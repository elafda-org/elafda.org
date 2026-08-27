## ADDED Requirements

### Requirement: Closed command vocabulary
The resolver SHALL recognize exactly the commands `track`, `open`, `update`, `find`, `archive`, and `help`, and SHALL return `unknown` for anything it cannot map to one of them. The resolver SHALL NOT return any other value.

#### Scenario: Resolution returns a vocabulary member
- **WHEN** any mention text is resolved
- **THEN** the returned command is one of the six commands or `unknown`

#### Scenario: Unsupported request
- **WHEN** a mention asks for something outside the command vocabulary
- **THEN** the resolver returns `unknown` and reports no command

### Requirement: Exact command matching
The resolver SHALL resolve a mention whose first word after the bot handle exactly matches a command to that command, at the `exact` tier, without further interpretation.

#### Scenario: Bare command
- **WHEN** a mention reads `@eLafdaBot track`
- **THEN** the resolver returns `track` at the `exact` tier

#### Scenario: Command with trailing text
- **WHEN** a mention reads `@eLafdaBot archive this whole thread please`
- **THEN** the resolver returns `archive` at the `exact` tier

#### Scenario: Case and punctuation insensitivity
- **WHEN** a mention reads `@eLafdaBot HELP!`
- **THEN** the resolver returns `help` at the `exact` tier

### Requirement: Natural-language command matching
The resolver SHALL map free-form English, Hindi, and Hinglish phrasings to a command at the `phrase` tier when no exact match applies, and SHALL keep the phrase variants in locale-keyed data rather than in matching logic.

#### Scenario: English phrasing
- **WHEN** a mention reads `@eLafdaBot can you keep an eye on this`
- **THEN** the resolver returns `track` at the `phrase` tier

#### Scenario: Hinglish phrasing
- **WHEN** a mention reads `@eLafdaBot iska case banao`
- **THEN** the resolver returns `open` at the `phrase` tier

#### Scenario: Devanagari phrasing
- **WHEN** a mention written in Hindi asks the bot to save the thread
- **THEN** the resolver returns `archive` at the `phrase` tier

### Requirement: Untrusted content isolation
The resolver SHALL classify only the text authored by the tagging account. Parent, quoted, and linked content SHALL NOT be an input to resolution.

#### Scenario: Instruction embedded in a parent tweet
- **WHEN** the tweet being replied to contains text resembling a bot command
- **THEN** that text does not influence the resolved command

#### Scenario: Mention carrying a link
- **WHEN** a mention contains a URL
- **THEN** the URL is stripped before matching and its contents are never fetched or classified

### Requirement: Ambiguity and failure degrade safely
The resolver SHALL report a confidence for every resolution, SHALL resolve to `unknown` when a mention matches more than one command with equal strength, and SHALL treat a classifier error or an out-of-vocabulary classifier response as a failure that yields `unknown`.

#### Scenario: Equally matching phrases
- **WHEN** a mention matches variants for two different commands at the same strength
- **THEN** the resolver returns `unknown` rather than choosing between them

#### Scenario: Classifier returns an unlisted value
- **WHEN** an injected classifier returns a value outside the command vocabulary
- **THEN** the resolver discards it and returns `unknown`

#### Scenario: Classifier throws
- **WHEN** an injected classifier raises an error
- **THEN** the resolver returns `unknown` rather than propagating the error

### Requirement: Auditable resolution result
The resolver SHALL return the resolved command, the tier that produced it, and a confidence value, so a bot event can record why a mention was interpreted as it was.

#### Scenario: Result carries provenance
- **WHEN** a mention is resolved at any tier
- **THEN** the result reports the command, the tier, and a confidence between 0 and 1

### Requirement: Deterministic resolution
The resolver SHALL be a pure function with no network access, persistence, clock, or randomness, and SHALL NOT call a classifier unless one is explicitly supplied by the caller.

#### Scenario: Repeated resolution
- **WHEN** the same mention text is resolved twice with the same options
- **THEN** both calls return identical results

#### Scenario: No classifier supplied
- **WHEN** the resolver is called without a classifier
- **THEN** resolution completes using only the exact and phrase tiers
