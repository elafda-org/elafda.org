## Why

`SPEC.md` currently proposes GitHub, Google, and email sign-in even though eLafda’s initial community and case-nomination workflows are centered on X. Establishing X as the sole member identity provider now prevents incompatible account models from entering the implementation and gives contributors one clear authentication contract.

## What Changes

- **BREAKING** Remove GitHub, Google, email, password, magic-link, and ChatGPT sign-in from the product direction.
- Define X OAuth as the only member sign-in and account-linking provider.
- Key member identity to the stable X provider account ID rather than a mutable handle or display name.
- Keep X member authentication credentials separate from the `@eLafdaBot` integration credentials and permissions.
- Preserve the administrator hardware-key or passkey requirement as step-up authentication, not as an alternative member login provider.
- Keep the current public archive preview anonymous; authentication UI and backend behavior remain part of the later community implementation phase.

## Capabilities

### New Capabilities

- `member-authentication`: X-only member sign-in, identity mapping, session establishment, provider restrictions, and administrator step-up requirements.

### Modified Capabilities

None.

## Impact

- Updates the authentication, configuration, security, testing, and Phase 2 requirements in `SPEC.md`.
- Future identity tables and Auth.js configuration must support exactly one member OAuth provider: X.
- Future sign-in pages must not advertise or expose other providers or email-based authentication.
- The current read-only website does not gain a non-functional sign-in control as part of this decision.
