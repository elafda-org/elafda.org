# eLafda

> The open-source home of internet lafda.

eLafda is a community-governed platform for documenting and discussing Indian internet controversies. It combines open community conversation with a separate, reviewed, source-backed historical record.

The core product rule is simple: **discussion is not verification**. Posts and votes can shape conversation and discovery, but claims enter a canonical case timeline only after their wording and sources pass review.

## Project status

eLafda is in early development. The current increment is a public, read-only website that establishes the product identity and previews case discovery. X-only member authentication, submissions, community features, moderation workflows, persistent case data, and the X bot are later phases.

The complete product and technical direction lives in [`SPEC.md`](./SPEC.md). Planned implementation changes are managed through [OpenSpec](https://openspec.dev/).

## Repository layout

```text
.
├── apps/
│   └── web/                 # Public website
├── openspec/
│   ├── changes/             # Proposed and active changes
│   ├── specs/               # Accepted capability specifications
│   └── config.yaml          # OpenSpec project context and rules
├── AGENTS.md                # Instructions for coding agents
├── SPEC.md                  # Product and technical source of truth
├── LICENSE
└── README.md
```

The repository will grow toward the monorepo structure described in `SPEC.md` as backend and shared-package capabilities are introduced.

## Local development

Requirements:

- Node.js 22.13 or newer
- npm
- OpenSpec CLI for specification workflow changes

Install dependencies from the application directory:

```bash
cd apps/web
npm ci
```

Then run the common web commands directly from the project root:

```bash
npm run dev
npm run build
npm test
npm run lint
```

Additional scripts are listed in [`apps/web/package.json`](./apps/web/package.json).

## Cloudflare deployment

The server-rendered web application deploys to Cloudflare Workers. `elafda.org` and `www.elafda.org` are production custom domains; requests to `www` are permanently redirected to the apex domain.

Authenticate once for local deployments:

```bash
cd apps/web
npx wrangler login
```

Return to the project root and deploy the safe `workers.dev` preview first:

```bash
npm run deploy:preview
```

After smoke-testing that URL and checking the existing Cloudflare DNS records, attach the production custom domains explicitly:

```bash
npm run deploy:production
```

CI should provide `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as protected secrets. Never add either value to `wrangler.jsonc`, environment files committed to Git, or build logs. If a production smoke check fails, restore the last known-good Worker version or the prior DNS target before retiring it.

The `Verify and deploy` GitHub Actions workflow runs lint and tests for pull requests. A push to `main`, including a merged pull request, deploys production only after verification passes. Manual workflow runs deploy only when started from `main`. Add both Cloudflare values under repository or `production` environment Actions secrets before merging the workflow; they are not currently configured.

## OpenSpec workflow

All material product changes begin as an OpenSpec change. `SPEC.md` defines the product vision; OpenSpec turns a scoped increment into testable requirements and implementation tasks.

Inspect the current state:

```bash
openspec list
openspec status --change <change-name>
```

Start a scoped change:

```bash
openspec new change <change-name> --description "<purpose>"
```

Use `openspec instructions` for the required proposal, design, specs, and tasks artifacts. Validate the change before implementation and again before it is archived:

```bash
openspec validate <change-name>
```

The initial website work is recorded under `openspec/changes/archive/2026-08-15-build-base-website/`; its accepted capability requirements now live in `openspec/specs/`.

## Product principles

- Keep community discussion separate from canonical history.
- Attribute allegations; do not present accusations as established fact.
- Attach evidence state to canonical factual claims.
- Treat votes as discovery signals, never as proof.
- Preserve corrections, revisions, and moderation accountability.
- Minimize legal, privacy, safety, and copyright risk by design.
- Build for WCAG 2.2 AA and Indian-language localization.

## Contributing

The contribution and governance documents described in `SPEC.md` are still being prepared. Until they land, open a focused issue or OpenSpec change before making a substantial implementation change. Do not add real controversy records or allegations without an approved sourcing and review workflow.

Code is licensed under the [GNU Affero General Public License v3.0 or later](./LICENSE) (`AGPL-3.0-or-later`). The license for original canonical case content will be selected after legal review; third-party evidence retains its original ownership and licensing.
