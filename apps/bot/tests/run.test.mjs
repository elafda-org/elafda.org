import test from "node:test";
import assert from "node:assert/strict";

import { PRELAUNCH_REPLY, REPLY_LIMIT } from "../src/reply.ts";
import { runOnce } from "../src/run.ts";

class MemoryStore {
  constructor() {
    this.cursor = null;
    this.paused = false;
    this.entries = new Map();
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
  async postReply(text, inReplyToTweetId) {
    if (this.failOnTweetId === inReplyToTweetId) {
      throw new Error("x api rejected the reply");
    }
    this.posts.push({ text, inReplyToTweetId });
    return { id: `reply-${inReplyToTweetId}` };
  }
}

const BOT_ID = "999";

const mention = (id, conversationId, authorId = "555") => ({
  id,
  conversationId,
  authorId,
});

const run = (client, store, overrides = {}) =>
  runOnce({
    client,
    store,
    botUserId: BOT_ID,
    replyText: PRELAUNCH_REPLY,
    maxRepliesPerRun: 10,
    dryRun: false,
    paused: false,
    ...overrides,
  });

test("holding reply content", async (t) => {
  await t.test("posts the fixed pre-launch text", async () => {
    const client = new FakeXClient([mention("100", "a")]);
    await run(client, new MemoryStore());
    assert.equal(client.posts.length, 1);
    assert.equal(client.posts[0].text, PRELAUNCH_REPLY);
  });

  await t.test("fits inside the reply limit", () => {
    assert.ok([...PRELAUNCH_REPLY].length <= REPLY_LIMIT);
  });

  await t.test("implies no intake", () => {
    const lowered = PRELAUNCH_REPLY.toLowerCase();
    for (const term of ["nomination", "case", "review", "filed", "elf-n"]) {
      assert.ok(!lowered.includes(term), `reply mentions ${term}`);
    }
  });

  await t.test("draws nothing from the tweet it answers", async () => {
    // The reply is a constant. Nothing about the mention reaches it, which is
    // what makes the outgoing text impossible to steer from a thread.
    const client = new FakeXClient([mention("100", "conversation-xyz")]);
    await run(client, new MemoryStore());
    const posted = client.posts[0].text;
    assert.equal(posted, PRELAUNCH_REPLY);
    assert.ok(!posted.includes("100"));
    assert.ok(!posted.includes("conversation-xyz"));
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

  await t.test("claims before posting, so a failure leaves a claim", async () => {
    const client = new FakeXClient([mention("100", "a")]);
    client.failOnTweetId = "100";
    const store = new MemoryStore();

    const result = await run(client, store);
    assert.equal(client.posts.length, 0);
    assert.equal(result.failed, 1);
    assert.equal(result.replied, 0);
    assert.equal(store.entries.get("a"), "claimed");
    // The cursor did not move past the mention, so a later run sees it again
    // once the short-lived claim expires.
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
