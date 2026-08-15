## Context

The current website is intentionally anonymous and read-only. `SPEC.md` schedules member authentication for the community phase but currently lists GitHub, Google, and email sign-in. The product is launching around Indian Tech Twitter, and the user has selected X as the sole member login provider. This choice affects identity mapping, configuration, account recovery, bot credential isolation, and privileged access.

## Goals / Non-Goals

**Goals:**

- Establish X as the only primary member authentication provider.
- Use a stable provider identifier so X handle and display-name changes do not create new accounts.
- Keep member OAuth credentials isolated from bot ingestion and reply credentials.
- Maintain secure OAuth validation, session handling, account sanctions, and administrator step-up authentication.
- Ensure future UI and APIs fail closed when any unapproved provider is configured or requested.

**Non-Goals:**

- Implement authentication in the current read-only preview.
- Add X bot ingestion, nominations, or posting permissions.
- Treat control of an X account as evidence that profile claims or submitted allegations are true.
- Define a second login provider as an automatic fallback.

## Decisions

### X is the sole primary sign-in provider

Auth.js will eventually be configured with only the X provider. Email, password, magic-link, GitHub, Google, ChatGPT, and generic provider selection are excluded. A single provider keeps account identity aligned with the launch community and avoids premature account-linking complexity.

Alternative considered: retain email as a recovery provider. Rejected because that creates a second authentication path and weakens the explicit X-only rule. Recovery will be an authenticated support process with conservative proof and audit requirements, not a hidden login mechanism.

### Provider account ID is the identity key

The account record will use the immutable provider account identifier returned by X as its unique external key. Handles, display names, avatars, and profile metadata are mutable snapshots and must never be used for uniqueness or authorization.

Alternative considered: username-keyed accounts. Rejected because X handles can change ownership or be renamed.

### Member OAuth and bot integration use separate applications and secrets

Member sign-in receives only the minimum identity scopes needed for authentication. Bot ingestion and replies use separate configuration, tokens, rate limits, rotation, audit, and emergency controls. A member session must never grant bot capabilities.

Alternative considered: one X application for both flows. Rejected because shared credentials and broad scopes increase blast radius and make revocation unsafe.

### Privileged users use step-up authentication

X remains the sole member login provider, while moderators, archivists, and administrators can be required to register a passkey or hardware-backed factor for privileged actions. This is an additional factor after X sign-in, not another account provider.

### Public reading remains anonymous

Visitors can browse the public archive without signing in. Sign-in appears only when community features are implemented and is required for member write actions. The base website must not include a control that implies a working authentication flow before the backend exists.

## Risks / Trade-offs

- [X outage or API policy change blocks sign-in] → Keep public reads anonymous, maintain existing sessions conservatively, publish service status, and require an explicit product change before adding a fallback provider.
- [Users lose access to their X account] → Provide a manual, audited recovery or account-closure process that cannot itself authenticate a user through email.
- [Mutable or recycled handles cause account confusion] → Key accounts to provider ID and display current handles only as profile metadata.
- [OAuth permissions accidentally expand into posting access] → Maintain separate member and bot applications, request minimum scopes, and test configured scopes.
- [X-only access excludes people without X accounts] → Accept this launch trade-off explicitly and revisit it only through a future OpenSpec change.

## Migration Plan

1. Update `SPEC.md` and configuration names before authentication code exists.
2. Implement the `member-authentication` capability during the community phase.
3. Add provider allowlist, OAuth callback, identity mapping, session, revocation, and step-up tests.
4. Enable sign-in only after production callback URLs, secrets, policies, and abuse controls are verified.

Rollback before implementation is a documentation change. After launch, rollback means disabling new sign-ins while preserving public reads and existing account data; adding another provider requires a separate approved change.

## Open Questions

- What manual process will handle users who permanently lose access to X?
- Which X application tier and OAuth capabilities will be available at implementation time?
- Which privileged roles require passkey enrollment immediately versus before their first sensitive action?
