## ADDED Requirements

### Requirement: Holding reply content
The bot SHALL post a pre-launch acknowledgement drawn at random from a fixed pool of pre-written variants, each of which states that the archive is not open yet and links the public wall of tagged tweets at elafda.org/tagged, and SHALL NOT restate, summarize, characterize, or quote the content of the tagging tweet or its thread.

#### Scenario: Mention receives a holding reply
- **WHEN** the bot answers a mention
- **THEN** the reply is one of the pre-written variants with no content drawn from any tweet

#### Scenario: Reply implies no intake
- **WHEN** the bot answers a mention
- **THEN** the reply does not reference a nomination, a case, a review link, or a filing

#### Scenario: Variation is presentation only
- **WHEN** any variant in the pool is selected
- **THEN** it satisfies every content rule above, so randomization never changes what the reply commits to

### Requirement: Meme attachment
The bot SHALL attach at most one image per reply, chosen at random from a maintainer-curated set held in operational state rather than in the repository, SHALL post the text alone when the set is empty or the image cannot be fetched or uploaded, and SHALL NOT attach media drawn from the tagging tweet or its thread.

#### Scenario: A curated image is available
- **WHEN** the bot answers a mention and the curated set holds at least one image
- **THEN** the reply carries one randomly chosen image from the set

#### Scenario: No curated image is available
- **WHEN** the curated set is empty
- **THEN** the bot posts the text-only holding reply rather than skipping the mention

#### Scenario: The image upload fails
- **WHEN** fetching or uploading the chosen image fails
- **THEN** the bot posts the text-only holding reply and the mention is not counted as failed

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
- **THEN** the claim is released so the next run retries, and no duplicate reply is posted in the meantime

### Requirement: Mention polling with a durable cursor
The bot SHALL poll every page of mentions newer than the stored cursor, SHALL advance the cursor only past mentions it finished with and never past a mention whose reply failed, and SHALL NOT reply to its own posts.

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

#### Scenario: Mentions span several pages
- **WHEN** more mentions than one API page arrived since the cursor
- **THEN** the bot fetches every page before selecting, so no mention is stranded behind an advancing cursor

#### Scenario: A reply fails mid-batch
- **WHEN** a reply fails and later mentions in the same batch are replied to or skipped
- **THEN** the cursor does not advance past the failed mention, so the next run re-polls and retries it

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
