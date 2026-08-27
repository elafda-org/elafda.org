## ADDED Requirements

### Requirement: Multi-page structure and shared shell
The website SHALL present its public content as dedicated pages: the landing page at `/`, case discovery at `/cases`, the product model and process at `/how-it-works`, the safety principles at `/principles` and the tagged feed at `/tagged`. Every page SHALL render a shared shell with a skip link, the brand link home, primary navigation to those pages and the site footer, and SHALL identify the current page programmatically in the navigation. Each page SHALL carry its own document title and description, and `<header>`, `<main>` and `<footer>` SHALL be sibling landmarks.

#### Scenario: Visitor moves between pages
- **WHEN** a visitor follows a primary navigation link from any public page
- **THEN** the destination page loads with the same shell, its own document title and its navigation entry marked as the current page

#### Scenario: Assistive technology reads a page
- **WHEN** a page is inspected by assistive technology
- **THEN** the header, main content and footer are exposed as sibling landmarks and the skip link targets the main content

### Requirement: GitHub repository star link
The site header SHALL link to the project's GitHub repository on every page and SHALL display the repository star count when it can be retrieved in the visitor's browser. When the count is unavailable the link SHALL degrade to a plain repository link without an error state.

#### Scenario: Star count resolves
- **WHEN** the repository metadata request succeeds
- **THEN** the header GitHub link shows the star count and its accessible name includes it

#### Scenario: Star count unavailable
- **WHEN** the repository metadata request fails or is blocked
- **THEN** the header still shows a working GitHub repository link with no count and no error indication

## MODIFIED Requirements

### Requirement: Discussion and record distinction
The website SHALL explain that community discussion and the reviewed canonical record are separate layers, and SHALL NOT suggest that votes establish factual truth. The full product-model explanation SHALL live on the how-it-works page, reachable from primary navigation on every page, and the landing page SHALL summarize the distinction.

#### Scenario: Visitor reviews the product model
- **WHEN** a visitor opens the how-it-works page
- **THEN** the interface presents discussion as open conversation and the record as reviewed, sourced history

#### Scenario: Visitor scans the landing page
- **WHEN** a visitor reads the landing page
- **THEN** the copy distinguishes discussion from the record and states that popularity is not treated as truth

### Requirement: Trust and safety framing
The website SHALL communicate neutral wording, source review, visible corrections, and privacy-sensitive moderation as core product commitments on a principles page reachable from primary navigation on every page.

#### Scenario: Visitor evaluates platform trust
- **WHEN** a visitor opens the principles page
- **THEN** the visitor can identify how allegations, sources, corrections, and private information are handled

### Requirement: Accessible responsive interface
Every public page SHALL support keyboard navigation, visible focus, semantic landmarks, sufficient contrast, reduced-motion preferences, and layouts suitable for mobile and desktop viewports.

#### Scenario: Keyboard-only navigation
- **WHEN** a visitor navigates any public page using only a keyboard
- **THEN** every interactive control is reachable, visibly focused, and operable in a logical order

#### Scenario: Small-screen layout
- **WHEN** any public page is viewed at a mobile viewport width
- **THEN** content remains readable, controls remain usable, and no primary content requires horizontal scrolling
