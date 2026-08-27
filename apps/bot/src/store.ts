/**
 * Operational state for the pre-launch bot: a poll cursor and a ledger of
 * conversations already answered.
 *
 * None of this is canonical content. Losing it costs a re-poll or a duplicate
 * reply, which is why it lives in KV rather than pre-empting the PostgreSQL
 * decision in SPEC.md section 13 to store two keys.
 */

/** Structurally compatible with Cloudflare's `KVNamespace`. */
export interface KvNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface BotStore {
  getCursor(): Promise<string | null>;
  setCursor(mentionId: string): Promise<void>;
  isPaused(): Promise<boolean>;
  hasAnswered(conversationId: string): Promise<boolean>;
  /** Short-lived marker written before posting. */
  claimConversation(conversationId: string): Promise<void>;
  /** Long-lived marker written after a successful post. */
  confirmConversation(conversationId: string): Promise<void>;
  /**
   * Remove a claim after a failed post, so the next poll retries immediately
   * instead of racing the claim TTL against the cron interval.
   */
  releaseClaim(conversationId: string): Promise<void>;
}

const CURSOR_KEY = "mentions:cursor";
const PAUSE_KEY = "bot:paused";
const conversationKey = (conversationId: string) => `replied:${conversationId}`;

/**
 * Backstop only: a failed post releases its claim explicitly. The TTL covers a
 * crash between claiming and posting, where no release ever runs.
 */
export const CLAIM_TTL_SECONDS = 900;
/** Roughly 90 days. A re-tag after that earns a fresh reply. */
export const CONFIRM_TTL_SECONDS = 7_776_000;

export class KvBotStore implements BotStore {
  readonly #kv: KvNamespace;

  constructor(kv: KvNamespace) {
    this.#kv = kv;
  }

  getCursor(): Promise<string | null> {
    return this.#kv.get(CURSOR_KEY);
  }

  async setCursor(mentionId: string): Promise<void> {
    await this.#kv.put(CURSOR_KEY, mentionId);
  }

  async isPaused(): Promise<boolean> {
    return (await this.#kv.get(PAUSE_KEY)) !== null;
  }

  async hasAnswered(conversationId: string): Promise<boolean> {
    return (await this.#kv.get(conversationKey(conversationId))) !== null;
  }

  async claimConversation(conversationId: string): Promise<void> {
    await this.#kv.put(conversationKey(conversationId), "claimed", {
      expirationTtl: CLAIM_TTL_SECONDS,
    });
  }

  async confirmConversation(conversationId: string): Promise<void> {
    await this.#kv.put(conversationKey(conversationId), "replied", {
      expirationTtl: CONFIRM_TTL_SECONDS,
    });
  }

  async releaseClaim(conversationId: string): Promise<void> {
    await this.#kv.delete(conversationKey(conversationId));
  }
}
