import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

// Sitewide copy conventions: outward-facing text uses no em or en dashes
// (use a period, colon or parentheses instead) and no Oxford comma. The
// Oxford-comma pattern also matches a plain comma before "and"/"or" joining
// clauses; rephrase those rather than allowlisting them here. Both patterns
// match across newlines, since JSX copy often wraps mid-sentence.
const RULES = [
  [/[—–]/g, "an em or en dash"],
  [/,\s+(?:and|or)\s/g, "an Oxford comma"],
];

const webDir = fileURLToPath(new URL("../", import.meta.url));
const appDir = path.join(webDir, "app");

test("keeps copy free of em dashes, en dashes and Oxford commas", async () => {
  const entries = await readdir(appDir, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /\.(tsx?|mdx?)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
  assert.ok(files.length > 0, "expected app source files to scan");

  const problems = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const lines = source.split("\n");
    const relative = path.relative(webDir, file);

    for (const [pattern, label] of RULES) {
      for (const match of source.matchAll(pattern)) {
        const number = source.slice(0, match.index).split("\n").length;
        problems.push(`${relative}:${number} uses ${label}: ${lines[number - 1].trim()}`);
      }
    }
  }

  assert.deepEqual(problems, [], `copy style violations:\n${problems.join("\n")}`);
});
