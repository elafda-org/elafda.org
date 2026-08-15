# public-homepage Specification

## Purpose
TBD - created by archiving change build-base-website. Update Purpose after archive.
## Requirements
### Requirement: Product identity and promise
The website SHALL present the eLafda name, its purpose as a source-backed archive of Indian internet controversies, and a primary path to explore case previews within the first viewport.

#### Scenario: Visitor opens the homepage
- **WHEN** a visitor loads the public homepage
- **THEN** the visitor sees the eLafda identity, a concise product promise, and a prominent archive discovery action

### Requirement: Discussion and record distinction
The website SHALL explain that community discussion and the reviewed canonical record are separate layers, and SHALL NOT suggest that votes establish factual truth.

#### Scenario: Visitor reviews the product model
- **WHEN** a visitor reaches the product-model section
- **THEN** the interface presents discussion as open conversation and the record as reviewed, sourced history

### Requirement: Trust and safety framing
The website SHALL communicate neutral wording, source review, visible corrections, and privacy-sensitive moderation as core product commitments.

#### Scenario: Visitor evaluates platform trust
- **WHEN** a visitor reviews the trust section
- **THEN** the visitor can identify how allegations, sources, corrections, and private information are handled

### Requirement: Accessible responsive interface
The homepage SHALL support keyboard navigation, visible focus, semantic landmarks, sufficient contrast, reduced-motion preferences, and layouts suitable for mobile and desktop viewports.

#### Scenario: Keyboard-only navigation
- **WHEN** a visitor navigates the homepage using only a keyboard
- **THEN** every interactive control is reachable, visibly focused, and operable in a logical order

#### Scenario: Small-screen layout
- **WHEN** the homepage is viewed at a mobile viewport width
- **THEN** content remains readable, controls remain usable, and no primary content requires horizontal scrolling

### Requirement: Honest preview state
The website SHALL clearly indicate that the initial experience is a preview and SHALL avoid presenting representative records as a complete live archive.

#### Scenario: Visitor sees representative content
- **WHEN** preview case records are displayed
- **THEN** nearby interface text identifies the early or preview state of the archive
