## 1. Product Contract

- [x] 1.1 Define single-word commands and two-tier resolution in `SPEC.md` §9
- [x] 1.2 Record the resolution tier and confidence on `bot_events` in `SPEC.md` §14
- [ ] 1.3 Resolve whether `open` should collapse into `track`, given that duplicate detection is their only stated difference

## 2. Domain Module

- [x] 2.1 Add `packages/domain` as a runtime-agnostic package with no web or Worker dependency
- [x] 2.2 Define the command vocabulary, resolution tiers, and result type
- [x] 2.3 Implement mention normalization that strips the handle, URLs, punctuation, and case
- [x] 2.4 Implement exact-tier matching on the first word after the handle
- [x] 2.5 Implement phrase-tier matching against a locale-keyed lexicon for English, Hindi, and Hinglish
- [x] 2.6 Define the classifier port and validate its output against the vocabulary, treating errors and unlisted values as `unknown`
- [x] 2.7 Return command, tier, and confidence on every resolution

## 3. Verification

- [x] 3.1 Add a `node:test` suite covering every scenario in the capability spec
- [x] 3.2 Add root scripts that run the domain suite and typecheck the package
- [x] 3.3 Run lint and the web build to confirm the new package does not affect the site
- [x] 3.4 Re-run `openspec validate x-bot-command-resolution`
