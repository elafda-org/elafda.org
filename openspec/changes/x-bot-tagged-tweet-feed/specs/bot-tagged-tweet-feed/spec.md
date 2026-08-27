## ADDED Requirements

### Requirement: Tagged target resolution
The bot SHALL resolve each polled mention's tagged target from platform reply metadata: the tweet the mention replies to when the mention is a reply, and the mention itself otherwise. The bot SHALL NOT resolve targets from tweet text or classification.

#### Scenario: Mention replies to a tweet
- **WHEN** a polled mention is a reply to another tweet
- **THEN** the replied-to tweet id is recorded as the tagged target

#### Scenario: Mention is a conversation root
- **WHEN** a polled mention is not a reply
- **THEN** the mention's own id is recorded as the tagged target

#### Scenario: Bot's own tweet
- **WHEN** a polled mention was authored by the bot account
- **THEN** no tagged target is recorded for it

### Requirement: Recording is idempotent ingestion
The bot SHALL record the tagged target for every polled human mention, including mentions in conversations it has already answered and mentions observed in dry-run mode, and recording the same target again SHALL leave a single record.

#### Scenario: Re-tag of the same tweet
- **WHEN** several mentions across runs resolve to the same tagged target
- **THEN** the feed contains that target once

#### Scenario: Mention in an answered conversation
- **WHEN** a mention arrives in a conversation the bot has already answered
- **THEN** its tagged target is still recorded even though no reply is posted

#### Scenario: Dry run records targets
- **WHEN** the bot runs in dry-run mode
- **THEN** tagged targets are recorded even though no reply is posted and the cursor does not advance

### Requirement: Id-only records
Tagged target records SHALL contain platform identifiers only (tweet id, mention id, conversation id) and SHALL NOT contain tweet text, media, author handles, or any other content.

#### Scenario: Record contents
- **WHEN** a tagged target is recorded
- **THEN** the stored record consists of platform ids and a recording timestamp only

### Requirement: Public tagged feed endpoint
The web Worker SHALL serve the recorded tagged target ids over HTTP as JSON ordered newest first by reading the bot's KV namespace through a shared key codec, SHALL mark responses publicly cacheable, and SHALL answer non-GET methods with a failure status. The bot Worker SHALL remain without an HTTP surface, and no bot posting credential SHALL be present in or required by the Worker that serves the feed.

#### Scenario: Feed request
- **WHEN** a client requests the tagged feed
- **THEN** it receives JSON containing the recorded tweet ids newest first with a public cache directive

#### Scenario: Non-GET method
- **WHEN** a client sends any method other than GET to the feed path
- **THEN** the Worker refuses it with a failure status and serves no state

#### Scenario: Missing namespace binding
- **WHEN** the feed is requested in an environment without the KV binding
- **THEN** the Worker reports the feed unavailable rather than crashing

#### Scenario: Bot stays unreachable
- **WHEN** any HTTP request is addressed to the bot Worker
- **THEN** no handler serves it, because serving the feed adds no fetch surface to the Worker holding posting credentials
