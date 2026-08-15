## Why

The website already builds for the Cloudflare Workers runtime, but deployment is coupled to private OpenAI Sites metadata while `SPEC.md` still names Vercel as the production web host. The selected production direction is Cloudflare Workers behind Cloudflare DNS so the current server-rendered application and later API features can share one edge runtime without forcing a static export.

## What Changes

- **BREAKING** Replace the Sites-specific deployment metadata and build hook with a standard, repository-owned Wrangler configuration.
- Make Cloudflare Workers the production target for the web and request-driven API tier.
- Configure `elafda.org` and `www.elafda.org` as Worker custom domains, with `www` redirected permanently to the apex domain.
- Add root and web-package commands for local preview and explicit preview/production deployments.
- Document local Cloudflare authentication and non-interactive CI credentials without committing secrets or account identifiers.
- Keep the existing private Sites preview available until the Worker deployment and apex-domain smoke check succeed.

## Capabilities

### New Capabilities

- `cloudflare-worker-hosting`: Build, preview, deploy, domain-routing, and operational requirements for hosting the web application on Cloudflare Workers and Cloudflare DNS.

### Modified Capabilities

None.

## Impact

- Updates the deployment architecture and reference documentation in `SPEC.md`.
- Changes `apps/web` build configuration, deployment scripts, hosting tests, and documentation.
- Adds production-domain routing to version-controlled Wrangler configuration.
- Requires Cloudflare authentication for manual deployment and Cloudflare account/token secrets for future CI deployment.
- Does not add application data, authentication, backend services, or production secrets.
