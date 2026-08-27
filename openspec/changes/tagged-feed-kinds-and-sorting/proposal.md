## Why

The tagged wall treats every mention identically, and real traffic already shows why that fails: alongside deliberate tags, the bot's mention stream carries people simply replying to the bot's own reply ("dm me too", "sure thing"). Under the current rule each of those records a target and pollutes the wall with mid-thread chatter. The wall also has exactly one ordering, newest first, so a tweet the community tags repeatedly (the strongest nomination signal `SPEC.md` §9 has before real nominations exist) looks no different from a drive-by tag.

This change makes the wall honest and navigable: every new tag still appears, but each record knows how it arrived, the page can filter by that, and repeated tagging becomes visible through a relevance ordering.

## What Changes

- Every recorded tag carries a kind, resolved from platform reply metadata only:
  - `original`: the mention is not a reply; the tagged post is the mention itself.
  - `commentary`: the mention replies to someone else's tweet; the tagged post is that tweet and the mention is commentary over it.
  - `reply`: the mention replies to a tweet authored by the bot itself. The mention is recorded as its own target, because the bot's own tweets must never become feed targets.
- Tagged records grow from an id-only audit crumb to a small value the feed serves: kind, tag count, first and latest tagging mention, timestamps. Re-tagging the same target increments the count and keeps the strongest kind (original over commentary over reply).
- The bot's mention poll requests one additional field (`in_reply_to_user_id`); no extra API calls or quota class.
- `GET /api/tagged` returns annotated entries (id, kind, tag count, last tagged time) by reading record values, still one KV list page plus cached-for-a-minute reads, still ids and counters only, never tweet content.
- The `/tagged` page gains sort controls (latest, most tagged) and kind filters (all, original posts, commentary, replies to the bot) with the existing accessible-filter pattern, a kind label on each entry, and the homepage teaser stops showing `reply` records.

## Capabilities

### Modified Capabilities

- `bot-tagged-tweet-feed`: target resolution gains kind classification, records gain counted metadata, and the feed endpoint serves annotated entries.
- `tagged-tweets-page`: the wall gains sorting, kind filtering and per-entry kind labels.

## Non-goals

- Engagement-based relevance (likes, views). The feed stores no engagement data and fetching it would change the bot's API quota class. Relevance means tag count.
- Distinguishing deliberate tags from auto-carried mentions in replies to other humans. That requires tweet-text analysis; kinds here come from reply metadata only. A future change can refine `commentary` with an explicit-mention check.
- Nominations, review states, or persistence beyond the bot's KV namespace. The PostgreSQL migration of this data belongs to the nomination change.
- Backfilling tags the bot polled before this change ships.

## Impact

- `packages/domain/bot/tagged-feed.ts` grows the record codec, kind classification and sort helpers shared by writer and reader; the key codec is unchanged, so existing keys stay valid.
- The bot store's `recordTaggedTweet` becomes a read-modify-write upsert (one KV read per human mention; volume is small and the bot is the only writer).
- The web Worker reads record values (at most the feed limit per uncached request, behind the same 60 second cache).
- Records written before this change lack the new fields; the reader treats them as `commentary` with a count of one. Production KV currently holds no tagged records, so this is purely defensive.
