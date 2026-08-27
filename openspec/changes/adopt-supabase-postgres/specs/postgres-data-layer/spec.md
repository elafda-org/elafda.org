## ADDED Requirements

### Requirement: Managed PostgreSQL provider
The production database SHALL be a Supabase managed PostgreSQL project, recorded as the provider in `SPEC.md` §13 and §18, and the schema and migrations SHALL remain runnable on vanilla PostgreSQL with no dependency on Supabase-specific services or extensions.

#### Scenario: Provider recorded in the spec
- **WHEN** `SPEC.md` §13 and §18 are read after this change
- **THEN** Supabase managed PostgreSQL is the named provider and Neon is no longer referenced as the production database

#### Scenario: Self-host portability
- **WHEN** the committed migration chain is applied to a stock PostgreSQL instance with no Supabase components
- **THEN** every migration applies successfully

### Requirement: Schema and migration workflow
The repository SHALL define the database schema in Drizzle ORM under `packages/db` and SHALL manage schema evolution through generated SQL migration files that are committed, applied in order and treated as append-only.

#### Scenario: Migration generation
- **WHEN** the schema definition changes
- **THEN** drizzle-kit generates a new SQL migration file that is committed alongside the schema change

#### Scenario: Clean apply verified continuously
- **WHEN** the repository's checks run
- **THEN** the full migration chain is applied to a disposable PostgreSQL and a failure to apply fails the check

#### Scenario: History stays append-only
- **WHEN** a committed migration proves wrong
- **THEN** a new migration corrects it and previously committed migration files are not edited

### Requirement: Worker database connectivity
The web Worker SHALL reach the database only through a Cloudflare Hyperdrive binding whose configuration holds the connection string, SHALL treat the binding as optional so an environment without it degrades rather than crashes, and the bot Worker SHALL gain no database access.

#### Scenario: Connectivity smoke check
- **WHEN** an operator runs the documented smoke check against an environment with the binding
- **THEN** a trivial query round-trips through Hyperdrive to the Supabase database and reports success

#### Scenario: Missing binding degrades
- **WHEN** the Worker runs in an environment without the Hyperdrive binding
- **THEN** it serves everything it serves today and no request crashes on the absent binding

#### Scenario: Bot Worker unchanged
- **WHEN** the bot Worker's configuration and code are inspected after this change
- **THEN** they contain no database binding, driver or connection string

### Requirement: Credential and surface containment
No database credential SHALL appear in source, configuration files in the repository, client-exposed environment variables, logs or fixtures, and the Supabase project SHALL NOT expose a public Data API: the database SHALL be reachable only over the Postgres protocol through the pooled path and by operators through the provider dashboard.

#### Scenario: No credentials in the repository
- **WHEN** the repository is searched after provisioning
- **THEN** no Supabase connection string, database password or service key is found in any tracked file

#### Scenario: Public Data API disabled
- **WHEN** the Supabase project's REST or GraphQL Data API endpoint is requested
- **THEN** it serves no database schema or rows

### Requirement: No product behavior change
This foundation SHALL NOT alter any served page, endpoint or bot behavior, and SHALL NOT create product tables from `SPEC.md` §14.

#### Scenario: Existing surfaces unchanged
- **WHEN** the existing build, lint and rendered-output tests run after this change
- **THEN** they pass without modification to their assertions

#### Scenario: Schema starts empty
- **WHEN** the migration chain from this change is applied to a clean database
- **THEN** only migration bookkeeping objects exist and no §14 product table is created
