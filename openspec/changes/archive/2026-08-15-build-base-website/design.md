## Context

The repository contains a comprehensive product specification and no application implementation. This increment needs to communicate the product credibly before the database, moderation workflows, community features, and external integrations exist. The website must therefore feel like a real archive while being honest that its featured records are representative preview content.

## Goals / Non-Goals

**Goals:**

- Deliver a polished, responsive public homepage with a distinctive eLafda visual identity.
- Make the separation between open discussion and reviewed historical record immediately understandable.
- Provide useful case discovery behavior over representative, local data.
- Establish accessible layout, component, typography, color, and interaction patterns for later pages.
- Produce a deployment-compatible TypeScript application with product-specific metadata.

**Non-Goals:**

- Implement authentication, profiles, posting, voting, comments, saving, following, reports, or moderation.
- Create a database, API, background worker, X bot, uploads, or third-party integrations.
- Present sample case content as a live or exhaustive archive.
- Implement every route in the long-term information architecture.

## Decisions

### Use the Sites vinext React starter as the initial application shell

The starter provides the required hosted runtime and a small TypeScript surface suitable for a first public page. This is preferable to introducing the full monorepo and backend stack before any backend capability is in scope. The architecture can migrate into the `apps/web` monorepo layout when real services are introduced.

### Build one rich homepage rather than shallow placeholder routes

The homepage will combine product framing, search and filtering, featured case previews, the two-layer model, contribution guidance, and trust commitments. Navigation items that do not yet have working routes will point to meaningful sections on the page. This avoids dead-end placeholder pages while expressing the planned information architecture.

### Keep preview data local and label the product state clearly

Representative case objects will be colocated with the page component and drive the discovery UI. Sample records will use neutral descriptions and source/status metadata, and the interface will carry a preview-state cue. This avoids implying that a canonical production archive already exists.

### Use client-side filtering only for the representative dataset

Search and topic chips will update the rendered case cards instantly and announce result counts. The implementation will keep the filtering boundary simple so PostgreSQL-backed search can replace it later without changing the visual contract.

### Create visual distinction through typography, editorial layout, and restrained motion

The direction is an editorial archive with warm paper tones, deep ink, an electric coral accent, and chartreuse status details. CSS and icon components will carry the design; no decorative stock photography is necessary for the product itself. Motion will respect reduced-motion preferences.

## Risks / Trade-offs

- [Static preview data may be mistaken for live records] → Use explicit preview wording and avoid detailed allegations or claims about real private individuals.
- [A single page cannot validate the complete route architecture] → Keep section IDs and component boundaries aligned with the future route concepts.
- [Client-side filtering does not represent production search] → Treat it as an interaction prototype and keep search copy limited to the records on the page.
- [The temporary starter differs from the eventual monorepo stack] → Use standard React and TypeScript patterns that can move into `apps/web` with minimal change.

## Migration Plan

1. Establish the OpenSpec change and validate its requirements.
2. Initialize the web runtime and replace all starter UI and metadata.
3. Build and validate the static application.
4. Publish the validated build as the initial private preview.
5. Later increments can replace local case data with API responses and split sections into routes.

Rollback consists of redeploying the prior site version; no persistent data or migrations are involved.

## Open Questions

- Final operator identity and launch jurisdiction remain unresolved per `SPEC.md`.
- Final case seeding and editorial review are deferred until the canonical case workflow exists.
- The exact long-term open-content license remains subject to legal review.
