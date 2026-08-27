## MODIFIED Requirements

### Requirement: Tagged target resolution
The bot SHALL resolve each polled mention's tagged target and kind from platform reply metadata only, never from tweet text or classification:

- A mention that is not a reply SHALL be recorded with kind `original` and the mention itself as the target.
- A mention that replies to a tweet authored by any account other than the bot SHALL be recorded with kind `commentary` and the replied-to tweet as the target.
- A mention that replies to a tweet authored by the bot SHALL be recorded with kind `reply` and the mention itself as the target; a tweet authored by the bot SHALL never be recorded as a target.

#### Scenario: Mention replies to someone else's tweet
- **WHEN** a polled mention is a reply to a tweet whose author is not the bot
- **THEN** the replied-to tweet id is recorded as the tagged target with kind `commentary`

#### Scenario: Mention is a conversation root
- **WHEN** a polled mention is not a reply
- **THEN** the mention's own id is recorded as the tagged target with kind `original`

#### Scenario: Mention replies to the bot
- **WHEN** a polled mention is a reply to a tweet the bot authored
- **THEN** the mention's own id is recorded as the tagged target with kind `reply` and the bot's tweet id is not recorded

#### Scenario: Bot's own tweet
- **WHEN** a polled mention was authored by the bot account
- **THEN** no tagged target is recorded for it

### Requirement: Recording is idempotent counted ingestion
The bot SHALL record a tagged target for every polled human mention, including mentions in conversations it has already answered and mentions observed in dry-run mode. Records SHALL be keyed by target tweet id: recording a target again SHALL leave a single record whose tag count reflects the number of recording mentions, whose latest-mention metadata reflects the most recent one, and whose kind is the strongest recorded for that target, ranked `original` over `commentary` over `reply`.

#### Scenario: Re-tag of the same tweet
- **WHEN** several mentions across runs resolve to the same tagged target
- **THEN** the feed contains that target once with a tag count equal to the number of recording mentions

#### Scenario: Kind upgrades but never downgrades
- **WHEN** a target recorded with kind `commentary` is later recorded through a mention classified `original`, or the reverse
- **THEN** the record's kind is `original` in both orders

#### Scenario: Mention in an answered conversation
- **WHEN** a mention arrives in a conversation the bot has already answered
- **THEN** its tagged target is still recorded even though no reply is posted

#### Scenario: Dry run records targets
- **WHEN** the bot runs in dry-run mode
- **THEN** tagged targets are recorded even though no reply is posted and the cursor does not advance

### Requirement: Id-only records
Tagged target records SHALL contain platform identifiers, the recorded kind, counters and timestamps only (target tweet id, mention ids, conversation id, kind, tag count, recording timestamps) and SHALL NOT contain tweet text, media, author handles, or any other content.

#### Scenario: Record contents
- **WHEN** a tagged target is recorded
- **THEN** the stored record consists of platform ids, the kind, a tag count and recording timestamps only

### Requirement: Public tagged feed endpoint
The web Worker SHALL serve the recorded tagged targets over HTTP as JSON ordered newest first, each entry annotated with its target id, kind, tag count and last-tagged time, by reading the bot's KV namespace through the shared codec in `packages/domain`. Responses SHALL be publicly cacheable, non-GET methods SHALL receive a failure status, a record missing the annotation fields SHALL be served with kind `commentary` and a tag count of one rather than dropped, the bot Worker SHALL remain without an HTTP surface, and no bot posting credential SHALL be present in or required by the Worker that serves the feed.

#### Scenario: Feed request
- **WHEN** a client requests the tagged feed
- **THEN** it receives JSON entries newest first, each carrying id, kind, tag count and last-tagged time, with a public cache directive

#### Scenario: Legacy record without annotations
- **WHEN** the feed reads a record written before kinds existed
- **THEN** the entry is served with kind `commentary` and tag count one instead of being omitted

#### Scenario: Non-GET method
- **WHEN** a client sends any method other than GET to the feed path
- **THEN** the Worker refuses it with a failure status and serves no state

#### Scenario: Missing namespace binding
- **WHEN** the feed is requested in an environment without the KV binding
- **THEN** the Worker reports the feed unavailable rather than crashing

#### Scenario: Bot stays unreachable
- **WHEN** any HTTP request is addressed to the bot Worker
- **THEN** no handler serves it, because serving the feed adds no fetch surface to the Worker holding posting credentials
