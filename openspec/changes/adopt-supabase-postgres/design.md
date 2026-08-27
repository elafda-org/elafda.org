# Design

## Why Supabase over the alternatives

Three candidates fit the current Cloudflare Workers runtime.

**Cloudflare D1** is platform-native and the hosting bindings already scaffold it, but it is SQLite. The §14 model leans on PostgreSQL behavior the spec calls out by name: relational integrity under concurrent writes, full-text search and trigram indexes for §13's search baseline, and UUIDv7 key generation. Choosing D1 would rewrite the spec's data direction to fit the host; the contract says to resolve such conflicts in the spec, and the spec says PostgreSQL.

**Neon** was the §18 reference and would work. Supabase supersedes it on two grounds: the whole Supabase stack is open source and self-hostable, which is the stronger match for an AGPL project that promises substitutable infrastructure, and it bundles operational surface (backups, dashboard, pooler, logs) that Neon spreads across integrations. The two are close; this is a judgment call recorded here so it is not relitigated in code.

**Supabase** is managed PostgreSQL, so everything the spec already says about PostgreSQL holds without translation. The decision is provider-level only: nothing in the schema or the application may depend on Supabase-specific services, so a self-hoster pointing the same migrations at vanilla PostgreSQL gets an identical system.

## Connection path: Worker to Hyperdrive to Supabase

Workers open database connections per-isolate and per-request, which raw PostgreSQL tolerates badly. Cloudflare's answer is Hyperdrive: it holds a warm connection pool near the database, performs connection setup near the Worker and caches common reads. The Worker receives a Hyperdrive binding and passes the binding's generated connection string to an ordinary Postgres driver, so Drizzle code is identical in local development (plain connection string) and production (binding string).

Consequences accepted with this path:

- Hyperdrive pools in transaction mode. Session-scoped PostgreSQL state (session prepared statements, advisory locks, temp tables across transactions) is off the table for application code. The driver is configured accordingly, for example `prepare: false` on postgres-js.
- The Hyperdrive configuration, not the repository, holds the Supabase connection string. Rotation happens in the Cloudflare dashboard or wrangler, never in a commit.
- Whether Hyperdrive points at Supabase's direct connection host or its Supavisor pooler endpoint is pinned during implementation against Cloudflare's current Supabase guide, since the recommendation has shifted over time. Either way Hyperdrive does the pooling that matters; the choice only affects the origin hostname.
- The binding is optional in the Worker's environment type, matching the existing `BOT_STATE` posture: an environment without the binding degrades rather than crashes. Until product features ship, no request path touches the database at all.

## Access path: Drizzle over the wire protocol, not supabase-js

Supabase's client library reaches the database through PostgREST and would create a second, untyped-at-our-layer API surface with its own authorization model. The spec already commits to a typed service layer over Drizzle, and the working contract keeps authorization in service methods. So the application speaks the Postgres wire protocol only, and the Supabase project's public Data API stays disabled. That also closes the default-exposure footgun where a fresh Supabase project serves its schema publicly to anyone holding the anon key.

For the same reason this change does not adopt row-level security. RLS earns its keep when end-user tokens reach the database; here a single service role connects through Hyperdrive and every request is authorized in the service layer before SQL runs. Revisit only if a future change puts user-scoped tokens on the wire.

## Migrations

`packages/db` holds the Drizzle schema and drizzle-kit configuration. `drizzle-kit generate` emits SQL migration files that are committed and treated as append-only: a bad migration is corrected by a new migration, never by editing history. CI applies the full chain to a disposable vanilla PostgreSQL on every run, which both guards the chain and enforces the no-Supabase-specifics rule, since the CI database has no Supabase extensions preloaded beyond stock PostgreSQL.

This change lands the workflow with an empty schema: the migration chain, the CI check and the connectivity smoke test are real, but the first product tables belong to the readable-archive change so that schema review happens next to the feature that needs it.

## What stays out

The bot Worker keeps zero database access and its cron-only, no-HTTP posture. The tagged-tweet feed keeps living in KV until the real nomination model from §9 and §14 lands in PostgreSQL through its own change, which is also the natural point to migrate those records.
