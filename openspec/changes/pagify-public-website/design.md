# Design: pagify-public-website

## Page map

| Route | Content | Former homepage section |
| --- | --- | --- |
| `/` | Hero with case-file aside, closing call to action | 01 hero, 06 closing |
| `/cases` | Section heading, search, topic filters, case grid, empty state | 02 archive |
| `/how-it-works` | Two-layer product model, four-step process | 03 two-layers, 04 process |
| `/principles` | Safety principles | 05 principles |
| `/tagged` | Existing tagged feed, refitted to the shared shell | already a page |

Eyebrow numbering restarts per page (01, 02) instead of running across the old scroll.

## Shared shell

`app/components/site-chrome.tsx` is a server module exporting `SiteHeader`, `SignalStrip` and `SiteFooter`.

- `SiteHeader({ active })` renders the skip link, the brand link and the primary navigation (`/cases`, `/how-it-works`, `/principles`, `/tagged`). The link matching `active` gets `aria-current="page"`, which is also the styling hook. The old header call-to-action slot is taken by the GitHub star link.
- `SignalStrip({ label, signals })` defaults to the product-status signals; `/tagged` passes its unreviewed-tags signals. The DOM shape (alternating label and separator spans) is preserved so the existing mobile truncation rule keeps working.
- `SiteFooter` carries the brand, the tagline, the page links, the GitHub link and the copyright line.

Every page renders `SiteHeader`, then `SignalStrip`, then `<main id="main-content">` with the page content, then `SiteFooter`. That makes header, main and footer siblings, closing the landmark defect noted in `CLAUDE.md`, and gives the skip link a stable target.

## GitHub star link

`app/components/github-stars.tsx` is the shell's only client component. On mount it fetches `https://api.github.com/repos/elafda-org/elafda.org` and reads `stargazers_count`. The link always renders as `GitHub ★`; the count appears after it resolves, formatted compactly (`861`, `1.2k`). Failures (rate limit, offline, adblock) are swallowed and leave the plain link, so server-rendered output and tests never depend on the network. The accessible name carries the count when known.

An unauthenticated client-side call is per-visitor and stays far under GitHub's 60-requests-per-hour IP limit; no proxy or token is warranted for one number.

## Pages and components

- `app/page.tsx` loses `"use client"`, its state and the moved sections; it becomes a server component. Hero actions point at `/cases` and `/how-it-works`.
- `app/cases/page.tsx` is a server component owning metadata and the section heading (promoted to `h1`); `app/cases/case-explorer.tsx` is the client component holding the preview data, search, filters, live region, grid and empty state, unchanged in behavior.
- `app/how-it-works/page.tsx` and `app/principles/page.tsx` are static server components; their lead headings are promoted to `h1`.
- Each page exports `Metadata` with a page title in the existing `Something: eLafda` pattern and a purpose-specific description.

## CSS

`globals.css` changes are additive: heading selectors that named `h2` inside `.section-heading`, `.two-layers` and `.principles-title` gain `h1` equivalents (including the `em` accent and the mobile sizes), `.site-header nav a[aria-current="page"]` reuses the hover underline, and `.github-link` lays out the star and count inside the existing `header-cta` treatment. Standalone page sections get top borders where the removed neighbors used to provide them.

## Tests

`tests/rendered-html.test.mjs` keeps its worker-boot pattern and gains one rendered test per new route (title, defining copy, preview cue where required). The homepage test drops assertions for content that moved and gains navigation and GitHub-link assertions. Source-level assertions follow their subjects: `aria-live` and `aria-pressed` to `case-explorer.tsx`, the skip link and `/tagged` links to `site-chrome.tsx`.
