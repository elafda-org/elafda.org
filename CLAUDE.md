# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read first

`AGENTS.md` is the working contract for agents in this repo (sources of truth, required OpenSpec workflow, product/content rules, frontend expectations, safety scope). Read it before making changes; this file only adds commands, architecture, and current-state context that `AGENTS.md` does not cover.

Source-of-truth order: `SPEC.md` (product + technical spec) → accepted specs in `openspec/specs/` → the active change in `openspec/changes/<name>/` → code. Resolve conflicts in the spec, not in code.

## Commands

All application commands run from `apps/web`:

```bash
npm ci                 # install (Node >= 22.13)
npm run dev            # vinext dev server (Cloudflare Workers runtime via Miniflare)
npm run build          # production build; the required pre-handoff check
npm run lint           # eslint (typescript-eslint, react, react-hooks, jsx-a11y, next core-web-vitals)
npm test               # runs build, then node --test tests/rendered-html.test.mjs
```

Run a single test case (the suite is `node:test`, so filter by test name):

```bash
cd apps/web && npm run build && node --test --test-name-pattern "loading skeleton" tests/rendered-html.test.mjs
```

`npm test` runs `render()` against the built worker at `dist/server/index.js`, so a build must precede any direct `node --test` invocation.

OpenSpec workflow (CLI is installed globally):

```bash
openspec list
openspec list
openspec validate --all
openspec new change <name> --description "<purpose>"
```

## Architecture

Two layers matter more than the file tree:

**1. The product's core invariant.** eLafda separates *community discussion* from the *canonical record*. Posts, votes, and popularity drive discovery only; a claim enters a case timeline only after its sources and wording pass review (`submitted → needs_sources → community_review → archivist_review → accepted/disputed/rejected`). Anything you build must keep those concepts distinct in naming, data, and UI. `SPEC.md` §6–§12 defines cases, posts, votes, moderation states, ranking, and the X-bot nomination model; §14–§15 defines the eventual PostgreSQL data model and `/api/v1` surface.

**2. The delivery state.** `SPEC.md` describes the full v1 target (Next.js + PostgreSQL + Drizzle + X-only Auth.js + Redis worker + S3, deployed on Vercel/Neon/R2, monorepo with `packages/*`). **None of that exists yet.** The repo is at Phase 1 of §24: a single read-only marketing/discovery page. Do not build toward the full stack ahead of an approved OpenSpec change.

### What actually runs

`apps/web` is the OpenAI Sites **vinext** starter (not stock Next.js), targeting the Cloudflare Workers runtime:

- `worker/index.ts`: Worker entry. Delegates to `vinext/server/app-router-entry`, intercepting `/_vinext/image` for image optimization via the `IMAGES` binding.
- `vite.config.ts`: composes `vinext()`, the local `sites()` plugin, and `@cloudflare/vite-plugin`. Bindings (`d1`, `r2`) are read from `.openai/hosting.json`; both are currently `null`, so no bindings are simulated locally.
- `build/sites-vite-plugin.ts`: post-build step that packages Sites hosting metadata with the deployable output.
- `app/`: a paginated public site. `page.tsx` is the server-rendered landing page (hero + closing); `cases/` holds the discovery page whose client `case-explorer.tsx` drives the hardcoded `cases` array, search, and topic filtering; `how-it-works/` and `principles/` are static pages; `tagged/` renders the community-tag feed. `components/site-chrome.tsx` provides the shared skip link, header (with the client `github-stars.tsx` star-count link), signal strip, and footer; pages render `<header>`, `<main id="main-content">`, and `<footer>` as sibling landmarks.
- `app/layout.tsx`: `<html lang="en">` shell, `./globals.css` import, and the `Metadata` export (title, description, Open Graph, `summary_large_image` Twitter card, `metadataBase` from `APP_URL`).
- `app/globals.css`: hand-written design system (~230 lines) on top of `@import "tailwindcss"`. Defines every class `page.tsx` uses, plus `focus-visible`, `prefers-reduced-motion`, and a `max-width: 760px` breakpoint. Tailwind utilities are available but the page does not use them; edit this file rather than adding utility soup.

Because this is the Workers runtime, there is no Node server: server code runs in Worker scope.

### Accepted base website capabilities

The completed `build-base-website` change is archived under `openspec/changes/archive/2026-08-15-build-base-website/`. Its two accepted capability specs are the acceptance criteria for the current page:

- `public-homepage`: identity/promise above the fold, the discussion-vs-record distinction, trust framing, keyboard/contrast/reduced-motion/responsive behavior, and an explicit *preview* state cue.
- `case-discovery-preview`: representative case cards with status/source/verification metadata, local search with an empty state, topic filters with programmatic active state, and a live region announcing result counts.

All archived tasks are complete. New behavior requires a new scoped OpenSpec change.

### Test suite

`tests/rendered-html.test.mjs` is a `node:test` suite and the de-facto regression guard for the active change. It boots the built worker and asserts rendered output per route (`/`, `/cases`, `/how-it-works`, `/principles`, `/tagged`, `/api/tagged`, the www redirect) plus source-level invariants (`aria-live`, `aria-pressed`, `skip-link`, `aria-current`, `metadataBase`, reduced-motion and focus-visible CSS, and that no vinext-starter residue remains). Build, lint, and all tests currently pass.

Extend this suite when you add behavior; it is what keeps the `public-homepage` and `case-discovery-preview` scenarios honest without a browser harness.

### Known implementation constraints

- **Client components are now the exception**: only the case explorer, the tagged feed, and the GitHub star counter run client-side; marketing pages are server components.
- The header star count is an unauthenticated client-side `api.github.com` request that degrades to a plain GitHub link on failure; tests never depend on it.

## Repository state

The repository has one Git root at the project root. `apps/web` is a normal directory in that monorepo, not a submodule or embedded repository. Keep future applications and packages under the same root unless an approved architecture change explicitly introduces a separate repository.
