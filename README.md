# noworriesfix.com

Static site for No Worries Home Improvements. No framework, no dependencies, no database, no secrets.

- Edit pages, prices and copy in `build.mjs`; styles in `src/styles.css`.
- `node build.mjs` writes the site to `dist/`.
- Old Lovable URLs forward via `src/_redirects`; security headers live in `src/_headers`.

## Cloudflare settings (Git integration)

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `node build.mjs` |
| Build output directory | `dist` |
| Production branch | `main` |

Cost: $0 on the free plan (static files only, no Functions, nothing scheduled).

## Open items before go-live

- Publish the Airtable form "Get a Flat-Price Photo Quote" (Lead Intake table) and confirm its public URL matches `QUOTE_FORM_URL` in `build.mjs`.
- Insurance and license: the site makes no "insured" or "licensed" claim. Add one only once the policy/license exists.
- Guarantee / warranty wording: not on the site yet; add once decided.
- Proof: no job counts or ratings. Add real reviews (selected for "the price was what he quoted") and before/after photos captioned with the flat price.
- Service minimum: rate card says $95, Airtable GO/NO-GO formula says $175. The site publishes neither until this is settled.
