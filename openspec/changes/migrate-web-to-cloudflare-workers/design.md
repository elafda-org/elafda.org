## Context

`apps/web` uses vinext and `@cloudflare/vite-plugin`, and already emits a Cloudflare Worker-compatible server bundle. Its Vite configuration currently reads `.openai/hosting.json`, injects bindings programmatically, and runs a Sites-only packaging plugin. The public DNS zone is already delegated to Cloudflare, while the local Wrangler CLI is not yet authenticated.

The application is server-rendered and is expected to gain request-driven backend behavior. Cloudflare Pages would be suitable only if the site were intentionally reduced to a static export; that is not the selected architecture.

## Goals / Non-Goals

**Goals:**

- Make the repository itself sufficient to build and deploy the web Worker.
- Keep local development and production builds aligned with the Workers runtime.
- Separate a safe preview deployment from production custom-domain attachment.
- Route both apex and `www` through the Worker and canonicalize traffic to the apex.
- Keep Cloudflare account IDs, API tokens, and application secrets out of Git.
- Leave a documented path for CI deployment after credentials are configured.

**Non-Goals:**

- Provision Neon, queues, R2, email, bot workers, or monitoring in this increment.
- Move background or continuously running jobs into request Workers.
- Implement member authentication or any community write behavior.
- Delete the existing private Sites preview before production verification.
- Commit Cloudflare account credentials or automate registrar changes.

## Decisions

### Use standard Wrangler configuration with the Cloudflare Vite plugin

`apps/web/wrangler.jsonc` will be the input configuration for development and builds. The Vite plugin will emit its deployment configuration into `dist`, which Wrangler automatically discovers after a build. This replaces programmatic configuration and Sites-only metadata with the platform's normal configuration path.

### Keep preview and production routing distinct

The top-level Wrangler environment will deploy to a `workers.dev` preview without production routes. A `production` environment will carry the apex and `www` custom-domain routes. Production builds select that environment before compilation so the emitted Wrangler configuration contains the correct routes.

This ensures a first deployment can be smoke-tested without touching production traffic. Attaching production domains is a separate explicit command after verification.

### Canonicalize `www` in the Worker

Both hostnames will be configured as Worker custom domains. The Worker entry will return a permanent redirect from `www.elafda.org` to the same path and query on `https://elafda.org`. Handling this at the Worker avoids a separate redirect service and keeps canonical URL behavior versioned with the application.

### Verify pull requests and deploy merged changes through GitHub Actions

The repository exposes deterministic deployment commands. Local use authenticates with `wrangler login`; CI uses `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Pull requests run lint and build-backed tests without credentials or deployment. Pushes to `main`, including merged pull requests, deploy the production environment only after verification succeeds. Manual production dispatch is restricted to the `main` ref. The deployment job remains unavailable until the repository or protected production environment holds both Cloudflare secrets.

## Risks / Trade-offs

- [Production routes are attached before the Worker is healthy] → Deploy and smoke-test the default preview first; invoke the production command only after it passes.
- [An existing DNS record conflicts with a custom domain] → Inspect the Cloudflare zone after authentication and resolve the exact record deliberately before production deployment.
- [Preview and production configuration drift] → Keep both environments in one Wrangler file and exercise the same build/test pipeline.
- [Workers runtime limits block a future backend feature] → Keep long-running bot and queue consumers on their separately specified runtime; evaluate new bindings through later OpenSpec changes.
- [A token leaks through repository configuration] → Store tokens only in Wrangler's local authentication or deployment secret managers and keep local environment files ignored.

## Migration Plan

1. Add and validate the Wrangler-based configuration and deployment commands.
2. Remove Sites-only metadata and packaging from the build.
3. Run lint, tests, and both default and production builds locally.
4. Authenticate Wrangler and inspect the current Cloudflare zone records.
5. Deploy the default Worker preview and smoke-test the generated `workers.dev` URL.
6. Deploy the production environment to attach apex and `www` custom domains.
7. Verify HTTPS, the apex response, the `www` redirect, and rollback readiness.
8. Remove the old private Sites preview only after the production checks pass.

Rollback consists of deploying the last known-good Worker version or restoring the prior DNS target. No persistent data migration is involved.

## Open Questions

- Which Cloudflare account will own the production Worker after local login?
- Are there existing apex or `www` records that must be replaced before custom-domain attachment?
- Who will create the restricted Cloudflare API token and add both required GitHub Actions secrets?
