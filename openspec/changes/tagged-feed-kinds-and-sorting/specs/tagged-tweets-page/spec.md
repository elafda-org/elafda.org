## MODIFIED Requirements

### Requirement: Tagged tweets page
The website SHALL serve a public `/tagged` page that lists the tweets the community has tagged for the bot, rendered as live X embeds resolved from recorded tweet ids, and every tag recorded by the bot SHALL be eligible to appear subject only to the feed limit and the active filter.

#### Scenario: Feed loads with records
- **WHEN** the page loads and the feed returns entries
- **THEN** each entry renders as an embedded tweet under the active sort order and filter

#### Scenario: New tag appears
- **WHEN** the bot records a new tag and the feed cache window passes
- **THEN** the target appears on the wall without any further operator action

#### Scenario: Deleted or protected tweet
- **WHEN** X declines to render an embedded tweet
- **THEN** the entry degrades to a plain link to the tweet on X, with no stored copy of its content shown

## ADDED Requirements

### Requirement: Sorting the wall
The page SHALL offer two orderings with an accessible pressed-state control: latest (newest target first, the default) and most tagged (tag count descending, recency as tiebreak). Changing the ordering SHALL NOT refetch the feed and SHALL update the result-count live region.

#### Scenario: Sort by most tagged
- **WHEN** the visitor selects the most-tagged ordering
- **THEN** entries reorder by tag count descending with newer targets first among equal counts, without a network request

#### Scenario: Default ordering
- **WHEN** the page loads
- **THEN** entries appear newest first and the latest control is marked pressed

### Requirement: Filtering by kind
The page SHALL let the visitor filter the wall to all tags, original posts, commentary, or replies to the bot, using programmatic pressed state, and SHALL show each entry's kind as a visible label. An active filter with no matching entries SHALL show an empty state distinct from the feed-unavailable state.

#### Scenario: Filter to original posts
- **WHEN** the visitor activates the original-posts filter
- **THEN** only entries with kind `original` remain, the control is marked pressed, and the live region announces the new count

#### Scenario: Kind is visible without filtering
- **WHEN** the wall renders any entry
- **THEN** the entry carries a visible label naming its kind

#### Scenario: Empty filter result
- **WHEN** the active filter matches no entries
- **THEN** an empty state explains that no tags of that kind exist yet, and clearing the filter restores the wall

### Requirement: Teaser excludes bot-reply chatter
The homepage teaser slice of the wall SHALL show the newest entries whose kind is not `reply`.

#### Scenario: Reply records exist
- **WHEN** the feed's newest entries include kind `reply` records
- **THEN** the teaser skips them and shows the newest `original` or `commentary` entries instead
