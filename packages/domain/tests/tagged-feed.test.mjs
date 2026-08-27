import test from "node:test";
import assert from "node:assert/strict";

import {
  TAGGED_PREFIX,
  classifyMention,
  listTaggedFeedEntries,
  parseFeedEntry,
  parseTaggedRecord,
  serializeTaggedRecord,
  sortTaggedEntries,
  taggedKey,
  tweetIdFromTaggedKey,
  upsertTaggedRecord,
} from "../bot/index.ts";

/**
 * Mirrors the ordering contract of Cloudflare KV: keys come back in ascending
 * lexicographic order, filtered by prefix, capped by limit.
 */
class FakeKv {
  constructor() {
    this.entries = new Map();
  }
  set(key, value) {
    this.entries.set(key, value);
  }
  async list({ prefix, limit = 1000 }) {
    const names = [...this.entries.keys()]
      .filter((name) => name.startsWith(prefix))
      .sort();
    return {
      keys: names.slice(0, limit).map((name) => ({ name })),
      list_complete: names.length <= limit,
    };
  }
  async get(key) {
    return this.entries.get(key) ?? null;
  }
}

const BOT = "bot-1";

test("tagged key codec", async (t) => {
  await t.test("round-trips ids of every magnitude", () => {
    for (const id of ["1", "42", "300", "1960000000000000000", "9".repeat(20)]) {
      assert.equal(tweetIdFromTaggedKey(taggedKey(id)), id);
    }
  });

  await t.test("keys share the listable prefix", () => {
    assert.ok(taggedKey("123").startsWith(TAGGED_PREFIX));
  });

  await t.test("larger ids sort lexicographically first", () => {
    // "300" > "42" numerically but sorts before it as a raw string; the codec
    // must invert both paddings and digits so numeric order wins.
    assert.ok(taggedKey("300") < taggedKey("42"));
    assert.ok(taggedKey("1960000000000000001") < taggedKey("1960000000000000000"));
  });
});

const entryIds = (entries) => entries.map((entry) => entry.id);

test("listTaggedFeedEntries ordering", async (t) => {
  await t.test("returns ids newest first regardless of insertion order", async () => {
    const kv = new FakeKv();
    for (const id of ["42", "1960000000000000000", "5", "300"]) {
      kv.set(taggedKey(id), "{}");
    }
    assert.deepEqual(entryIds(await listTaggedFeedEntries(kv, 10)), [
      "1960000000000000000",
      "300",
      "42",
      "5",
    ]);
  });

  await t.test("caps the result at the limit, keeping the newest", async () => {
    const kv = new FakeKv();
    for (const id of ["1", "2", "3", "4"]) {
      kv.set(taggedKey(id), "{}");
    }
    assert.deepEqual(entryIds(await listTaggedFeedEntries(kv, 2)), ["4", "3"]);
  });

  await t.test("ignores keys outside the tagged prefix", async () => {
    const kv = new FakeKv();
    kv.set(taggedKey("7"), "{}");
    kv.set("replied:99", "replied");
    kv.set("mentions:cursor", "42");
    assert.deepEqual(entryIds(await listTaggedFeedEntries(kv, 10)), ["7"]);
  });
});

test("classifyMention", async (t) => {
  await t.test("root mention is an original post targeting itself", () => {
    assert.deepEqual(
      classifyMention({ id: "10", repliedToId: null, inReplyToUserId: null }, BOT),
      { kind: "original", targetTweetId: "10" },
    );
  });

  await t.test("reply to someone else is commentary over that tweet", () => {
    assert.deepEqual(
      classifyMention({ id: "10", repliedToId: "9", inReplyToUserId: "human-2" }, BOT),
      { kind: "commentary", targetTweetId: "9" },
    );
  });

  await t.test("reply to the bot records itself, never the bot's tweet", () => {
    assert.deepEqual(
      classifyMention({ id: "10", repliedToId: "9", inReplyToUserId: BOT }, BOT),
      { kind: "reply", targetTweetId: "10" },
    );
  });

  await t.test("reply with unknown replied-to author stays commentary", () => {
    assert.deepEqual(
      classifyMention({ id: "10", repliedToId: "9", inReplyToUserId: null }, BOT),
      { kind: "commentary", targetTweetId: "9" },
    );
  });
});

test("upsertTaggedRecord", async (t) => {
  const first = {
    targetTweetId: "90",
    kind: "commentary",
    mentionId: "100",
    conversationId: "a",
    taggedAt: "2026-08-27T10:00:00.000Z",
  };

  await t.test("first tag starts the record at count one", () => {
    const record = upsertTaggedRecord(null, first);
    assert.equal(record.tweetId, "90");
    assert.equal(record.kind, "commentary");
    assert.equal(record.tagCount, 1);
    assert.equal(record.firstMentionId, "100");
    assert.equal(record.lastMentionId, "100");
    assert.equal(record.recordedAt, first.taggedAt);
    assert.equal(record.lastTaggedAt, first.taggedAt);
  });

  await t.test("re-tag counts and refreshes latest metadata only", () => {
    const record = upsertTaggedRecord(upsertTaggedRecord(null, first), {
      ...first,
      mentionId: "104",
      taggedAt: "2026-08-27T11:00:00.000Z",
    });
    assert.equal(record.tagCount, 2);
    assert.equal(record.firstMentionId, "100");
    assert.equal(record.lastMentionId, "104");
    assert.equal(record.recordedAt, first.taggedAt);
    assert.equal(record.lastTaggedAt, "2026-08-27T11:00:00.000Z");
  });

  await t.test("kind upgrades to original in either order, never downgrades", () => {
    const viaCommentaryThenOriginal = upsertTaggedRecord(
      upsertTaggedRecord(null, first),
      { ...first, kind: "original", mentionId: "104" },
    );
    const viaOriginalThenCommentary = upsertTaggedRecord(
      upsertTaggedRecord(null, { ...first, kind: "original" }),
      { ...first, kind: "commentary", mentionId: "104" },
    );
    assert.equal(viaCommentaryThenOriginal.kind, "original");
    assert.equal(viaOriginalThenCommentary.kind, "original");
  });

  await t.test("reply never outranks a recorded kind", () => {
    const record = upsertTaggedRecord(upsertTaggedRecord(null, first), {
      ...first,
      kind: "reply",
      mentionId: "104",
    });
    assert.equal(record.kind, "commentary");
  });

  await t.test("re-polled mention is declined by reference, counted once", () => {
    // Frozen cursors, per-run caps and dry runs re-poll mentions the record
    // has already counted; the fold must hand back the same object so the
    // writer can skip the put and the count cannot inflate.
    const existing = upsertTaggedRecord(null, first);
    assert.equal(upsertTaggedRecord(existing, first), existing);
    assert.equal(
      upsertTaggedRecord(existing, { ...first, mentionId: "99" }),
      existing,
    );
  });

  await t.test("mention comparison is numeric, not string order", () => {
    const existing = upsertTaggedRecord(null, first);
    const record = upsertTaggedRecord(existing, { ...first, mentionId: "1000" });
    assert.equal(record.tagCount, 2);
  });
});

test("parseFeedEntry", async (t) => {
  await t.test("accepts a well-formed wire entry", () => {
    const entry = {
      id: "90",
      kind: "original",
      tagCount: 3,
      taggedAt: "2026-08-27T10:00:00.000Z",
    };
    assert.deepEqual(parseFeedEntry(entry), entry);
  });

  await t.test("defaults unknown kinds and counts like parseTaggedRecord", () => {
    assert.deepEqual(parseFeedEntry({ id: "90", kind: "mystery", tagCount: 0 }), {
      id: "90",
      kind: "commentary",
      tagCount: 1,
      taggedAt: null,
    });
  });

  await t.test("rejects entries without a numeric string id", () => {
    for (const raw of [null, "90", {}, { id: 90 }, { id: "abc" }]) {
      assert.equal(parseFeedEntry(raw), null);
    }
  });
});

test("parseTaggedRecord", async (t) => {
  await t.test("round-trips a serialized record", () => {
    const record = upsertTaggedRecord(null, {
      targetTweetId: "90",
      kind: "original",
      mentionId: "100",
      conversationId: "a",
      taggedAt: "2026-08-27T10:00:00.000Z",
    });
    assert.deepEqual(parseTaggedRecord("90", serializeTaggedRecord(record)), record);
  });

  await t.test("legacy id-only value degrades to commentary counted once", () => {
    const record = parseTaggedRecord(
      "90",
      JSON.stringify({
        tweetId: "90",
        mentionId: "100",
        conversationId: "a",
        recordedAt: "2026-08-20T00:00:00.000Z",
      }),
    );
    assert.equal(record.kind, "commentary");
    assert.equal(record.tagCount, 1);
    assert.equal(record.firstMentionId, "100");
    assert.equal(record.lastMentionId, "100");
    assert.equal(record.lastTaggedAt, "2026-08-20T00:00:00.000Z");
  });

  await t.test("missing or malformed values are served, not dropped", () => {
    for (const raw of [null, "", "not json", "[]"]) {
      const record = parseTaggedRecord("90", raw);
      assert.equal(record.tweetId, "90");
      assert.equal(record.kind, "commentary");
      assert.equal(record.tagCount, 1);
    }
  });
});

test("sortTaggedEntries", async (t) => {
  const entries = [
    { id: "300", kind: "commentary", tagCount: 1, taggedAt: null },
    { id: "42", kind: "original", tagCount: 3, taggedAt: null },
    { id: "1960000000000000000", kind: "reply", tagCount: 1, taggedAt: null },
    { id: "5", kind: "commentary", tagCount: 3, taggedAt: null },
  ];

  await t.test("latest orders by id descending", () => {
    assert.deepEqual(
      sortTaggedEntries(entries, "latest").map((entry) => entry.id),
      ["1960000000000000000", "300", "42", "5"],
    );
  });

  await t.test("most tagged orders by count, newest first among equals", () => {
    assert.deepEqual(
      sortTaggedEntries(entries, "mostTagged").map((entry) => entry.id),
      ["42", "5", "1960000000000000000", "300"],
    );
  });

  await t.test("does not mutate its input", () => {
    const before = entries.map((entry) => entry.id);
    sortTaggedEntries(entries, "mostTagged");
    assert.deepEqual(entries.map((entry) => entry.id), before);
  });
});

test("listTaggedFeedEntries", async (t) => {
  await t.test("serves annotated entries newest first, tolerating legacy values", async () => {
    const kv = new FakeKv();
    const record = upsertTaggedRecord(null, {
      targetTweetId: "300",
      kind: "original",
      mentionId: "301",
      conversationId: "a",
      taggedAt: "2026-08-27T10:00:00.000Z",
    });
    kv.set(taggedKey("300"), serializeTaggedRecord(record));
    kv.set(taggedKey("42"), JSON.stringify({ mentionId: "43" }));
    const entries = await listTaggedFeedEntries(kv, 10);
    assert.deepEqual(entries, [
      { id: "300", kind: "original", tagCount: 1, taggedAt: "2026-08-27T10:00:00.000Z" },
      { id: "42", kind: "commentary", tagCount: 1, taggedAt: null },
    ]);
  });
});
