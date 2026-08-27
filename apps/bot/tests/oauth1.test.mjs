import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAuthorizationHeader,
  buildSignatureBaseString,
  percentEncode,
} from "../src/oauth1.ts";

const CREDENTIALS = {
  apiKey: "test-api-key",
  apiSecret: "test-api-secret",
  accessToken: "test-access-token",
  accessTokenSecret: "test-access-token-secret",
};

const CONTEXT = { nonce: "fixednonce123", timestamp: 1_700_000_000 };

test("percent encoding follows RFC 3986", async (t) => {
  await t.test("escapes the characters encodeURIComponent leaves alone", () => {
    assert.equal(percentEncode("!*'()"), "%21%2A%27%28%29");
  });

  await t.test("leaves unreserved characters intact", () => {
    assert.equal(percentEncode("aZ09-._~"), "aZ09-._~");
  });

  await t.test("escapes spaces and reserved characters", () => {
    assert.equal(percentEncode("a b&c=d"), "a%20b%26c%3Dd");
  });
});

test("signature base string", async (t) => {
  await t.test("is method, url, and parameters joined by ampersands", () => {
    const base = buildSignatureBaseString(
      "get",
      "https://api.x.com/2/users/1/mentions",
      { b: "2", a: "1" },
    );
    assert.equal(
      base,
      "GET&https%3A%2F%2Fapi.x.com%2F2%2Fusers%2F1%2Fmentions&a%3D1%26b%3D2",
    );
  });

  await t.test("sorts parameters by encoded key", () => {
    const base = buildSignatureBaseString("POST", "https://example.com/", {
      zebra: "1",
      apple: "2",
      mango: "3",
    });
    assert.match(base, /apple%3D2%26mango%3D3%26zebra%3D1$/);
  });

  await t.test("double-encodes parameter values, as RFC 5849 requires", () => {
    // The value is encoded once as a parameter, then the whole normalized
    // parameter string is encoded again into the base string. A comma is
    // therefore %252C here, not %2C.
    const base = buildSignatureBaseString("GET", "https://example.com/", {
      "tweet.fields": "author_id,conversation_id",
    });
    assert.match(base, /tweet\.fields%3Dauthor_id%252Cconversation_id$/);
  });
});

test("authorization header", async (t) => {
  await t.test("carries every required oauth parameter", async () => {
    const header = await buildAuthorizationHeader(
      "GET",
      "https://api.x.com/2/users/1/mentions",
      {},
      CREDENTIALS,
      CONTEXT,
    );

    assert.match(header, /^OAuth /);
    for (const field of [
      "oauth_consumer_key",
      "oauth_nonce",
      "oauth_signature",
      "oauth_signature_method",
      "oauth_timestamp",
      "oauth_token",
      "oauth_version",
    ]) {
      assert.ok(header.includes(`${field}="`), `missing ${field}`);
    }
    assert.ok(header.includes('oauth_signature_method="HMAC-SHA1"'));
    assert.ok(header.includes('oauth_version="1.0"'));
  });

  await t.test("is deterministic for a fixed nonce and timestamp", async () => {
    const first = await buildAuthorizationHeader(
      "GET",
      "https://api.x.com/2/users/1/mentions",
      { since_id: "42" },
      CREDENTIALS,
      CONTEXT,
    );
    const second = await buildAuthorizationHeader(
      "GET",
      "https://api.x.com/2/users/1/mentions",
      { since_id: "42" },
      CREDENTIALS,
      CONTEXT,
    );
    assert.equal(first, second);
  });

  await t.test("changes when a signed query parameter changes", async () => {
    const withCursor = await buildAuthorizationHeader(
      "GET",
      "https://api.x.com/2/users/1/mentions",
      { since_id: "42" },
      CREDENTIALS,
      CONTEXT,
    );
    const withoutCursor = await buildAuthorizationHeader(
      "GET",
      "https://api.x.com/2/users/1/mentions",
      {},
      CREDENTIALS,
      CONTEXT,
    );
    assert.notEqual(withCursor, withoutCursor);
  });

  await t.test("never leaks a secret into the header", async () => {
    const header = await buildAuthorizationHeader(
      "POST",
      "https://api.x.com/2/tweets",
      {},
      CREDENTIALS,
      CONTEXT,
    );
    assert.ok(!header.includes(CREDENTIALS.apiSecret));
    assert.ok(!header.includes(CREDENTIALS.accessTokenSecret));
  });
});
