## 1. Implementation

- [x] 1.1 Move remaining literal colors in `globals.css` onto tokens (`--lift`, `--lift-strong`, `--body-soft`, paper and ink mixes)
- [x] 1.2 Add the dark token block under `:root[data-theme="dark"]`; the bare `:root` light tokens are the default in every other state
- [x] 1.3 Pin dark text on surfaces that keep coral or lime backgrounds in both themes
- [x] 1.3a Keep ink-ground panels (hero file, layers band, footer, dark buttons) dark in both themes via local token re-pins
- [x] 1.3b Route coral text through `--coral-text` so it meets WCAG AA on light paper
- [x] 1.4 Add the stateless `ThemeToggle` switch (sliding knob with a CSS-chosen icon, `data-theme` + `localStorage` on click) to the site header next to the GitHub pill
- [x] 1.5 Add the pre-paint inline script in the root layout that re-applies a stored choice
- [x] 1.6 Restyle the GitHub link as a pill with the GitHub mark, live star count, and star glyph

## 2. Verification

- [x] 2.1 Cover the theme blocks and toggle presence in the rendered-HTML suite
- [x] 2.2 Screenshot both themes on the homepage and confirm accent surfaces, header tools, and the tagged wall render correctly
- [x] 2.2a Audit WCAG contrast of every text-bearing token pair in both palettes
- [x] 2.3 Run lint, the web build, and the web test suite
- [x] 2.4 Validate this change
