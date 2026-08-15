## 1. Hosting Contract

- [x] 1.1 Update `SPEC.md` to select Cloudflare Workers and Cloudflare DNS for the request-driven web tier
- [x] 1.2 Document preview, production, credentials, domain behavior, verification, and rollback

## 2. Worker Configuration

- [x] 2.1 Add standard Wrangler configuration with separate preview and production targets
- [x] 2.2 Remove Sites-only metadata and build packaging while preserving the vinext Workers runtime
- [x] 2.3 Implement the canonical `www.elafda.org` to `elafda.org` redirect
- [x] 2.4 Add root and web-package build, preview, and deploy commands

## 3. Verification

- [x] 3.1 Update rendered-output tests to verify Worker artifacts and domain redirect behavior
- [x] 3.2 Run OpenSpec validation, lint, tests, and default and production builds
- [x] 3.3 Authenticate Wrangler, inspect existing domain records, deploy and smoke-test the preview Worker
- [x] 3.4 Deploy production custom domains, verify HTTPS and redirects, and confirm rollback readiness

## 4. Follow-up Operations

- [x] 4.1 Add pull-request verification and merge-to-main production deployment automation
- [ ] 4.2 Configure the restricted `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` GitHub Actions secrets
- [ ] 4.3 Retire the previous private Sites preview only after production verification
