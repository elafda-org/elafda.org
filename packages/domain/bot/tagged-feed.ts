/**
 * Key codec, record codec and reader for the tagged-tweet feed.
 *
 * The bot Worker writes one KV record per tagged target; the web Worker reads
 * them back to serve `/api/tagged`. Both sides bind the same KV namespace, so
 * the key format, the value format, and the classification and upsert rules
 * are shared domain code rather than duplicated per Worker.
 */

export const TAGGED_PREFIX = "tagged:";
/** Wide enough for any 64-bit snowflake id. */
const TAGGED_ID_WIDTH = 20;

/**
 * Nines' complement of the zero-padded id. KV lists keys in ascending
 * lexicographic order, so complementing every digit makes the largest
 * (newest) snowflake sort first and lets one `list` page serve the feed
 * in latest order. The transform is its own inverse.
 */
const complementDigits = (digits: string): string =>
  digits.replace(/\d/g, (digit) => String(9 - Number(digit)));

export const taggedKey = (tweetId: string): string =>
  `${TAGGED_PREFIX}${complementDigits(tweetId.padStart(TAGGED_ID_WIDTH, "0"))}`;

export const tweetIdFromTaggedKey = (name: string): string => {
  const padded = complementDigits(name.slice(TAGGED_PREFIX.length));
  return padded.replace(/^0+(?=\d)/, "");
};

/**
 * How a tag arrived, resolved from platform reply metadata only (SPEC.md §9):
 * - `original`: the mention is not a reply; the tagged post is the mention.
 * - `commentary`: the mention replies to someone else's tweet; the tagged
 *   post is that tweet and the mention is commentary over it.
 * - `reply`: the mention replies to a tweet the bot authored. Conversation,
 *   not nomination; the mention records itself, never the bot's tweet.
 */
export type TaggedTweetKind = "original" | "commentary" | "reply";

/** Higher rank wins when the same target is tagged through different routes. */
const KIND_RANK: Record<TaggedTweetKind, number> = {
  original: 2,
  commentary: 1,
  reply: 0,
};

const isKind = (value: unknown): value is TaggedTweetKind =>
  value === "original" || value === "commentary" || value === "reply";

/** Platform identifiers, counters and timestamps only. Never tweet content. */
export type TaggedTweetRecord = {
  tweetId: string;
  kind: TaggedTweetKind;
  /** Number of mentions that have recorded this target. */
  tagCount: number;
  conversationId: string;
  firstMentionId: string;
  lastMentionId: string;
  /** When the target was first recorded. */
  recordedAt: string | null;
  /** When the target was most recently recorded. */
  lastTaggedAt: string | null;
};

/** The reply-metadata slice of a polled mention that classification needs. */
export type MentionReplyContext = {
  id: string;
  /** The tweet this mention replies to, when it is a reply. */
  repliedToId: string | null;
  /** The author of the replied-to tweet, when the platform provides it. */
  inReplyToUserId: string | null;
};

/**
 * Resolve a mention's kind and target from reply metadata. A reply whose
 * replied-to author is unknown counts as commentary, matching the pre-kind
 * behavior of recording the replied-to tweet.
 */
export function classifyMention(
  mention: MentionReplyContext,
  botUserId: string,
): { kind: TaggedTweetKind; targetTweetId: string } {
  if (!mention.repliedToId) {
    return { kind: "original", targetTweetId: mention.id };
  }
  if (mention.inReplyToUserId === botUserId) {
    return { kind: "reply", targetTweetId: mention.id };
  }
  return { kind: "commentary", targetTweetId: mention.repliedToId };
}

export type TaggedRecordInput = {
  targetTweetId: string;
  kind: TaggedTweetKind;
  mentionId: string;
  conversationId: string;
  /** ISO timestamp of this recording pass. */
  taggedAt: string;
};

/**
 * Fold one recording mention into the target's record. Pure, so writer and
 * tests agree: a re-tag increments the count, refreshes the latest-mention
 * metadata, and keeps the strongest kind seen for the target.
 */
export function upsertTaggedRecord(
  existing: TaggedTweetRecord | null,
  input: TaggedRecordInput,
): TaggedTweetRecord {
  if (!existing) {
    return {
      tweetId: input.targetTweetId,
      kind: input.kind,
      tagCount: 1,
      conversationId: input.conversationId,
      firstMentionId: input.mentionId,
      lastMentionId: input.mentionId,
      recordedAt: input.taggedAt,
      lastTaggedAt: input.taggedAt,
    };
  }
  return {
    ...existing,
    kind: KIND_RANK[input.kind] > KIND_RANK[existing.kind] ? input.kind : existing.kind,
    tagCount: existing.tagCount + 1,
    lastMentionId: input.mentionId,
    lastTaggedAt: input.taggedAt,
  };
}

export const serializeTaggedRecord = (record: TaggedTweetRecord): string =>
  JSON.stringify(record);

/**
 * Parse a stored value, tolerating records written before kinds existed
 * (id-only values with a single `mentionId`) and malformed values. Anything
 * unreadable degrades to the pre-kind behavior: commentary, counted once.
 */
export function parseTaggedRecord(
  tweetId: string,
  raw: string | null,
): TaggedTweetRecord {
  let value: Record<string, unknown> = {};
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        value = parsed as Record<string, unknown>;
      }
    } catch {
      // Malformed value; fall through to defaults.
    }
  }
  const string = (key: string): string | null =>
    typeof value[key] === "string" ? (value[key] as string) : null;
  const legacyMentionId = string("mentionId");
  const recordedAt = string("recordedAt");
  return {
    tweetId,
    kind: isKind(value.kind) ? value.kind : "commentary",
    tagCount:
      typeof value.tagCount === "number" && value.tagCount >= 1
        ? Math.floor(value.tagCount)
        : 1,
    conversationId: string("conversationId") ?? "",
    firstMentionId: string("firstMentionId") ?? legacyMentionId ?? "",
    lastMentionId: string("lastMentionId") ?? legacyMentionId ?? "",
    recordedAt,
    lastTaggedAt: string("lastTaggedAt") ?? recordedAt,
  };
}

/** What `/api/tagged` serves per target: ids and counters, never content. */
export type TaggedFeedEntry = {
  id: string;
  kind: TaggedTweetKind;
  tagCount: number;
  taggedAt: string | null;
};

export const toFeedEntry = (record: TaggedTweetRecord): TaggedFeedEntry => ({
  id: record.tweetId,
  kind: record.kind,
  tagCount: record.tagCount,
  taggedAt: record.lastTaggedAt,
});

export type TaggedSort = "latest" | "mostTagged";

const byIdDescending = (left: TaggedFeedEntry, right: TaggedFeedEntry): number => {
  const difference = BigInt(right.id) - BigInt(left.id);
  return difference === 0n ? 0 : difference > 0n ? 1 : -1;
};

/** Pure and non-mutating, shared by the page's client-side controls. */
export function sortTaggedEntries(
  entries: readonly TaggedFeedEntry[],
  sort: TaggedSort,
): TaggedFeedEntry[] {
  const ordered = [...entries];
  if (sort === "mostTagged") {
    ordered.sort(
      (left, right) => right.tagCount - left.tagCount || byIdDescending(left, right),
    );
  } else {
    ordered.sort(byIdDescending);
  }
  return ordered;
}

/** The structural slice of Cloudflare's `KVNamespace` the reader needs. */
export interface TaggedFeedKvReader {
  list(options: {
    prefix: string;
    limit?: number;
  }): Promise<{ keys: { name: string }[]; list_complete: boolean }>;
  get(key: string): Promise<string | null>;
}

/** Newest recorded targets first, at most `limit` of them. */
export async function listTaggedTweetIds(
  kv: Pick<TaggedFeedKvReader, "list">,
  limit: number,
): Promise<string[]> {
  const page = await kv.list({ prefix: TAGGED_PREFIX, limit });
  return page.keys.map((key) => tweetIdFromTaggedKey(key.name));
}

/**
 * Annotated feed entries, newest target first. One list page plus one value
 * read per key; the web Worker's edge cache bounds how often this runs.
 */
export async function listTaggedFeedEntries(
  kv: TaggedFeedKvReader,
  limit: number,
): Promise<TaggedFeedEntry[]> {
  const page = await kv.list({ prefix: TAGGED_PREFIX, limit });
  return Promise.all(
    page.keys.map(async ({ name }) => {
      const tweetId = tweetIdFromTaggedKey(name);
      return toFeedEntry(parseTaggedRecord(tweetId, await kv.get(name)));
    }),
  );
}
