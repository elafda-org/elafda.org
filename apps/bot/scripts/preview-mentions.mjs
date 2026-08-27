/**
 * Show the mentions the bot would answer, and whether it has already posted in
 * any of those conversations.
 *
 * Read-only. Makes two authenticated GET requests and posts nothing. Run this
 * before switching BOT_REPLY_MODE to "live", because the replies are public.
 *
 *     npm run preview:bot-mentions
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { buildAuthorizationHeader } from "../src/oauth1.ts";
import { allPrelaunchReplies } from "../src/reply.ts";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));
const env = {};
for (const line of (await readFile(envPath, "utf8")).split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}

const REQUIRED = [
  "X_BOT_API_KEY",
  "X_BOT_API_SECRET",
  "X_BOT_ACCESS_TOKEN",
  "X_BOT_ACCESS_TOKEN_SECRET",
  "X_BOT_USER_ID",
];
const missing = REQUIRED.filter((name) => !env[name]);
if (missing.length > 0) {
  console.error(`Missing in .env: ${missing.join(", ")}`);
  console.error(
    "Run `npm run verify:bot-credentials` first; it prints X_BOT_USER_ID.",
  );
  process.exit(1);
}

const credentials = {
  apiKey: env.X_BOT_API_KEY,
  apiSecret: env.X_BOT_API_SECRET,
  accessToken: env.X_BOT_ACCESS_TOKEN,
  accessTokenSecret: env.X_BOT_ACCESS_TOKEN_SECRET,
};
const botUserId = env.X_BOT_USER_ID;

async function get(url, query) {
  const authorization = await buildAuthorizationHeader(
    "GET",
    url,
    query,
    credentials,
    {
      nonce: crypto.randomUUID().replace(/-/g, ""),
      timestamp: Math.floor(Date.now() / 1000),
    },
  );
  const response = await fetch(
    `${url}?${new URLSearchParams(query).toString()}`,
    { method: "GET", headers: { authorization } },
  );
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 300)}`);
  }
  return JSON.parse(body);
}

const mentions = await get(`https://api.x.com/2/users/${botUserId}/mentions`, {
  max_results: "25",
  "tweet.fields": "author_id,conversation_id,created_at",
  expansions: "author_id",
  "user.fields": "username",
});

// Everything the bot account has posted, used to detect conversations it has
// already spoken in.
let ownTweets = { data: [] };
try {
  ownTweets = await get(`https://api.x.com/2/users/${botUserId}/tweets`, {
    max_results: "100",
    "tweet.fields": "conversation_id",
  });
} catch (error) {
  console.error(`Could not read the bot's own timeline: ${error.message}`);
  console.error("Treating every conversation as unanswered.\n");
}

const answered = new Set(
  (ownTweets.data ?? []).map((tweet) => tweet.conversation_id),
);
const usernames = new Map(
  (mentions.includes?.users ?? []).map((user) => [user.id, user.username]),
);
const all = mentions.data ?? [];

if (all.length === 0) {
  console.log("No pending mentions.");
  process.exit(0);
}

// Same selection the Worker makes: oldest first, one reply per conversation.
const ordered = [...all].sort((a, b) =>
  BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0,
);

const seen = new Set();
const willReply = [];
const willSkip = [];

for (const tweet of ordered) {
  const row = {
    ...tweet,
    username: usernames.get(tweet.author_id) ?? tweet.author_id,
    url: `https://x.com/i/status/${tweet.id}`,
  };
  if (tweet.author_id === botUserId) {
    willSkip.push({ ...row, reason: "authored by the bot" });
  } else if (answered.has(tweet.conversation_id)) {
    willSkip.push({ ...row, reason: "bot already posted in this conversation" });
  } else if (seen.has(tweet.conversation_id)) {
    willSkip.push({ ...row, reason: "another mention in the same conversation" });
  } else {
    seen.add(tweet.conversation_id);
    willReply.push(row);
  }
}

const line = (t) =>
  `  @${t.username}  ${t.created_at ?? ""}\n  ${t.url}\n  ${String(t.text ?? "").replace(/\s+/g, " ").slice(0, 220)}`;

console.log(`Pending mentions: ${all.length}`);
console.log(`Bot has posted in ${answered.size} conversation(s) already.\n`);

console.log(`WILL REPLY TO ${willReply.length} conversation(s):\n`);
for (const t of willReply) {
  console.log(line(t));
  console.log("");
}

if (willSkip.length > 0) {
  console.log(`WILL SKIP ${willSkip.length}:\n`);
  for (const t of willSkip) {
    console.log(`${line(t)}\n  reason: ${t.reason}`);
    console.log("");
  }
}

console.log("Each reply would read one of (picked at random, meme attached when curated):");
for (const variant of allPrelaunchReplies()) {
  console.log(`  "${variant}"`);
}
console.log("");
console.log("Nothing was posted. This script only reads.");
