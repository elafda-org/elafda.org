/**
 * Cloudflare Worker entry point for the pre-launch `@eLafdaBot` replies.
 *
 * Cron-triggered only. There is no `fetch` handler on purpose: this Worker
 * holds posting credentials, and it has no reason to be reachable over HTTP.
 */
import { PRELAUNCH_REPLY } from "./reply.ts";
import { runOnce } from "./run.ts";
import { KvBotStore, type KvNamespace } from "./store.ts";
import { HttpXClient } from "./x-client.ts";

export interface Env {
  BOT_STATE: KvNamespace;
  X_BOT_API_KEY: string;
  X_BOT_API_SECRET: string;
  X_BOT_ACCESS_TOKEN: string;
  X_BOT_ACCESS_TOKEN_SECRET: string;
  /** The bot account's numeric id. The mentions endpoint takes an id, not a handle. */
  X_BOT_USER_ID: string;
  /** Set to "true" to stop posting without touching stored state. */
  BOT_PAUSED?: string;
  /** "live" posts replies. Anything else, including unset, is a dry run. */
  BOT_REPLY_MODE?: string;
  BOT_MAX_REPLIES_PER_RUN?: string;
}

interface ScheduledController {
  scheduledTime: number;
  cron: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

const DEFAULT_MAX_REPLIES_PER_RUN = 10;

/** Fail loudly and by name. A silent missing secret looks like an idle bot. */
function requireEnv(env: Env, name: keyof Env): string {
  const value = env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`missing required configuration: ${String(name)}`);
  }
  return value;
}

function readMaxReplies(env: Env): number {
  const parsed = Number.parseInt(env.BOT_MAX_REPLIES_PER_RUN ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_REPLIES_PER_RUN;
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    const client = new HttpXClient({
      credentials: {
        apiKey: requireEnv(env, "X_BOT_API_KEY"),
        apiSecret: requireEnv(env, "X_BOT_API_SECRET"),
        accessToken: requireEnv(env, "X_BOT_ACCESS_TOKEN"),
        accessTokenSecret: requireEnv(env, "X_BOT_ACCESS_TOKEN_SECRET"),
      },
    });

    const result = await runOnce({
      client,
      store: new KvBotStore(env.BOT_STATE),
      botUserId: requireEnv(env, "X_BOT_USER_ID"),
      replyText: PRELAUNCH_REPLY,
      maxRepliesPerRun: readMaxReplies(env),
      dryRun: env.BOT_REPLY_MODE !== "live",
      paused: env.BOT_PAUSED === "true",
      log: (message) => console.log(message),
    });

    // Counts and conversation ids only. No credential and no tweet text.
    console.log(
      JSON.stringify({
        paused: result.paused,
        dryRun: result.dryRun,
        polled: result.polled,
        replied: result.replied,
        skipped: result.skipped,
        failed: result.failed,
        intended: result.intended.length,
      }),
    );
  },
};
