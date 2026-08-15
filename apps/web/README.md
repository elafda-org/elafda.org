# @elafda/web

The public eLafda website. It currently provides the read-only archive preview defined by the accepted OpenSpec capabilities `public-homepage` and `case-discovery-preview`.

## Commands

```bash
npm ci          # install exact dependencies
npm run dev     # start the local site
npm run build   # create the production Workers build
npm run preview # build and preview locally in the Workers runtime
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

The application uses vinext with the Cloudflare Vite plugin. `wrangler.jsonc` defines a safe default `workers.dev` preview and an explicit production environment for the `elafda.org` and `www.elafda.org` custom domains. Generated output, local Wrangler state, dependencies, and environment files are ignored.

For a manual deployment, authenticate with `npx wrangler login`, run `npm run deploy:preview`, and smoke-test the returned URL. Only then run `npm run deploy:production` to attach production domains. Non-interactive deployments provide `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` outside version control.

Product decisions belong in the repository-level `SPEC.md` and OpenSpec workflow. Do not add persistent data, authentication, or real controversy records without an approved OpenSpec change.
