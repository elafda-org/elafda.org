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
const EM_OR_EN_DASH = /[—–]/g;
const OXFORD_COMMA = /,\s+(?:and|or)\s/g;

const appDir = fileURLToPath(new URL("../app/", import.meta.url));

async function collectSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(full);
      return /\.(tsx?|mdx?)$/.test(entry.name) ? [full] : [];
    }),
  );
  return files.flat();
}

function violations(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => {
    const number = source.slice(0, match.index).split("\n").length;
    return { line: source.split("\n")[number - 1], number };
  });
}

test("keeps copy free of em dashes, en dashes and Oxford commas", async () => {
  const files = await collectSourceFiles(appDir);
  assert.ok(files.length > 0, "expected app source files to scan");

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(path.dirname(appDir), file);

    for (const { line, number } of violations(source, EM_OR_EN_DASH)) {
      assert.fail(`${relative}:${number} uses an em or en dash: ${line.trim()}`);
    }
    for (const { line, number } of violations(source, OXFORD_COMMA)) {
      assert.fail(`${relative}:${number} uses an Oxford comma: ${line.trim()}`);
    }
  }
});
