import {
  buildAuthorizationHeader,
  type Oauth1Credentials,
  type SigningContext,
} from "./oauth1.ts";

export type Mention = {
  id: string;
  authorId: string;
  conversationId: string;
};

export interface XClient {
  /** Mentions newer than `sinceId`, in whatever order the API returns them. */
  fetchMentions(userId: string, sinceId?: string): Promise<Mention[]>;
  postReply(text: string, inReplyToTweetId: string): Promise<{ id: string }>;
}

const API_ROOT = "https://api.x.com/2";

/** Runaway guard for mention pagination: 20 pages of 25 is 500 mentions/run. */
const MAX_MENTION_PAGES = 20;

export type HttpXClientOptions = {
  credentials: Oauth1Credentials;
  /** Injected for reproducible signing in tests. */
  signingContext?: () => SigningContext;
  fetchImpl?: typeof fetch;
  maxResults?: number;
};

function defaultSigningContext(): SigningContext {
  return {
    nonce: crypto.randomUUID().replace(/-/g, ""),
    timestamp: Math.floor(Date.now() / 1000),
  };
}

export class HttpXClient implements XClient {
  readonly #credentials: Oauth1Credentials;
  readonly #signingContext: () => SigningContext;
  readonly #fetch: typeof fetch;
  readonly #maxResults: number;

  constructor(options: HttpXClientOptions) {
    this.#credentials = options.credentials;
    this.#signingContext = options.signingContext ?? defaultSigningContext;
    // Resolve the global at call time through `globalThis`. Storing a bare
    // `fetch` reference detaches it from its receiver, which Node tolerates and
    // the Workers runtime rejects with "Illegal invocation".
    this.#fetch =
      options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
    this.#maxResults = options.maxResults ?? 25;
  }

  async fetchMentions(userId: string, sinceId?: string): Promise<Mention[]> {
    const url = `${API_ROOT}/users/${encodeURIComponent(userId)}/mentions`;
    const mentions: Mention[] = [];
    let paginationToken: string | undefined;

    // X pages newest-first. A partial fetch would leave the missing mentions
    // OLDER than the ones returned, and the caller's cursor would then advance
    // past them forever, so every page since the cursor is drained. `since_id`
    // bounds the window; the page cap is a runaway guard far above plausible
    // volume, and hitting it fails the run so the cursor stays put.
    for (let page = 0; page < MAX_MENTION_PAGES; page += 1) {
      const query: Record<string, string> = {
        max_results: String(this.#maxResults),
        "tweet.fields": "author_id,conversation_id",
      };
      if (sinceId) {
        query.since_id = sinceId;
      }
      if (paginationToken) {
        query.pagination_token = paginationToken;
      }

      // Query parameters are part of the signature base string, so they are
      // signed here and appended to the URL from the same object.
      const authorization = await buildAuthorizationHeader(
        "GET",
        url,
        query,
        this.#credentials,
        this.#signingContext(),
      );

      const requestUrl = `${url}?${new URLSearchParams(query).toString()}`;
      const response = await this.#fetch(requestUrl, {
        method: "GET",
        headers: { authorization },
      });

      if (!response.ok) {
        throw new Error(
          `mention poll failed with ${response.status} ${response.statusText}`,
        );
      }

      const payload = (await response.json()) as {
        data?: { id: string; author_id?: string; conversation_id?: string }[];
        meta?: { next_token?: string };
      };

      for (const tweet of payload.data ?? []) {
        mentions.push({
          id: tweet.id,
          authorId: tweet.author_id ?? "",
          // A tweet with no conversation id is its own conversation root.
          conversationId: tweet.conversation_id ?? tweet.id,
        });
      }

      paginationToken = payload.meta?.next_token;
      if (!paginationToken) {
        return mentions;
      }
    }

    throw new Error(
      `mention poll exceeded ${MAX_MENTION_PAGES} pages; refusing a partial batch`,
    );
  }

  async postReply(
    text: string,
    inReplyToTweetId: string,
  ): Promise<{ id: string }> {
    const url = `${API_ROOT}/tweets`;

    // A JSON body is not part of an OAuth 1.0a signature base string, so only
    // the OAuth parameters are signed for this request.
    const authorization = await buildAuthorizationHeader(
      "POST",
      url,
      {},
      this.#credentials,
      this.#signingContext(),
    );

    const response = await this.#fetch(url, {
      method: "POST",
      headers: {
        authorization,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text,
        reply: { in_reply_to_tweet_id: inReplyToTweetId },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `reply failed with ${response.status} ${response.statusText}`,
      );
    }

    const payload = (await response.json()) as { data?: { id?: string } };
    return { id: payload.data?.id ?? "" };
  }
}
