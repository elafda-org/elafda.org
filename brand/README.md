# eLafda brand

The brand formalizes the visual language already shipped on elafda.org: an archival
"case file" aesthetic — paper, ink, one loud coral accent — set in Georgia. The core
device is the **coral full stop**: the internet's drama scrolls on forever; eLafda puts
a period on it. It appears as the dot in `eLafda.`, the active node on a case timeline,
and the standalone mark.

## Logo

| File | Use |
| --- | --- |
| `logo/wordmark.svg` | Primary lockup, light backgrounds |
| `logo/wordmark-dark.svg` | Primary lockup, ink/dark backgrounds |
| `logo/wordmark-mono.svg` | Single-color contexts (inherits `currentColor`) |
| `logo/mark.svg` | Square "eL." tile — avatars, app icons |
| `logo/mark-light.svg` | Square tile on paper with ink border |
| `logo/favicon.svg` | Round "e." disc — small sizes (≤48px) where "eL." stops reading |

All text is outlined to paths (Georgia Bold, −0.06em tracking), so the SVGs render
identically everywhere — no font dependency.

Rules:

- The full stop is always coral (`#ff5a45`) except in the mono variant. Never recolor it
  per-context and never omit it.
- Wordmark is `eLafda` — lowercase `e`, capital `L`, never "Elafda" / "eLAFDA".
- Clear space: at least the height of the "e" on all sides. Don't add effects, gradients,
  outlines, or rotation (rotation is reserved for the site's stamp/layer motifs).
- Below ~48px use `favicon.svg` ("e.") instead of the "eL." mark.

## Color

| Token | Hex | Role |
| --- | --- | --- |
| Paper | `#f4f0e6` | Background, light surfaces |
| Paper deep | `#e8e2d4` | Secondary surface (dormant states) |
| Ink | `#151513` | Text, borders, dark surfaces |
| Muted | `#67645d` | Secondary text |
| Coral | `#ff5a45` | The accent. Full stop, emphasis, "developing" |
| Lime | `#c7f464` | Verification, "resolved", file tabs, stamps |
| Blue | `#6eb9ff` | Focus rings, case accent |
| Violet | `#b99bff` | Case accent |

Coral is emphasis, lime is verification — don't swap those roles. Paper/ink do the
work; the accents punctuate.

## Type

- **Display / headlines / wordmark:** Georgia (fallback: Times New Roman, serif),
  tight tracking (−0.04em to −0.075em), tight leading (0.83–1.05).
- **UI / labels:** Inter (fallback: system sans), bold, uppercase, wide tracking
  (+0.05em to +0.13em), small sizes.
- **Metadata / case IDs:** ui-monospace, bold, uppercase.

## Voice

Plain, declarative, a little dry. The record speaks; it doesn't hype.
Tagline: **"Internet forgets. Receipts shouldn't."** Signal words: open source,
community governed, source backed. Keep discussion and record vocabulary distinct.
Ready-to-paste bios, profile fields, and boilerplate live in `copy.md`.

## Ready-made assets

- `web/` — favicons (16/32), touch icon (180), PWA icons (192/512), and
  `og-1200x630.png` (Open Graph / Twitter card).
- `x/` — `avatar-400.png` and `banner-1500x500.png` for the X profile, plus
  `system-map-1600x1200.png` (4:3 system map for posts) and its `system-map.html`
  source. Regenerate with:
  `google-chrome --headless=new --force-device-scale-factor=2 --window-size=1600,1200 --screenshot=out.png file://.../system-map.html`

Regeneration script: text is outlined from `Georgia_Bold.ttf` via fontTools, composed
to SVG, rasterized with sharp. See git history of this directory for the pipeline.

## Wiring into the app

Shipped via the `wire-brand-web-assets` OpenSpec change: `apps/web/public/og.png` is
`web/og-1200x630.png`, and `favicon.svg` (from `logo/`), `favicon-16.png`,
`favicon-32.png`, and `apple-touch-icon-180.png` live in `apps/web/public/` and are
declared through `metadata.icons` in `app/layout.tsx`. If these assets are
regenerated, re-copy them into `apps/web/public/`.
