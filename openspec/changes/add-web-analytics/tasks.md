## 1. Implementation

- [x] 1.1 Add the gtag script tags to `app/layout.tsx` via `next/script` with the `afterInteractive` strategy
- [x] 1.2 Gate the tag on production builds so development and test runs load nothing

## 2. Verification

- [x] 2.1 Extend `tests/rendered-html.test.mjs` to pin the analytics wiring and its production gate
- [x] 2.2 Run lint, the web build, and the full test suite
- [x] 2.3 Run `openspec validate add-web-analytics`
