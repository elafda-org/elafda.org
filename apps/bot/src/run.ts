import { classifyMention } from "../../../packages/domain/bot/tagged-feed.ts";
import type { BotStore } from "./store.ts";
import type { Mention, XClient } from "./x-client.ts";

/** What one reply will post: composed text plus an optional uploaded image. */
export type ReplyDraft = {
  text: string;
  /** An already-uploaded media id to attach, or null for a text-only reply. */
  mediaId: string | null;
};

export type RunOptions = {
  client: XClient;
  store: BotStore;
  botUserId: string;
  /**
   * Called once per posted reply, so each reply can vary its text and meme.
   * It runs inside the claim: a throw follows the failed-reply path, which
   * releases the claim and freezes the cursor for a retry next run.
   */
  buildReply: () => Promise<ReplyDraft>;
  maxRepliesPerRun: number;
  /** Poll and select, but report intended replies instead of posting. */
  dryRun: boolean;
  /** Configuration-level pause, checked alongside the stored pause flag. */
  paused: boolean;
  log?: (message: string) => void;
};

export type RunResult = {
  paused: boolean;
  dryRun: boolean;
  polled: number;
  replied: number;
  /** Conversations already answered, or authored by the bot itself. */
  skipped: number;
  failed: number;
  /** Conversation ids the bot would have answered, in dry-run mode. */
  intended: string[];
  cursor: string | null;
};

function emptyResult(overrides: Partial<RunResult>): RunResult {
  return {
    paused: false,
    dryRun: false,
    polled: 0,
    replied: 0,
    skipped: 0,
    failed: 0,
    intended: [],
    cursor: null,
    ...overrides,
  };
}

/** Tweet ids are 64-bit values delivered as strings, so compare numerically. */
function ascendingById(left: Mention, right: Mention): number {
  const difference = BigInt(left.id) - BigInt(right.id);
  return difference === 0n ? 0 : difference < 0n ? -1 : 1;
}

/**
 * One scheduled pass: poll, pick unanswered conversations, reply once each.
 *
 * The cursor advances only past mentions this run actually finished with, and
 * never past a mention whose reply failed: the first failure freezes it, so the
 * failed mention (and everything after it) is re-polled next run. When the
 * per-run cap stops the loop, the remainder stay newer than the cursor and are
 * picked up next time rather than being silently skipped.
 */
export async function runOnce(options: RunOptions): Promise<RunResult> {
  const log = options.log ?? (() => {});

  if (options.paused) {
    log("run skipped: bot is paused");
    return emptyResult({ paused: true, dryRun: options.dryRun });
  }

  // Independent reads; the speculative cursor fetch is free when paused.
  const [storedPause, cursor] = await Promise.all([
    options.store.isPaused(),
    options.store.getCursor(),
  ]);
  if (storedPause) {
    log("run skipped: bot is paused");
    return emptyResult({ paused: true, dryRun: options.dryRun });
  }
  const mentions = await options.client.fetchMentions(
    options.botUserId,
    cursor ?? undefined,
  );

  if (mentions.length === 0) {
    return emptyResult({ dryRun: options.dryRun, cursor });
  }

  const ordered = [...mentions].sort(ascendingById);
  const answeredThisRun = new Set<string>();
  const intended: string[] = [];
  let replied = 0;
  let selected = 0;
  let skipped = 0;
  let failed = 0;
  let lastProcessed: string | null = null;
  // Set by the first failed reply. From then on the cursor stops advancing, so
  // the failed mention stays newer than the cursor and is re-polled next run.
  let cursorFrozen = false;

  for (const mention of ordered) {
    // The bot's own replies come back as mentions of itself.
    if (mention.authorId === options.botUserId) {
      skipped += 1;
      if (!cursorFrozen) {
        lastProcessed = mention.id;
      }
      continue;
    }

    // Every human tag records its target for the public feed, before dedupe
    // and cap checks: recording is ingestion bookkeeping rather than a reply,
    // so it also happens in dry-run mode and for already-answered
    // conversations. Kind and target come from platform reply metadata only;
    // a reply to the bot records itself, never the bot's tweet.
    const { kind, targetTweetId } = classifyMention(mention, options.botUserId);
    await options.store.recordTaggedTweet({
      tweetId: targetTweetId,
      kind,
      mentionId: mention.id,
      conversationId: mention.conversationId,
    });

    if (
      answeredThisRun.has(mention.conversationId) ||
      (await options.store.hasAnswered(mention.conversationId))
    ) {
      skipped += 1;
      if (!cursorFrozen) {
        lastProcessed = mention.id;
      }
      continue;
    }

    // Stop before claiming anything we cannot also answer this run.
    if (selected >= options.maxRepliesPerRun) {
      log(`per-run reply cap of ${options.maxRepliesPerRun} reached`);
      break;
    }

    if (options.dryRun) {
      intended.push(mention.conversationId);
      answeredThisRun.add(mention.conversationId);
      selected += 1;
      continue;
    }

    // Claim before posting. A claim without a post costs one unanswered tag
    // until the claim expires; a post without a claim costs a duplicate reply.
    await options.store.claimConversation(mention.conversationId);
    answeredThisRun.add(mention.conversationId);
    selected += 1;

    try {
      const draft = await options.buildReply();
      await options.client.postReply(
        draft.text,
        mention.id,
        draft.mediaId ?? undefined,
      );
      await options.store.confirmConversation(mention.conversationId);
      replied += 1;
      if (!cursorFrozen) {
        lastProcessed = mention.id;
      }
    } catch (error) {
      failed += 1;
      cursorFrozen = true;
      // Release rather than letting the claim expire: the TTL matches the cron
      // interval, so an unexpired claim would make the next run skip the
      // mention and commit the cursor past it, losing the retry forever.
      await options.store.releaseClaim(mention.conversationId);
      log(
        `reply failed for conversation ${mention.conversationId}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  // A dry run must leave the cursor where it found it, or the mentions it only
  // reported would never be answered for real.
  if (!options.dryRun && lastProcessed) {
    await options.store.setCursor(lastProcessed);
  }

  return {
    paused: false,
    dryRun: options.dryRun,
    polled: mentions.length,
    replied,
    skipped,
    failed,
    intended,
    cursor: options.dryRun ? cursor : (lastProcessed ?? cursor),
  };
}
