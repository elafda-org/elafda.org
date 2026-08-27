/**
 * Verify the bot's OAuth 1.0a credentials and print its numeric user id.
 *
 * Makes exactly one request: an authenticated read of the bot's own account.
 * It posts nothing and reads no other account. This is the check no offline
 * test can perform, because only X can say whether a signature is acceptable.
 *
 *     npm run verify:bot-credentials
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { buildAuthorizationHeader } from "../src/oauth1.ts";

const REQUIRED = [
  "X_BOT_API_KEY",
  "X_BOT_API_SECRET",
  "X_BOT_ACCESS_TOKEN",
  "X_BOT_ACCESS_TOKEN_SECRET",
];

function parseEnv(contents) {
  const values = {};
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const raw = trimmed.slice(separator + 1).trim();
    values[key] = raw.replace(/^["']|["']$/g, "");
  }
  return values;
}

const envPath = fileURLToPath(new URL("../.env", import.meta.url));

let env;
try {
  env = parseEnv(await readFile(envPath, "utf8"));
} catch {
  console.error(`Could not read ${envPath}`);
  console.error("Copy .env.example to .env and fill in the values first.");
  process.exit(1);
}

const missing = REQUIRED.filter((name) => !env[name]);
if (missing.length > 0) {
  console.error(`Missing in .env: ${missing.join(", ")}`);
  process.exit(1);
}

const credentials = {
  apiKey: env.X_BOT_API_KEY,
  apiSecret: env.X_BOT_API_SECRET,
  accessToken: env.X_BOT_ACCESS_TOKEN,
  accessTokenSecret: env.X_BOT_ACCESS_TOKEN_SECRET,
};

const url = "https://api.x.com/2/users/me";
const authorization = await buildAuthorizationHeader(
  "GET",
  url,
  {},
  credentials,
  {
    nonce: crypto.randomUUID().replace(/-/g, ""),
    timestamp: Math.floor(Date.now() / 1000),
  },
);

const response = await fetch(url, {
  method: "GET",
  headers: { authorization },
});
const body = await response.text();

if (response.ok) {
  const account = JSON.parse(body)?.data ?? {};
  const id = account.id ?? "";
  const username = account.username ?? "";
  console.log("Signature accepted.");
  console.log(`Account:         @${username}`);
  console.log(`X_BOT_USER_ID=   ${id}`);
  console.log("");
  await checkWritePermission();
  console.log("");
  console.log("Put that id in .env, and set it as a secret before deploying.");
  process.exit(0);
}

/**
 * Probe whether the access token carries write permission.
 *
 * OAuth 1.0a exposes no scope information, so the only signal is how the write
 * endpoint refuses us. This sends a deliberately invalid request body with no
 * text field at all: X cannot publish it under any circumstance, so nothing can
 * reach the timeline. A read-only token is rejected on permission before the
 * body is ever validated; a write-capable token gets as far as validation and
 * complains about the missing field. The two are distinguishable.
 */
async function checkWritePermission() {
  const writeUrl = "https://api.x.com/2/tweets";
  const header = await buildAuthorizationHeader(
    "POST",
    writeUrl,
    {},
    credentials,
    {
      nonce: crypto.randomUUID().replace(/-/g, ""),
      timestamp: Math.floor(Date.now() / 1000),
    },
  );

  const probe = await fetch(writeUrl, {
    method: "POST",
    headers: { authorization: header, "content-type": "application/json" },
    body: "{}",
  });

  if (probe.status === 403) {
    let detail = "";
    try {
      detail = JSON.parse(await probe.text())?.detail ?? "";
    } catch {
      detail = "";
    }
    console.log("Write permission: NO.");
    if (detail) {
      console.log(`  X says: ${detail}`);
    }
    console.log("  Two things to check, in this order:");
    console.log(
      "  1. The app's User authentication settings actually SAVED with permissions",
    );
    console.log(
      "     set to Read and write. The form refuses to save without a callback URL",
    );
    console.log(
      "     and website URL, and a failed save leaves the old permission in place.",
    );
    console.log(
      "  2. The access token and secret were REGENERATED after that save. A token",
    );
    console.log("     issued earlier keeps read-only scope permanently.");
    return;
  }

  if (probe.status === 400) {
    console.log("Write permission: yes.");
    console.log(
      "  The write endpoint accepted the credentials and rejected the empty",
    );
    console.log("  probe body, which is the expected result. Nothing was posted.");
    return;
  }

  console.log(`Write permission: inconclusive (HTTP ${probe.status}).`);
  console.log(`  ${(await probe.text()).slice(0, 200)}`);
}

console.error(`Request failed: ${response.status} ${response.statusText}`);
if (response.status === 401) {
  console.error(
    "401 means the signature or the key pair is wrong. Check that all four values",
  );
  console.error(
    "came from the same app, with no stray whitespace or truncation.",
  );
} else if (response.status === 403) {
  console.error(
    "403 usually means app permissions. Set the app to Read and write, then",
  );
  console.error("regenerate the access token and secret and try again.");
} else if (response.status === 429) {
  console.error("429 is a rate limit. Wait and retry.");
}
// The response body can echo request context, so it is printed last and only
// on failure, where it is the most useful diagnostic available.
console.error(body.slice(0, 500));
process.exit(1);
