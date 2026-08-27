## Why

The public website is a single long homepage whose sections stand in for pages: case discovery, the product model, the process and the safety principles all live behind fragment anchors. That made sense for a first marketing page, but it now works against the product. Sections cannot carry their own titles, descriptions or share links, the `<main>` landmark wraps the header and footer, and the whole surface ships as one client component, which limits the SSR and SEO posture `SPEC.md` §13 and §22 call for. The `/tagged` page already proved the multi-page shape and had to duplicate the entire header and footer to get it.

Separately, eLafda is an open-source project (`SPEC.md` §1) whose credibility argument includes building in public, yet the repository is only linked at the bottom of the homepage. Surfacing the GitHub repository and its star count in the header, the way copperhead.sh does, makes that posture visible on every page.

## What Changes

- The homepage sections become dedicated pages: `/` keeps the hero and closing call to action, `/cases` hosts case discovery, `/how-it-works` hosts the two-layer product model and the nominate-source-review-preserve process, and `/principles` hosts the safety principles. `/tagged` remains where it is.
- A shared site shell (skip link, header, primary navigation, signal strip, footer) renders on every page from one component, with the current page exposed through `aria-current`. `/tagged` drops its duplicated copy of the shell.
- The header gains a GitHub link that shows the repository star count fetched from the GitHub API in the visitor's browser, degrading to a plain repository link when the count is unavailable.
- Each page carries its own document title and description. Landmarks are corrected so `<header>`, `<main>` and `<footer>` are siblings, and only the interactive case explorer stays a client component.

## Capabilities

### Modified Capabilities

- `public-homepage`: the accessibility requirement extends to every public page, the product-model and trust framings move to dedicated pages reachable from primary navigation, and new requirements cover the multi-page structure, the shared shell and the header GitHub star link.
- `case-discovery-preview`: case discovery is hosted on a dedicated `/cases` page linked from primary navigation, keeping its preview framing; search, filtering and announcements are unchanged.

### New Capabilities

None.

## Non-goals

- No new case content, no real records and no change to the preview data set.
- No backend, database or authentication work; the pages remain read-only.
- No visual redesign: pages reuse the existing design system, sectioning and copy with only the edits pagination requires.
- No server-side proxy or caching for the GitHub star count.

## Impact

- `apps/web/app` gains `cases/`, `how-it-works/` and `principles/` routes plus shared shell components; `page.tsx` shrinks to the landing page and becomes a server component.
- `app/globals.css` gains heading rules for pages that promote former section `h2`s to `h1`s, active-navigation styling and the header GitHub link styling.
- `tests/rendered-html.test.mjs` splits its homepage assertions across the new routes and follows the source files that moved.
- The browser makes one unauthenticated request to `api.github.com` per visit for the star count, a third-party posture comparable to the existing X widgets and Google Analytics scripts.
