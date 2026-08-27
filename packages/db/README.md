# @elafda/db

Drizzle schema, SQL migrations and the database client for eLafda's PostgreSQL
database. Production runs on a Supabase managed project reached through
Cloudflare Hyperdrive; everything here must also run on vanilla PostgreSQL so
self-hosters can substitute their own database (`SPEC.md` §13, §18).

The schema is currently empty on purpose: this package lands the workflow, and
the first product tables arrive with the readable-archive change.

## Workflow

```bash
npm ci                 # install (Node >= 22.13)
npm run generate       # drizzle-kit: emit SQL migrations from src/schema.ts
DATABASE_URL=... npm run migrate   # apply the committed chain, in order
```

Rules:

- Migrations are committed and append-only. Fix a bad migration with a new
  migration, never by editing a committed file.
- Nothing may depend on Supabase-specific extensions or services. CI enforces
  this by applying the chain to a stock PostgreSQL container.
- Application code connects through `src/client.ts` (`createDb`), which
  configures the driver for Hyperdrive's transaction-mode pooling
  (`prepare: false`, no session-scoped state).

## Local development

Any local PostgreSQL works. Copy `.env.example` to `.env`, point
`DATABASE_URL` at it and run `npm run migrate`.

## Connectivity smoke check (operator)

The smoke Worker in `smoke/` round-trips one query through a HYPERDRIVE
binding on localhost. It is never deployed.

```bash
npm run smoke                 # local: uses localConnectionString, checks the driver path
npm run smoke -- --remote     # real path: Worker -> Hyperdrive -> Supabase
curl http://localhost:8787    # {"ok":true,...} on success
```

`--remote` needs the Hyperdrive id filled into `smoke/wrangler.jsonc` first.

## Provisioning (operator, one-time)

1. Create the Supabase project in Mumbai (`ap-south-1`). Keep the connection
   string out of the repository.
2. Disable the project's public Data API (REST and GraphQL): the application
   speaks the Postgres wire protocol only, and a fresh project otherwise serves
   its schema to anyone holding the anon key.
3. Create the Hyperdrive configuration and note its id for
   `apps/web/wrangler.jsonc` and `smoke/wrangler.jsonc`:

   ```bash
   npx wrangler hyperdrive create elafda-db --connection-string="<from Supabase>"
   ```

   Use the connection string form Cloudflare's current Supabase guide
   recommends (direct host or Supavisor endpoint); Hyperdrive does the pooling
   that matters either way.
4. Apply migrations to production with `DATABASE_URL` set to the Supabase
   connection string, from a trusted shell, never from a committed file.
