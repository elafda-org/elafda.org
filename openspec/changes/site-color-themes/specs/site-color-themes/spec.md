## ADDED Requirements

### Requirement: Two complete palettes
The site SHALL define complete light and dark palettes as design tokens, and every page SHALL render correctly under both without per-page styling.

#### Scenario: Dark palette applies everywhere
- **WHEN** the dark theme is active on any page
- **THEN** backgrounds, text, borders, and tinted surfaces all follow the dark tokens

#### Scenario: Accent surfaces keep contrast
- **WHEN** the dark theme is active
- **THEN** text on coral and lime surfaces stays dark and readable rather than following the light ink token

#### Scenario: Ink panels stay dark
- **WHEN** the dark theme is active
- **THEN** surfaces built on the dark ink ground, such as the hero case file, the layers band and the footer, keep that dark ground so their lime and coral accents stay readable

#### Scenario: Coral text meets contrast on paper
- **WHEN** coral is used as text on the light paper background
- **THEN** a deeper coral shade applies so the text meets WCAG AA contrast

### Requirement: Light default and override model
The theme SHALL default to the light palette regardless of the visitor's system color-scheme preference, SHALL let an explicit toggle choice switch it in either direction, and SHALL persist that choice across visits.

#### Scenario: No stored choice
- **WHEN** a visitor with a dark system preference loads any page having never used the toggle
- **THEN** the light palette applies

#### Scenario: Explicit choice wins
- **WHEN** a visitor has chosen the dark theme
- **THEN** the dark palette applies on every page until they choose again

#### Scenario: No flash of the wrong theme
- **WHEN** a visitor with a stored dark choice loads a page
- **THEN** the dark palette applies before the page content first paints

### Requirement: Header theme toggle
Every page's header SHALL include a keyboard-operable switch with an accessible name that flips between the light and dark theme, whose knob position and icon reflect the theme currently active.

#### Scenario: Toggling
- **WHEN** the toggle is activated
- **THEN** the palette flips immediately and the choice is stored

#### Scenario: Storage unavailable
- **WHEN** persistent storage is blocked
- **THEN** the toggle still flips the current page without an error
