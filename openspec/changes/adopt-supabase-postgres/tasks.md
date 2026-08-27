# Tasks

## 1. Spec amendment

- [x] 1.1 Update `SPEC.md` §13 stack table: database row names Supabase managed PostgreSQL, with the self-host substitution note preserved
- [x] 1.2 Update `SPEC.md` §18 deployment topology, prose, §27 initial decisions and §29 references: replace Neon entries with Supabase equivalents (connection pooling documentation link included)

## 2. Provisioning (operator)

- [x] 2.1 Create the production Supabase project; record region and project ref in the operator docs, not the repo
- [x] 2.2 Disable the project's public Data API exposure (REST and GraphQL) and confirm the endpoint serves no schema
- [x] 2.3 Create the Hyperdrive configuration with `wrangler hyperdrive create` using the connection string form Cloudflare's current Supabase guide recommends; record the Hyperdrive id

## 3. packages/db foundation

- [x] 3.1 Scaffold `packages/db` with Drizzle ORM and drizzle-kit configuration, empty schema module and a README covering the generate and migrate workflow
- [x] 3.2 Generate and commit the baseline migration; verify it applies to a clean local PostgreSQL
- [x] 3.3 Add the CI-runnable migration check: apply the full chain to a disposable vanilla PostgreSQL and fail on error
- [x] 3.4 Document local development: any local PostgreSQL via connection string in an untracked `.env`, with `.env.example` updated

## 4. Worker connectivity

- [x] 4.1 Add the Hyperdrive binding and `nodejs_compat` flag to `apps/web/wrangler.jsonc` (both environment blocks), with the binding optional in the Worker `Env` type
- [x] 4.2 Add the Postgres driver dependency configured for transaction-mode pooling (no session state, `prepare: false` or equivalent)
- [x] 4.3 Add the operator smoke check script that round-trips a trivial query through the binding and prints the result; document how to run it
- [x] 4.4 Verify the Worker still builds and serves identically in an environment without the binding

## 5. Verification and handoff

- [x] 5.1 `openspec validate adopt-supabase-postgres`
- [x] 5.2 Repo-wide secret scan confirms no connection string or key entered any tracked file
- [x] 5.3 `cd apps/web && npm run build && npm run lint && npm test` pass unchanged
- [x] 5.4 Run the migration CI check and the connectivity smoke check; record both outcomes
