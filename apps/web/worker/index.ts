/** Cloudflare Worker entry point for eLafda's vinext application. */
import handler from "vinext/server/app-router-entry";

import {
  listTaggedFeedEntries,
  type TaggedFeedKvReader,
} from "../../../packages/domain/bot/tagged-feed.ts";

interface Env {
  ASSETS: Fetcher;
  /**
   * The bot Worker's KV namespace, bound read-only in spirit: the web Worker
   * only ever lists tagged-target keys. Optional so environments without the
   * binding degrade to an unavailable feed instead of a crash.
   */
  BOT_STATE?: TaggedFeedKvReader;
  /**
   * Hyperdrive route to the Supabase PostgreSQL database. Optional for the
   * same reason as BOT_STATE; no request path uses it yet, and the first
   * consumer arrives with the readable-archive change via
   * `packages/db/src/client.ts`.
   */
  HYPERDRIVE?: { connectionString: string };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/**
 * The Workers runtime's cache surface; not in the DOM lib's CacheStorage,
 * and absent entirely when the built worker runs under plain Node (the
 * rendered-html test harness), where the feed just skips edge caching.
 */
declare const caches: { default: Cache } | undefined;

const edgeCache = (): Cache | null =>
  typeof caches === "undefined" ? null : caches.default;

const TAGGED_FEED_LIMIT = 100;
const TAGGED_FEED_CACHE_SECONDS = 60;

async function taggedFeedResponse(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  if (!env.BOT_STATE) {
    return Response.json(
      { error: "tagged feed is not configured" },
      { status: 503 },
    );
  }
  // A cache-control header alone does not edge-cache a Worker-generated
  // response; only the Cache API stores it. With the explicit put below, the
  // KV fan-out (one list plus one get per entry) runs once per cache miss
  // instead of once per visitor.
  const cache = edgeCache();
  const cached = cache && (await cache.match(request.url));
  if (cached) {
    return cached;
  }
  // Entries carry ids, kinds and counters only, never tweet content. Sorting
  // and kind filtering happen client-side on the page, so the response (and
  // its edge cache) stays one shape.
  let entries;
  try {
    entries = await listTaggedFeedEntries(env.BOT_STATE, TAGGED_FEED_LIMIT);
  } catch {
    // A transient KV failure serves the page's designed error state, not a
    // Cloudflare exception page. Never cached; the next request retries.
    return Response.json(
      { error: "tagged feed is unavailable" },
      { status: 503 },
    );
  }
  const response = Response.json(
    { tweets: entries },
    {
      headers: {
        "cache-control": `public, max-age=${TAGGED_FEED_CACHE_SECONDS}`,
      },
    },
  );
  if (cache) {
    ctx.waitUntil(cache.put(request.url, response.clone()));
  }
  return response;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === "www.elafda.org") {
      url.hostname = "elafda.org";
      url.protocol = "https:";
      return Response.redirect(url, 308);
    }

    if (url.pathname === "/api/tagged") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }
      return taggedFeedResponse(request, env, ctx);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
