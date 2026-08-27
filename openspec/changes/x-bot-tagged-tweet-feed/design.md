## Context

The bot already polls mentions on a cron and keeps operational state in KV. Since the web app's migration to Cloudflare Workers, both Workers deploy to the same account, so they can bind the same KV namespace: what the bot records is directly readable by the Worker that serves elafda.org, with no HTTP boundary between them.

`SPEC.md` §9 is explicit that nomination targets are resolved "from platform metadata such as conversation ID and referenced tweet ID, never from classifier output". This change implements exactly that resolution rule, and nothing downstream of it.

## Goals

- Show what the community has tagged without storing, restating, or ranking any of it.
- Respect deletion and protection: if a tweet disappears from X, it disappears from the page.
- Keep posting credentials out of every HTTP-reachable code path.

## Decisions

### Record ids only, and let X render content

The bot stores tweet ids and nothing else: no text, no author, no media. The page hands each id to X's embed widget, which fetches the live tweet in the viewer's browser. A deleted or protected tweet renders as a bare link that X declines to expand, which satisfies "never reproduce deleted media automatically" (§9 bot safety) structurally rather than by policy. It also keeps the feed endpoint free of user content, so serving it publicly asserts nothing.

### The replied-to tweet is the record, with the mention as fallback

A tag is almost always a reply under someone else's tweet, and the interesting object is the tweet being replied to, so that is what gets recorded (from `referenced_tweets` metadata, per §9). A root mention has no parent; it is recorded itself, because there the mention *is* the flagged content. Quote-tweet references are deliberately ignored: §9 names the replied-to relationship for target resolution, and widening it is a product decision for the real nomination change.

### Recording happens for every polled human mention, in every mode

Recording is ingestion bookkeeping, not a reply. It happens even for mentions in already-answered conversations (a re-tag still signals the same target) and in dry-run mode (the feed works while replies are being verified). Only the bot's own tweets are excluded. Writes are keyed by tweet id, so all of this is idempotent; the same target tagged five times is one record.

This deliberately narrows what "dry run" means: the `bot-prelaunch-replies` dry-run requirement promises no posts, no answered-markers, and no cursor movement, and tagged records are none of those. A dry run that re-polls the same mentions simply overwrites the same keys.

### Storage: one KV key per target, data in the key name

Records live at `tagged:<nines-complement of the zero-padded tweet id>`. Zero-padding to 20 digits and complementing every digit makes ascending lexicographic KV `list` order equal descending numeric snowflake order, so the newest N targets come from listing one page of keys alone: no per-item `get`, no serialized index key to contend over, and idempotent re-records are plain overwrites. The value stores a small JSON audit crumb (mention id, conversation id) that nothing currently reads. Keys carry no TTL: unlike the reply ledger, these records are the content of a public page, though losing them still only costs a thinner page, which is why KV remains acceptable ahead of the §13 database.

### The web Worker serves the feed; the bot stays unreachable

The prelaunch change kept the bot deliberately without a `fetch` handler because it holds posting credentials, and AGENTS.md forbids weakening bot safeguards for convenience. That posture survives intact: the web Worker binds the same KV namespace and serves `GET /api/tagged` itself, so the credentialed Worker never gains an HTTP surface. The endpoint answers only GET (405 otherwise), degrades to 503 when the binding is absent, and carries a short public cache TTL so the page cannot stampede KV. Same-origin serving also removes the need for CORS and for a hardcoded cross-origin feed URL in the client. The cost is that two Workers now bind one namespace with an implicit writer/reader split; the shared key codec in `packages/domain/bot/tagged-feed.ts` is what keeps that split honest, since writer and reader cannot drift while they import the same module.

### The page fetches the same-origin feed client-side

The existing page is a client component and the feed is naturally dynamic, so the `/tagged` page fetches `/api/tagged` in the browser and renders embeds, keeping the server-rendered shell static and cacheable. The path is a checked-in constant because it is public configuration with exactly one correct value.

## Risks

- **X embed dependence.** If `platform.twitter.com` is blocked or slow, the page degrades to a list of plain links to X. That is the designed floor, not a failure.
- **KV list pagination.** `list` returns up to 1000 keys per page and the inverted key order puts the newest first, so the endpoint serves the newest slice in one read; past 1000 recorded targets the oldest fall off the feed before a database exists. Logged as an accepted cap.
- **Public endpoint abuse.** The endpoint is cacheable, id-only, and unauthenticated by design; the cache TTL is the rate limit.
- **Shared namespace coupling.** A web Worker bug could in principle write to the bot's namespace. The binding is used through the read-only reader interface, and nothing in the web Worker imports a writer; the real guarantee arrives with the §13 database and stays out of scope here.

## Open questions

- Whether the page should eventually group targets by conversation rather than listing raw tweets. Deferred until real usage shows the shape of tagging.
