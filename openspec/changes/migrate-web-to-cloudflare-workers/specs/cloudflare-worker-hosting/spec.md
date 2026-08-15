## ADDED Requirements

### Requirement: Worker-compatible production artifact

The web application SHALL build into a Cloudflare Worker server artifact with its static assets and SHALL NOT require Sites-specific hosting metadata to deploy.

#### Scenario: Production build completes

- **WHEN** a maintainer runs the documented production build
- **THEN** the output contains a deployable Worker configuration, server bundle, and public assets generated from version-controlled Wrangler and Vite configuration

### Requirement: Safe preview deployment

The deployment workflow SHALL support deploying and verifying a `workers.dev` preview without attaching or changing the production custom domains.

#### Scenario: Maintainer deploys a preview

- **WHEN** a maintainer invokes the preview deployment command with valid Cloudflare credentials
- **THEN** the application is deployed to a preview Worker target and production traffic remains unchanged

### Requirement: Production custom domains

The production Worker configuration SHALL route `elafda.org` and `www.elafda.org` as Cloudflare custom domains.

#### Scenario: Visitor requests the apex domain

- **WHEN** a visitor opens an HTTPS URL on `elafda.org`
- **THEN** the production Worker serves the application at the same path and query

#### Scenario: Visitor requests the www domain

- **WHEN** a visitor opens an HTTPS URL on `www.elafda.org`
- **THEN** the Worker returns a permanent redirect to the equivalent `https://elafda.org` URL

### Requirement: Explicit deployment environments

Preview and production deployments SHALL use explicit commands and distinct Worker environments so that production domain attachment cannot occur as a side effect of a preview deployment.

#### Scenario: Maintainer selects production

- **WHEN** a maintainer invokes the documented production deployment command
- **THEN** the build selects the production Wrangler environment before compilation and deploys the emitted production artifact

### Requirement: Secret-free repository configuration

Committed hosting configuration and documentation SHALL NOT contain Cloudflare API tokens, account secrets, or application secrets.

#### Scenario: Deployment credentials are configured

- **WHEN** a maintainer deploys locally or from CI
- **THEN** credentials are supplied by Wrangler authentication or secret environment variables outside version control

### Requirement: Deployment verification and rollback

Production delivery SHALL verify successful HTTPS service on the apex domain and canonical redirection from `www`, and SHALL retain a last-known-good rollback path.

#### Scenario: Production smoke check fails

- **WHEN** either the apex response or `www` redirect does not match the expected behavior
- **THEN** the release is not considered complete and the maintainer can restore the prior Worker version or DNS target
