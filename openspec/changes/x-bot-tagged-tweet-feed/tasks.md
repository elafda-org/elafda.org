## 1. Bot: record tagged targets

- [x] 1.1 Request `referenced_tweets` in the mention poll and expose the replied-to id on `Mention`
- [x] 1.2 Add tagged-target recording to the KV store, keyed through the shared codec with an id-only JSON value
- [x] 1.3 Record the tagged target for every polled human mention in `runOnce`, in all modes, before dedupe and cap checks

## 2. Feed endpoint

- [x] 2.1 Add the shared tagged-key codec and newest-first KV reader to `packages/domain/bot`
- [x] 2.2 Serve `GET /api/tagged` from the web Worker entry: newest-first JSON, public cache TTL, 405 for other methods, 503 without the binding
- [x] 2.3 Bind the bot's KV namespace in `apps/web/wrangler.jsonc` for both the preview and production environments

## 3. Web: tagged page

- [x] 3.1 Add the `/tagged` route with unreviewed-tags framing, X embeds from feed ids, and loading, empty, error, and announcement states
- [x] 3.2 Link the page from the homepage header navigation and footer, and link home from the page header
- [x] 3.3 Style the page in `globals.css` within the existing design system, including reduced-motion and focus-visible behavior
- [x] 3.4 Render embeds with X's dark theme and canonical `x.com` markup, with the fallback card matching
- [x] 3.5 Add the homepage wall teaser after the hero with empty and unavailable states, and lay both walls out as masonry columns

## 4. Verification

- [x] 4.1 Extend the bot and domain `node:test` suites to cover target resolution, idempotent recording, dry-run recording, the key codec, and the feed endpoint scenarios
- [x] 4.2 Extend the rendered-HTML suite to cover the tagged page: framing copy, live region, states, and homepage links
- [x] 4.3 Run lint, typecheck, the web build, and the full test suite
- [x] 4.4 Re-run `openspec validate x-bot-tagged-tweet-feed`

## 5. Maintainer steps (not automatable here)

- [ ] 5.1 Deploy `apps/bot` (recording) and the web Worker (`/api/tagged` + KV binding)
- [ ] 5.2 Confirm the production `/tagged` page loads the feed and renders embeds in a browser
