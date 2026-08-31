# NOTES

## Client build warnings (2026-08-28)

### npm install/ci warnings

- **`ERESOLVE overriding peer dependency` (listr2)** — `@angular/cli@22.1.4` pins `listr2@10.2.2`, but the
  `@listr2/prompt-adapter-inquirer@4.2.4` it also ships peers on `listr2@10.2.1` *exactly*. Upstream packaging bug.
  Newer adapter releases (4.2.5+) peer on `listr2@11`, so upgrading the adapter makes it worse. Fixed with the
  `"@angular/cli": { "listr2": "10.2.1" }` override in `client/package.json` — the CLI gets the patch version the
  adapter asks for, and `@angular/build`'s own `listr2@10.2.2` is left untouched.

- **`deprecated glob@10.5.0`** — came from `babel-plugin-istanbul@8 → test-exclude@7 → glob@^10`. `babel-plugin-istanbul`
  has no release that moves to `test-exclude@8`, so the fix is the `"test-exclude": { "glob": "13.0.6" }` override.
  `test-exclude` only uses `require('glob').glob` / `.sync`, both of which still exist in glob 13, and the root project
  already depends on `glob@13.0.6` so the nested copy dedupes away entirely.
  Note: npm will not re-apply a new nested override against an already-resolved lock edge. The stale
  `node_modules/test-exclude` + `node_modules/test-exclude/node_modules/glob` entries had to be deleted from
  `package-lock.json` before `npm install` would honour it.

- **`deprecated esri-loader@3.7.0`** — replaced by
  `client/src/app/pages/geo-fencing/threat-lens/map-utils/threat-lens-arcgis.loader.ts`, which does the only two things
  the app used esri-loader for: inject `https://js.arcgis.com/4.34/` once and wrap the resulting AMD `require` in a
  promise. The suggested replacement, `@arcgis/core`, was rejected: it is a ~200 MB ESM package on a 5.x API line
  (the app targets the 4.34 CDN build), it needs its assets copied into the build output, and bundling `SceneView`
  locally would blow the initial-bundle budget. Runtime behaviour is unchanged — the ArcGIS API is still CDN-loaded
  on demand.

- **`deprecated @ngtools/webpack` / `@angular-devkit/build-angular`** — fixed by migrating the whole workspace
  off Angular's webpack build system. See "Webpack -> esbuild build system migration" below. (Originally
  written up as unfixable; the reason it turned out to be tractable is that the production webpack config
  was dead code.)

  The original assessment was: `angular.json` builds through `@angular-builders/custom-webpack:browser` because
  `webpack.config.js` runs `webpack-obfuscator` over `vendor.js` and `compression-webpack-plugin` for the `.gz`
  artifacts, and `webpack.instrument.js` adds `babel-plugin-istanbul` for Cypress coverage. `@angular-builders/custom-webpack`
  itself depends on `@angular-devkit/build-angular`, so the packages install (and warn) regardless of what
  `angular.json` selects. Moving to `@angular/build:application` means porting obfuscation, gzip and coverage
  instrumentation to esbuild equivalents.

### `ng build` warnings

- **CommonJS/AMD optimization bailouts** for `leaflet`, `@maplibre/maplibre-gl-leaflet` and `maplibre-gl` — these are
  real UMD packages and are already loaded through a dynamic `import()` in the satellite map renderer, so they land in
  a lazy chunk. Added to `allowedCommonJsDependencies` in `angular.json`. The `esri-loader` bailout disappeared with
  the package itself.

- **`bundle initial exceeded maximum budget`** — the initial budget warning was raised from 2 MB to 2.25 MB
  (error threshold left at 3 MB). This is a threshold change, not a size reduction: the initial bundle is 2.10 MB, of
  which **1.19 MB is `styles.css`**, essentially all Tailwind utilities generated from `./src/**/*.{html,ts}`
  (the codebase leans hard on arbitrary-value classes, and `important: true` adds `!important` to every rule).
  `main.js` is only 790 kB. Real reductions, if wanted later:
  - move `maplibre-gl.css` (70 kB) and the leaflet CSS (17 kB) out of the global `styles` array and onto the
    geo-fencing map components (they already use `ViewEncapsulation.None`), so they ship in the lazy chunk — worth
    roughly 60-70 kB;
  - reduce the arbitrary-value Tailwind usage, which is where the remaining ~1.1 MB comes from.

## Webpack -> esbuild build system migration (2026-08-28)

Migrated every builder off Angular's deprecated webpack support. This removes `@angular-devkit/build-angular`,
`@ngtools/webpack` and `@angular-builders/custom-webpack` from the tree entirely (448 packages), so `npm ci`
is now completely silent and `ng build` / `ng serve` no longer print builder deprecation notices.

| target | before | after |
| --- | --- | --- |
| build | `@angular-builders/custom-webpack:browser` | `@angular/build:application` |
| serve | `@angular-devkit/build-angular:dev-server` | `@angular/build:dev-server` |
| extract-i18n | `@angular-devkit/build-angular:extract-i18n` | `@angular/build:extract-i18n` |
| test | `@angular-devkit/build-angular:karma` | `@angular/build:karma` |

`@angular/build` had to be added as an explicit devDependency — it was only present transitively via the two
packages that were removed.

### Why the migration was possible at all: webpack.config.js was dead code

`webpack.config.js` guarded its body with `if (options?.configuration !== "production") return config;`.
`@angular-builders/custom-webpack` invokes the user config as
`configOrFactoryOrPromise(baseWebpackConfig, buildOptions, targetOptions)`
(`node_modules/@angular-builders/custom-webpack/dist/custom-webpack-builder.js:56`) — `configuration` lives on
the THIRD argument, not the second. So `options.configuration` was always `undefined` and the guard always
returned early. Corroborating evidence: the file `require()`s `compression-webpack-plugin` and
`webpack-obfuscator` after the guard, neither package was in package.json or node_modules, and the production
build still exited 0. Nothing would have resolved those requires if the body ran.

Consequence: gzip precompression and JS obfuscation were NOT happening, despite appearances. No `.gz` files
were ever emitted (`nginx/nginx-prod.conf` has `gzip on;` at line 38 doing it dynamically, so nothing was
actually broken). The file was deleted rather than ported — porting it would have ADDED obfuscation that
production has never had.

### Coverage instrumentation had to be rebuilt (webpack.instrument.js -> instrument-build.js)

`webpack.instrument.js` WAS live (no configuration guard) — it added a `babel-loader` + `babel-plugin-istanbul`
rule for the `instrumented` configuration, which Cypress consumes via `@cypress/code-coverage`.

An esbuild plugin cannot replace it. `@angular/build` registers its own compiler plugin BEFORE user plugins
(`node_modules/@angular/build/src/tools/esbuild/application-code-bundle.js:56` pushes `createCompilerPlugin()`,
line 62 pushes `...options.plugins`), and that plugin claims `onLoad({filter: /\.[cm]?[jt]sx?$/})`. esbuild runs
onLoad callbacks in registration order and the first non-null result wins, so a user `.ts` onLoad never fires.
This is also why `@angular-builders/custom-esbuild` was NOT adopted — its `plugins` option feeds the same
`options.plugins` array and inherits the same ordering problem.

Replacement: `client/instrument-build.js`, a post-build step that instruments the EMITTED bundles with
`istanbul-lib-instrument` (already a devDependency), passing each bundle's adjacent `.js.map` as
`inputSourceMap`. istanbul embeds that map in the coverage object, and nyc/`istanbul-lib-source-maps` splits
one bundle's coverage back into per-source-file entries at report time.

One non-obvious detail: esbuild emits source maps with workspace-relative `sources`
(`src/app/...`). Left alone, `istanbul-lib-source-maps` resolves those against the OUTPUT directory and
produces paths like `build-next/browser/src/app/...`. `instrument-build.js` therefore rewrites `sources` to
absolute paths (`path.resolve(__dirname, source)`) before instrumenting.

Verified without running Cypress: 146 app bundles instrumented / 28 vendor bundles skipped, all output still
parses as valid ESM, `window.__coverage__` wiring present, and feeding `main.js` through
`readInitialCoverage` -> `createSourceMapStore().transformCoverage()` remaps 847 statements onto 26 real
`.ts` files (the single non-src entry is a `node_modules` file that nyc excludes by default).
NOT yet verified: an actual browser run producing `window.__coverage__`. That needs a Cypress run.

### Output layout change

`@angular/build:application` writes to `<outputPath>/browser/`. angular.json uses the object form
`{"base": "build", "browser": ""}` to keep the flat `client/build/` layout that `post-build.js` and the
backend expect.

The CLI's `--output-path` flag only accepts the STRING form (`--output-path.base` is rejected: "Unknown
arguments"), and the string form always appends `browser/`. Since `run.sh`'s `client_build()` passes
`--output-path build-next`, it now builds to `build-next/browser/`. `run.sh` was updated to move the
base-level files (`3rdpartylicenses.txt`, `prerendered-routes.json`) into that directory and rsync from
`build-next/browser/` instead of `build-next/`.

### proxy.conf.json had to be rewritten

The Vite dev-server translates the webpack array form via `normalizeProxyConfiguration`
(`node_modules/@angular/build/src/utils/load-proxy-config.js`) — it keeps the `context` array handling, but
the resulting per-key object is handed to Vite's `http-proxy`, which has no `router`, `pathFilter` or
`logLevel` options. `router` was the only thing specifying the backend, so the proxy would have had NO target.
Rewritten to a single `"target": "https://127.0.0.1:8443"`; `secure`, `ws`, `changeOrigin` and `xfwd` are all
genuine `http-proxy` options and were kept.

### Two latent warnings that webpack had been hiding

- `src/main.ts` imported `@angular/localize/init` directly; esbuild warns this "may lead to undefined
  behavior". Moved to the `polyfills` array in angular.json.
- `home-insight.component.html` had `[ngClass]="{ '': cond, '': !cond }"` — two empty-string keys, so it
  applied no classes in either branch and the duplicate key made the first unreachable. Dead binding, removed.

### Bundle size

esbuild produces a smaller initial bundle than webpack did: **2.10 MB -> 1.90 MB**. The initial budget
`maximumWarning` was therefore restored to its original `2MB` (it had been raised to 2.25MB only to silence
the webpack-era overshoot). Headroom is now ~100 kB. `styles.css` is still ~1.25 MB of Tailwind utilities and
remains the dominant contributor if that ever needs reducing.

### Dependency cleanup

- Removed devDependencies: `@angular-builders/custom-webpack`, `@angular-devkit/build-angular`.
- Added devDependency: `@angular/build@22.1.4`.
- Removed the now-dead `"@angular-devkit/build-angular"` overrides block.
- `webpack` and `babel-loader` REMAIN in the tree on purpose — they are peer dependencies of
  `@cypress/code-coverage` and `@cypress/webpack-preprocessor`, so the top-level `webpack` security override
  is still live. `babel-plugin-istanbul` and the `@babel/*` presets are no longer used by the build but were
  left in place for the same Cypress tooling.

## Tenant onboarding never left `/onboarding` after Confirm

`18-case-management.cy.ts` -> "Case Management - Tenant Alert Visibility" failed at
`10-tenant-management.controller.ts:169` waiting for `[data-testid="dashboard-main"]`. Every test id in the
flow exists; the failure screenshot shows the app still parked on
`/onboarding?redirect=%2Fdashboard%2Fprofile%2Fhomepage` with step 3 rendered, and the
`POST /api/update/tenants` in the command log returning 200. So the request succeeded and the client simply
bounced straight back to onboarding.

`TenantComponent.confirm()` ran all of its side effects *inside* the `userSessionData.update()` callback:

```
userSessionData.update(state => {
  const updated = { ...state, tenant: { ...state.tenant, ...res.tenant, ... } };
  tenantData.set(...);
  setOnboardingStatus(false);      // this is itself a userSessionData.update()
  router.navigate(['/dashboard']);
  return updated;                  // <- overwrites what setOnboardingStatus just wrote
});
```

Angular's `WritableSignal.update(fn)` is `set(fn(currentValue))` — `fn` runs first, then the result is
written. So the nested `setOnboardingStatus(false)` set `hasOnboarding: false`, and the outer `set(updated)`
immediately clobbered it back to `true` (carried over from `state.tenant`). `OnboardingGuard` on
`/dashboard/profile` then redirected to `/onboarding` again.

This only started failing after the tenant merge was tightened. The previous shape was
`tenant: res.tenant ?? state.tenant`, which replaced the whole tenant object with the backend's snake_case
`tenant_data` document — that payload has no `hasOnboarding` key at all, so the value came out `undefined`,
the guard read it as falsy, and the redirect happened to not fire. The clobber was always there; changing to
`{ ...state.tenant, ...res.tenant }` preserved `hasOnboarding: true` and exposed it.

Fix: keep the update callback pure and move `tenantData.set`, `setOnboardingStatus(false)` and
`router.navigate` out to the `next` handler, after the signal write.

Note `res.tenant` is `tenant.model_dump()` from `TenantManager.update_tenant` — raw snake_case, and its
`email` is still Fernet-encrypted (only `get_all_tenant` decrypts it). Spreading it into the camelCase
session tenant leaves those keys as dead weight; the explicit camelCase remaps below the spread cover the
fields the UI actually reads.

## Social spec: two real blockers, both mocked out now

`08-social-management.cy.ts` was down to 1 passing / 2 failing / 8 skipped. Two independent causes.

### 1. `reconProfilesFrom` crashed on the recon mock

`TypeError: Cannot read properties of null (reading 'ids')` in the suite's `before each`. Entries 2, 3 and 5
of `backend/tests/mock/elastic/social_recon.json` carry `"data": null` (Github and Allmylinks hits with no
parsed profile), and `asRecord(null)` returned `null`, so `asRecord(entry['data'])['ids']` threw. `asRecord`
now coerces null/undefined to `{}`, which also hardens `crawlItemsFor` against a mock that failed to load.

### 2. Nothing was stubbing the extension, so half the UI never rendered

`SocialExtensionService.detect()` is a pure `window.postMessage` handshake with the browser extension — it
pings `{source:'orion-app', type:'ping'}` and waits for `{source:'orion-extension', type:'presence'}`. It
never touches `/api/extension/session`; that endpoint exists on the backend but no client code calls it, so
the `cy.intercept('GET', '**/api/extension/session', …)` lines in both social controllers were inert. Without
a presence reply the state settles on `install`, and both `profile-listing.component.html` (the whole
profile-tabs section, behind `isExtensionReady()`) and `manage-profiles.component.html` render the install
gate instead of their content.

`stubExtensionPresence(connected)` now installs a fake in-page bridge through `cy.on('window:before:load')`.
It has to be injected with `win.eval` rather than `win.addEventListener` from the spec: `detect()` rejects
any message whose `event.source !== window`, and a `postMessage` issued from the Cypress frame carries the
spec window as its source. Running the listener inside the AUT realm makes the reply pass that guard.
`connected: false` gives the `signin` state and `stubUnsupportedBrowser()` (blanking `userAgent` /
`userAgentData`) gives `unsupported`, so all three extension-manager branches are now covered.

### Connections mock was producing character-index objects

`crawlItemsFor('connections')` spread each entry of `social_followers.json` — which is an array of plain
handle strings — so `{...'loislane'}` became `{"0":"l","1":"o",…}`. The old connections test only asserted
the outgoing request body, so nothing caught it. The mapping now builds real
`{resource_id, handle, title, url, parent_url}` records, and the connections tab and the post-connections
popup both assert on rendered handles.

### Coverage added

Empty scan results, clean stealer/phone lookups, stopping an in-flight section sync (`command: 'cancel'`),
`load more` past the 50-item display limit, the post-connections popup (YouTube — feed connections are
gated to facebook/youtube/mastodon/bluesky/hackernews/reddit/habr/devcommunity/stackoverflow/stackexchange),
the extension `signin` and `unsupported` states, the manage-profiles 10-session cap, and a platform load
failure. 11 tests -> 20, all passing on two consecutive runs.

## Log Manager was dropping most of what it claimed to show (2026-08-31)

Audit of `/dashboard/profile/monitoring?tab=log-manager`. Six defects, all fixed.

### Unhandled 500s never reached the file logger

`configs/exception_handlers.py` logged to `logging.getLogger("uvicorn.error")`, which only goes to
stdout/container logs. Nothing in the repo bridges stdlib `logging` to `workspace/logs/` (no
`basicConfig`/`dictConfig`/`log_config` anywhere), so no 500 and no traceback had ever appeared in the
Log Manager. Both handlers now also call `log.g().e()` / `log.g().w()` with the formatted traceback.
`auth_manager` had the same problem via its own `logging.getLogger(__name__)`; that logger is gone and
its two `logger.exception` calls now go through `log.g().e()`.

### Multi-line entries were discarded

`LOG_LINE_PATTERN` is anchored, and `_parse_log_line` returned `None` for anything that did not match, so
every continuation line was thrown away — 196 of 778 lines (25%) in the crawler logs, which is exactly the
stack frames and Playwright `Call log:` detail. `get()` now buffers unmatched lines and attaches them to
their header entry. Because `_iter_log_lines_reverse` walks bottom-up, the continuation arrives before its
header, so the buffer is flushed in `reversed()` order onto the next entry that parses.

### Crawler errors were shown twice

The crawler's `log.g().e()`/`c()` write to both `<date>/info/` and `<date>/error/`, and `_log_files`
`rglob`s the whole date directory, so every crawler error appeared twice. `error/` is a strict subset of
`info/` (only `e()` and `c()` write there, and they always write both), so it is now skipped when a
sibling `info/` exists.

### CRITICAL was written to disk and then filtered out by the reader

`VISIBLE_LOG_TYPES` was `{INFO, WARNING, ERROR}` while `log_controller` also emits `SUCCESS` and
`CRITICAL` — the most severe level was unreachable by design. Both added, plus the type dropdown and
badge colours in the component.

### The caller column was empty for ~90% of rows

The old code looked for the literal `" - Function "` and so only matched callers logged from a bare
function; for a class caller the `if` failed and the `(file:line)` suffix stayed glued to the end of the
message. Replaced with `CALLER_PATTERN` matching the `<name> (<path>:<line>)` suffix. Measured on the
real logs: 90/100 empty -> 0/100.

### 30-day retention had not run since 2026-07-04

`__cleanup_old_logs` wrapped the whole loop in one `try`, so a single failure aborted the entire pass, and
it used `os.remove` per file — which raises `IsADirectoryError` on the crawler's nested `info/`/`error/`
layout and `PermissionError` on root-owned directories. It also set `__last_cleanup_date` before doing the
work, so a failed pass would not retry that day. Now: per-directory `shutil.rmtree(..., ignore_errors=True)`,
so one undeletable directory no longer blocks the rest.

### Flush deleted the log root and wedged the writer for four days

Found on production after the fixes above shipped: the page was still empty because
`SYSTEM_LOG_FLUSHED_AT` was `2026-08-27T23:58:39` and `/app/workspace/logs` did not exist at all.
`flush()` removes every date directory and then calls `_remove_empty_dir(root)` on the log root itself,
so pressing "Flush all logs" deletes `workspace/logs`. After that `__write_to_file`'s
`os.makedirs(.../logs/<date>)` needs write permission on `workspace/`, not on `logs/` — the container runs
as uid 1000 and could write inside `logs/` but could not recreate it — and `log_controller.py:93` is
`except Exception: pass`, so every write failed silently. Nothing was logged between 2026-08-27 and
2026-08-31. Dropped the `_remove_empty_dir(root)` call; `delete()` still prunes an emptied date directory,
which is the case that call was actually for.

Recovering an instance in this state needs both halves: recreate `backend/workspace/logs` owned by 1000,
and `DEL SYSTEM_LOG_FLUSHED_AT` in redis, since the marker hides everything older than the flush.

`run.sh` now creates `backend/workspace/logs` and makes it group/other writable just before `compose up`,
next to the identical `parser_files` prep, so every deploy path lands the directory. It is needed because
`/app/workspace` is root-owned on production while the container runs as uid 1000 — the app can write
inside `logs/` but cannot create it — so a fresh clone, a wiped volume or a new box would otherwise start
in the same wedged state. The chmod is deliberately not `-R`: recursing would rewrite the 0644 perms
`__write_to_file` sets on every log file and walk the whole history on each deploy.

### Left alone deliberately

`total` is still `page * limit + 1` (an honest count means scanning every file on every request), deep
paging is still an O(page) rescan, and nginx / Mongo / Elastic / the Angular client / the sibling Orion
services still do not feed this page at all. Those need a real log pipeline, not a patch.
