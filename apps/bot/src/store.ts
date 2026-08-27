/**
 * Operational state for the pre-launch bot: a poll cursor, a ledger of
 * conversations already answered, and the tagged-target records behind the
 * public `/tagged` feed.
 *
 * None of this is canonical content. Losing the cursor or the ledger costs a
 * re-poll or a duplicate reply; losing tagged records costs a thinner feed
 * page. That is why it all lives in KV rather than pre-empting the PostgreSQL
 * decision in SPEC.md section 13.
 */

import {
  parseTaggedRecord,
  serializeTaggedRecord,
  taggedKey,
  upsertTaggedRecord,
  type TaggedTweetKind,
} from "../../../packages/domain/bot/tagged-feed.ts";

/** Structurally compatible with Cloudflare's `KVNamespace`. */
export interface KvNamespace {
  get(key: string): Promise<string | null>;
  get(key: string, type: "arrayBuffer"): Promise<ArrayBuffer | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options: { prefix: string }): Promise<{ keys: { name: string }[] }>;
}

/** Platform identifiers only. Never tweet text, media, or author handles. */
export type TaggedTweetInput = {
  /** The classified target: replied-to tweet, or the mention itself. */
  tweetId: string;
  /** How the tag arrived, from `classifyMention` in `packages/domain`. */
  kind: TaggedTweetKind;
  mentionId: string;
  conversationId: string;
};

export interface BotStore {
  getCursor(): Promise<string | null>;
  setCursor(mentionId: string): Promise<void>;
  isPaused(): Promise<boolean>;
  hasAnswered(conversationId: string): Promise<boolean>;
  /** Short-lived marker written before posting. */
  claimConversation(conversationId: string): Promise<void>;
  /** Long-lived marker written after a successful post. */
  confirmConversation(conversationId: string): Promise<void>;
  /**
   * Remove a claim after a failed post, so the next poll retries immediately
   * instead of racing the claim TTL against the cron interval.
   */
  releaseClaim(conversationId: string): Promise<void>;
  /**
   * Keyed by target tweet id: a re-tag folds into the existing record,
   * counting the tag and keeping the strongest kind. The web Worker reads
   * these records back through the shared codec in
   * `packages/domain/bot/tagged-feed.ts`; the bot only ever writes them.
   */
  recordTaggedTweet(target: TaggedTweetInput): Promise<void>;
  /** Keys of the curated meme images the maintainer has uploaded, if any. */
  listMemeKeys(): Promise<string[]>;
  getMemeImage(key: string): Promise<MemeImage | null>;
}

/** One curated meme image, ready to upload to X as-is. */
export type MemeImage = {
  bytes: ArrayBuffer;
  contentType: string;
};

/**
 * Curated meme images live in the same namespace under `meme:<filename>`,
 * uploaded by the maintainer with `wrangler kv key put --path`. They never
 * enter the repository, and an empty set simply means text-only replies.
 */
export const MEME_PREFIX = "meme:";

const MEME_CONTENT_TYPES: Record<string, string> = {
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Derived from the key's file extension; null for anything unsupported. */
export function memeContentType(key: string): string | null {
  const extension = key.slice(key.lastIndexOf(".") + 1).toLowerCase();
  return MEME_CONTENT_TYPES[extension] ?? null;
}

const CURSOR_KEY = "mentions:cursor";
const PAUSE_KEY = "bot:paused";
const conversationKey = (conversationId: string) => `replied:${conversationId}`;

/**
 * Backstop only: a failed post releases its claim explicitly. The TTL covers a
 * crash between claiming and posting, where no release ever runs.
 */
export const CLAIM_TTL_SECONDS = 900;
/** Roughly 90 days. A re-tag after that earns a fresh reply. */
export const CONFIRM_TTL_SECONDS = 7_776_000;

export class KvBotStore implements BotStore {
  readonly #kv: KvNamespace;

  constructor(kv: KvNamespace) {
    this.#kv = kv;
  }

  getCursor(): Promise<string | null> {
    return this.#kv.get(CURSOR_KEY);
  }

  async setCursor(mentionId: string): Promise<void> {
    await this.#kv.put(CURSOR_KEY, mentionId);
  }

  async isPaused(): Promise<boolean> {
    return (await this.#kv.get(PAUSE_KEY)) !== null;
  }

  async hasAnswered(conversationId: string): Promise<boolean> {
    return (await this.#kv.get(conversationKey(conversationId))) !== null;
  }

  async claimConversation(conversationId: string): Promise<void> {
    await this.#kv.put(conversationKey(conversationId), "claimed", {
      expirationTtl: CLAIM_TTL_SECONDS,
    });
  }

  async confirmConversation(conversationId: string): Promise<void> {
    await this.#kv.put(conversationKey(conversationId), "replied", {
      expirationTtl: CONFIRM_TTL_SECONDS,
    });
  }

  async releaseClaim(conversationId: string): Promise<void> {
    await this.#kv.delete(conversationKey(conversationId));
  }

  async recordTaggedTweet(target: TaggedTweetInput): Promise<void> {
    // No TTL: these records are the content of the public feed. Read-modify-
    // write is safe because the bot is the namespace's only writer and a run
    // processes mentions sequentially.
    const key = taggedKey(target.tweetId);
    const raw = await this.#kv.get(key);
    const existing = raw === null ? null : parseTaggedRecord(target.tweetId, raw);
    const record = upsertTaggedRecord(existing, {
      targetTweetId: target.tweetId,
      kind: target.kind,
      mentionId: target.mentionId,
      conversationId: target.conversationId,
      taggedAt: new Date().toISOString(),
    });
    await this.#kv.put(key, serializeTaggedRecord(record));
  }

  async listMemeKeys(): Promise<string[]> {
    // One KV list page holds 1000 keys, far above any plausible meme set, so
    // pagination is deliberately not handled.
    const result = await this.#kv.list({ prefix: MEME_PREFIX });
    return result.keys
      .map((key) => key.name)
      .filter((name) => memeContentType(name) !== null);
  }

  async getMemeImage(key: string): Promise<MemeImage | null> {
    const contentType = memeContentType(key);
    if (contentType === null) {
      return null;
    }
    const bytes = await this.#kv.get(key, "arrayBuffer");
    return bytes === null ? null : { bytes, contentType };
  }
}
