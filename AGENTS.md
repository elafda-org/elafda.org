# AGENTS.md

This file defines the working contract for coding agents in this repository.

## Sources of truth

1. `SPEC.md` is the product and technical source of truth.
2. Accepted specifications in `openspec/specs/` define implemented capability behavior.
3. Active work in `openspec/changes/<change-name>/` defines the scope, design, requirements, and tasks for an in-progress change.
4. Existing code and tests describe current implementation details but must not silently override the product rules above.

When these sources conflict, stop and resolve the conflict in the relevant specification before changing behavior.

## Required OpenSpec workflow

Use OpenSpec for every material feature, behavior change, architecture decision, data-model change, or cross-cutting refactor.

1. Inspect `SPEC.md`, `openspec/config.yaml`, accepted specs, and active changes relevant to the request.
2. Create or select one clearly scoped OpenSpec change.
3. Complete the change artifacts in dependency order: `proposal.md`, `design.md` when required, capability specs, then `tasks.md`.
4. Run `openspec validate <change-name>` before implementation.
5. Implement only behavior covered by the change and mark tasks complete as they are verified.
6. Re-run validation and relevant build/tests before handoff.
7. Archive a change only after all required behavior is implemented and verified.

Small documentation corrections and mechanical maintenance may be made without a separate change when they do not alter product behavior or requirements.

Do not edit generated or archived OpenSpec content to disguise implementation drift. Create a new change when accepted behavior must change.

## Repository conventions

- The web application lives in `apps/web`.
- Preserve the existing package manager, lockfile, TypeScript configuration, and Sites/vinext runtime unless an approved change explicitly replaces them.
- Keep the v1 architecture a modular monolith. Do not introduce service boundaries that are not operationally required.
- Prefer small, typed modules and explicit domain language from `SPEC.md`.
- Keep server authorization in service methods, not only route middleware, when backend services are introduced.
- Use cursor pagination for feeds and comments, idempotency for specified write actions, and optimistic concurrency for revisions.
- Never expose server-only configuration through client-prefixed environment variables.
- X is the sole member sign-in provider. Do not add GitHub, Google, email, password, magic-link, ChatGPT, or generic provider-selection login flows.
- Keep member X OAuth credentials and scopes separate from X bot credentials and capabilities.

## Product and content rules

- Discussion, popularity, evidence, and canonical truth are distinct concepts in both naming and UI.
- Never present an allegation, complaint, FIR, arrest, or investigation as proof of guilt.
- Use neutral, attributed language and give material responses and corrections comparable prominence.
- Do not add real case content merely as demo data. Use clearly labeled representative or fictional records until the sourcing and review workflow is operational.
- Do not introduce doxxing, intimate media, private records, illegally obtained material, fabricated evidence, or full copyrighted reproductions.
- Preserve privacy for voters, reporters, appellants, and sensitive moderation evidence.
- Canonical revisions and administrative actions must remain auditable when those systems are implemented.
- Write user-facing copy in a plain human voice. Do not use em dashes, en dashes, or the Oxford comma in copy; use a period, colon, or parentheses instead of a dash. `apps/web/tests/copy-style.test.mjs` enforces this in CI.

## Frontend expectations

- Build responsive interfaces from mobile through desktop without horizontal overflow.
- Target WCAG 2.2 AA: semantic structure, keyboard operation, visible focus, sufficient contrast, reduced-motion support, and meaningful accessible names.
- Clearly label preview, disputed, source-required, and verified states.
- Avoid dead navigation and controls that imply unavailable functionality.
- Keep English copy localization-ready; do not embed user-visible strings in domain logic.

## Verification

Run the narrowest relevant checks during development and the full applicable checks before handoff.

For the current website:

```bash
cd apps/web
npm run build
```

When relevant scripts exist, also run lint, unit, integration, schema, migration, accessibility, and end-to-end checks described by the active change. Never claim a check passed unless it was run successfully.

## Safety and scope

- Preserve the project code license as `AGPL-3.0-or-later`; do not apply it to third-party evidence or unresolved canonical case-content licensing.
- Keep secrets out of source, logs, fixtures, previews, and forks.
- Do not copy production user content into local or preview environments.
- Do not weaken moderation, privacy, audit, upload, or bot safeguards to simplify implementation.
- Do not make external deployments, publish content, change infrastructure, or contact third parties unless the user explicitly authorizes that action or it is part of the requested delivery workflow.
- Preserve unrelated user changes in a dirty worktree.
