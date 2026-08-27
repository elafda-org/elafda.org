import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function fetchWorker(url = "https://elafda.org/", env = {}, init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(url, {
      headers: { accept: "text/html" },
      ...init,
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
      ...env,
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function fetchHtml(url) {
  const response = await fetchWorker(url);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  return response.text();
}

test("server-renders the eLafda landing page", async () => {
  const html = await fetchHtml("https://elafda.org/");
  assert.match(html, /<title>eLafda: The open-source home of internet lafda<\/title>/i);
  assert.match(html, /Internet forgets\./);
  assert.match(html, /Receipts shouldn’t\./);
  assert.match(html, /EARLY ARCHIVE PREVIEW/);
  assert.match(html, /og\.png/);
  assert.match(html, /<link rel="icon" href="\/favicon\.svg"[^>]*type="image\/svg\+xml"/);
  assert.match(html, /<link rel="icon" href="\/favicon-32\.png"[^>]*sizes="32x32"/);
  assert.match(html, /<link rel="icon" href="\/favicon-16\.png"[^>]*sizes="16x16"/);
  assert.match(html, /<link rel="apple-touch-icon" href="\/apple-touch-icon-180\.png"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);

  // The shell links every page from the header nav and repeats them in the
  // footer, and surfaces the GitHub repository at the top of the page.
  for (const href of ["/cases", "/how-it-works", "/principles", "/tagged"]) {
    const links = html.match(new RegExp(`href="${href}"`, "g")) ?? [];
    assert.ok(links.length >= 2, `expected header and footer links to ${href}`);
  }
  const githubAt = html.indexOf("https://github.com/elafda-org/elafda.org");
  const mainAt = html.indexOf('<main id="main-content"');
  assert.ok(githubAt !== -1, "expected the GitHub repository link");
  assert.ok(mainAt !== -1, "expected the main landmark");
  assert.ok(githubAt < mainAt, "the header GitHub link should precede main");

  // Header, main and footer are sibling landmarks: main starts after the
  // header closes and the footer starts after main closes.
  const headerCloseAt = html.indexOf("</header>");
  const mainCloseAt = html.indexOf("</main>");
  const footerAt = html.indexOf("<footer");
  assert.ok(headerCloseAt !== -1 && headerCloseAt < mainAt, "main should follow the header");
  assert.ok(mainCloseAt !== -1 && mainCloseAt < footerAt, "footer should follow main");

  // The freshest slice of the tagged wall sits right after the hero, framed
  // as unreviewed and linking to the full wall.
  const heroCloseAt = html.indexOf("Fresh on the wall.");
  assert.ok(heroCloseAt !== -1, "expected the tagged-wall teaser");
  assert.match(html, /Unreviewed, not part of any case record\./);

  // Theme support: the header carries the toggle and the shell re-applies a
  // stored choice before first paint.
  assert.match(html, /class="theme-toggle"/);
  assert.match(html, /localStorage\.getItem\("elafda-theme"\)/);
});

test("defines both color themes in the stylesheet", async () => {
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  // Light is the default in every state; only a stored dark choice flips
  // the tokens, so no palette may hide behind the system preference.
  assert.match(styles, /:root\[data-theme="dark"\]/);
  assert.doesNotMatch(styles, /@media \(prefers-color-scheme: dark\)/);
  // X embed iframes pin a light color-scheme: the dark root otherwise
  // forces an opaque light canvas behind the transparent iframe, which
  // shows as a halo around the embed's rounded corners.
  assert.match(styles, /\.tweet-list iframe \{[^}]*color-scheme: light/);
  // The header switch: a knob that slides and swaps its icon per theme.
  assert.match(styles, /\.theme-knob/);
  assert.match(styles, /:root\[data-theme="dark"\] \.theme-knob \{ transform: translateX/);
});

test("server-renders the cases page with the discovery preview", async () => {
  const html = await fetchHtml("https://elafda.org/cases");
  assert.match(html, /<title>Cases: eLafda<\/title>/i);
  assert.match(html, /What’s in the record\?/);
  assert.match(html, /Search preview cases/);
  assert.match(html, /preview cases/);
  assert.match(html, /early archive preview/);
  assert.match(html, /EARLY ARCHIVE PREVIEW/);
  assert.match(html, /aria-current="page"[^>]*>Cases|href="\/cases"[^>]*aria-current="page"/);
});

test("server-renders the how-it-works page with the product model", async () => {
  const html = await fetchHtml("https://elafda.org/how-it-works");
  assert.match(html, /<title>How it works: eLafda<\/title>/i);
  assert.match(html, /One controversy, two layers/i);
  assert.match(html, /COMMUNITY DISCUSSION/);
  assert.match(html, /CANONICAL RECORD/);
  assert.match(html, /Votes shape discovery, not truth/);
  assert.match(html, /Nominate/);
  assert.match(html, /Preserve/);
});

test("server-renders the principles page with the safety commitments", async () => {
  const html = await fetchHtml("https://elafda.org/principles");
  assert.match(html, /<title>Principles: eLafda<\/title>/i);
  assert.match(html, /Receipts, responsibly/i);
  assert.match(html, /Allegations stay allegations\./);
  assert.match(html, /Responses get equal daylight\./);
  assert.match(html, /Public interest has boundaries\./);
  assert.match(html, /Power leaves a paper trail\./);
});

test("server-renders the tagged-on-X page behind its unreviewed framing", async () => {
  const html = await fetchHtml("https://elafda.org/tagged");
  assert.match(html, /<title>Tagged on X: eLafda<\/title>/i);
  assert.match(html, /What the community is flagging\./);
  assert.match(html, /UNREVIEWED COMMUNITY TAGS/);
  assert.match(html, /NOT A CASE RECORD/);
  // The unreviewed framing must be in the document before the feed markup.
  const framingAt = html.indexOf("has passed source review");
  const feedAt = html.indexOf('class="tagged-feed"');
  assert.ok(framingAt !== -1, "expected the unreviewed framing copy");
  assert.ok(feedAt !== -1, "expected the feed container");
  assert.ok(framingAt < feedAt, "framing should precede the feed");
  // The client feed streams in after load; the shell must carry its status.
  assert.match(html, /Loading tagged tweets/);
  assert.match(html, /skip-link/);
  // The bot mention in the deck resolves to the bot's X profile.
  assert.match(
    html,
    /<a href="https:\/\/x\.com\/eLafdaBot"[^>]*>@eLafdaBot<\/a>/,
  );

  const feedSource = await readFile(
    new URL("../app/tagged/tagged-feed.tsx", import.meta.url),
    "utf8",
  );
  assert.match(feedSource, /aria-live="polite"/);
  assert.match(feedSource, /Try again/);
  assert.match(feedSource, /Nothing has been tagged yet\./);
  assert.match(feedSource, /twitter-tweet/);
  // Ids only ever come from the feed and render as live embeds or bare links.
  assert.doesNotMatch(feedSource, /dangerouslySetInnerHTML/);

  // Sort and kind-filter controls carry programmatic pressed state, every
  // kind has a visible label, and an empty filter result has its own state.
  assert.match(feedSource, /aria-pressed/);
  assert.match(feedSource, /aria-label="Sort tags"/);
  assert.match(feedSource, /aria-label="Filter tags by kind"/);
  assert.match(feedSource, /Most tagged/);
  assert.match(feedSource, /Original post/);
  assert.match(feedSource, /Reply to the bot/);
  assert.match(feedSource, /No tags of this kind yet\./);
  // The homepage teaser never spends slots on bot-conversation chatter.
  assert.match(feedSource, /kind !== "reply"/);
});

test("serves the tagged feed at /api/tagged from the shared KV namespace", async () => {
  // Mirrors the codec in packages/domain/bot/tagged-feed.ts: zero-pad to 20
  // digits and take the nines' complement, so ascending key order is
  // descending id order.
  const complement = (id) =>
    id.padStart(20, "0").replace(/\d/g, (digit) => String(9 - Number(digit)));
  const key = (id) => `tagged:${complement(id)}`;
  // One annotated record, one legacy id-only value, one missing value: the
  // feed serves all three, degrading legacy records instead of dropping them.
  const values = new Map([
    [
      key("1960000000000000000"),
      JSON.stringify({
        tweetId: "1960000000000000000",
        kind: "original",
        tagCount: 3,
        conversationId: "a",
        firstMentionId: "7",
        lastMentionId: "9",
        recordedAt: "2026-08-26T00:00:00.000Z",
        lastTaggedAt: "2026-08-27T00:00:00.000Z",
      }),
    ],
    [key("42"), JSON.stringify({ tweetId: "42", mentionId: "43" })],
    [key("5"), null],
  ]);
  const BOT_STATE = {
    calls: [],
    async list(options) {
      this.calls.push(options);
      const names = [...values.keys()]
        .filter((name) => name.startsWith(options.prefix))
        .sort();
      return {
        keys: names.slice(0, options.limit ?? 1000).map((name) => ({ name })),
        list_complete: true,
      };
    },
    async get(name) {
      return values.get(name) ?? null;
    },
  };

  const response = await fetchWorker("https://elafda.org/api/tagged", {
    BOT_STATE,
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /json/i);
  assert.match(response.headers.get("cache-control") ?? "", /public/);
  const payload = await response.json();
  assert.deepEqual(payload.tweets, [
    {
      id: "1960000000000000000",
      kind: "original",
      tagCount: 3,
      taggedAt: "2026-08-27T00:00:00.000Z",
    },
    { id: "42", kind: "commentary", tagCount: 1, taggedAt: null },
    { id: "5", kind: "commentary", tagCount: 1, taggedAt: null },
  ]);
  assert.equal(BOT_STATE.calls[0].prefix, "tagged:");

  // Without the binding the feed degrades to unavailable, not a crash.
  const missing = await fetchWorker("https://elafda.org/api/tagged");
  assert.equal(missing.status, 503);

  // Reads only: any other method is refused.
  const posted = await fetchWorker(
    "https://elafda.org/api/tagged",
    { BOT_STATE },
    { method: "POST" },
  );
  assert.equal(posted.status, 405);
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
  const [page, chrome, stars, explorer, layout, styles, packageJson] =
    await Promise.all([
      readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
      readFile(
        new URL("../app/components/site-chrome.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../app/components/github-stars.tsx", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../app/cases/case-explorer.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
    ]);

  assert.match(explorer, /aria-live="polite"/);
  assert.match(explorer, /aria-pressed=\{topic === item\}/);
  assert.match(chrome, /className="skip-link"/);
  assert.match(chrome, /aria-current=/);
  assert.match(chrome, /https:\/\/github\.com\/elafda-org\/elafda\.org/);
  // The star count is fetched client-side and fails to a plain link.
  assert.match(stars, /api\.github\.com\/repos\/elafda-org\/elafda\.org/);
  assert.match(stars, /stargazers_count/);
  assert.match(stars, /catch/);
  for (const source of [page, chrome]) {
    assert.doesNotMatch(source, /https:\/\/github\.com\/elafda["/]/);
  }
  assert.match(layout, /metadataBase/);
  assert.match(layout, /summary_large_image/);
  // Analytics ship gated: present in the source, but only for production
  // builds, so dev servers and test runs never report pageviews.
  assert.match(layout, /googletagmanager\.com/);
  assert.match(layout, /process\.env\.NODE_ENV === "production"/);
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
