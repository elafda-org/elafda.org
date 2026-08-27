import type { BotStore } from "./store.ts";
import type { Mention, XClient } from "./x-client.ts";

export type RunOptions = {
  client: XClient;
  store: BotStore;
  botUserId: string;
  replyText: string;
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
 * The cursor advances only past mentions this run actually finished with. When
 * the per-run cap stops the loop, the remainder stay newer than the cursor and
 * are picked up next time rather than being silently skipped.
 */
export async function runOnce(options: RunOptions): Promise<RunResult> {
  const log = options.log ?? (() => {});

  if (options.paused || (await options.store.isPaused())) {
    log("run skipped: bot is paused");
    return emptyResult({ paused: true, dryRun: options.dryRun });
  }

  const cursor = await options.store.getCursor();
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

  for (const mention of ordered) {
    // The bot's own replies come back as mentions of itself.
    if (mention.authorId === options.botUserId) {
      skipped += 1;
      lastProcessed = mention.id;
      continue;
    }

    if (
      answeredThisRun.has(mention.conversationId) ||
      (await options.store.hasAnswered(mention.conversationId))
    ) {
      skipped += 1;
      lastProcessed = mention.id;
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
      await options.client.postReply(options.replyText, mention.id);
      await options.store.confirmConversation(mention.conversationId);
      replied += 1;
      lastProcessed = mention.id;
    } catch (error) {
      failed += 1;
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
