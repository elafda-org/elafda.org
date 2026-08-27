## ADDED Requirements

### Requirement: Production-only pageview measurement
The site SHALL load its analytics tag only in production builds, SHALL load it after hydration so it never delays server-rendered content, and SHALL NOT send pageviews from development or test environments.

#### Scenario: Production page load
- **WHEN** a production build serves a page
- **THEN** the analytics script loads after hydration with the configured measurement id

#### Scenario: Development or test run
- **WHEN** the site runs outside a production build
- **THEN** no analytics script is referenced and no request to the analytics host is made

### Requirement: Measurement stays out of the record
Analytics SHALL be limited to default pageview measurement and SHALL NOT feed ranking, discovery, or any part of the canonical record.

#### Scenario: Analytics data use
- **WHEN** analytics data exists for the site
- **THEN** it informs maintainers only and no product surface reads it
