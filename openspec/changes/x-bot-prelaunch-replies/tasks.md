## 1. Product Contract

- [x] 1.1 Update `SPEC.md` §19 to name OAuth 1.0a bot credentials instead of the OAuth 2.0 shaped `X_BOT_CLIENT_ID / X_BOT_CLIENT_SECRET / X_BOT_ACCESS_TOKEN`
- [ ] 1.2 Correct `brand/copy.md` so the tag-reply section names `@eLafdaBot` rather than `@elafda`
- [ ] 1.3 Decide whether `@elafda` mentions are polled, redirected, or ignored

## 2. Bot Worker

- [x] 2.1 Add `apps/bot` with its own Wrangler configuration, cron trigger, and KV binding
- [x] 2.2 Implement OAuth 1.0a request signing with injectable nonce and timestamp
- [x] 2.3 Implement an X client covering mention polling and reply posting behind an interface
- [x] 2.4 Implement KV-backed cursor storage and a claim-before-post conversation ledger
- [x] 2.5 Implement the run orchestration: pause check, poll, self-mention filter, dedupe, per-run cap, reply
- [x] 2.6 Implement dry-run mode that reports intended replies without posting or claiming
- [x] 2.7 Validate required configuration at run start and fail with the missing variable named

## 3. Verification

- [x] 3.1 Add a `node:test` suite covering every scenario in the capability spec, using a faked X client and an in-memory store
- [x] 3.2 Add root scripts to run, typecheck, and credential-verify the bot package
- [x] 3.3 Document the secrets, KV namespace, cadence, and deployment steps without committing values, with a committed `.env.example` and a gitignored `.env`
- [x] 3.4 Run lint, the web build, and the full test suite
- [x] 3.5 Re-run `openspec validate x-bot-prelaunch-replies`

## 4. Maintainer Steps (not automatable here)

- [x] 4.1 Set app permissions to Read and Write, then regenerate access tokens
- [x] 4.2 Create the KV namespace and record its id in Wrangler configuration
- [x] 4.3 Fill `apps/bot/.env` for local runs, and set the `X_BOT_*` secrets with `wrangler secret put` for production
- [x] 4.4 Run `npm run verify:bot-credentials`, record `X_BOT_USER_ID`, deploy paused, run once in dry-run mode, then unpause
- [x] 4.5 Seed `mentions:cursor` past the manually answered backlog before going live

## 5. Review Hardening

- [x] 5.1 Restore the paused and dry-run defaults in the committed Wrangler vars so a fresh deploy matches the documented cannot-post-by-accident posture
- [x] 5.2 Release a failed reply's claim and freeze the cursor at the first failure, so the next run retries instead of losing the mention behind the cursor or a live claim
- [x] 5.3 Drain mention pagination before selection, so a burst larger than one API page is never stranded behind an advancing cursor
- [x] 5.4 Validate the preview script's env like the verify script does, and commit a lockfile so `npm ci` works in `apps/bot`
