## 1. Assets

- [x] 1.1 Copy the brand favicon set into `apps/web/public/`: `favicon.svg` from `brand/logo/` plus `favicon-16.png`, `favicon-32.png`, and `apple-touch-icon-180.png` from `brand/web/`
- [x] 1.2 Replace `apps/web/public/og.png` with `brand/web/og-1200x630.png`, keeping the `/og.png` path

## 2. Metadata

- [x] 2.1 Declare the icon set via `metadata.icons` in `apps/web/app/layout.tsx` without changing existing Open Graph or Twitter fields

## 3. Validation

- [x] 3.1 Extend `apps/web/tests/rendered-html.test.mjs` to assert icon links render in served HTML and icon files ship in the client build
- [x] 3.2 Run `openspec validate wire-brand-web-assets`, `npm run build`, `npm run lint`, and `npm test` in `apps/web`
- [x] 3.3 Update `brand/README.md` so the wiring section reflects that the assets are now shipped
