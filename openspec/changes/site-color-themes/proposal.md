## Why

The site shipped light-only while readers increasingly expect a dark option, and the embedded tweets on the tagged pages already render dark. A first-party dark theme makes the whole site coherent in both preferences and was requested directly by the maintainer, together with a cleaner header treatment for the GitHub repository link.

## What Changes

- The hand-written design system in `globals.css` moves its remaining hardcoded colors onto tokens, and a dark palette redefines those tokens. The light palette is the default regardless of system preference; an explicit choice is stamped as `data-theme` on the document and wins in both directions.
- A header switch on every page flips the theme and persists the choice in `localStorage`; an inline shell script re-applies a stored choice before first paint so there is no flash. The switch knob shows the active theme's icon and slides right when the dark palette is on.
- Accent surfaces that keep coral or lime backgrounds in both themes pin dark text explicitly, so the dark theme's light ink never lands on a bright accent. Panels built on the dark ink ground (the hero case file, the layers band, the footer, dark buttons) re-pin their tokens locally and stay dark in both themes, keeping their lime and coral accents on dark ground.
- Coral used as text gains a `--coral-text` token: a deeper shade in the light theme that meets WCAG AA on paper, full coral in the dark theme and on ink panels.
- The header GitHub link becomes a quiet rounded pill: the GitHub mark, the live star count, and a gold star glyph, with no box border.
- Tweet embeds and their fallback cards stay dark in both themes, per the maintainer's direction.

## Capabilities

### New Capabilities

- `site-color-themes`: the two palettes, the light default and override model, the toggle, and the no-flash requirement.

### Modified Capabilities

None accepted today.

## Non-goals

- Per-page or per-section theme overrides.
- Re-theming the Open Graph card, favicons, or other rasterized brand assets.

## Impact

- `globals.css` gains token blocks and loses literal colors; every page inherits both themes with no per-page work.
- `apps/web/app/components/theme-toggle.tsx` is new; the site header composes it next to the GitHub pill.
- The root layout gains a small inline script that reads one `localStorage` key.
