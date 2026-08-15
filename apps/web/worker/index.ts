/** Cloudflare Worker entry point for eLafda's vinext application. */
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === "www.elafda.org") {
      url.hostname = "elafda.org";
      url.protocol = "https:";
      return Response.redirect(url, 308);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
