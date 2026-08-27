## Why

People can tag `@eLafdaBot` today and get silence. `SPEC.md` §9 defines what the bot will eventually do, but the nomination flow needs PostgreSQL, a job queue, and a review page that Phase 1 does not have. Silence is the worst available answer: it reads as a dead project, and it gives a tagging user no signal that anything was received.

A holding reply closes that gap without touching the canonical record. It acknowledges the tag, states plainly that nominations are not open, and files nothing.

## What Changes

- Add `apps/bot`, a cron-triggered Cloudflare Worker that polls `@eLafdaBot` mentions and posts one pre-launch holding reply per conversation.
- Sign X API requests with OAuth 1.0a user context, so the bot has no token-refresh cycle to maintain inside a scheduled Worker.
- Keep the poll cursor and reply ledger in Workers KV as operational state, with no database and no canonical content.
- Reply at most once per conversation, and cap replies per run so a burst of tags cannot become a reply storm.
- Ship an emergency pause that takes effect without a deployment, and a dry-run mode that logs intended replies instead of posting them.
- Acknowledge the tag only. The reply never restates, summarizes, or characterizes the claim in the thread.

## Capabilities

### New Capabilities

- `bot-prelaunch-replies`: Mention polling, per-conversation reply-once behavior, holding-reply content limits, pause and dry-run controls, rate limiting, and the state the bot keeps.

### Modified Capabilities

None. This does not implement `SPEC.md` §9 command intents; it answers every mention identically.

## Non-goals

- Command resolution. The `x-bot-command-resolution` change covers that, and a holding reply is the same regardless of what was asked.
- Nominations, review links, case matching, thread archival, and anything that writes a record.
- Member authentication and the `/api/v1` surface.

## Impact

- Adds a second deployable Worker with its own Wrangler configuration, cron schedule, and secrets, separate from the web Worker.
- Requires `X_BOT_*` secrets and a KV namespace that the maintainer provisions. None are committed.
- Requires paid X API access for mention reads, which is a standing operational cost.
- Does not change the website, its build, or its deployment.
