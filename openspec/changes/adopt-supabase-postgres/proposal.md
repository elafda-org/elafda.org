## Why

Every remaining delivery phase in `SPEC.md` §24 is queued behind the §13 database decision. Phase 1's readable archive, Phase 2's community features, Phase 3's review queues and Phase 4's real bot intents all need the PostgreSQL data model of §14, and today the repository has no database at all: the only persistence is the bot's KV namespace, which its own store documents as non-canonical operational state. `SPEC.md` names PostgreSQL with Drizzle as the stack and its deployment section currently names Neon as the reference provider; that reference was never provisioned.

The selected direction is Supabase managed PostgreSQL. It is full PostgreSQL, so the §14 constraints, full-text search and trigram indexes work unchanged; it bundles backups, a dashboard and a connection pooler on a workable free tier; and its stack is open source and self-hostable, which matches the project's AGPL posture that self-hosters can substitute their own infrastructure.

This change is the foundation only: the provider decision recorded in the spec, the schema and migration workflow, and verified connectivity from the web Worker. The archive schema and every product feature stay in their own later changes.

## What Changes

- Amend `SPEC.md`: the §13 stack table's database row and the §18 deployment topology, §27 initial decisions and §29 references replace Neon with Supabase managed PostgreSQL, keeping the note that self-hosters can substitute any PostgreSQL.
- Add `packages/db`: the Drizzle ORM schema home and the drizzle-kit migration workflow, with generated SQL migrations committed to the repository and applied append-only. No product tables are defined yet.
- Connect the web Worker to the database through a Cloudflare Hyperdrive configuration bound in `apps/web/wrangler.jsonc`, with connectivity proven by an operator-run smoke check rather than any public endpoint.
- Add a CI-runnable verification that the committed migrations apply cleanly to a disposable vanilla PostgreSQL.
- Document environments: Supabase project for production, any local PostgreSQL for development and CI.

## Capabilities

### New Capabilities

- `postgres-data-layer`: the managed provider decision, the schema and migration workflow, the Worker connectivity path and the credential and surface containment rules.

### Modified Capabilities

None. No accepted capability changes behavior; the site and the bot behave identically before and after this change.

## Non-goals

- Any product table from §14, including cases, users and bot events. The readable-archive change owns the first product schema.
- Supabase Auth. X-only member sign-in through Auth.js remains the accepted direction and member OAuth stays separate from bot credentials.
- Supabase Storage, Realtime and Edge Functions. Media stays on the R2 direction of §18.
- Data access through supabase-js or PostgREST. The application reads and writes through the typed service layer and Drizzle over the Postgres protocol, and the project's public Data API surface stays disabled.
- Database access from the bot Worker, which keeps its KV-only posture.

## Impact

- `SPEC.md` §13 and §18 change their managed-provider reference from Neon to Supabase.
- The monorepo gains `packages/db` alongside `packages/domain`.
- `apps/web/wrangler.jsonc` gains a Hyperdrive binding and the `nodejs_compat` compatibility flag the Postgres driver requires.
- CI gains a migration check that needs a disposable PostgreSQL service.
- Operators gain two provisioning duties documented by this change: a Supabase project and a Hyperdrive configuration holding its connection string. No secret enters the repository.
