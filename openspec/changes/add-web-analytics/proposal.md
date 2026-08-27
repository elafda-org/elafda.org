## Why

The site has no visibility into whether anyone visits, which pages hold attention, or whether launch outreach lands. A minimal analytics tag answers that before v1 planning. Without an approved change covering it, the tag added to the layout is uncovered behavior under the repository's OpenSpec contract; this change closes that gap.

## What Changes

- Load Google Analytics (gtag.js, measurement id `G-87L4KMKRE4`) from the root layout of `apps/web`.
- Gate the tag to production builds only, so development servers and local test runs never report pageviews into the production property.
- Load the scripts after hydration (the `next/script` `afterInteractive` strategy), keeping analytics off the server-render critical path.

## Capabilities

### New Capabilities

- `web-analytics`: production-only pageview measurement on the public site.

### Modified Capabilities

None. No user-visible behavior, content, or navigation changes.

## Non-goals

- Event tracking, conversion goals, or any instrumentation beyond default pageviews.
- Cookie consent tooling. Revisit when a member-facing surface ships.
- Self-hosted or privacy-first analytics alternatives; that is a later decision.

## Impact

- `apps/web/app/layout.tsx` gains the gated script tags; nothing else in the app changes.
- Third-party requests to googletagmanager.com occur on production page loads only.
- No data model, API, or deployment changes.
