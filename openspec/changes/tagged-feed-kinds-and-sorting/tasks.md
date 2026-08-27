# Tasks

## 1. Shared domain

- [x] 1.1 Extend `packages/domain/bot/tagged-feed.ts`: kind type, record codec (parse tolerant of legacy values), `classifyMention`, pure `upsertTaggedRecord` with kind precedence and counting, and sort helpers (latest, most tagged)
- [x] 1.2 Extend `packages/domain/tests/tagged-feed.test.mjs`: classification for all three kinds, upsert counting and kind precedence in both orders, legacy value parsing, both sort orders with tiebreaks

## 2. Bot recording

- [x] 2.1 Request and surface `in_reply_to_user_id` in `apps/bot/src/x-client.ts` (`Mention.inReplyToUserId`)
- [x] 2.2 Rework `recordTaggedTweet` in `apps/bot/src/store.ts` into the read-modify-write upsert over the shared record codec
- [x] 2.3 Classify in `apps/bot/src/run.ts` via `classifyMention` so reply-to-bot mentions record themselves, never the bot's tweet
- [x] 2.4 Update `apps/bot/tests/run.test.mjs` and the fake store for kinds, counts and the reply-to-bot target rule

## 3. Feed endpoint

- [x] 3.1 Read record values in the web Worker's tagged feed handler and serve annotated entries (id, kind, tagCount, taggedAt), legacy records defaulting to commentary with count one
- [x] 3.2 Update the worker feed test for the annotated shape and legacy tolerance

## 4. Tagged page

- [x] 4.1 Sort controls (latest, most tagged) and kind filters (all, original, commentary, replies) on `/tagged` using the `topic-filters` pressed-state pattern, client-side only, live region updated
- [x] 4.2 Visible kind label on each wall entry; empty-filter state distinct from feed-unavailable
- [x] 4.3 Homepage teaser skips kind `reply` entries
- [x] 4.4 Styles for controls and labels in `globals.css` within the existing design system
- [x] 4.5 Extend `apps/web/tests/rendered-html.test.mjs` for the controls, pressed state and kind labels

## 5. Verification

- [x] 5.1 `openspec validate tagged-feed-kinds-and-sorting`
- [x] 5.2 Root `npm test` (typechecks, domain, bot, web build and rendered tests) and `npm run lint` pass
- [x] 5.3 Confirm no tweet text, media or author handle enters any stored record or feed response
