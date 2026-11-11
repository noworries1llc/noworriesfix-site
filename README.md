# noworriesfix.com

Static site for No Worries Home Improvements. No framework, no dependencies, no database, no secrets.

- Edit pages, prices and copy in `build.mjs`; styles in `src/styles.css`.
- `node build.mjs` writes the site to `dist/`.
- Old Lovable URLs forward via `src/_redirects`; security headers live in `src/_headers`.

## Cloudflare settings (Worker with static assets, Git-connected)

| Setting | Value |
|---|---|
| Build command | `node build.mjs` |
| Deploy command | `npx wrangler deploy` |
| Production branch | `main` |

`wrangler.jsonc` tells the Worker to serve `./dist` and use `404.html` for missing pages. No Worker script runs; it's static files only, so it stays on the free plan with nothing scheduled.

## Open items before go-live

- Publish the Airtable form "Get a Flat-Price Photo Quote" (Lead Intake table) and confirm its public URL matches `QUOTE_FORM_URL` in `build.mjs`.
- Insurance and license: the site makes no "insured" or "licensed" claim. Add one only once the policy/license exists.
- Guarantee / warranty wording: not on the site yet; add once decided.
- Proof: no job counts or ratings. Add real reviews (selected for "the price was what he quoted") and before/after photos captioned with the flat price.
- Service minimum settled at $95 (2026-11-11) and published. The Airtable Lead Intake "GO / NO-GO" formula still assumes $175; update it in the Airtable UI.
