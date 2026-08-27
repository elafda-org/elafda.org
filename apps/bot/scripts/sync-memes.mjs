/**
 * Sync the curated meme stills in `apps/bot/memes/` into the bot's KV
 * namespace, where the deployed Worker reads them.
 *
 * The folder is the source of truth: every valid local file is put under
 * `meme:<filename>`, and remote `meme:` keys with no local file are deleted.
 * Dry run by default, matching the bot's cannot-post-by-accident posture;
 * pass `--live` to apply. Requires an authenticated wrangler.
 *
 *   npm run sync:bot-memes            # show the plan
 *   npm run sync:bot-memes -- --live  # apply it
 */
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MEME_PREFIX, memeContentType } from "../src/store.ts";

const botDir = fileURLToPath(new URL("..", import.meta.url));
const memesDir = path.join(botDir, "memes");
const live = process.argv.includes("--live");

// X caps simple image uploads at 5 MB and GIFs at 15 MB; stay under both.
const MAX_IMAGE_BYTES = 4_500_000;
const MAX_GIF_BYTES = 14_000_000;
// Below this the still renders visibly soft in the X media card.
const TINY_BYTES = 30_000;

function wrangler(args) {
  return spawnSync("npx", ["wrangler", ...args], {
    cwd: botDir,
    encoding: "utf8",
  });
}

let files;
try {
  files = readdirSync(memesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
} catch {
  console.error(`No memes directory at ${memesDir}. Nothing to sync.`);
  process.exit(1);
}

const locals = [];
let invalid = 0;
for (const name of files) {
  const contentType = memeContentType(name);
  if (contentType === null) {
    console.log(`skip   ${name}: unsupported extension`);
    invalid += 1;
    continue;
  }
  if (/[^A-Za-z0-9._-]/.test(name)) {
    console.log(`skip   ${name}: rename to letters, digits, dot, dash`);
    invalid += 1;
    continue;
  }
  const bytes = statSync(path.join(memesDir, name)).size;
  const cap = contentType === "image/gif" ? MAX_GIF_BYTES : MAX_IMAGE_BYTES;
  if (bytes > cap) {
    console.log(`skip   ${name}: ${bytes} bytes is over the X upload cap`);
    invalid += 1;
    continue;
  }
  if (bytes < TINY_BYTES) {
    console.log(`note   ${name}: only ${bytes} bytes, will render soft on X`);
  }
  locals.push({ name, key: `${MEME_PREFIX}${name}`, bytes });
}

if (locals.length === 0) {
  console.error("No valid meme files found. Nothing to sync.");
  process.exit(invalid > 0 ? 1 : 0);
}

// Remote state, for computing deletions. A dry run without wrangler auth
// still shows the puts; deletions are then reported as unknown.
let remoteKeys = null;
const listed = wrangler(["kv", "key", "list", "--binding=BOT_STATE", "--remote"]);
if (listed.status === 0) {
  try {
    const start = listed.stdout.indexOf("[");
    remoteKeys = JSON.parse(listed.stdout.slice(start))
      .map((row) => row.name)
      .filter((name) => name.startsWith(MEME_PREFIX));
  } catch {
    remoteKeys = null;
  }
}
if (remoteKeys === null && live) {
  console.error("Could not list remote keys; refusing a blind live sync.");
  console.error(listed.stderr?.trim() ?? "");
  process.exit(1);
}

const localKeys = new Set(locals.map((entry) => entry.key));
const deletions = (remoteKeys ?? []).filter((key) => !localKeys.has(key));

for (const entry of locals) {
  console.log(`put    ${entry.key} (${entry.bytes} bytes)`);
}
for (const key of deletions) {
  console.log(`delete ${key} (no local file)`);
}
if (remoteKeys === null) {
  console.log("note   remote keys not listed; deletions unknown in this run");
}

if (!live) {
  console.log("\nDry run. Re-run with --live to apply.");
  process.exit(0);
}

let failed = 0;
for (const entry of locals) {
  const result = wrangler([
    "kv",
    "key",
    "put",
    entry.key,
    "--path",
    path.join(memesDir, entry.name),
    "--binding=BOT_STATE",
    "--remote",
  ]);
  if (result.status === 0) {
    console.log(`synced ${entry.key}`);
  } else {
    failed += 1;
    console.error(`FAILED ${entry.key}: ${result.stderr?.trim()}`);
  }
}
for (const key of deletions) {
  const result = wrangler([
    "kv",
    "key",
    "delete",
    key,
    "--binding=BOT_STATE",
    "--remote",
  ]);
  if (result.status === 0) {
    console.log(`removed ${key}`);
  } else {
    failed += 1;
    console.error(`FAILED delete ${key}: ${result.stderr?.trim()}`);
  }
}

console.log(
  `\n${locals.length} puts attempted, ${deletions.length} deletes attempted, ${failed} failures`,
);
process.exit(failed > 0 ? 1 : 0);
