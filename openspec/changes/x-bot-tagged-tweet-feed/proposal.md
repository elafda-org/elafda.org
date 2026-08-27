## Why

People are already tagging `@eLafdaBot` under tweets they want preserved, and today that activity is invisible: the bot replies once and the tag disappears into X. `SPEC.md` §9 treats a tag as a nomination signal whose target is resolved from platform metadata (the replied-to tweet), but the full nomination flow needs PostgreSQL and a review surface that Phase 1 does not have.

A public feed of the tweets people have tagged closes part of that gap honestly. It shows the project is alive and receiving signal, it shows *what* the community is flagging without asserting anything about it, and it exercises the same target-resolution rule (`replied-to tweet, from platform metadata`) that the real nomination flow will use.

## What Changes

- The bot records, for every human mention it polls, the id of the tweet that mention was replying to (the tagged target). A mention that is not a reply records the mention itself, since it is its own conversation root.
- The web Worker serves those recorded ids at `GET /api/tagged` as JSON, newest first, by binding the bot's KV namespace and listing keys through a codec shared from `packages/domain`. The bot Worker stays cron-only and HTTP-unreachable, preserving its credential-isolation posture.
- The website gains a `/tagged` page that renders each recorded id as an X embedded tweet, clearly labeled as unreviewed community tags rather than case records, with loading, empty, and error states.
- The homepage header and footer link to the new page.

## Capabilities

### New Capabilities

- `bot-tagged-tweet-feed`: what the bot records per mention, the id-only storage rule, and the shape and caching of the read endpoint.
- `tagged-tweets-page`: the public page, its embed behavior, its unreviewed labeling, and its accessibility states.

### Modified Capabilities

None accepted today. The active `bot-prelaunch-replies` change is unaffected: recording a tagged target is ingestion bookkeeping and changes no reply behavior.

## Non-goals

- Nominations, review links, command handling, or anything that writes a record beyond a tweet id.
- Storing or re-serving tweet text, media, or author identity. Content renders live from X and disappears when the source does.
- Member authentication and the `/api/v1` surface.

## Impact

- The bot's KV namespace is now bound by two Workers: the bot writes, the web Worker lists `tagged:` keys. The bot itself gains no HTTP surface and its secrets stay out of the web Worker entirely.
- `packages/domain` gains the tagged-key codec shared by the writer and the reader, so the format cannot drift between them.
- The mention poll requests one additional tweet field (`referenced_tweets`); no extra API calls or quota class.
- `apps/web` gains its first second route and its first API path in the Worker entry, exercising vinext routing beyond the single homepage.
- The page loads X's widgets script from `platform.x.com` at view time, the same third-party posture as the existing Google Analytics tag.
