## 1. Shared shell

- [x] 1.1 Add `app/components/site-chrome.tsx` with `SiteHeader` (skip link, brand, primary navigation with `aria-current`), `SignalStrip` and `SiteFooter`
- [x] 1.2 Add `app/components/github-stars.tsx`: client-side star count from the GitHub API with compact formatting and a plain-link fallback
- [x] 1.3 Style active navigation and the GitHub star link in `globals.css`

## 2. Pages

- [x] 2.1 Reduce `app/page.tsx` to a server-rendered landing page (hero plus closing) using the shared shell, with actions pointing at `/cases` and `/how-it-works`
- [x] 2.2 Add `/cases`: server page with metadata and heading, client `case-explorer.tsx` with the unchanged search, filters, live region, grid and empty state
- [x] 2.3 Add `/how-it-works`: two-layer product model and the four-step process as a static page
- [x] 2.4 Add `/principles`: safety principles as a static page
- [x] 2.5 Refit `/tagged` to the shared shell, dropping its duplicated header and footer
- [x] 2.6 Extend `globals.css` heading and border rules for promoted `h1`s and standalone sections

## 3. Verification

- [x] 3.1 Update `tests/rendered-html.test.mjs`: per-route rendered tests, navigation and GitHub-link assertions, source assertions following moved files
- [x] 3.2 Run lint, the web build and the full test suite
- [x] 3.3 Re-run `openspec validate pagify-public-website`
- [x] 3.4 Update `CLAUDE.md` current-state notes (landmark structure, client-component posture, page map)
