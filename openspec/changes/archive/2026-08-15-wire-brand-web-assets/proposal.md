## Why

The accepted brand identity (see `brand/`) produced ready-made web assets: favicons, touch and PWA icons, and a 1200x630 Open Graph card. The shipped site still serves no icons at all and uses a 2.4MB homepage screenshot as `og.png`, which weakens link previews and wastes bandwidth. Wiring the brand assets in completes the site-wide metadata work started in `build-base-website` and keeps the public surface consistent with the brand the project now publishes.

## What Changes

- Add the brand favicon set to `apps/web/public/` and declare it via `metadata.icons` in `app/layout.tsx`: SVG favicon, 16/32 PNG fallbacks, 180px apple touch icon.
- Replace `apps/web/public/og.png` (2.4MB screenshot) with the brand `og-1200x630.png` card, keeping the `/og.png` URL and existing Open Graph and Twitter metadata stable.
- Extend the rendered-HTML test suite to assert the icon links are present in served HTML and that the icon files ship in the client build.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `public-homepage`: adds a requirement that the site serves brand icons and a lightweight brand link-preview image.

## Impact

- Touches `apps/web/app/layout.tsx`, `apps/web/public/`, and `apps/web/tests/rendered-html.test.mjs` only.
- No behavior, routing, content, or dependency changes; the `/og.png` URL and metadata shape are preserved.
- Reduces the Open Graph payload from about 2.4MB to under 100KB.
