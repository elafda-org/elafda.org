import test from "node:test";
import assert from "node:assert/strict";

import {
  REPLY_LIMIT,
  allPrelaunchReplies,
  composePrelaunchReply,
} from "../src/reply.ts";
import { runOnce } from "../src/run.ts";
import { upsertTaggedRecord } from "../../../packages/domain/bot/tagged-feed.ts";

class MemoryStore {
  constructor() {
    this.cursor = null;
    this.paused = false;
    this.entries = new Map();
    this.tagged = new Map();
  }
  async getCursor() {
    return this.cursor;
  }
  async setCursor(id) {
    this.cursor = id;
  }
  async isPaused() {
    return this.paused;
  }
  async hasAnswered(conversationId) {
    return this.entries.has(conversationId);
  }
  async claimConversation(conversationId) {
    this.entries.set(conversationId, "claimed");
  }
  async confirmConversation(conversationId) {
    this.entries.set(conversationId, "replied");
  }
  async releaseClaim(conversationId) {
    this.entries.delete(conversationId);
  }
  async recordTaggedTweet(target) {
    if (this.failTaggedRecording) {
      throw new Error("kv rejected the tagged record");
    }
    // Same fold as KvBotStore, so assertions exercise production semantics.
    const existing = this.tagged.get(target.tweetId) ?? null;
    const record = upsertTaggedRecord(existing, {
      targetTweetId: target.tweetId,
      kind: target.kind,
      mentionId: target.mentionId,
      conversationId: target.conversationId,
      taggedAt: "2026-08-27T00:00:00.000Z",
    });
    if (record !== existing) {
      this.tagged.set(target.tweetId, record);
    }
  }
}

class FakeXClient {
  constructor(mentions = []) {
    this.mentions = mentions;
    this.polls = [];
    this.posts = [];
    this.failOnTweetId = null;
  }
  async fetchMentions(userId, sinceId) {
    this.polls.push({ userId, sinceId });
    return this.mentions;
  }
  async postReply(text, inReplyToTweetId, mediaId) {
    if (this.failOnTweetId === inReplyToTweetId) {
      throw new Error("x api rejected the reply");
    }
    this.posts.push({ text, inReplyToTweetId, mediaId: mediaId ?? null });
    return { id: `reply-${inReplyToTweetId}` };
  }
  async uploadImage() {
    return { id: "uploaded-media" };
  }
}

const BOT_ID = "999";

const mention = (
  id,
  conversationId,
  authorId = "555",
  repliedToId = null,
  inReplyToUserId = repliedToId === null ? null : "666",
) => ({
  id,
  conversationId,
  authorId,
  repliedToId,
  inReplyToUserId,
});

// Pinned to the pool's first variant so tests can assert exact posted text.
const HOLDING_TEXT = composePrelaunchReply(() => 0);

const run = (client, store, overrides = {}) =>
  runOnce({
    client,
    store,
    botUserId: BOT_ID,
    buildReply: async () => ({ text: HOLDING_TEXT, mediaId: null }),
    maxRepliesPerRun: 10,
    dryRun: false,
    paused: false,
    ...overrides,
  });

test("holding reply content", async (t) => {
  await t.test("posts a reply drawn from the fixed pool", async () => {
    const client = new FakeXClient([mention("100", "a")]);
    await run(client, new MemoryStore(), {
      buildReply: async () => ({
        text: composePrelaunchReply(() => 0.42),
        mediaId: null,
      }),
    });
    assert.equal(client.posts.length, 1);
    assert.ok(allPrelaunchReplies().includes(client.posts[0].text));
  });

  await t.test("every variant fits inside the reply limit", () => {
    for (const variant of allPrelaunchReplies()) {
      assert.ok([...variant].length <= REPLY_LIMIT, variant);
    }
  });

  await t.test("every variant implies no intake", () => {
    for (const variant of allPrelaunchReplies()) {
      const lowered = variant.toLowerCase();
      for (const term of ["nomination", "case", "review", "filed", "elf-n"]) {
        assert.ok(!lowered.includes(term), `"${variant}" mentions ${term}`);
      }
    }
  });

  await t.test("every variant holds and points at the wall", () => {
    for (const variant of allPrelaunchReplies()) {
      assert.ok(variant.endsWith("elafda.org/tagged"), variant);
      assert.match(
        variant,
        /soon|pending|not live|not ready|still building|still being built|yet/,
        variant,
      );
    }
  });

  await t.test("every variant follows the outward copy style", () => {
    for (const variant of allPrelaunchReplies()) {
      assert.ok(!variant.includes("—"), `em dash in "${variant}"`);
      assert.ok(
        !/, (and|or) /.test(variant),
        `oxford comma in "${variant}"`,
      );
      assert.equal(variant, variant.toLowerCase(), variant);
    }
  });

  await t.test("randomization stays inside the pool and varies", () => {
    const pool = allPrelaunchReplies();
    const seen = new Set();
    for (const value of [0, 0.19, 0.42, 0.61, 0.83, 0.999]) {
      const composed = composePrelaunchReply(() => value);
      assert.ok(pool.includes(composed), composed);
      seen.add(composed);
    }
    assert.ok(seen.size > 1, "expected different variants across seeds");
  });

  await t.test("draws nothing from the tweet it answers", async () => {
    // The composer takes only a random source. Nothing about the mention
    // reaches it, which is what makes the outgoing text impossible to steer
    // from a thread.
    const client = new FakeXClient([mention("100", "conversation-xyz")]);
    await run(client, new MemoryStore());
    const posted = client.posts[0].text;
    assert.equal(posted, HOLDING_TEXT);
    assert.ok(!posted.includes("100"));
    assert.ok(!posted.includes("conversation-xyz"));
  });
});

test("meme attachment", async (t) => {
  await t.test("passes the drafted media id through to the post", async () => {
    const client = new FakeXClient([mention("100", "a")]);
    await run(client, new MemoryStore(), {
      buildReply: async () => ({ text: HOLDING_TEXT, mediaId: "media-7" }),
    });
    assert.equal(client.posts[0].mediaId, "media-7");
  });

  await t.test("posts text-only when the draft carries no media", async () => {
    const client = new FakeXClient([mention("100", "a")]);
    await run(client, new MemoryStore());
    assert.equal(client.posts[0].mediaId, null);
  });

  await t.test("a failed draft follows the failed-reply path", async () => {
    const store = new MemoryStore();
    const client = new FakeXClient([mention("100", "a")]);
    const result = await run(client, store, {
      buildReply: async () => {
        throw new Error("draft exploded");
      },
    });
    assert.equal(result.failed, 1);
    assert.equal(client.posts.length, 0);
    // Claim released and cursor frozen, so the next run retries the mention.
    assert.equal(store.entries.has("a"), false);
    assert.equal(store.cursor, null);
  });
});

test("reply once per conversation", async (t) => {
  await t.test("skips a conversation already answered", async () => {
    const store = new MemoryStore();
    store.entries.set("a", "replied");
    const client = new FakeXClient([mention("100", "a")]);

    const result = await run(client, store);
    assert.equal(client.posts.length, 0);
    assert.equal(result.skipped, 1);
  });

  await t.test("answers a conversation once when it has several mentions", async () => {
    const client = new FakeXClient([
      mention("100", "a"),
      mention("101", "a"),
      mention("102", "a"),
    ]);
    const store = new MemoryStore();

    const result = await run(client, store);
    assert.equal(client.posts.length, 1);
    assert.equal(result.replied, 1);
    assert.equal(result.skipped, 2);
  });

  await t.test("releases the claim when the post fails", async () => {
    const client = new FakeXClient([mention("100", "a")]);
    client.failOnTweetId = "100";
    const store = new MemoryStore();

    const result = await run(client, store);
    assert.equal(client.posts.length, 0);
    assert.equal(result.failed, 1);
    assert.equal(result.replied, 0);
    // The claim is released and the cursor did not move past the mention, so
    // the next run re-polls it and retries immediately, with no TTL race.
    assert.equal(store.entries.has("a"), false);
    assert.equal(store.cursor, null);
  });

  await t.test("never advances the cursor past a failed reply", async () => {
    const store = new MemoryStore();
    const client = new FakeXClient([mention("100", "a"), mention("101", "b")]);
    client.failOnTweetId = "100";

    const result = await run(client, store);
    // The later mention still gets its reply, but the cursor freezes at the
    // failure, so mention 100 stays newer than the cursor and is re-polled.
    assert.equal(result.failed, 1);
    assert.equal(result.replied, 1);
    assert.equal(store.entries.get("b"), "replied");
    assert.equal(store.entries.has("a"), false);
    assert.equal(store.cursor, null);
  });

  await t.test("marks a conversation replied only after a successful post", async () => {
    const store = new MemoryStore();
    await run(new FakeXClient([mention("100", "a")]), store);
    assert.equal(store.entries.get("a"), "replied");
  });
});

test("mention polling with a durable cursor", async (t) => {
  await t.test("polls without a cursor on the first run", async () => {
    const client = new FakeXClient([]);
    await run(client, new MemoryStore());
    assert.deepEqual(client.polls, [{ userId: BOT_ID, sinceId: undefined }]);
  });

  await t.test("passes the stored cursor on later runs", async () => {
    const store = new MemoryStore();
    store.cursor = "42";
    const client = new FakeXClient([]);
    await run(client, store);
    assert.equal(client.polls[0].sinceId, "42");
  });

  await t.test("advances the cursor to the newest processed mention", async () => {
    const store = new MemoryStore();
    const client = new FakeXClient([
      mention("102", "c"),
      mention("100", "a"),
      mention("101", "b"),
    ]);
    await run(client, store);
    assert.equal(store.cursor, "102");
    assert.equal(client.posts.length, 3);
  });

  await t.test("does not reply to its own posts", async () => {
    const client = new FakeXClient([mention("100", "a", BOT_ID)]);
    const result = await run(client, new MemoryStore());
    assert.equal(client.posts.length, 0);
    assert.equal(result.skipped, 1);
  });

  await t.test("leaves the cursor alone when nothing is returned", async () => {
    const store = new MemoryStore();
    store.cursor = "42";
    const result = await run(new FakeXClient([]), store);
    assert.equal(store.cursor, "42");
    assert.equal(result.replied, 0);
    assert.equal(result.cursor, "42");
  });
});

test("emergency pause", async (t) => {
  await t.test("stored pause stops the run", async () => {
    const store = new MemoryStore();
    store.paused = true;
    const client = new FakeXClient([mention("100", "a")]);

    const result = await run(client, store);
    assert.equal(result.paused, true);
    assert.equal(client.posts.length, 0);
    assert.equal(client.polls.length, 0);
  });

  await t.test("configured pause stops the run", async () => {
    const client = new FakeXClient([mention("100", "a")]);
    const result = await run(client, new MemoryStore(), { paused: true });
    assert.equal(result.paused, true);
    assert.equal(client.posts.length, 0);
  });
});

test("dry-run mode", async (t) => {
  await t.test("reports intended replies without posting or claiming", async () => {
    const store = new MemoryStore();
    const client = new FakeXClient([mention("100", "a"), mention("101", "b")]);

    const result = await run(client, store, { dryRun: true });
    assert.deepEqual(result.intended, ["a", "b"]);
    assert.equal(client.posts.length, 0);
    assert.equal(store.entries.size, 0);
  });

  await t.test("leaves the cursor unchanged", async () => {
    const store = new MemoryStore();
    store.cursor = "42";
    await run(new FakeXClient([mention("100", "a")]), store, { dryRun: true });
    assert.equal(store.cursor, "42");
  });
});

test("reply rate limiting", async (t) => {
  await t.test("stops at the per-run cap and leaves the rest", async () => {
    const store = new MemoryStore();
    const client = new FakeXClient([
      mention("100", "a"),
      mention("101", "b"),
      mention("102", "c"),
    ]);

    const result = await run(client, store, { maxRepliesPerRun: 2 });
    assert.equal(result.replied, 2);
    assert.equal(client.posts.length, 2);
    // The cursor stops at the last answered mention, so conversation c is
    // still newer than the cursor and is picked up next run.
    assert.equal(store.cursor, "101");
    assert.equal(store.entries.has("c"), false);
  });
});

test("tagged target recording", async (t) => {
  await t.test("records the replied-to tweet as commentary", async () => {
    const store = new MemoryStore();
    await run(new FakeXClient([mention("100", "a", "555", "90")]), store);
    assert.deepEqual([...store.tagged.keys()], ["90"]);
    assert.equal(store.tagged.get("90").firstMentionId, "100");
    assert.equal(store.tagged.get("90").lastMentionId, "100");
    assert.equal(store.tagged.get("90").conversationId, "a");
    assert.equal(store.tagged.get("90").kind, "commentary");
  });

  await t.test("records a root mention as an original post", async () => {
    const store = new MemoryStore();
    await run(new FakeXClient([mention("100", "100")]), store);
    assert.deepEqual([...store.tagged.keys()], ["100"]);
    assert.equal(store.tagged.get("100").kind, "original");
  });

  await t.test("a reply to the bot records itself, never the bot's tweet", async () => {
    const store = new MemoryStore();
    // The human replies to the bot's own reply: repliedToId is the bot's
    // tweet, so the record must target the mention with kind reply.
    await run(
      new FakeXClient([mention("100", "a", "555", "90", BOT_ID)]),
      store,
    );
    assert.deepEqual([...store.tagged.keys()], ["100"]);
    assert.equal(store.tagged.get("100").kind, "reply");
  });

  await t.test("records nothing for the bot's own tweets", async () => {
    const store = new MemoryStore();
    await run(new FakeXClient([mention("100", "a", BOT_ID, "90")]), store);
    assert.equal(store.tagged.size, 0);
  });

  await t.test("collapses re-tags of the same target into one record", async () => {
    const store = new MemoryStore();
    const client = new FakeXClient([
      mention("100", "a", "555", "90"),
      mention("101", "a", "556", "90"),
    ]);
    const result = await run(client, store);
    assert.deepEqual([...store.tagged.keys()], ["90"]);
    assert.equal(store.tagged.get("90").tagCount, 2);
    assert.equal(result.replied, 1);
  });

  await t.test("still records in an already-answered conversation", async () => {
    const store = new MemoryStore();
    store.entries.set("a", "replied");
    await run(new FakeXClient([mention("100", "a", "555", "90")]), store);
    assert.deepEqual([...store.tagged.keys()], ["90"]);
    assert.equal(store.entries.get("a"), "replied");
  });

  await t.test("records during a dry run without touching the ledger", async () => {
    const store = new MemoryStore();
    await run(new FakeXClient([mention("100", "a", "555", "90")]), store, {
      dryRun: true,
    });
    assert.deepEqual([...store.tagged.keys()], ["90"]);
    assert.equal(store.entries.size, 0);
    assert.equal(store.cursor, null);
  });

  await t.test("records targets past the per-run reply cap", async () => {
    const store = new MemoryStore();
    const client = new FakeXClient([
      mention("100", "a", "555", "90"),
      mention("101", "b", "555", "91"),
      mention("102", "c", "555", "92"),
    ]);
    const result = await run(client, store, { maxRepliesPerRun: 2 });
    assert.equal(result.replied, 2);
    // Recording happens per polled mention; the cap only limits replies.
    assert.deepEqual([...store.tagged.keys()].sort(), ["90", "91", "92"]);
  });

  await t.test("re-polled mentions never inflate the tag count", async () => {
    // A frozen cursor (cap, failed reply or dry run) re-polls mentions the
    // record already counted; only genuinely new mentions may count.
    const store = new MemoryStore();
    const first = new FakeXClient([mention("100", "a", "555", "90")]);
    await run(first, store, { dryRun: true });
    await run(first, store, { dryRun: true });
    assert.equal(store.tagged.get("90").tagCount, 1);

    const second = new FakeXClient([
      mention("100", "a", "555", "90"),
      mention("101", "b", "556", "90"),
    ]);
    await run(second, store, { dryRun: true });
    assert.equal(store.tagged.get("90").tagCount, 2);
  });

  await t.test("a failed record freezes the cursor and spares the rest", async () => {
    const store = new MemoryStore();
    store.failTaggedRecording = true;
    const client = new FakeXClient([
      mention("100", "a", "555", "90"),
      mention("101", "b", "555", "91"),
    ]);
    const result = await run(client, store);
    // Both mentions fail to record, neither gets a reply, and the cursor
    // stays put so the next run retries them; the run itself completes.
    assert.equal(result.failed, 2);
    assert.equal(result.replied, 0);
    assert.equal(result.cursor, null);
    assert.deepEqual(client.posts, []);
  });
});
