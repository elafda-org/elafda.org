## 1. Product Contract

- [x] 1.1 Update `SPEC.md` to define X as the sole member sign-in provider and separate member OAuth configuration from bot credentials
- [x] 1.2 Add repository guidance that prohibits alternate member login providers
- [ ] 1.3 Resolve the manual recovery policy and implementation-time X OAuth access requirements

## 2. Identity and Session Implementation

- [ ] 2.1 Configure Auth.js with only the X provider and a strict server-side provider allowlist
- [ ] 2.2 Map accounts by stable X provider account ID and treat handles and profile fields as mutable metadata
- [ ] 2.3 Implement secure state, PKCE, callback, session, sign-out, and revocation behavior
- [ ] 2.4 Enforce local account sanctions during sign-in and every protected request

## 3. Authorization and Isolation

- [ ] 3.1 Require X authentication for community write actions while preserving anonymous public reads and safe return destinations
- [ ] 3.2 Configure distinct X applications, secrets, scopes, and rotation procedures for member authentication and the bot
- [ ] 3.3 Add passkey or hardware-backed step-up authentication for configured privileged actions

## 4. Interface and Verification

- [ ] 4.1 Build an accessible X-only sign-in experience without provider selection or unsupported fallback controls
- [ ] 4.2 Add tests for provider rejection, stable identity mapping, callback validation, sanctions, anonymous reads, protected writes, credential isolation, and privileged step-up
- [ ] 4.3 Run schema, type, unit, integration, security, accessibility, and production build checks
- [ ] 4.4 Validate the OpenSpec change and archive it only after the authentication capability is deployed and verified
