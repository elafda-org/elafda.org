## ADDED Requirements

### Requirement: Tagged tweets page
The website SHALL serve a public `/tagged` page that lists the tweets the community has tagged for the bot, rendered as live X embeds resolved from recorded tweet ids, newest first.

#### Scenario: Feed loads with records
- **WHEN** the page loads and the feed returns tweet ids
- **THEN** each id renders as an embedded tweet, newest first

#### Scenario: Deleted or protected tweet
- **WHEN** X declines to render an embedded tweet
- **THEN** the entry degrades to a plain link to the tweet on X, with no stored copy of its content shown

### Requirement: Unreviewed labeling
The page SHALL state that its contents are community tags, unreviewed, and not part of any case record, with that framing visible before the first embed. The page SHALL NOT rank, score, or editorially characterize any tagged tweet.

#### Scenario: Framing precedes content
- **WHEN** the page renders
- **THEN** copy identifying the list as unreviewed community tags appears before the first embedded tweet

### Requirement: Load, empty, and error states
The page SHALL announce feed progress through a live region, SHALL show a distinct empty state when the feed has no records, and SHALL show an error state with the feed unavailable rather than an empty page when the fetch fails.

#### Scenario: Feed is empty
- **WHEN** the feed returns no ids
- **THEN** the page explains that nothing has been tagged yet and how to tag the bot

#### Scenario: Feed unreachable
- **WHEN** the feed request fails
- **THEN** the page states the feed is unavailable and offers a retry

#### Scenario: Result announcement
- **WHEN** the feed resolves
- **THEN** a live region announces how many tagged tweets loaded

### Requirement: Homepage wall teaser
The homepage SHALL show the newest recorded tagged tweets in a section after the hero, framed as unreviewed community tags with a link to the full tagged page, and SHALL NOT rank, score, or editorially characterize them. Recency is the only ordering.

#### Scenario: Teaser renders the freshest tags
- **WHEN** the homepage loads and the feed returns tweet ids
- **THEN** a small newest-first slice renders as embeds after the hero, with the unreviewed framing and a link to the tagged page

#### Scenario: Teaser with an empty feed
- **WHEN** the feed returns no ids
- **THEN** the section invites tagging the bot instead of showing an empty wall

#### Scenario: Teaser when the feed fails
- **WHEN** the feed request fails on the homepage
- **THEN** the section states the feed is unavailable without an error box dominating the page

### Requirement: Navigation and page conventions
The homepage header navigation and footer SHALL link to the tagged page, and the tagged page SHALL keep the site's conventions: a skip link, semantic landmarks, keyboard-visible focus, reduced-motion respect, and no horizontal overflow from mobile through desktop.

#### Scenario: Reaching the page
- **WHEN** a visitor is on the homepage
- **THEN** the header navigation and footer both link to the tagged page

#### Scenario: Returning home
- **WHEN** a visitor is on the tagged page
- **THEN** a link back to the homepage is present in the header
