## Context

`SPEC.md` §9 describes a bot that turns tags into nominations. None of its dependencies exist: no PostgreSQL, no job queue, no `/n/{id}` review page. What does exist is an X account people can already tag and a brand voice for pre-launch replies.

This change builds the smallest thing that is honest: acknowledge the tag, file nothing, and say so.

## Goals

- Never imply a nomination was created. §9 forbids the bot from summarizing unreviewed allegations, and a reply that sounds like intake would do exactly that.
- Never reply twice to the same conversation.
- Be stoppable in seconds, by someone who cannot deploy.

## Decisions

### A separate Worker, not the web Worker

`apps/bot` gets its own Wrangler configuration and deployment. It has a different trigger (cron, not fetch), different secrets, and a different blast radius. Folding a credentialed X client into the Worker that serves elafda.org would put posting secrets in the request path of a public website for no benefit.

This deviates from `SPEC.md` §16, which lists `apps/worker`. That entry describes a long-running container consuming a queue, per §18. A cron-triggered edge Worker is a different runtime with a different lifecycle, and conflating the two under one directory name would make the later queue worker harder to introduce, not easier.

### OAuth 1.0a, not OAuth 2.0

OAuth 1.0a user-context credentials do not expire. OAuth 2.0 user-context tokens last about two hours and require refresh-token rotation, which means the bot must durably store a rotating secret and can be bricked by losing it mid-rotation. For a scheduled process that posts as itself, that is a failure mode bought for nothing.

`SPEC.md` §19 names `X_BOT_CLIENT_ID / X_BOT_CLIENT_SECRET / X_BOT_ACCESS_TOKEN`, which is OAuth 2.0 shaped. That list needs updating, and the tasks call it out.

### KV for state, deliberately not a database

The bot keeps a poll cursor and a ledger of answered conversations. This is operational state: losing it costs at most a duplicate reply or a re-poll, and none of it is canonical content. Introducing D1 or Postgres here would pre-empt the §13 database decision to store two keys.

**This is a real tradeoff, not a free one.** KV is eventually consistent, so the reply ledger cannot give the guarantee that §14's unique constraint on `(platform, external_id)` will. A stale read can produce a duplicate reply. Mitigations: the ledger key is claimed before the post rather than after, replies are capped per run, and the cadence is slow relative to KV convergence. The real ingestion change must use a database with a unique constraint; KV is adequate only because a duplicate holding reply is embarrassing rather than harmful.

### Claim before posting

The ledger entry is written before the X API call. If the post then fails, the conversation is marked answered when it was not, and that tag goes unanswered. The inverse ordering would risk answering twice when a post succeeds but the ledger write fails.

For a bot whose §25 acceptance criterion is idempotent writes, a missed reply is the correct failure. The claim carries a short TTL so a genuinely failed post is retried on a later run, while a successful one is upgraded to a long-lived entry.

### One reply, no interpretation

Every mention gets the same text. There is no classification, no thread reading, and no per-intent variation. The reply is a fixed string with no interpolation from tweet content, which removes the injection surface entirely: nothing a tagging user writes can reach the outgoing reply.

## Risks

- **Cost.** Every poll consumes X API read quota whether or not anyone tagged the bot. Cadence is configuration, not code, so it can be tuned down without a deploy.
- **Signature correctness is unverified.** OAuth 1.0a signing is tested for determinism, encoding, and base-string construction, but no test proves X accepts the signature. First live run is the real verification, which is what dry-run mode is for.
- **Handle inconsistency.** `brand/copy.md` names `@elafda` as the handle and aims its tag-reply copy there, while `SPEC.md` and this change use `@eLafdaBot`. The brand document needs a correction.

## Open questions

- Whether `@elafda` should also be polled, or should redirect people to `@eLafdaBot`.
- How long the ledger should retain answered conversations before a re-tag earns a second reply.
