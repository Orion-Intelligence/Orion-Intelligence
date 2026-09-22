# LLM / AI maintenance rules — docs branding & white-label

Read this before changing anything under `docs/`, the docs screenshot pipeline, or the
`/documentation` serving path. These docs are white-labeled per tenant, so "Orion" is not a
fixed string here — it is replaced for other tenants at serve time and at screenshot-build time.

## How white-labeling works

1. **Text (runtime, per tenant).** Non-default tenants open `/documentation` (client
   `documentationUrl` getter). nginx proxies `^~ /documentation/` to the app backend, and
   `backend/routes/documentation_routes.py` fetches the page from the internal `documentation`
   container and rewrites `Orion Intelligence` -> the tenant's `app_name`, then `\bOrion\b` ->
   `app_name`, for `text/html` only. Default / canonical-brand tenants pass through unchanged and
   keep "Orion". readthedocs (the default tenant's docs) is external and also keeps "Orion".

2. **Screenshots (build time, neutral).** Raster pixels cannot be rebranded per tenant, so the
   white-label docs use a **neutral** screenshot set that says "Intelligence Platform" instead of "Orion".
   `cy.docsScreenshot` (`client/cypress/support/commands.ts`) captures each shot twice in one pass:
   the real shot, then `applyNeutralBrand` (`client/cypress/support/brand-neutralize.ts`) swaps logo
   `<img>`/background-image to the generic mark (`docs/_static/brand-neutral-*.svg`) and rewrites
   `Orion Intelligence`/`\bOrion\b` -> `Intelligence Platform` in the live DOM, then the branded shot, then the
   DOM is restored. `generate_docs.sh` post-processes both: real -> `docs/screenshots/`,
   neutral -> `docs/screenshots-neutral/`. Baked caption labels are neutralized in the neutral pass
   via `ORION_DOCS_NEUTRAL=1` in `postprocess_screenshots.py`. `docs/Dockerfile` copies
   `screenshots-neutral/*` over `screenshots/` before `sphinx-build` (that image is the self-hosted
   `/documentation`), so white-label shows "Intelligence Platform"; readthedocs/default keeps the real shots.

## Rules

- **Do not hardcode a tenant name.** Write docs prose with "Orion"/"Orion Intelligence"; the proxy
  rebrands it. Never write another tenant's brand into the source.
- **Brand rewrite happens in several places — keep the token order (`Orion Intelligence` then
  `\bOrion\b`) in sync, but mind the CASE rules.** `backend/routes/documentation_routes.py` (runtime
  HTML proxy) is case-SENSITIVE on purpose: the docs source is authored in canonical Title-case, and
  a case-insensitive match would corrupt lowercase URLs like `orion-search.readthedocs.io`.
  `client/cypress/support/brand-neutralize.ts` (screenshot DOM) and `postprocess_screenshots.py`
  `_neutralize_brand` (baked labels) are case-INSENSITIVE: UI/label text can be any case and a raster
  image has no functional URL to break. `docs/Dockerfile` neutralizes `searchindex.js` at build.
- **The runtime proxy only rewrites `text/html`.** Any non-HTML asset the self-hosted image serves
  that carries the brand MUST be neutralized/removed at BUILD time (`docs/Dockerfile`) or excluded in
  `conf.py` — the proxy never touches it. Already handled: `searchindex.js` (sed), page sources
  (`html_copy_source=False`, `html_show_sourcelink=False`), README-only `_static/readme-*.svg`
  (removed from /site). If you re-enable search, add a sidebar, or add `_static` assets with brand
  text, neutralize them the same way.
- **The neutral screenshot set is a required, committed artifact.** `docs/screenshots-neutral/` MUST
  be regenerated (`generate_docs.sh`) and committed next to `docs/screenshots/`. The self-hosted
  `documentation` image is built by `./run.sh build -d|-p` / `compose build documentation`, which do
  NOT run `generate_docs.sh`; if `docs/screenshots-neutral/` is missing, `docs/Dockerfile` prints a
  loud WARNING and ships the REAL Orion screenshots. Never leave it uncommitted.
- **Logo detection is scoped to `/api/s/static/system/`** (brand logos) in brand-neutralize.ts.
  Do not broaden it back to all of `/api/s/static/` — that also matches user/tenant avatars and would
  replace people's photos with the neutral mark in neutral shots.
- **New screenshots:** capture through the normal Cypress flow with `cy.docsScreenshot(...)`; both
  the real and neutral variants are produced automatically. Do not paste pre-rendered images that
  already have brand pixels baked in — the neutralizer works on the live DOM before capture, not on
  finished raster images.
- **Captions:** if a figure caption names the product, it is baked onto the neutral image as
  "Intelligence Platform" automatically. Prefer feature-descriptive captions; avoid tenant-specific names.
- **Regenerate:** run `bash docs/scripts/generate_docs.sh` (from anywhere). It runs the e2e suite
  once and writes both `docs/screenshots/` and `docs/screenshots-neutral/`. Then `./run.sh build -d`
  rebuilds the `documentation` image so `/documentation` picks up the neutral set.
- **The neutral brand is generic ("Intelligence Platform" + `docs/_static/brand-neutral-*.svg`), not each
  tenant's name** — that is intentional; raster screenshots cannot be per-tenant without runtime
  image editing, which is deliberately avoided.
- This file is excluded from the Sphinx build (`conf.py` `exclude_patterns`); it is guidance, not a
  published page.
