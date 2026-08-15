import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function fetchWorker(url = "https://elafda.org/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(url, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the eLafda archive preview", async () => {
  const response = await fetchWorker();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>eLafda: The open-source home of internet lafda<\/title>/i);
  assert.match(html, /Internet forgets\./);
  assert.match(html, /Receipts shouldn’t\./);
  assert.match(html, /One controversy, two layers/i);
  assert.match(html, /EARLY ARCHIVE PREVIEW/);
  assert.match(html, /Search preview cases/);
  assert.match(html, /og\.png/);
  assert.match(html, /<link rel="icon" href="\/favicon\.svg"[^>]*type="image\/svg\+xml"/);
  assert.match(html, /<link rel="icon" href="\/favicon-32\.png"[^>]*sizes="32x32"/);
  assert.match(html, /<link rel="icon" href="\/favicon-16\.png"[^>]*sizes="16x16"/);
  assert.match(html, /<link rel="apple-touch-icon" href="\/apple-touch-icon-180\.png"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("redirects the www hostname to the canonical apex URL", async () => {
  const response = await fetchWorker("https://www.elafda.org/cases?topic=tech");

  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://elafda.org/cases?topic=tech",
  );
});

test("ships the finished product surface and social image", async () => {
  const [page, layout, styles, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /aria-live="polite"/);
  assert.match(page, /aria-pressed=\{topic === item\}/);
  assert.match(page, /className="skip-link"/);
  assert.match(page, /https:\/\/github\.com\/elafda-org\/elafda\.org/);
  assert.doesNotMatch(page, /https:\/\/github\.com\/elafda["/]/);
  assert.match(layout, /metadataBase/);
  assert.match(layout, /summary_large_image/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /focus-visible/);
  assert.match(styles, /@media \(max-width:\s*760px\)/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  const ogStats = await stat(new URL("../public/og.png", import.meta.url));
  assert.ok(
    ogStats.size < 200_000,
    `og.png should be the brand card (<200KB), got ${ogStats.size} bytes`,
  );
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/client/og.png", import.meta.url));
  for (const icon of [
    "favicon.svg",
    "favicon-16.png",
    "favicon-32.png",
    "apple-touch-icon-180.png",
  ]) {
    await access(new URL(`../public/${icon}`, import.meta.url));
    await access(new URL(`../dist/client/${icon}`, import.meta.url));
  }
  await access(new URL("../wrangler.jsonc", import.meta.url));
  await assert.rejects(access(new URL("../.openai/hosting.json", import.meta.url)));
  await assert.rejects(access(new URL("../build/sites-vite-plugin.ts", import.meta.url)));
});
