## ADDED Requirements

### Requirement: Holding reply content
The bot SHALL post a fixed pre-launch acknowledgement that states nominations are not open, and SHALL NOT restate, summarize, characterize, or quote the content of the tagging tweet or its thread.

#### Scenario: Mention receives the holding reply
- **WHEN** the bot answers a mention
- **THEN** the reply is the configured pre-launch text with no content drawn from any tweet

#### Scenario: Reply implies no intake
- **WHEN** the bot answers a mention
- **THEN** the reply does not reference a nomination, a case, a review link, or a filing

### Requirement: Reply once per conversation
The bot SHALL post at most one holding reply per conversation, and SHALL record a conversation as answered before attempting to post rather than after.

#### Scenario: Second mention in an answered conversation
- **WHEN** a further mention arrives in a conversation the bot has already answered
- **THEN** the bot posts no additional reply

#### Scenario: Several mentions in one unanswered conversation
- **WHEN** a single poll returns multiple mentions sharing one conversation
- **THEN** the bot posts exactly one reply for that conversation

#### Scenario: Posting fails after the claim
- **WHEN** the reply request fails after the conversation was claimed
- **THEN** the claim expires so a later run can retry, and no duplicate reply is posted in the meantime

### Requirement: Mention polling with a durable cursor
The bot SHALL poll mentions newer than the stored cursor, SHALL advance the cursor to the newest mention it observed, and SHALL NOT reply to its own posts.

#### Scenario: First run
- **WHEN** no cursor is stored
- **THEN** the bot polls without one and stores a cursor from the results

#### Scenario: Subsequent run
- **WHEN** a cursor is stored
- **THEN** the bot requests only mentions newer than that cursor

#### Scenario: Self-mention
- **WHEN** a returned mention was authored by the bot account
- **THEN** the bot does not reply to it

#### Scenario: Poll returns nothing
- **WHEN** no new mentions exist
- **THEN** the bot posts nothing and leaves the cursor unchanged

### Requirement: Emergency pause
The bot SHALL support a pause that stops all posting, SHALL honor a pause stored in operational state without requiring a deployment, and SHALL continue to consume no reply quota while paused.

#### Scenario: Paused by stored state
- **WHEN** the pause flag is set in operational state
- **THEN** the run posts nothing

#### Scenario: Paused by configuration
- **WHEN** the deployment is configured as paused
- **THEN** the run posts nothing

### Requirement: Dry-run mode
The bot SHALL support a mode that performs polling and selection but reports intended replies instead of posting them, and SHALL NOT record conversations as answered or advance the poll cursor in that mode.

#### Scenario: Dry run with new mentions
- **WHEN** the bot runs in dry-run mode and finds unanswered mentions
- **THEN** it reports the replies it would post, posts nothing, and leaves the ledger unchanged

#### Scenario: Dry run leaves the cursor in place
- **WHEN** a dry run observes mentions newer than the stored cursor
- **THEN** the cursor is unchanged, so a later live run still sees those mentions

### Requirement: Reply rate limiting
The bot SHALL cap the number of replies posted in a single run so that a burst of mentions cannot produce an unbounded number of posts.

#### Scenario: Burst of mentions
- **WHEN** a poll returns more unanswered conversations than the configured per-run cap
- **THEN** the bot posts no more than the cap and leaves the remainder for a later run

### Requirement: Credential isolation
The bot SHALL read X credentials from deployment secrets, SHALL NOT contain credentials in version-controlled configuration, and SHALL NOT log credential values.

#### Scenario: Missing credentials
- **WHEN** a required credential is absent at run time
- **THEN** the run fails with an error naming the missing variable and posts nothing

#### Scenario: Run logging
- **WHEN** the bot logs the outcome of a run
- **THEN** no credential value appears in the log output
