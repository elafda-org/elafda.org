# @elafda/bot

Cron-triggered Cloudflare Worker that posts the pre-launch holding reply to people
who tag `@eLafdaBot`.

It acknowledges the tag and files nothing. It does not read threads, does not
classify intent, and does not create nominations. `SPEC.md` §9 describes the bot
this will eventually become; none of that is implemented here.

There is no `fetch` handler. This Worker holds posting credentials and has no
reason to be reachable over HTTP.

## What it does per run

1. Stops immediately if paused, by configuration or by stored state.
2. Polls mentions newer than the stored cursor.
3. Drops its own posts and conversations it has already answered.
4. Posts one reply per remaining conversation, up to the per-run cap.
5. Advances the cursor only past mentions it finished with.

## Setup

### 1. X application

The app must be owned by the bot account and kept separate from any member
sign-in app.

- Set app permissions to **Read and Write**.
- **Regenerate the access token and secret afterwards.** Tokens minted while the
  app was read-only stay read-only, and posting will fail with a permissions
  error that does not mention the cause.
- Note the bot account's **numeric user id**. The mentions endpoint takes an id,
  not a handle.
- Reading mentions requires a paid API tier. Confirm the current tier and its
  monthly read cap before choosing a cron cadence.

### 2. KV namespace

```bash
cd apps/bot
npm ci
npx wrangler kv namespace create BOT_STATE
```

Put the returned id into `wrangler.jsonc` as the `BOT_STATE` namespace `id`. The
committed id belongs to the production Cloudflare account; replace it when
deploying anywhere else, or the deploy fails with a namespace-not-found error.

### 3. Credentials

Never commit these and never paste them into a chat or an issue.

The five names are declared in `wrangler.jsonc` under `secrets.required`, so
wrangler warns about missing ones during local development and refuses to deploy
without them, naming the gaps.

**Local development** reads `.env` in this directory:

```bash
cp .env.example .env
# then fill in the values
```

`.env` is gitignored and never leaves your machine. Wrangler loads it from the
directory holding `wrangler.jsonc`, which is why it lives here rather than at the
repository root. Use `.env` or `.dev.vars`, never both: defining `.dev.vars`
makes wrangler ignore `.env` entirely.

**Production is separate.** A `.env` file does not reach a deployed Worker. Set
each value on the Worker itself:

```bash
npx wrangler secret put X_BOT_API_KEY
npx wrangler secret put X_BOT_API_SECRET
npx wrangler secret put X_BOT_ACCESS_TOKEN
npx wrangler secret put X_BOT_ACCESS_TOKEN_SECRET
npx wrangler secret put X_BOT_USER_ID
```

`X_BOT_USER_ID` is a public numeric id rather than a secret. It sits with the
others so there is one place to look; move it into the `vars` block of
`wrangler.jsonc` if you would rather have it in version control.

### 4. Verify the credentials

The portal does not show the numeric user id, and no offline test can prove that
X accepts a signature. One command, run from the repository root, does both:

```bash
npm run verify:bot-credentials
```

It makes a single authenticated read of the bot's own account, prints
`X_BOT_USER_ID`, and posts nothing. A 401 means the key pair or the signature is
wrong; a 403 usually means the app is still read-only.

This proves signing and identity. Write permission is proven only by the first
live reply.

## First deployment

`wrangler.jsonc` ships with `BOT_PAUSED: "true"` and `BOT_REPLY_MODE: "dry-run"`,
so a deploy cannot post by accident.

```bash
npx wrangler deploy
```

Then work through it in order:

1. Set `BOT_PAUSED` to `"false"` in `wrangler.jsonc` and redeploy. Still a dry run.
2. Watch a scheduled run with `npx wrangler tail`. The summary line reports
   `polled` and `intended` counts.
3. Set `BOT_REPLY_MODE` to `"live"` and redeploy.

The first live reply is the only thing that proves the app has write permission.
If it fails, the access token was almost certainly issued before the app was set
to Read and write, and needs regenerating.

## Stopping it

Fastest, no deployment required:

```bash
npx wrangler kv key put --binding BOT_STATE bot:paused 1
```

The next run reads that key and posts nothing. Delete the key to resume. Setting
`BOT_PAUSED` to `"true"` and redeploying works too, but takes a build.

## Configuration

| Variable | Purpose |
| --- | --- |
| `BOT_PAUSED` | `"true"` stops all posting |
| `BOT_REPLY_MODE` | `"live"` posts. Anything else, including unset, is a dry run |
| `BOT_MAX_REPLIES_PER_RUN` | Per-run reply cap. Defaults to 10 |

Cron cadence lives in `wrangler.jsonc` under `triggers.crons` and is the main
driver of API read consumption.

## Running it locally

```bash
cd apps/bot
npm ci
npx wrangler dev --test-scheduled
```

Then trigger a run by visiting `/__scheduled` on the local server. Keep
`BOT_REPLY_MODE` unset or set to anything other than `"live"` while doing this,
or a local run will post to X for real.

## Tests

From the repository root:

```bash
npm run test:bot
npm run typecheck:bot
```

The suite runs against a faked X client and an in-memory store, so it needs no
credentials and makes no network calls.

## Known limits

The reply ledger lives in KV, which is eventually consistent. A stale read can
produce a duplicate reply. That is acceptable for a holding reply and is not
acceptable for the real nomination flow, which needs the unique constraint on
`(platform, external_id)` from `SPEC.md` §14.
