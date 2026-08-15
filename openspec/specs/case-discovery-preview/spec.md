# case-discovery-preview Specification

## Purpose
TBD - created by archiving change build-base-website. Update Purpose after archive.
## Requirements
### Requirement: Representative case cards
The website SHALL display representative case records with a neutral title, category, case status, last-update cue, source count, and verification label.

#### Scenario: Visitor scans case previews
- **WHEN** case previews are visible
- **THEN** each card exposes the metadata needed to distinguish subject, status, recency, and evidentiary state

### Requirement: Local text search
The website SHALL allow visitors to filter the representative case records by words in their titles, summaries, and categories without a page reload.

#### Scenario: Search has matches
- **WHEN** a visitor enters a term matching one or more representative records
- **THEN** only matching records remain visible and the result count is updated

#### Scenario: Search has no matches
- **WHEN** a visitor enters a term matching no representative records
- **THEN** the interface displays an explanatory empty state and a way to clear the search

### Requirement: Topic filtering
The website SHALL provide an all-topics option and topic controls that filter representative case records without a page reload.

#### Scenario: Visitor selects a topic
- **WHEN** a visitor activates a topic control
- **THEN** only records assigned to that topic remain visible and the active topic is programmatically identifiable

### Requirement: Search result announcement
The discovery interface SHALL expose changes in the number of visible case records to assistive technologies.

#### Scenario: Filter result changes
- **WHEN** a search term or topic selection changes the visible records
- **THEN** the updated number of matching records is announced through an appropriate live region
