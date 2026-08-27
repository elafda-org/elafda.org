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
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const TAGGED_FEED_LIMIT = 100;
/** Edge cache is the feed's rate limit; KV sees at most one read per minute. */
const TAGGED_FEED_CACHE_SECONDS = 60;

async function taggedFeedResponse(env: Env): Promise<Response> {
  if (!env.BOT_STATE) {
    return Response.json(
      { error: "tagged feed is not configured" },
      { status: 503 },
    );
  }
  // Entries carry ids, kinds and counters only, never tweet content. Sorting
  // and kind filtering happen client-side on the page, so the response (and
  // its edge cache) stays one shape.
  const entries = await listTaggedFeedEntries(env.BOT_STATE, TAGGED_FEED_LIMIT);
  return Response.json(
    { tweets: entries },
    {
      headers: {
        "cache-control": `public, max-age=${TAGGED_FEED_CACHE_SECONDS}`,
      },
    },
  );
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
      return taggedFeedResponse(env);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
