/**
 * OAuth 1.0a user-context signing for the X API, per RFC 5849.
 *
 * The bot posts as itself on a schedule. OAuth 1.0a credentials do not expire,
 * which removes the refresh-token rotation a cron Worker would otherwise have
 * to store durably and could be bricked by losing.
 */

export type Oauth1Credentials = {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
};

export type SigningContext = {
  /** Injected so signatures are reproducible in tests. */
  nonce: string;
  /** Seconds since the epoch. */
  timestamp: number;
};

/**
 * RFC 3986 percent-encoding. `encodeURIComponent` leaves `!*'()` alone, and
 * OAuth requires them escaped, so a signature built on the browser default
 * would be rejected for any parameter containing them.
 */
export function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!*'()]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function normalizeParameters(parameters: Record<string, string>): string {
  return Object.entries(parameters)
    .map(([key, value]) => [percentEncode(key), percentEncode(value)] as const)
    .sort((left, right) =>
      left[0] === right[0]
        ? left[1] < right[1]
          ? -1
          : left[1] > right[1]
            ? 1
            : 0
        : left[0] < right[0]
          ? -1
          : 1,
    )
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

/**
 * Build the signature base string.
 *
 * `url` must carry no query string: query parameters are signed through
 * `parameters` instead. A JSON request body is never part of the base string,
 * which is why the reply endpoint signs only its OAuth parameters.
 */
export function buildSignatureBaseString(
  method: string,
  url: string,
  parameters: Record<string, string>,
): string {
  return [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(normalizeParameters(parameters)),
  ].join("&");
}

async function hmacSha1(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(message),
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Produce the `Authorization` header value for a signed request.
 *
 * `queryParameters` must contain every query parameter that will appear on the
 * request URL, and `url` must be the same URL without them.
 */
export async function buildAuthorizationHeader(
  method: string,
  url: string,
  queryParameters: Record<string, string>,
  credentials: Oauth1Credentials,
  context: SigningContext,
): Promise<string> {
  const oauthParameters: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: context.nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(context.timestamp),
    oauth_token: credentials.accessToken,
    oauth_version: "1.0",
  };

  const baseString = buildSignatureBaseString(method, url, {
    ...queryParameters,
    ...oauthParameters,
  });
  const signingKey = `${percentEncode(credentials.apiSecret)}&${percentEncode(
    credentials.accessTokenSecret,
  )}`;

  const signed: Record<string, string> = {
    ...oauthParameters,
    oauth_signature: await hmacSha1(signingKey, baseString),
  };

  const header = Object.keys(signed)
    .sort()
    .map((key) => `${percentEncode(key)}="${percentEncode(signed[key] ?? "")}"`)
    .join(", ");

  return `OAuth ${header}`;
}
