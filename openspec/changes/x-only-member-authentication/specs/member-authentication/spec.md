## ADDED Requirements

### Requirement: X-only member sign-in
The system SHALL offer X as the sole primary member authentication provider and MUST reject sign-in attempts for every other provider.

#### Scenario: Member starts sign-in
- **WHEN** a visitor chooses to sign in
- **THEN** the system starts an X OAuth authorization flow without presenting a provider picker

#### Scenario: Unsupported provider is requested
- **WHEN** a client requests a GitHub, Google, email, password, magic-link, ChatGPT, or other provider sign-in route
- **THEN** the system rejects the request without creating an account or session

### Requirement: Stable X identity mapping
The system SHALL uniquely associate a member account with the stable X provider account ID and MUST NOT use a handle, display name, email address, or avatar URL as the identity key.

#### Scenario: Member changes X handle
- **WHEN** an existing member signs in after changing their X handle
- **THEN** the system signs the member into the existing account and updates only permitted profile metadata

### Requirement: Secure OAuth flow
The system SHALL validate OAuth state and PKCE, use approved callback URLs, request only the minimum identity scopes, and establish a session only after a valid callback.

#### Scenario: OAuth callback validation fails
- **WHEN** the callback has invalid state, verifier, issuer data, or provider response
- **THEN** the system rejects authentication, creates no session, and records a privacy-safe security event

### Requirement: Member and bot credential isolation
The system SHALL use separate X applications, secrets, tokens, and permission scopes for member sign-in and the `@eLafdaBot` integration.

#### Scenario: Member authentication succeeds
- **WHEN** a member completes X sign-in
- **THEN** the resulting account and session receive no bot ingestion, reply, or posting credentials

### Requirement: Anonymous public access
The system SHALL allow visitors to read public archive content without authenticating and SHALL require member authentication for protected community write actions.

#### Scenario: Anonymous visitor browses a case
- **WHEN** an unauthenticated visitor opens public case or timeline content
- **THEN** the system serves the public content without redirecting to X

#### Scenario: Anonymous visitor attempts a protected write
- **WHEN** an unauthenticated visitor starts a post, comment, vote, follow, report, or proposal action
- **THEN** the system preserves a safe return destination and starts X sign-in

### Requirement: Privileged step-up authentication
The system SHALL require a registered passkey or hardware-backed factor for configured privileged actions while retaining X as the sole primary login provider.

#### Scenario: Administrator attempts a sensitive action
- **WHEN** an X-authenticated administrator without a current step-up assertion attempts a sensitive administrative action
- **THEN** the system requires the configured hardware-backed factor before authorizing the action

### Requirement: Sanction and revocation enforcement
The system SHALL check local account status on every session establishment and protected request, regardless of the state of the member’s X account.

#### Scenario: Suspended member signs in successfully with X
- **WHEN** X authenticates a member whose local eLafda account is suspended
- **THEN** the system does not grant an active member session and communicates the applicable sanction or appeal path
