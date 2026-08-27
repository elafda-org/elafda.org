# Design

## Kind comes from reply metadata, not text

`SPEC.md` §9 resolves tag targets from platform metadata, and this change keeps classification inside that boundary. The mentions endpoint already tells us everything the three kinds need: whether the mention is a reply (`referenced_tweets` of type `replied_to`) and who it replies to (`in_reply_to_user_id`).

- Not a reply: the author posted a tweet that tags the bot. Kind `original`, target is the mention itself.
- Reply to a tweet by anyone other than the bot: the classic tag. Kind `commentary`, target is the replied-to tweet.
- Reply to a tweet by the bot: conversation with the bot, not a nomination. Kind `reply`, and the target is the mention itself, never the bot's tweet. Recording the bot's own reply as a wall target would put eLafda's "coming soon" post on eLafda's own wall.

The known blind spot: a reply to another human deep in a thread the bot was tagged into carries the bot's handle automatically and classifies as `commentary`. Telling those apart needs tweet text (is the handle present outside the leading auto-mention run), which is a scope step this change deliberately does not take; the spec delta names it as a future refinement so the limitation is recorded rather than discovered.

## One record per target, upserted

The key codec is untouched: one `tagged:` key per target, nines'-complement id ordering, so "latest" still falls out of a single KV list. What changes is the value, which becomes the unit the feed actually serves:

```
{ tweetId, kind, tagCount, conversationId,
  firstMentionId, lastMentionId, recordedAt, lastTaggedAt }
```

`recordTaggedTweet` becomes read-modify-write: fetch the existing record, increment `tagCount`, update `lastMentionId`/`lastTaggedAt`, and keep the strongest kind seen (`original` over `commentary` over `reply`; a root post that later also gets commentary-tagged stays `original`). The bot is the namespace's only writer and processes mentions sequentially inside a run, so the read-modify-write has no concurrent writer to race.

The upsert logic is a pure function in `packages/domain` next to the key codec, for the same reason the codec lives there: the writer (bot) and reader (web Worker) must not drift, and pure functions are what the `node:test` suites can pin down.

## Relevance is tag count

The only popularity signal the system has that does not require new X API reads is how often the community re-tags the same target. Relevance ordering is `tagCount` descending with recency as the tiebreak. This is honest about what it is: a nomination-strength preview, not engagement ranking, matching the §9 framing of tags as nomination signals. Anything based on likes or views would change the bot's read quota class and is out of scope.

## The API stays parameterless; the client sorts and filters

`GET /api/tagged` returns every annotated entry (up to the feed limit) in latest order. Sorting and filtering happen in the page, like the case explorer's client-side search: one cached fetch, instant control toggles, no cache fragmentation per sort-filter combination on the edge, and the 60 second cache keeps KV reads bounded exactly as before. The Worker now performs one KV `get` per listed key on cache miss; at the feed limit that is bounded and behind the cache.

Records without the new fields (written by a pre-change bot) parse as `commentary` with count one rather than being dropped, so a mixed namespace degrades to the old behavior instead of hiding tags. Production currently has zero records, so this path is defensive only.

## Page controls reuse the accessible filter pattern

The wall gets two control groups above the list: sort (latest, most tagged) and kind filter (all, original posts, commentary, replies to the bot), built on the existing `topic-filters` pattern with `aria-pressed` state and the live result-count region the page already has. Each entry shows a small kind label so the distinction is visible on the wall itself, not only through filters. The homepage teaser keeps its recency slice but excludes `reply` records, since bot-conversation chatter is exactly what a three-tweet teaser must not spend slots on.
