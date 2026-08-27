## Why

`SPEC.md` §9 defines the `@eLafdaBot` command surface as six single-word commands and requires that free-form mentions resolve into that same closed set. Nothing implements that mapping yet, and the surrounding bot workflow (mention polling, nominations, replies) depends on a database, a job queue, and X credentials that the repository does not have.

Command resolution is the one part of the bot that has no infrastructure dependency. Landing it first gives the later ingestion work a settled, tested contract to call, and gives `SPEC.md` §23 its named unit-test target for bot intent mapping.

## What Changes

- Add a pure domain module that resolves mention text to exactly one command or `unknown`.
- Implement tier one exact matching on the single-word command vocabulary.
- Implement tier two deterministic phrase matching for English, Hindi, and Hinglish variants.
- Define a classifier port for a future model-backed tier three, left unimplemented so current behavior is fully deterministic.
- Treat parent, quoted, and linked tweet content as evidence rather than instruction, so mention text is the only classification input.
- Return the resolved command with its tier and confidence so the eventual `bot_events` record is auditable.
- Fall back to `help` with no write on ambiguous, unknown, and classifier-failure paths.

## Capabilities

### New Capabilities

- `bot-command-resolution`: The mention-to-command contract, its two deterministic tiers, the untrusted-content boundary, the safe fallback behavior, and the audit fields the resolution produces.

### Modified Capabilities

None.

## Non-goals

- Mention polling, deduplication, nomination creation, and reply publishing. Those need PostgreSQL, a job queue, and `X_BOT_*` credentials, and belong to a later change.
- A model-backed classifier. The port is defined; no provider is wired.
- Any network call, persistence, or scheduled execution.

## Impact

- Adds `packages/domain` as the first shared package in the monorepo, holding runtime-agnostic domain logic with no web or Worker dependency.
- Adds a `node:test` suite for the resolver and a root script to run it.
- Does not change the website, its build, or its deployment.
- Does not add credentials, configuration, or external services.
