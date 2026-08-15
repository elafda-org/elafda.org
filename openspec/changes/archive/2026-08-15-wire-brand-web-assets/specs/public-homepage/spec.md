# public-homepage Delta

## ADDED Requirements

### Requirement: Brand icons and link preview

The website SHALL serve the brand icon set (SVG favicon with PNG fallbacks and an apple touch icon) declared in document metadata, and SHALL use the brand Open Graph card (40:21 aspect, no larger than 200KB) as the link-preview image for Open Graph and Twitter cards.

#### Scenario: Browser requests site icons

- **WHEN** a browser or crawler loads the homepage
- **THEN** the document head declares the SVG favicon, PNG fallback icons, and apple touch icon, and each declared icon URL is served from the site

#### Scenario: Link shared on social platforms

- **WHEN** a platform unfurls a link to the site
- **THEN** the Open Graph and Twitter card metadata reference the brand card at `/og.png` with its true pixel dimensions, and the served image is the brand card, not a page screenshot
