## Why

eLafda currently has a detailed product specification but no public product surface. A focused read-only website is the smallest useful increment for establishing the brand, demonstrating the separation between discussion and verified records, and creating a foundation for later case, community, and moderation capabilities described in `SPEC.md`.

## What Changes

- Create a responsive public homepage for eLafda with a clear product promise and calls to browse or understand the archive.
- Present realistic featured and recent case summaries with explicit verification, activity, and source cues.
- Explain the two-layer model: community discussion and reviewed canonical record.
- Add lightweight client-side case search and topic filtering for the homepage sample dataset.
- Add product trust, contribution, governance, and safety framing appropriate to a pre-launch base website.
- Establish site-wide visual language, metadata, accessibility behavior, and responsive navigation.
- Keep all interactions read-only and sample-driven; authentication, submissions, voting, comments, and persistence remain outside this increment.

## Capabilities

### New Capabilities

- `public-homepage`: The public eLafda landing and discovery experience, including product framing, navigation, responsive layout, and accessible interaction.
- `case-discovery-preview`: Read-only discovery of representative case records through search, topic filters, status, source, and update metadata.

### Modified Capabilities

None.

## Impact

- Adds the initial web application, styling, metadata, and static product content.
- Introduces the minimal frontend dependencies and hosting configuration needed by the Sites runtime.
- Establishes patterns that later routes and real PostgreSQL-backed case records can replace without changing the core information hierarchy.
- Does not add public APIs, persistent storage, authentication, uploads, or external platform integrations.
