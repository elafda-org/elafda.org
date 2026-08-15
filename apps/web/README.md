# @elafda/web

The public eLafda website. It currently provides the read-only archive preview defined by the accepted OpenSpec capabilities `public-homepage` and `case-discovery-preview`.

## Commands

```bash
npm ci          # install exact dependencies
npm run dev     # start the local site
npm run build   # create the production Workers build
npm run lint    # run code-quality checks
npm test        # build and run rendered-output tests
```

Node.js 22.13 or newer is required.

## Structure

```text
app/
├── globals.css       # Responsive editorial design system
├── layout.tsx        # Document shell and social metadata
└── page.tsx          # Homepage and local case discovery
public/
└── og.png            # Social preview card
tests/
└── rendered-html.test.mjs
worker/
└── index.ts          # Cloudflare Worker entry
```

The application uses the Sites vinext runtime and produces Cloudflare Worker-compatible output. Hosting metadata is kept in `.openai/hosting.json`; generated output, local runtime state, dependencies, and environment files are ignored.

Product decisions belong in the repository-level `SPEC.md` and OpenSpec workflow. Do not add persistent data, authentication, or real controversy records without an approved OpenSpec change.
