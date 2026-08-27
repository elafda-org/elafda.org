import test from "node:test";
import assert from "node:assert/strict";

import worker from "../src/index.ts";

const SECRETS = {
  X_BOT_API_KEY: "sentinel-api-key",
  X_BOT_API_SECRET: "sentinel-api-secret",
  X_BOT_ACCESS_TOKEN: "sentinel-access-token",
  X_BOT_ACCESS_TOKEN_SECRET: "sentinel-access-token-secret",
  X_BOT_USER_ID: "999",
};

const emptyKv = { async get() { return null; }, async put() {} };

const makeEnv = (overrides = {}) => ({
  BOT_STATE: emptyKv,
  ...SECRETS,
  BOT_PAUSED: "true",
  BOT_REPLY_MODE: "dry-run",
  ...overrides,
});

const controller = { scheduledTime: 0, cron: "*/15 * * * *" };
const ctx = { waitUntil() {} };

test("credential isolation", async (t) => {
  await t.test("names the missing variable and posts nothing", async () => {
    for (const name of Object.keys(SECRETS)) {
      const env = makeEnv({ [name]: undefined });
      await assert.rejects(
        () => worker.scheduled(controller, env, ctx),
        (error) => {
          assert.match(error.message, new RegExp(name));
          return true;
        },
        `expected a failure naming ${name}`,
      );
    }
  });

  await t.test("run logging contains no credential value", async () => {
    const lines = [];
    const original = console.log;
    console.log = (...args) => lines.push(args.join(" "));

    try {
      await worker.scheduled(controller, makeEnv(), ctx);
    } finally {
      console.log = original;
    }

    const output = lines.join("\n");
    assert.ok(output.length > 0, "expected the run to log a summary");
    for (const value of Object.values(SECRETS)) {
      if (value === "999") {
        continue;
      }
      assert.ok(!output.includes(value), `log leaked ${value}`);
    }
  });
});

test("reply mode defaults to a dry run", async (t) => {
  await t.test("anything other than live is treated as a dry run", async () => {
    // Global fetch is stubbed so the run exercises the real HttpXClient wiring
    // without any request leaving the machine.
    const lines = [];
    const originalLog = console.log;
    const originalFetch = globalThis.fetch;
    const requests = [];

    console.log = (...args) => lines.push(args.join(" "));
    globalThis.fetch = async (url, init) => {
      requests.push({ url: String(url), method: init?.method ?? "GET" });
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    try {
      await worker.scheduled(
        controller,
        makeEnv({ BOT_PAUSED: "false", BOT_REPLY_MODE: undefined }),
        ctx,
      );
    } finally {
      console.log = originalLog;
      globalThis.fetch = originalFetch;
    }

    const summary = JSON.parse(lines[lines.length - 1]);
    assert.equal(summary.dryRun, true);
    assert.equal(summary.replied, 0);

    // One signed mention poll, and no post.
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, "GET");
    assert.match(requests[0].url, /\/2\/users\/999\/mentions\?/);
  });

  await t.test("live mode is opt-in", async () => {
    const lines = [];
    const originalLog = console.log;
    const originalFetch = globalThis.fetch;

    console.log = (...args) => lines.push(args.join(" "));
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    try {
      await worker.scheduled(
        controller,
        makeEnv({ BOT_PAUSED: "false", BOT_REPLY_MODE: "live" }),
        ctx,
      );
    } finally {
      console.log = originalLog;
      globalThis.fetch = originalFetch;
    }

    assert.equal(JSON.parse(lines[lines.length - 1]).dryRun, false);
  });
});

test("mention pagination", async (t) => {
  await t.test("drains every next_token page before returning", async () => {
    const { HttpXClient } = await import("../src/x-client.ts");

    const pages = [
      {
        data: [{ id: "102", author_id: "1", conversation_id: "c1" }],
        meta: { next_token: "page-2" },
      },
      {
        data: [{ id: "100", author_id: "2", conversation_id: "c2" }],
        meta: {},
      },
    ];
    const requests = [];
    const client = new HttpXClient({
      credentials: {
        apiKey: "k",
        apiSecret: "s",
        accessToken: "t",
        accessTokenSecret: "ts",
      },
      fetchImpl: async (url) => {
        requests.push(String(url));
        return new Response(JSON.stringify(pages[requests.length - 1]), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    const mentions = await client.fetchMentions("999", "42");
    assert.equal(requests.length, 2);
    assert.match(requests[1], /pagination_token=page-2/);
    assert.match(requests[1], /since_id=42/);
    assert.deepEqual(
      mentions.map((m) => m.id),
      ["102", "100"],
    );
  });
});

test("the x client does not detach global fetch", async (t) => {
  await t.test("resolves globalThis.fetch at call time", async () => {
    // A client that captures `fetch` at construction throws "Illegal
    // invocation" on Workers, where the global must be called with globalThis
    // as its receiver. Node does not enforce that, so this test pins the
    // behaviour indirectly: a client holding a detached or bound reference
    // keeps calling the old function after the global is replaced.
    const { HttpXClient } = await import("../src/x-client.ts");

    const originalFetch = globalThis.fetch;
    let usedReplacement = false;

    const client = new HttpXClient({
      credentials: {
        apiKey: "k",
        apiSecret: "s",
        accessToken: "t",
        accessTokenSecret: "ts",
      },
    });

    globalThis.fetch = async () => {
      usedReplacement = true;
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    try {
      await client.fetchMentions("999");
    } finally {
      globalThis.fetch = originalFetch;
    }

    assert.equal(usedReplacement, true);
  });
});
