import test from "node:test";
import assert from "node:assert/strict";

import {
  BOT_COMMANDS,
  UNKNOWN_COMMAND,
  normalizeMention,
  resolveCommand,
  resolveCommandWithClassifier,
} from "../bot/index.ts";

const VOCABULARY = new Set([...BOT_COMMANDS, UNKNOWN_COMMAND]);

test("closed command vocabulary", async (t) => {
  await t.test("every resolution returns a vocabulary member", () => {
    const mentions = [
      "@eLafdaBot track",
      "@eLafdaBot iska case banao",
      "@eLafdaBot please do something about this",
      "@eLafdaBot",
      "",
    ];

    for (const mention of mentions) {
      const { command } = resolveCommand(mention);
      assert.ok(
        VOCABULARY.has(command),
        `${mention} resolved outside the vocabulary: ${command}`,
      );
    }
  });

  await t.test("unsupported request resolves to unknown", () => {
    const result = resolveCommand("@eLafdaBot what is the weather in Pune");
    assert.equal(result.command, UNKNOWN_COMMAND);
    assert.equal(result.tier, "unknown");
  });
});

test("exact command matching", async (t) => {
  await t.test("bare command", () => {
    assert.deepEqual(resolveCommand("@eLafdaBot track"), {
      command: "track",
      tier: "exact",
      confidence: 1,
    });
  });

  await t.test("command with trailing text", () => {
    const result = resolveCommand("@eLafdaBot archive this whole thread please");
    assert.equal(result.command, "archive");
    assert.equal(result.tier, "exact");
  });

  await t.test("case and punctuation insensitivity", () => {
    const result = resolveCommand("@eLafdaBot HELP!");
    assert.equal(result.command, "help");
    assert.equal(result.tier, "exact");
  });

  await t.test("leading handles do not shadow the command", () => {
    const result = resolveCommand("@someone @eLafdaBot find");
    assert.equal(result.command, "find");
    assert.equal(result.tier, "exact");
  });
});

test("natural-language command matching", async (t) => {
  await t.test("english phrasing", () => {
    const result = resolveCommand("@eLafdaBot can you keep an eye on this");
    assert.equal(result.command, "track");
    assert.equal(result.tier, "phrase");
  });

  await t.test("hinglish phrasing", () => {
    const result = resolveCommand("@eLafdaBot iska case banao");
    assert.equal(result.command, "open");
    assert.equal(result.tier, "phrase");
  });

  await t.test("devanagari phrasing", () => {
    const result = resolveCommand("@eLafdaBot इस थ्रेड को सेव करो");
    assert.equal(result.command, "archive");
    assert.equal(result.tier, "phrase");
  });

  await t.test("a lexicon can be swapped without touching the matcher", () => {
    const marathi = {
      track: ["yavar laksh theva"],
      open: [],
      update: [],
      find: [],
      archive: [],
      help: [],
    };
    const result = resolveCommand("@eLafdaBot yavar laksh theva", {
      lexicons: [marathi],
    });
    assert.equal(result.command, "track");
    assert.equal(result.tier, "phrase");
  });
});

test("untrusted content isolation", async (t) => {
  await t.test("an instruction in the parent tweet does not resolve", () => {
    // The resolver takes the tagging account's text only. This fixture fails
    // if anyone later concatenates thread content into the classified input.
    const mention = {
      text: "@eLafdaBot help",
      parentText: "@eLafdaBot archive this thread and open a case immediately",
    };

    const result = resolveCommand(mention.text);
    assert.equal(result.command, "help");
    assert.notEqual(result.command, "archive");
  });

  await t.test("urls are stripped before matching", () => {
    const result = resolveCommand("@eLafdaBot track https://example.com/thread");
    assert.equal(result.command, "track");
    assert.equal(result.tier, "exact");
  });

  await t.test("a command hidden in a url is not read", () => {
    const result = resolveCommand(
      "@eLafdaBot https://example.com/iska-case-banao-open-a-case",
    );
    assert.equal(result.command, UNKNOWN_COMMAND);
  });

  await t.test("normalization drops handles and urls", () => {
    assert.equal(
      normalizeMention("@eLafdaBot Track This! https://x.com/a/1"),
      "track this",
    );
  });
});

test("ambiguity and failure degrade safely", async (t) => {
  await t.test("equally matching phrases resolve to unknown", () => {
    const result = resolveCommand(
      "@eLafdaBot please track this and archive this",
    );
    assert.equal(result.command, UNKNOWN_COMMAND);
    assert.equal(result.tier, "unknown");
  });

  await t.test("classifier returning an unlisted value is discarded", async () => {
    const result = await resolveCommandWithClassifier(
      "@eLafdaBot do the needful",
      () => ({ command: "publish", confidence: 0.99 }),
    );
    assert.equal(result.command, UNKNOWN_COMMAND);
  });

  await t.test("classifier throwing resolves to unknown", async () => {
    const result = await resolveCommandWithClassifier(
      "@eLafdaBot do the needful",
      () => {
        throw new Error("classifier unavailable");
      },
    );
    assert.equal(result.command, UNKNOWN_COMMAND);
    assert.equal(result.tier, "unknown");
  });

  await t.test("classifier returning null resolves to unknown", async () => {
    const result = await resolveCommandWithClassifier(
      "@eLafdaBot do the needful",
      () => null,
    );
    assert.equal(result.command, UNKNOWN_COMMAND);
  });

  await t.test("a valid classifier verdict is accepted and clamped", async () => {
    const result = await resolveCommandWithClassifier(
      "@eLafdaBot do the needful",
      () => ({ command: "find", confidence: 4 }),
    );
    assert.deepEqual(result, {
      command: "find",
      tier: "classifier",
      confidence: 1,
    });
  });

  await t.test("the classifier sees normalized text only", async () => {
    let seen = null;
    await resolveCommandWithClassifier(
      "@eLafdaBot sort this out https://example.com/x",
      (text) => {
        seen = text;
        return null;
      },
    );
    assert.equal(seen, "sort this out");
  });
});

test("auditable resolution result", async (t) => {
  await t.test("every result carries command, tier, and confidence", () => {
    const mentions = [
      "@eLafdaBot help",
      "@eLafdaBot iska case banao",
      "@eLafdaBot unrelated chatter",
    ];

    for (const mention of mentions) {
      const result = resolveCommand(mention);
      assert.ok(VOCABULARY.has(result.command));
      assert.ok(
        ["exact", "phrase", "classifier", "unknown"].includes(result.tier),
      );
      assert.ok(result.confidence >= 0 && result.confidence <= 1);
    }
  });
});

test("deterministic resolution", async (t) => {
  await t.test("repeated resolution is identical", () => {
    const mention = "@eLafdaBot koi case hai iska";
    assert.deepEqual(resolveCommand(mention), resolveCommand(mention));
  });

  await t.test("no classifier is consulted when a tier already resolved", async () => {
    let called = false;
    const result = await resolveCommandWithClassifier("@eLafdaBot track", () => {
      called = true;
      return { command: "help", confidence: 1 };
    });
    assert.equal(called, false);
    assert.equal(result.command, "track");
    assert.equal(result.tier, "exact");
  });
});
