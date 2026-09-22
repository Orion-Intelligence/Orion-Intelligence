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

### Root logger bridge for stdlib logging

`docker logs trusted-web-main` carried 101 lines against 7 in `workspace/logs` for the same window,
including a real `[ERROR] Control server error: [Errno 13] Permission denied` that the page never showed.
Everything reaching stdlib `logging` — third-party libraries and any `logging.getLogger(__name__)` — was
invisible. `log_bridge` is a `logging.Handler` on the root logger at level WARNING that forwards
WARNING/ERROR/CRITICAL to `log.g().w()`/`.e()`/`.c()`, formatting `record.exc_info` onto the message so
the reader's multi-line merge keeps the traceback. INFO and DEBUG are dropped at the handler, which
matters because pymongo and elastic_transport are extremely chatty below WARNING.

`install()` calls `log.g()` first. That looks redundant but is the loop guard: `__configure_logs` is what
sets `propagate = False` on `genesis_logs`, and until the singleton exists that logger propagates to root,
so a record written by the bridge could come straight back into it. Forcing construction before the
handler is attached makes the ordering deterministic rather than dependent on who logs first.

Two things it does not reach. `uvicorn` sets `propagate: False`, so `uvicorn.error` records stop there and
never touch root — that path stays covered by the explicit `log.g()` calls in `configs/exception_handlers.py`.
And the gunicorn master is a separate process that never imports the app without `--preload`, so its own
errors are out of reach of anything in-process; the same goes for nginx, mongo, elastic and arango, which
need a log shipper, not a handler. `caller` on bridged rows reads `log_bridge` since `get_caller_info`
walks to the handler frame; the originating logger name is the message prefix instead.

### Left alone deliberately

`total` is still `page * limit + 1` (an honest count means scanning every file on every request), deep
paging is still an O(page) rescan, and nginx / Mongo / Elastic / the Angular client / the sibling Orion
services still do not feed this page at all. Those need a real log pipeline, not a patch.

## Backup job state, progress and memory (2026-08-31)

Reported symptom: in production the instant-backup progress bar never appears, sometimes appears after a
reload, and the backup does not finish; the server itself was seen choking. Three independent causes.

### The progress bar: per-process job state behind four workers

`docker-compose-production.yml` runs `gunicorn -w 4 --threads 4`, and `cronjobs.py` runs as a fifth,
separate process. `BackupManager._job` was a plain dict on a per-process singleton. `POST /api/admin/backups/instant`
starts the task in whichever worker handled it; `GET /api/admin/backups/status` round-robins, so three polls
in four answer from a worker whose singleton has never seen the job and returns `status: "idle"`.

The client made that worse rather than merely noisy: `pollJob()` only re-armed its timer while
`status === 'running'`, so the first poll that landed on the wrong worker ended polling silently — no bar,
no toast, nothing. A reload had a one-in-four chance of hitting the right worker, which is exactly the
"sometimes shows on reload" report.

Job state now lives in Mongo in `backup_jobs`, one document keyed `job_key: "backup_job"` with a unique
index, wrapped by `BackupJobStore`. `begin()` is a `find_one_and_update` filtered on `status != running`
with `upsert=True`; when a job is already running the filter misses, the upsert collides with the unique
index and the `DuplicateKeyError` *is* the answer — the lock is held. That makes the guard atomic across
all five processes, where the old `if self._job["status"] == "running"` guarded only its own.

Gunicorn was left at `-w 4` on purpose. Dropping to `-w 1` would also have made the singleton correct, by
serializing every API request in the product behind one event loop.

### Jobs that die without saying so

Two ways a run vanished. `asyncio.create_task(...)` was called with its return value discarded, and the
loop keeps only a weak reference, so the task could be collected mid-run; tasks are now held in
`BackupManager._tasks` until they complete. And if the worker itself is killed (OOM, `--timeout 900`), the
in-memory dict died with it, so the UI saw `idle` and no error was ever written. The job document now
carries a 30s heartbeat, and any reader that finds a `running` job whose `updated_at` is older than 120s
marks it failed with `BackupJobStore.STALE_MESSAGE`. A killed worker now surfaces as a failed backup within
two minutes instead of a bar that never moves or a job that is "running" forever.

### The choke: whole collections in RAM, twice

`_backup_mongo` did `find({}).to_list(length=None)` per collection and then `json_util.dumps(documents, indent=2)`,
holding the decoded documents *and* the entire serialized string in memory at once; `_backup_arango` did the
same via a list comprehension over the cursor plus `json.dumps`. The `web` service has no `mem_limit`, so on a
real dataset this is bounded only by host RAM. Both now stream: batches of `CONSTANTS.BACKUP_BATCH_SIZE`
documents, serialized and written inside `asyncio.to_thread`, with the Arango AQL cursor opened
`stream=True`. Restore is streamed and batched the same way, and Elasticsearch restore no longer builds
every bulk action for an index before sending the first one.

Streaming means the dumps are newline-delimited `.ndjson` rather than one JSON array, so restore accepts
both: `_collect_sources` maps stem to file and lets `.ndjson` win over a legacy `.json` of the same name,
and `_read_documents` / `_iter_documents` branch on the suffix. Backups taken before this change still
restore, including through `restore_backup.py`.

Streaming is also what keeps `--timeout 900` viable. The dump now yields to the event loop on every batch,
so the uvicorn worker keeps answering gunicorn's heartbeat while a large backup runs.

### Progress that reflects work

`step()` fired six times for the whole backup, and the Mongo export — by far the long pole — sat at the same
value from start to finish. `_backup_mongo` now takes a `report` callback and advances a fraction per
collection inside its slice of the window. The message stays one of the fixed strings because the UI runs
it through `| translate`; only the number moves.

### Log folder path

`_perform_backup` copied `BASE_DIR / "orion" / "logs"`, which has not been the log location since logs moved
to `workspace/logs` — and `/app/orion` is mounted read-only in production anyway. Every backup has been
storing an empty `logs/` folder. Fixed to `BASE_DIR / "workspace" / "logs"`.

Logs are archived into the backup but **never restored**. Fixing the path is what first made the log
restore actually execute, and it failed immediately in the real container: `copytree` copies file
metadata, so it hit `[Errno 13] Permission denied` on every existing `log_1.log` and `[Errno 1]
Operation not permitted` on the day directories. That aborted the restore, and because the rollback
path restores logs too it aborted the rollback as well — leaving maintenance mode held on for manual
intervention, which is how the Cypress spec caught it. Restoring logs is wrong anyway: it fights the
running logger's open handles, and rolling back *data* should not roll back the logs of what just
happened. `_run_restore_engine` no longer touches the log directory at all.

### Scheduled backups

`cronjob_manager.backup_loop` called `create_backup()` directly, bypassing the job guard entirely: it
published no status the UI could see, and nothing stopped it from running concurrently with a UI-triggered
backup — two full dumps at once, with `MAX_BACKUPS` pruning `shutil.rmtree`-ing a folder the other was still
writing. It now calls `run_backup_now()`, which takes the same cross-process lock and reports through the
same document.

## Backup/restore hardening and real maintenance mode (2026-08-31)

Follow-up to the entry above. A seven-lens audit with adversarial verification of every finding
produced 22 confirmed defects (6 were refuted and dropped). What follows is what was wrong and
what changed.

### Maintenance mode was advisory, not enforced

The `.maintenance` flag was read by exactly one thing: nginx, via `if (-f /app/static/.maintenance)`.
No Python anywhere looked at it. That left four ways to keep writing to the databases during a
restore, all confirmed:

- `location = /api/extension/socket` carried no guard in any of the five server blocks across the
  three configs. Because `location =` outranks the guarded prefixes, an extension could complete a
  fresh WebSocket handshake mid-restore.
- The `.onion` vhost's `location /` (nginx-prod.conf) had no guard at all, so Tor users kept full
  read/write access while the databases were being wiped and repopulated.
- `cronjobs.py` is a separate process. `purge_loop`, `iocs_alert_loop` and `backup_loop` never
  traverse nginx, so a proxy-level flag is invisible to them. The confirmed contamination path is
  the alert one: `upsert_alerts_bulk` and `set_scan_running` write with no owner or generation
  filter, so an alert scan finishing after `_restore_mongo` has repopulated the alert collections
  writes post-backup alerts into the just-restored dataset.
- nginx evaluates the guard only on *new* requests, so any asyncio task already in flight —
  and any long-lived socket — keeps running for the whole restore.

Enforcement is now in three layers. `maintenance_state` is a singleton class holding the single
predicate — `get_instance().is_active()`, a 1s-cached stat so it is cheap enough to call per
request, plus `enable()`/`disable()`/`invalidate()` so one object owns the flag's lifecycle. Every
tunable it and the backup manager use (`MAINTENANCE_FLAG`, `MAINTENANCE_CACHE_TTL_SECONDS`,
`BACKUP_MANIFEST_NAME`, `RESTORE_ROLLBACK_PREFIX`, `BACKUP_EXCLUDED_ELASTIC_INDICES`, the job-store
heartbeat and staleness windows, …) lives in `CONSTANTS` rather than as module-level globals, and
`backup_manager` now sources `BASE_DIR` from `CONSTANTS` too instead of mixing it with the
`interface` import. `maintenance_middleware` is
an ASGI middleware registered last in `setup_middlewares`, which makes it outermost, so it runs
before tenant resolution and every route. It handles `websocket` scopes explicitly — receiving the
`websocket.connect` and answering `websocket.close` 1013 — because the existing
`service_ready_middleware` returns early on any non-`http` scope, which is precisely the hole the
extension socket walked through. The nginx guard was added to all five socket blocks and to the
onion `location /`. The three cron loops check the predicate at the top of every iteration.

Exempt paths are deliberately narrow: `/api/admin/backups/status` (so progress stays visible),
`/robots.txt`, and the maintenance page's own assets. Everything else 503s, including `/api/public`
— which matters, see below.

`restore_backup` also quiesces before it starts: it closes local extension sockets and cancels
local social scans, then drains. That only reaches the restoring worker's own tasks; the middleware
in the other three workers is what stops new work arriving there.

### The maintenance page was never shown in production

`http.interceptor.ts:68` read `if (isDevMode() && ... status === 503)`. `isDevMode()` is false in
a production build, so Angular's optimizer removed the whole branch: the redirect to
`/static/maintenance.html` has never run in production. Users got a silently broken app instead of
a maintenance page. The gate is gone, and the status-poll URL is excluded from the redirect so the
admin driving the restore keeps their progress bar instead of being bounced with everyone else.

`maintenance.html` now polls `/api/admin/backups/status` and renders the live operation, phase
message and percentage. Its old reconnect probe hit `/dashboard/home`; the new one hits
`/api/public`, which works *because* the new middleware 503s it — nginx leaves `/api/public`
unguarded, so before the middleware existed there was no origin-independent way to ask "is the app
actually back?" without flapping the user in and out of the app every 5 seconds.

One more client fix: `token-refresh.service.ts` put `catchError` downstream of `switchMap`, so the
first 503 completed the outer observable and tore the refresh timer down permanently. Every user
who sat through a restore was silently logged out ~15 minutes later. The catch moved inside the
inner observable, so a failed tick is skipped and the timer survives.

### Backups that destroyed the thing they were protecting

`create_backup` pruned to `MAX_BACKUPS - 1` *before* writing the new backup. With `MAX_BACKUPS=2`,
a backup that then failed left one good backup where there had been two — and a second failure left
none. Pruning now happens after the new backup is written and its catalog row saved.

Every `shutil.rmtree` ran on the event loop. A large tree blocks long enough to starve the 30s job
heartbeat, and past 120s the staleness sweep marks a *live* job failed and releases the lock —
letting a second backup start on top of the running one, writing into the same directory. All
removals moved to `asyncio.to_thread`.

`_progress_window` was per-run state on a process-lifetime singleton: `restore_backup` set it to
`(5, 35)` and nothing ever reset it, so every later backup in that worker capped at 35%. It is now
a parameter threaded through `_perform_backup`.

### Restores that silently changed the data

Three fidelity gaps, all confirmed:

- **Elasticsearch lost every mapping and setting.** The dump stored only `_source` hits from a
  scroll; restore called `indices.create(index=name)` with no body, producing default dynamic
  mappings. Custom analyzers, normalizers, the 384-dim `dense_vector` embedding field,
  `max_result_window`, shard counts — all gone, and nothing at startup repairs an existing index.
  `_backup_elastic` now writes a `<index>.meta.json` sidecar with mappings and settings, and
  `_restore_elastic` passes them to `indices.create`. Settings that Elasticsearch refuses on create
  (`uuid`, `creation_date`, `provided_name`, `version`, `resize`, `routing`) are stripped.
- **ArangoDB edge collections came back as document collections.** `db.create_collection(name)`
  with no `edge=True` makes a document collection, so restoring `cti_edges` into an Arango that had
  lost it would break the CTI graph. The collection type is now recorded in a `.meta.json` sidecar
  and honoured on restore, including the case where an existing collection's type disagrees with
  the backup — that gets dropped and recreated rather than truncated.
- **A restore was not a restore.** Both `_restore_mongo` and `_restore_arango` drove their loop off
  the dump's files only, so any collection created after the backup was left fully populated: a
  point-in-time restore produced a mixed-epoch database. All three stores now enumerate what is
  live and drop whatever the backup does not contain.

`_validate_restore` only pinged connectivity — `list_collection_names`, `db.collections()`,
`conn.info()` — which passes cleanly against a database that was just wiped, making the rollback
trigger effectively unreachable. `_perform_backup` now writes a `manifest.json` with per-collection
document counts and a `completed` marker; restore refuses a manifest that says `completed: false`,
and validation compares post-restore counts against it. Backups predating the manifest still
restore, with a logged warning instead of count verification.

### Interrupted restores

If the process died inside `_run_restore_engine` the databases were left half-restored, no rollback
was attempted, and nothing recorded that it had happened — the next boot served traffic on an
inconsistent database. A `.restore_in_progress` marker is now written before the first datastore is
touched, naming the source backup and the rollback directory, and cleared only on the success or
rolled-back paths. `service_manager.init_services` calls `resolve_interrupted_restore()`, which
re-enables maintenance mode, logs CRITICAL with the exact `restore_backup.py <rollback>` recovery
command, and fails the job so the status endpoint surfaces it. Holding the site down is deliberate:
a partially restored database must not serve traffic. `start_backup` and `start_restore` refuse with
409 while the marker exists.

Two related leaks: `rollback_*` directories were outside all pruning and listing accounting and
accumulated forever, and nothing checked free space before writing a second full dump onto the same
volume. There is now an age-based rollback sweep and a `shutil.disk_usage` precondition that aborts
with 507 rather than filling the disk mid-restore.

Finally, restore never invalidated the Redis config cache, which has no TTL — so after a restore the
platform kept serving pre-restore system settings indefinitely. `_refresh_caches` reloads config
with `force_db=True` on both the success and rollback paths.

### Stealer logs are never backed up

`stealer_model` is excluded from the backup outright. It is the 150-shard bulk dump index and lives
on a different Elasticsearch host in production; scrolling it into an ndjson file is a large part of
why the server choked. `_is_excluded_index` gates both directions — and the restore side matters
just as much as the backup side, because the new "drop anything absent from the backup" logic would
otherwise have deleted the entire stealer index on the first restore.

### run.sh could leave production down permanently

`run.sh` has `set -e`. The dev and test paths pair `enable_maintenance_mode` with
`trap disable_maintenance_mode EXIT`; both production paths (`production` and `build -p`) set the
flag with no trap, so any failure between enabling and disabling left production hard-503 with no
automatic recovery. `wait_for_application_services` made it worse: an unbounded `until` loop that
hangs forever if the container never turns healthy, with the site down the whole time. Both
production paths now register the trap and clear it at their success points, and the health wait
takes a deadline (`APPLICATION_READY_TIMEOUT`, default 600s) and fails loudly.

### Not addressed

The quiesce only reaches the restoring worker's own tasks — the other three workers' in-flight
coroutines are stopped from *starting* new work by the middleware, but a coroutine already past its
last await keeps going. Making that airtight needs the write helpers themselves to re-check the
predicate (`upsert_alerts_bulk` and `set_scan_running` are the two confirmed unguarded ones), or a
generation token on every write. Mongo indexes are still not recreated after a restore beyond what
`ensure_indexes` rebuilds at boot, and Redis, the bloom-filter volume and GridFS remain outside the
backup entirely.

## Why `run.sh -docs` is slow, and what it is not (2026-08-31)

`npm test run` is fast; `./run.sh -docs` over the same specs is not. The screenshot machinery was the
obvious suspect and it is the wrong one. Measured, not assumed:

- `cy.screenshot()` costs ~300-400ms per call and leaves no residue on later commands. There are 100
  `docsScreenshot` calls in the whole suite, so screenshots account for roughly **40 seconds** across
  a run measured in hours.
- A direct A/B of one spec with and without `CYPRESS_takeScreenshots=true`, against the same warm
  stack, showed no meaningful difference in ordinary test execution.
- The evidence was in the run output all along: the test that *takes* a screenshot
  (`trial-subscription-banner`) finished in 2,020ms, while the three tests that take none cost
  198,842ms, 106,072ms and 90,962ms.
- Ruled out with evidence: `screenshotsFolder` (the only thing the flag changes in `cypress.config.ts`
  is one assignment), `retries` (hard-disabled at 0), `screenshotOnRunFailure` (identical in both
  modes), and `writeDocScreenshot`, which turns out to be dead code — nothing calls that task.

The real costs, largest first:

**`-docs` is not "the suite plus screenshots".** `run.sh:308-310` runs
`docker compose down -v --remove-orphans`, then a full `build -t`, then `restart_ng_serve`. `-v`
destroys every volume, so each docs run executes against an empty Mongo/Elasticsearch with cold
indexes and a cold dev server, while `npm test run` reuses whatever warm stack is already up. That
alone explains a large part of the gap, and it slows tests that take no screenshots — exactly the
reported symptom.

**`waitForStepStability` had no deadline.** `demo-tour.component.ts:2021` resolved only after 180ms
elapsed with no ResizeObserver/MutationObserver event on the step subtree. For enterprise tour steps
2-4 the observed element is `dashboard-consolidated`, which mutates continuously while search results
stream, so every mutation restarted the settle timer and the tour sat in `aria-busy` unbounded. It is
awaited twice per step. The same test was observed swinging 16.6s -> 94s with no code change, purely
because scan jobs from a killed earlier run were still churning the panel. Every sibling helper takes
a cap (`waitForStepTarget` 1500ms, `waitForSidebarRectStability` 700ms); this one now takes
`maxWaitMs = 2000` and clears the deadline in `finish()`.

**The tour runs real, cache-bypassing searches.** `demo_tour.json` sets `triggerSubmitOnNext` on step
1 and `triggerSubmitOnShow` on steps 3 and 4, so each pass issues `/api/search/consolidated/ioc`,
`/api/search/apt-intel` and `/api/urlscan/domain?force_new=true` — `force_new=true` defeats any
result cache. nginx logs show 55s of that traffic in one test, and `blocks background interaction`
pays for it twice because it repeats the set after `cy.reload()`.

**Tour transitions burn fixed timeouts.** Each step chains `waitForStepTarget` (1500/2500ms),
`waitForRenderedSelector` (1500ms), `waitForSidebarControl` / `waitForSidebarProjection` /
`waitForProfileMenuState` (1500ms each) plus `minimumLoadingMs` 350ms. `blocks background interaction`
performs 16 transitions; nginx logged **zero** requests across a 64-second window of that test, so
that minute is entirely client-side tour bookkeeping at ~6-9s per transition.

**`defaultCommandTimeout` is 60000**, 15x the Cypress default, and `requestTimeout`, `responseTimeout`,
`pageLoadTimeout`, `execTimeout` and `taskTimeout` match it. The slow tests land on near-exact
multiples of 60s, which is the signature of commands burning whole retry windows before eventually
succeeding. Lowering it does not make anything faster by itself; it converts silent 60s stalls into
fast, localised failures that name the offending command.

Left alone deliberately: dropping `-v` from the `-docs` teardown would warm the database between runs
but costs deterministic seeding for the screenshots, and lowering the timeouts will surface failures
that are currently being papered over. Both are judgement calls for the operator, not mechanical wins.

## DKIM Lookup (Entity Lookup)

New Entity-Lookup sub-tool that mirrors the Phone & Domain lookup exactly (an async-job micro,
polled by re-POSTing the same body so the deterministic `job_id` returns the cached job state).

- Enum: `ApiSubCategory.DKIM_LOOKUP = 'DKIM-Lookup'` in `client/src/app/shared/constants/pages.ts`.
  The sidebar builds every API item from `Object.values(ApiSubCategory)`, so `'DKIM-Lookup'` gives
  the route `api/dkim-lookup` (`item.toLowerCase()`) and the label "DKIM Lookup"
  (`replaceDashWithSpace`) with no translation entry — same as `Phone-Lookup`.
- Route + component: `app.routes.ts` `path: 'dkim-lookup'` →
  `client/src/app/sections/api/dkim-lookup/`.
- Backend proxy: `dkim_check_proxy` in `backend/routes/api_routes.py` (`POST /api/dkim/check`),
  a copy of `phone_universal_search_proxy` that forwards to `{TRUSTED_MICROS_API_BASE}/dkim/check/{user_id}`.
  Note the micro route has no `/api` prefix (unlike the phone micro's `/api/phone/universal_search`).

Flow (matches the two-mode DKIM micro in Orion-Micros `dkim_scan_manager`):
- Search a domain → the micro runs **discovery** (empty selector) and returns
  `result.selectors[]` (job `done`). The client then fires one **validation** job per selector and
  renders a card each — "result for each selector".
- If the archive has no selectors, the micro finishes as job `status:"error"`,
  `message:"No historical selectors found …"`. The client treats that as "not found" and shows the
  Selector-Required prompt so the user can add a selector manually and validate it.
- Validation `done` → `result{is_valid, raw_record, parsed_data, warnings, dns_query}`. A record that
  is present but invalid, or NXDOMAIN, comes back as job `status:"error"` with a `message`; the client
  shows that per-selector error. (Micro quirk: an invalid-but-present record loses its parsed data
  because the controller stores only the error `message`, not the `result`, on the error path.)

Client ships from the built folder — run `./run.sh build -p|-d` for this to appear in the app.

### DKIM Lookup — enrichment (max info + mxtoolbox-style checks + PDF)

Micro (`Orion-Micros` `dkim_scan_manager`) rewritten for maximum extraction:
- **Multi-string TXT fix (was corrupting 2048-bit keys).** Records are now reassembled with
  `"".join(rdata.strings)` instead of `to_text().strip('"')`, which spliced a literal `" "` into
  keys >255 chars — proven live on `fm1._domainkey.fastmail.com` (the key was 395 chars with
  `...M" "G...` inside, yet flagged Valid). Now clean 392-char 2048-bit key.
- **Key details:** RSA/Ed25519 key size derived via `cryptography.load_der_public_key(...).key_size`.
- **All tags** parsed with friendly labels (v/k/p/t/s/h/n/g + unknowns kept).
- **Archive fallback:** when live DNS has no record, the selector's last archived record
  (`archive.prove.email` `value` + first/last seen) is returned with `source:"archive"`.
- **mxtoolbox-style checks** (matches the reference the user pasted): per-selector `checks[]` =
  DKIM Record Published / DKIM Syntax Check / DKIM Public Key Check; domain-level `related[]` =
  DMARC Record Published / DMARC Policy Not Enabled / SPF Record Published. Full `dmarc`
  (policy, pct, rua, raw) and `spf` objects included. Each check is `{test, status: ok|warning|error, response}`.
- **Diagnostics no longer lost:** controller now always `progress.done(result)` (result carries its own
  status), so invalid-but-present records keep their parsed_data/warnings. `progress.error` only on exception.
- **Discovery** (`get_selectors_from_archive`) returns `{selectors, selectors_detail, dmarc, spf, related}`
  and probes ~27 common selectors concurrently when the archive has none. Deterministic (sorted).

Client (`sections/api/dkim-lookup`):
- Redesigned result section: a domain-level **Domain Security** panel (DMARC/SPF related checks +
  raw records) rendered once, and per-selector cards with the 3 DKIM checks (icon + response, mxtoolbox
  style), source chip (Live DNS / Archived), key chip (e.g. `RSA 2048-bit`), status badge
  (Valid/Invalid/Not Found), parsed tags, first/last seen, warnings, and raw record.
- **PDF export** via the shared `ReportExportService.exportByType(payload, 'doc_pdf')` +
  `ExportChoiceModalComponent` (same subsystem as `dashboard-api`; jspdf-based institutional doc,
  no DOM screenshot). Builds a `GraphReportPayload` (summary + one table per selector + a domain table).

Live wiring: the micro's extractor/controller are under the volume-mounted `app/orion`, so a
`docker restart trusted-micros-api` (no rebuild) picks them up. The client is served from the
volume-mounted `client/build`, so `npm run build` (or `./run.sh build -d`) + a browser hard-refresh
is enough — no docker image rebuild.

## main.ts router _NoMatch suppressor

Angular's route recognizer throws an internal `_NoMatch` while trying empty-path `redirectTo` routes (root `''`->dashboard, each section `''`->default) against deep lazy segments. On a hard reload / deep-link of a lazy route (e.g. `/dashboard/api/dkim-lookup`) this surfaces as an "Uncaught (in promise)" rejection even though the correct route still resolves. `main.ts` adds an `unhandledrejection` listener that `preventDefault()`s ONLY rejections whose stack contains `expandSegmentAgainstRouteUsingRedirect`; every other error still propagates.

## White-label docs (`/documentation`)

Self-hosted docs are white-labeled per tenant WITHOUT touching the Sphinx source. Non-default tenants link to `/documentation` (`documentationUrl` getter); the default tenant still uses external readthedocs. nginx (`= /documentation`, `= /documentation/`, `^~ /documentation/`) redirects to the landing page and proxies `/documentation/` to the app backend (`$app_backend`) — NOT to the `documentation` container. `routes/documentation_routes.py` (`GET /documentation/{path}`) resolves `request.state.tenant` -> `app_name` via `config_controller.get_cached(APP_NAME, tenant_id=...)`, fetches the page from the internal `http://documentation` container, and for `text/html` rewrites `Orion Intelligence` -> brand then bare `Orion` (`\bOrion\b`) -> brand; non-HTML streams through untouched. Default/canonical-brand tenants (brand in {"", "Orion", "Orion Intelligence"}) pass through unchanged. Because nginx no longer names the `documentation` upstream, a stopped docs container is a clean backend 502 instead of an nginx `[emerg] host not found in upstream` on `nginx -t`. main.py registers the router, so activating it needs a backend restart (not just uvicorn `--reload`, which only watches configs/orion/routes).

## Neutral ("Intelligence Platform") docs screenshots

Screenshots are neutralized at BUILD time (no runtime image work). `cy.docsScreenshot` (client/cypress/support/commands.ts) captures each shot twice in one pass: the real shot -> `<spec>/user-manual/`, then `applyNeutralBrand` (client/cypress/support/brand-neutralize.ts) mutates the live app DOM — swaps logo `<img>`s/background-image to a generic text-free icon mark (docs/_static/brand-neutral-mark.svg, inlined as a data-URI — icon-only because `<text>` in a data-URI SVG img renders unreliably during capture) and rewrites `Orion Intelligence`/`\bOrion\b` text -> `Intelligence Platform` — captures the branded shot -> `<spec>/user-manual-neutral/`, then `restoreNeutralBrand` reverts the DOM. `writeDocScreenshot` (cypress.config.ts) routes by `variant`. generate_docs.sh post-processes both sets: real -> docs/screenshots/, neutral -> docs/screenshots-neutral/. The self-hosted docs image (docs/Dockerfile, ORION_DOCS_PUBLIC=1) copies screenshots-neutral over screenshots before sphinx-build (guarded no-op if the dir is empty/absent), so the white-label `/documentation` shows the neutral mark while readthedocs/default keeps the real Orion shots. Neutral screenshots show a generic brand, NOT each tenant's name — raster pixels can't be per-tenant rebranded without runtime image editing. Verify by running the screenshot build (client dir): `bash ../docs/scripts/generate_docs.sh`.

Reliability hardening (kept one-pass, no second suite run): the neutral capture applies -> waits (repaint) -> RE-applies (catches Angular change-detection reverts) -> captures with a guaranteed restore (two-arg `.then` restores on success AND capture failure, so a failed shot never leaves the DOM neutralized for the next real shot). `applyNeutralBrand` is idempotent/accumulating and also covers `<img>` `srcset` and logo/brand `background-image`. Baked caption LABELS are neutralized too: `postprocess_screenshots.py` `_neutralize_brand` runs when `ORION_DOCS_NEUTRAL=1` (set only for the neutral pass in generate_docs.sh) — the label text is drawn by Pillow AFTER capture, so the browser neutralizer can't reach it. THREE places rewrite the brand and must stay in sync: `documentation_routes.py` (runtime proxy), `brand-neutralize.ts` (screenshot DOM), `postprocess_screenshots.py` (labels) — all use `Orion Intelligence` then `\bOrion\b` -> brand. Future-AI guidance lives in `docs/llm_rules.md` (excluded from the Sphinx build via conf.py).

Adversarial-audit hardening (8 confirmed findings fixed): (1) the runtime proxy only rewrites text/html, so non-HTML brand surfaces are neutralized at BUILD time in docs/Dockerfile — `searchindex.js` (sed Orion->Intelligence Platform), page sources removed (`html_copy_source=False`/`html_show_sourcelink=False` in conf.py), README-only `_static/readme-*.svg` deleted from /site. (2) `docs/screenshots-neutral/` is a REQUIRED committed artifact — the image build path (`build -d|-p`) does not run generate_docs.sh, so if it's missing the Dockerfile prints a loud WARNING and would ship real Orion shots; generate it and commit it. (3) `generate_docs.sh --clear` used to wipe the neutral raw captures before staging them — neutral collection now runs BEFORE the clear. (4) brand-neutralize.ts LOGO_SRC is scoped to `/api/s/static/system/` so user/tenant AVATARS aren't swapped to the mark. (5) screenshot + label neutralizers are case-INSENSITIVE (catch typed lowercase brand); the runtime proxy stays case-SENSITIVE on purpose (docs source is Title-case; case-insensitive would corrupt lowercase `orion-...` URLs in live HTML).

## Per-tenant backup and restore (2026-09-16)

Every backup now also writes a `tenants/<tenant_id>/` tree beside the existing whole-store folders, and a single tenant can be restored from it without touching any other tenant or any global data. Both halves are driven by one declarative registry so future models adapt on their own.

**Partition registry** (`backend/orion/api/interactive/backup_manager/tenant_partition.py`). It answers one question per collection: who owns a row? `Ownership.DIRECT` (row carries the tenant id), `TRANSITIVE` (row is owned through a user), `GLOBAL` (shared, never per-tenant), `PRESERVED` (backup bookkeeping). Rules are DERIVED from the odmantic models — it imports every module under `shared_model`, walks `Model.__subclasses__()`, and reads `model_fields`: a model declaring `tenant_id`/`tenant_uuid`/`auth_id` is DIRECT on that field, one declaring `user_id`/`user_uuid` is TRANSITIVE. So a model added next year is classified with no code change here. `EXPLICIT_RULES` overrides only where inference was proved wrong by the audit, and the fallback for anything unresolved is GLOBAL — an unknown collection is excluded from tenant folders and is never deleted by a tenant restore. Current split is 16 tenant-owned of 23 collections.

The four overrides that matter: `db_tenant_model` is keyed by its own `_id` (as an ObjectId), not a tenant field. `db_system_model` rows with a BLANK `tenant_id` are the global schema marker and must stay out of tenant folders. `takedown_requests` has `tenant_uuid` pinned to the ROOT tenant — the filing tenant is `requester_tenant_uuid` — and `target_domain` carries a UNIQUE index (`mongo_controller.py`), so it restores in MERGE mode keyed on `merge_key="target_domain"`. `social` is a raw collection with no odmantic model, owned transitively through `user_id`.

`tenant_query(rule, scope)` returns `None` rather than a broad filter whenever it cannot build a safe one (GLOBAL/PRESERVED rule, blank tenant id, empty user list, unparseable ObjectId). `None` means skip, never "match everything" — that is the whole fail-safe.

**Backup side is purely additive.** `_perform_backup` went from 5 to 6 steps; step 5 calls `_backup_tenants`, which wraps `_export_tenants` in a try/except that logs and records `{"error": ...}`. A bug in per-tenant export can therefore never fail a global backup. Per tenant it writes `tenants/<tid>/mongo/<coll>.ndjson` (filtered dumps), `tenants/<tid>/elastic/` (only `S_SIEM_INDEX` carries `tenant_id`; every other index and all of ArangoDB is global), and `tenants/<tid>/files/` (tenant branding dir, `IMAGE_DIR/<tid>.png`, per-user `session_data/<uid>` and `profile/<uid>.png`). The manifest gains a `tenants` block with a `layout` describing how every collection was classified at backup time. `BACKUP_MANIFEST_VERSION` is 2. Nothing reads the new folder on the whole-backup restore path — `_restore_mongo`/`_restore_arango`/`_restore_elastic` only look at their own store dirs and `_collect_sources` globs non-recursively — so old restores behave exactly as before.

**Restore side never uses the whole-store primitives.** `_restore_mongo` DROPS collections; a tenant restore must not go near it. `_restore_tenant_mongo` instead, per file in the tenant folder: re-asks the registry (a collection that became global since the backup is SKIPPED, which also means a hand-planted file in a tenant folder cannot smuggle global data in), builds `tenant_query`, `delete_many(query)`, then inserts. Before inserting a batch it looks up which `_id`s still exist — after the scoped delete, any survivor by definition belongs to someone else now (a document that changed tenants), so it is skipped and logged rather than overwritten. That is what keeps the blast radius at exactly one tenant. MERGE collections are never deleted: each row is upserted by `_id`, and a row whose `merge_key` value is already claimed by a different `_id` is skipped — without that, reinserting a takedown whose domain another tenant has since filed would hit the unique index and abort the restore.

Elastic per-tenant restore is `delete_by_query` on `{"term": {"tenant_id": ...}}` then bulk index; it NEVER creates or deletes the index, so global mappings and every other tenant's documents survive. Files are restored only at tenant/user-specific paths, never at a parent dir.

The restore scope is the UNION of the tenant's live user ids and the user ids found in the backup's `db_user_account.ndjson`. Live-only covers users deleted since the backup (their rows would be orphaned); backup-only covers users deleted since (their rows would never be reinserted).

A tenant restore does NOT enter global maintenance mode and does NOT write `.restore_in_progress` — both would take the whole platform down for one tenant's operation. It takes the same `BackupJobStore` lock (so it cannot race a backup or a full restore), exports the live tenant to `rollback_tenant_<tid>_<ts>/` first, and writes `.restore_tenant_in_progress`. On any failure it replays that rollback through the same engine and re-validates. `resolve_interrupted_tenant_restore` (called from `service_manager.py` next to the global one) logs CRITICAL and fails the job but deliberately does NOT force maintenance mode, because only one tenant is affected.

`_validate_tenant_restore` only checks that the tenant document exists — it must NOT compare counts the way `_validate_restore` does, because conflict skips and merge skips make exact equality a false failure that would trigger a pointless rollback.

**Routes.** `GET /api/admin/backups/{backup_id}/tenants` and `POST /api/admin/backups/{backup_id}/tenants/{tenant_id}/restore`, both behind a new `root_admin_required` dependency (admin AND `db_tenant_model.is_default`). The plain `ADMIN` role is per-tenant, so without the root check any tenant admin could restore another tenant's data.

Tests: `backend/tests/scripts/backup_manager/test_tenant_backup.py` (19) — registry classification, fail-safe `tenant_query`, auto-adaptation of a new model, per-tenant export isolation, cross-tenant non-interference on restore, global collections untouched, the smuggled-file guard, moved-document skip, merge semantics, unique-key clash skip, scope union, and rollback on validation failure. They need the query-aware `_FakeTenantCollection`/`_FakeTenantEngine` in `fakes.py`; the older fakes ignore query filters, which would make every isolation assertion pass vacuously.

## Tenant id field name unification (2026-09-16)

Every persisted tenant identifier is now spelled `tenant_id`. Before this, the same 24-hex string went under four names: `tenant_id` (`alert_connectors`, `db_alert_model`, `db_audit_log`, `db_system_model`), `tenant_uuid` (`db_user_account`, `cases`, `chat_shares`, `takedown_requests`), `requester_tenant_uuid` (`takedown_requests`) and `auth_id` (`db_keys`). Elasticsearch already used `tenant_id`, so the target name was the one that needed no data change on the ES side.

`takedown_requests` could not be renamed mechanically, because its two tenant fields mean different things. `tenant_uuid` there was always the ROOT tenant that operates the takedown queue, never the owner, and `requester_tenant_uuid` was the tenant that actually filed. The rename therefore FLIPS them: `tenant_uuid` -> `operator_tenant_id`, `requester_tenant_uuid` -> `tenant_id`. After this, `tenant_id` means "the owning tenant" on every collection without exception, which is the property the whole partition registry depends on.

Consequence for `tenant_partition.py`: `TENANT_FIELD_CANDIDATES` collapsed from `("tenant_id", "tenant_uuid", "auth_id")` to `("tenant_id",)`, and `db_keys` plus `takedown_requests` now classify by inference rather than by a hand-written override. The registry still reports the same 16 tenant-owned collections out of 23, verified before and after. `takedown_requests` keeps its explicit rule only for `RestoreMode.MERGE` + `merge_key="target_domain"`, which is about the unique index, not about field naming.

`migrations/scripts/migration_1_0_3_17.py` does the data half, `pyproject.toml` `migration_version` bumped to `1.0.3.17`. It runs in three phases. First it drops `unique_maintainer_per_company` on `db_user_account` — that index is created by name in `mongo_controller.py` against the tenant field, so leaving the old one in place would make the app's `create_index` fail with a key-spec conflict on the next boot. `Field(index=True)` indexes do NOT need dropping because `configure_database()` is never called, so odmantic never created them. Second it `$rename`s the fields, but only after asserting no document carries both the old and the new name — a half-migrated collection aborts the migration instead of silently losing one of the two values. Third it verifies: it counts documents still holding any legacy field name and raises if any remain, then logs a present/total count per new field so a partially populated collection is visible in the migration log rather than discovered later.

The code half is a mechanical rename of ~375 `tenant_uuid` occurrences plus 13 `auth_id` across backend and client. `\btenant_uuid\b` is safe to use for this because `_` is a word character, so it does not match inside `requester_tenant_uuid`, `root_tenant_uuid` or `alerts_allowed_tenant_ids` — those were renamed separately and deliberately. Local variables and the `_root_tenant_id` helper in `takedown_manager.py` were renamed for consistency but carry no data.

Watch out on deploy: the share-link JWT claims in `chat_share_manager.py` and `case_share_manager.py` are now written as `tenant_id`. Links issued before the rename carry `tenant_uuid` and will not resolve. If that matters, add a read-side fallback before deploying; nothing else in the system reads a persisted copy of the old names.

### Why the first deploy of the rename crashed, and the rule it establishes

Boot failed with `Migration failed: 'NoneType' object has no attribute 'wrapped_key'` at `migration_1_0_3_15.py:81`. Cause: the mechanical rename also rewrote HISTORICAL migration scripts. `migration_1_0_3_15` queried `db_keys.auth_id`; the rename turned that into `db_keys.tenant_id`, but that migration runs against a database that is still at pre-1.0.3.17 schema, where the field is genuinely still `auth_id`. It matched nothing, returned None, and the unguarded `.wrapped_key` blew up.

Rule: a historical migration is an immutable record of how the schema looked at that version. It must never be rewritten to match current model classes. The catch specific to odmantic is that you cannot simply restore `db_keys.auth_id` either, because the model attribute no longer exists and that raises AttributeError. Old migrations therefore have to stop going through the model entirely and use raw collection queries. `migration_1_0_3_15._find_tenant_key` now does `get_collection(db_keys).find_one({"$or": [{"tenant_id": ...}, {"auth_id": ...}]})`, which is correct both for a legacy database (old name still present) and for a fresh one seeded after the rename (new name). The `.wrapped_key` dereference is also None-guarded now, which was a latent crash even before the rename for any tenant lacking a key row.

Second trap, test mode only: `reset_test_mongo_and_import_mocks` (`test_manager.py:65`) DROPS every collection and re-imports `backend/tests/mock/mongo/*.json` on every boot, BEFORE migrations run. Those fixtures still carried `auth_id` and `tenant_uuid`, so each boot re-seeded legacy data and also wiped the stored version, replaying the whole migration chain. The fixtures are now on the new names (`db_keys.json` 12 keys, `db_user_account.json` 16 keys). Anything that seeds Mongo directly has to be renamed alongside the models, not just application code.

Startup order is on our side and worth remembering: `link_connection` -> import mocks -> migrations -> `ensure_indexes` -> `initialize` (`service_manager.py:45-53`). Because `ensure_indexes` runs AFTER migrations, `migration_1_0_3_17` can drop `unique_maintainer_per_company` and rename the field, and the app then recreates that index against `tenant_id` in the same boot. Reversing that order would deadlock on an index key-spec conflict.

## Takedowns are per tenant, not global (2026-09-16)

`takedown_requests` used to enforce ONE row per domain across the whole platform, via `create_index("target_domain", unique=True)`. The consequence was silent ownership theft: `create_takedown` looked the domain up with no tenant filter, and if the existing row had no `abuse_email` it overwrote that row's requester, `report_id`, `evidence` and status with the new caller's. Tenant A's report simply became tenant B's, with no audit trail and nothing in the UI to indicate it.

Uniqueness is now `(tenant_id, target_domain)` under the name `unique_takedown_per_tenant`, so each tenant keeps its own row for the same domain and the overwrite path can no longer reach across tenants. The three lookups that drove the flip are tenant scoped: the pre-check and the `DuplicateKeyError` recovery in `create_takedown`, and `enrich_report`. `enrich_report` had no tenant at all — it now takes one and `routes/api_routes.py` passes `current_user.tenant_id`, which also closes a smaller leak where one tenant could see another tenant's takedown status on a defacement report.

This removes the only reason `RestoreMode.MERGE` existed. MERGE was there because a REPLACE restore deletes with `{tenant_id: A}`, which cannot remove a row that now belongs to B, and reinserting A's backed-up copy then collided with B's live row on the global unique index. With uniqueness scoped per tenant the collision is impossible, so `takedown_requests` lost its explicit rule entirely and is now plain inferred `DIRECT` on `tenant_id` with `REPLACE`. Keeping MERGE would have been actively wrong now: its `merge_key` probe is not tenant scoped, so it would have skipped a row purely because a DIFFERENT tenant held that domain. The `RestoreMode` enum and `merge_key` field stay in place for a future collection with a genuinely global uniqueness constraint; nothing uses them today.

`migrations/scripts/migration_1_0_3_18.py` drops the legacy `target_domain_1` index, and `migration_version` is `1.0.3.18`. Dropping it is required, not cosmetic: `ensure_indexes` would otherwise leave the old global unique index in place alongside the new compound one and keep rejecting a second tenant's row. The verifier refuses to pass if any unique index still keys on `target_domain` alone, and separately aggregates for duplicate `(tenant_id, target_domain)` pairs, because those would make the new compound index impossible to build. Both guards were exercised against a stub before shipping.

## Backup cleanup after the tenant id unification (2026-09-16)

Two changes made parts of the backup code provably dead, and they are now gone.

`RestoreMode`, `PartitionRule.merge_key`, the MERGE branch in `_restore_tenant_mongo` and `_merge_tenant_documents` were deleted. They existed for exactly one collection, `takedown_requests`, and only because its `target_domain` unique index was global. Scoping that index to `(tenant_id, target_domain)` removed the cross-tenant collision that MERGE was working around, so no collection selects MERGE any more. Leaving the machinery in place would have been worse than dead: its `merge_key` probe was not tenant scoped, so it would have skipped restoring a tenant's row purely because a different tenant held that domain. `describe()` no longer emits `restore_mode`/`merge_key`, so the manifest `layout` block is correspondingly smaller.

`EXPLICIT_RULES` went from 8 entries to 3. Each removed entry was verified redundant by deleting it and re-resolving the collection: `db_system_model` (inference already yields DIRECT on `tenant_id`) and the four global corpora `db_feeder_script_model`, `db_url_data_model`, `persona_posts`, `scheduler_runs` (no tenant or user field, so the GLOBAL fallback already applies). The registry still classifies 16 of 23 collections as tenant owned, unchanged.

Three entries stay, and none is redundant. `db_tenant_model` is REQUIRED — without it the tenant document falls to GLOBAL, because identity lives in `_id` rather than a tenant field. `social` is REQUIRED — it is a raw collection with no odmantic model, so there are no fields to infer from and it would fall to GLOBAL, silently dropping every tenant's captured profiles from their backup. `db_document_feedback_model` is technically redundant today but is kept deliberately: the row is genuinely shared across tenants while its embedded comments are encrypted per tenant, so if that model ever gains a `tenant_id` field inference would flip it to DIRECT and a tenant restore would start deleting other tenants' feedback. That pin is the one place where "redundant" and "safe to delete" differ.

Rule going forward: an explicit rule is justified only when inference is WRONG, never to restate what inference already produces.

### tenant_partition split to match the manager layout

`tenant_partition.py` was a single 184-line module holding constants, models, free functions and the registry. It now follows the same layout as the other interactive managers (`<manager>/models/*.py`, `<manager>/constants/constant.py`):

- `backup_manager/models/tenant_partition_model.py` — `Ownership`, `PartitionRule`, `TenantScope`. These are plain dataclasses/enums, not odmantic documents, which is why they live in the manager's local `models` folder rather than `shared_model`.
- `backup_manager/constants/constant.py` — `TENANT_FIELD_CANDIDATES`, `USER_FIELD_CANDIDATES`, `SHARED_MODEL_PACKAGE`, `GLOBAL_RULE`, `PRESERVED_RULE`, `EXPLICIT_RULES`. `PRESERVED_RULE` is new only in the sense that the rule used to be constructed inline inside `rule_for` on every miss; it is now a module constant alongside `GLOBAL_RULE`, which is where the other fallback already lived.
- `backup_manager/tenant_partition.py` — just `TenantPartitionRegistry`. The two module-level helpers `_discover_model_fields` and `_infer_rule` became static methods, and `tenant_query` became a static method too, since it only ever operates on a `PartitionRule` plus a `TenantScope` and belongs with the class that produces the rules.

Call sites moved from `tenant_query(rule, scope)` to `TenantPartitionRegistry.tenant_query(rule, scope)` in `backup_manager.py` (2 sites) and the tests. Behaviour is unchanged and verified after the move: still 16 tenant-owned of 23, takedown still DIRECT on `tenant_id`, preserved collections still PRESERVED.

### Tenant and global backup split

`backup_manager.py` had grown to 1213 lines holding both the whole-store backup/restore and the per-tenant one. The per-tenant half now lives in `backup_manager/tenant_backup_manager.py` as `TenantBackupManager` (24 methods, 448 lines), leaving `backup_manager.py` at 815.

The split is by ownership of the operation, not by convenience: everything that reasons about a single tenant moved (`backup_tenants`, `_export_tenants`/`_export_tenant`, `_backup_tenant_elastic`/`_backup_tenant_files`/`_tenant_file_pairs`, `_tenant_scope`/`_tenant_restore_scope`, `_run_tenant_restore_engine`, `_restore_tenant_mongo`/`_insert_tenant_batch`/`_restore_tenant_elastic`/`_restore_tenant_files`, `_validate_tenant_restore`, plus the `list_backup_tenants`/`restore_tenant`/`start_tenant_restore`/`resolve_interrupted_tenant_restore` entry points and the `tenant_restore_marker`). Everything that is store-wide stayed: `_backup_mongo`/`_backup_arango`/`_backup_elastic`, `_restore_mongo`/`_restore_arango`/`_restore_elastic`, `restore_backup`, rollback sweeping, disk checks, pruning.

`TenantBackupManager` holds the owning `BackupManager` as `_owner` and reuses its IO primitives (`_dump_collection`, `_read_documents`, `_collect_sources`, `_read_hits`/`_write_hits`, `_is_excluded_index`, `_remove_tree`, `_load_backup_by_id`, `_set_progress`, `_job_store`, `_partition_registry`, `_refresh_caches`). Composition rather than duplication, because those primitives are genuinely shared and forking them would let the two paths drift. `BackupManager` reaches it through a lazy `_tenant` property in the same style as its existing `_engine`/`_job_store` properties, and keeps four thin delegating methods so the routes, `service_manager` and `_perform_backup` call sites did not change. The dependency is one way: `tenant_backup_manager.py` never imports `backup_manager.py`, so there is no import cycle.

Tests reach the internals through `manager._tenant.<method>`; only the public surface stayed on the manager itself.

### backup_manager split into task helpers, and the orphaned-directory leak

`backup_manager.py` was 816 lines doing five unrelated jobs. It is now 479, with two more helpers alongside `TenantBackupManager`, each owning one task and each reached through a lazy property in the same style as `_engine`/`_job_store`:

- `backup_store_io.py` / `BackupStoreIO` (~310 lines) — the "move bytes" layer: ndjson/json serialization, `dump_collection`, and the per-store `backup_*`/`restore_*` pairs for Mongo, ArangoDB, Elasticsearch and folders, plus `read_json_file`/`write_json_file`. Reached as `self._io`.
- `backup_retention.py` / `BackupRetention` (~82 lines) — housekeeping: `prune_old_backups`, `sweep_stale_rollbacks`, `require_free_space`, `directory_size`, and the new `sweep_orphaned_backups`. Reached as `self._retention`.
- `backup_manager.py` keeps only orchestration: the singleton, job start/finish and heartbeat wiring, the backup lifecycle (`create_backup`, `_perform_backup`, manifest, records), restore orchestration (quiesce, rollback point, validate, maintenance flag), and delegation to the three helpers.

All three helpers take the owning manager as `_owner` and call back for shared state rather than duplicating it. One attempt was made to pass `self._engine.database` in at the call site instead; that was reverted because it evaluates eagerly and broke tests that stub `backup_mongo` with an engine that has no `database`. Laziness matters here — the engine may not exist when the method is merely referenced.

`sweep_orphaned_backups` closes a real leak. On a hard crash or container restart mid-backup the job row self-heals (the heartbeat goes stale after `BACKUP_JOB_STALE_SECONDS` and `_expire_stale` marks it FAILED, so the lock is not held forever), and the partial backup is not restorable (no manifest, or `completed: false` -> 422). But the DIRECTORY leaked permanently: `_remove_tree` never ran, no `db_backup_model` record was ever saved, `prune_old_backups` only deletes directories that HAVE a record, and `sweep_stale_rollbacks` only matches the `rollback_` prefix. The new sweep runs alongside it in `create_backup` and removes only directories that are all of: not recorded in `db_backup_model`, not a rollback directory, lacking a manifest with `completed: true`, and older than `RESTORE_ROLLBACK_MAX_AGE_HOURS`. Verified against a fixture covering all six cases: crashed-without-manifest and incomplete-manifest are removed; completed-but-unrecorded, recorded, rollback directories and recent crashes are kept. The age cutoff is what stops it deleting a backup that is still being written by a live run.

## Tenant-facing Backup & Restore section (2026-09-16)

The tenant section reuses the SAME `BackupRestoreComponent` as admin rather than a mirrored copy, driven by one input: `@Input() scope: 'admin' | 'tenant'`. All five endpoint calls go through a `basePath` getter (`admin/backups` vs `tenant/backups`), and the template gates on `isTenantScope` — a tenant sees the list, the progress bar and Restore, but not Instant Backup or Delete, because a tenant neither creates nor deletes system backups. Restore wording differs too: admin warns about maintenance mode, tenant says only their own data is replaced.

There is ONE route (`profile/backup-restore`) and ONE sidebar entry (`ProfileSubCategory.BACKUP_RESTORE`) for both audiences; scope is derived in `ngOnInit` from `licenseService.isAdmin()`, with an optional route-data override (`data: { scope }`) and the `@Input()` for direct embedding. `withComponentInputBinding()` was deliberately NOT enabled on the router: it would auto-bind route params to inputs across every component in the app, far too broad for one flag.

The role model here is the thing to get right, and the first attempt got it wrong. `user_role.ADMIN` is a SINGLE superuser for the whole platform, enforced by the unique partial index `unique_admin_role` on `role: admin` (`mongo_controller.py:59-63`). A tenant's own administrator is a MEMBER with the `maintainer` licence — that is exactly what the sidebar's `isMember() && licenses.includes('maintainer')` branch describes. Gating the tenant routes on `role_required([ADMIN])` therefore 403'd the very users the feature is for. They now use `role_required([MEMBER, ADMIN])` + `license_required("maintainer")`, matching `/api/update/tenants`. The same fact makes the pre-existing `admin/backups` routes safe: `role_required([ADMIN])` there means the single superuser, not "any tenant admin". The sidebar previously excluded `BACKUP_RESTORE` from the member+maintainer branch; that exclusion is removed.

Three new routes in `tenant_routes.py`:
`GET /api/tenant/backups`, `GET /api/tenant/backups/status`, `POST /api/tenant/backups/{backup_id}/restore`.

The security property that matters: the tenant id is ALWAYS taken from `current_user.tenant_id` and never from a path parameter, so a tenant admin cannot name another tenant. That is the difference from the admin routes, which do accept `{tenant_id}` in the URL and are therefore gated behind `root_admin_required`. Both sets funnel into the same `start_tenant_restore`, so there is one restore implementation.

`list_backups_for_tenant` walks the `db_backup_model` records newest first and keeps only those whose `tenants/<tenant_id>/mongo` folder exists, so a tenant only sees backups that actually contain them, annotated with their own document/file/user counts pulled from the manifest.

Note on the lint rule: `local/class-field-group-spacing` (client `eslint.config.js:368`) enforces field order private -> protected -> plain -> `@Input` -> `@Output`, contiguous, blank line between groups. Putting `@Input() scope` at the top of the class fails it; it belongs after the plain fields.

### Download backup as zip

A Download button sits next to Restore on every backup row, in both the desktop table and the mobile card, for both scopes. It reuses the same component, so the only difference is what the endpoint hands back.

What each scope downloads is the important part. Admin gets `GET /api/admin/backups/{id}/download`, the whole backup directory. A tenant gets `GET /api/tenant/backups/{id}/download`, which zips ONLY `tenants/<tenant_id>/` — never the backup root, so the archive cannot contain another tenant's data or the global stores. As with the other tenant routes the id comes from `current_user.tenant_id` and never from the URL, and `resolve_download` 404s if that tenant is not present in the chosen backup.

`BackupStoreIO.iter_zip` streams rather than materialising the archive. A backup here is ~1.5GB across folders, so both buffering the zip in memory and writing a temp copy to disk (which would double usage on the same volume the backups live on) were rejected. It writes into a small `_ZipBuffer` that is drained and yielded after every 1MB source chunk, so peak memory is roughly one chunk plus deflate state regardless of backup size, and `StreamingResponse` sends it as it is produced. Verified end to end: valid zip, arrives in multiple chunks, entries rooted under the archive name.

`compresslevel=1` is deliberate — ndjson dumps compress extremely well (90000 bytes to 479 in the fixture) so the cheapest deflate level already gets almost all the benefit, and the endpoint stays CPU-light while streaming.

Client side, `ApiService.get` is typed for JSON and has no `responseType: 'blob'` overload, so the download injects `HttpClient` directly, matching what `case-details.ts` already does for artifact files. Changing the shared `ApiService` signature for one call site was not worth the blast radius.

## Export view manager (single HTML, your design)

Every export carries `index.html` at its root. The design is NOT authored in Python: the page lives as a real asset, `backup_manager/backup_report.html`, and `backup_report.py` is 18 lines that read it and substitute one placeholder. That split exists because the template had been a Python triple-quoted string, and a `\n` inside the JS (`split('\n')`) was silently consumed by Python's own escaping, emitting a literal newline inside a JS string literal and breaking the page with `Invalid or unexpected token`. As an asset file there is no escaping layer at all, and the design can be edited directly in a browser or editor without touching Python.

The current template is the design handed back from `~/Downloads/2026_09_16_17_39_54/index.html`, adopted verbatim: warm dark palette (`--bg:#151513`, `--panel:#1d1d1a`, amber `--accent:#e7b96a`), topbar with brand mark, a summary panel with a distribution stack and legend, a four-card grid, underlined tab nav, and plain-language labels (`mongo` -> "Account details", `arango` -> "Connections", `elastic` -> "Findings", `tenants` -> "Organizations", collection names mapped through `FRIENDLY_NAMES`/`displayName`, tenant ids shown as "Organization . XXXXXX"). Verified byte-identical after adoption: CSS 8,505 bytes and JS 24,726 bytes both compare equal to the source, with only the embedded data block differing.

Keep future changes in the HTML asset. The Python side owes it exactly one thing: replace `__DATA__` with the manifest JSON, escaping `</` as `<\/` so a value containing `</script>` cannot terminate the block.

The manifest is embedded at write time, which is what makes `file://` work with no server, no picker and no upload step: browsers block `fetch` and XHR against sibling files there, so a page that discovered everything at runtime could never read its own folder. With the data inline, the summary, per-store tables, tenant breakdown and partition layout all render immediately. A background `fetch('manifest.json')` probe still runs; when the folder happens to be served over http the page upgrades itself and record-level browsing becomes available, rebuilding the subtitle through `setSubtitle()`.

Written at three points, all passing the manifest: `_perform_backup` (whole backup), `_export_tenant` (per tenant, given a tenant-shaped manifest), and both download resolvers. The resolvers matter because they are what puts a viewer beside `manifest.json` in an export taken from a backup created before this feature existed; writing only at backup time would have left every existing backup without one. The write is idempotent, so a download also refreshes the on-disk copy to the current design.

Verified by serving a folder containing ONLY `index.html` (a faithful stand-in for `file://`, which Cypress cannot visit): renders standalone with no picker, body `rgb(21,21,19)` on `rgb(238,238,229)`, cards reading "Types of information 3 / Categories 37 / Organizations 6 / Listed files 140", summary "Saved items 360,283", tabs Overview / Account details / Connections / Findings / Organizations / Files (140), and "Activity history" (db_audit_log) at 15,764 documents and 56.4% share.

### Download backup as zip

A Download button sits next to Restore on every backup row, in both the desktop table and the mobile card, for both scopes. It reuses the same component, so the only difference is what the endpoint hands back.

What each scope downloads is the important part. Admin gets `GET /api/admin/backups/{id}/download`, the whole backup directory. A tenant gets `GET /api/tenant/backups/{id}/download`, which zips ONLY `tenants/<tenant_id>/` — never the backup root, so the archive cannot contain another tenant's data or the global stores. As with the other tenant routes the id comes from `current_user.tenant_id` and never from the URL, and `resolve_download` 404s if that tenant is not present in the chosen backup.

`BackupStoreIO.iter_zip` streams rather than materialising the archive. A backup here is ~1.5GB across folders, so both buffering the zip in memory and writing a temp copy to disk (which would double usage on the same volume the backups live on) were rejected. It writes into a small `_ZipBuffer` that is drained and yielded after every 1MB source chunk, so peak memory is roughly one chunk plus deflate state regardless of backup size, and `StreamingResponse` sends it as it is produced. Verified end to end: valid zip, arrives in multiple chunks, entries rooted under the archive name.

`compresslevel=1` is deliberate — ndjson dumps compress extremely well (90000 bytes to 479 in the fixture) so the cheapest deflate level already gets almost all the benefit, and the endpoint stays CPU-light while streaming.

Client side, `ApiService.get` is typed for JSON and has no `responseType: 'blob'` overload, so the download injects `HttpClient` directly, matching what `case-details.ts` already does for artifact files. Changing the shared `ApiService` signature for one call site was not worth the blast radius.

## Export view manager (single self-discovering HTML)

Every export carries one file at its root, `index.html`, written by `backup_manager/backup_report.py`. It is a STATIC template with no data baked in: `BackupReport.write(path)` drops the same HTML into the backup root (from `_perform_backup`) and into each `tenants/<tenant_id>/` (from `_export_tenant`). Nothing is generated per backup, so there is no payload builder to keep in sync with the manifest.

Both download resolvers also call `BackupReport.write` before zipping. That is what makes it appear beside `manifest.json` in an export taken from a backup created BEFORE this feature existed — writing at backup time alone would have left every existing backup without a viewer. The write is idempotent and ~26KB, so it costs nothing and has the side effect of refreshing the on-disk copy to the current template whenever a backup is downloaded.

The manifest is EMBEDDED in the page at write time, so opening `index.html` straight from the unzipped folder renders the whole summary immediately with no server, no picker and no interaction. This is the only way to make `file://` work: browsers block `fetch` (and XHR) against sibling files there, so a page that discovers everything at runtime cannot read its own folder. Embedding the manifest, which is the source of every count and the partition layout anyway, removes the upload step entirely.

Three modes, in order of preference, resolved automatically:
- `embedded` - the default on `file://`. All stores, counts, tenant tables and the partition layout render from the embedded manifest. Opening a collection explains that record-level browsing needs the real file and offers the folder picker.
- `fetch` - if a probe for `manifest.json` succeeds (the folder is served over http, or the app serves it), the page upgrades itself and record browsing becomes available. The upgrade rebuilds the subtitle through `setSubtitle()` rather than patching the old string.
- `local` - the `webkitdirectory` picker and drop zone remain as an opt-in, walking nested directories via `webkitGetAsEntry`. It is no longer an entry requirement, only the way to browse records offline.

Nothing is uploaded in any mode.

If the manifest is missing entirely it still works: `inferredStores()` rebuilds the store list from the filenames it can see, so a partially copied or hand-assembled export still browses.

In depth means statistics, not just counts. Tabs are Overview / MongoDB / ArangoDB / Elasticsearch / Tenants / Files. Store tables carry a proportion bar per collection, a share percentage, size, and the partition `layout` joined in (ownership, field, inferred-vs-explicit), with a chip row summarising collections / documents / largest / empty. Overview adds a per-store summary plus a tenant share table showing what proportion of tenant-owned documents each tenant holds.

Clicking any collection, index or file opens a drill-down with two views. FIELD STATISTICS derives, from the parsed records, per field: coverage percentage with a bar, present and empty counts, distinct-value count, a type breakdown with percentages (including `objectId` and `date` recognised from their `$oid`/`$date` wrappers), min/max for numerics, and the five most common values. RECORDS is a paged browser, 100 per page, each record expandable to pretty-printed JSON, with the filter box scoped to the open file rather than the table behind it.

Reads cap at 4MB per file and the chip row states the real file size alongside how much was read, so the numbers are never silently partial. Truncating mid-file cuts a record in half, so the final incomplete line is dropped before parsing; without that it showed up as a bogus one-off field with 0% coverage.

Sizing deliberately avoids `HEAD` requests. An earlier attempt measured every file with `HEAD` + `content-length`; Node's fetch returned the header but Chromium did not expose it, so all 140 files measured as zero. Sizes now come only from sources that cannot lie: `File.size` when the folder was picked locally, and the actual byte length of a file once it has been opened in fetch mode.

Verified against the real 1.5GB backup by serving it over http and driving the page with Cypress: auto-detected with no picker; 24 Mongo collections / 27,946 docs, 32,072 Arango, 300,265 Elastic, 6 tenants, 16/24 tenant-owned, 140 files; top tenant holding 99.7% of tenant-owned documents; `db_audit_log` at 56.4% share; its drill-down reporting 12,823 records parsed from a 4.8MB file at 327B average, and field statistics showing `_id` 100% coverage / 12,823 unique / objectId 100%, `event` 337 distinct values, `ts` date 100%, paged 129 pages at 100 per page.

### Download backup as zip

A Download button sits next to Restore on every backup row, in both the desktop table and the mobile card, for both scopes. It reuses the same component, so the only difference is what the endpoint hands back.

What each scope downloads is the important part. Admin gets `GET /api/admin/backups/{id}/download`, the whole backup directory. A tenant gets `GET /api/tenant/backups/{id}/download`, which zips ONLY `tenants/<tenant_id>/` — never the backup root, so the archive cannot contain another tenant's data or the global stores. As with the other tenant routes the id comes from `current_user.tenant_id` and never from the URL, and `resolve_download` 404s if that tenant is not present in the chosen backup.

`BackupStoreIO.iter_zip` streams rather than materialising the archive. A backup here is ~1.5GB across folders, so both buffering the zip in memory and writing a temp copy to disk (which would double usage on the same volume the backups live on) were rejected. It writes into a small `_ZipBuffer` that is drained and yielded after every 1MB source chunk, so peak memory is roughly one chunk plus deflate state regardless of backup size, and `StreamingResponse` sends it as it is produced. Verified end to end: valid zip, arrives in multiple chunks, entries rooted under the archive name.

`compresslevel=1` is deliberate — ndjson dumps compress extremely well (90000 bytes to 479 in the fixture) so the cheapest deflate level already gets almost all the benefit, and the endpoint stays CPU-light while streaming.

Client side, `ApiService.get` is typed for JSON and has no `responseType: 'blob'` overload, so the download injects `HttpClient` directly, matching what `case-details.ts` already does for artifact files. Changing the shared `ApiService` signature for one call site was not worth the blast radius.

## Export view manager (single-file HTML summary)

Every export now carries `index.html` at its root, written by `backup_manager/backup_report.py` (`BackupReport`). It is one self-contained file: all CSS and JS inline, the data embedded as a JSON `<script type="application/json">` block, no network requests and no external assets, so it opens over `file://` straight out of the unzipped folder.

It is generated at DOWNLOAD time and injected into the zip as the first entry, not served from disk. That way every export carries an up-to-date summary including backups created before this feature existed (the five already on disk have no `index.html` and still download with one). `iter_zip` takes an optional `extra` map, writes those entries first, and skips any on-disk file whose archive path collides — so a stale `index.html` sitting in a backup folder can never shadow the freshly generated one, and the zip never contains a duplicate entry.

A copy is also written to disk at backup time, so the folder is self-describing when browsed directly:
- the whole-backup summary, written by `_perform_backup` immediately after `manifest.json` (so it reflects the final, completed manifest);
- a per-tenant summary, written by `_export_tenant` into `tenants/<tenant_id>/`, which is what ends up at the root of a tenant download.

This matters for the tenant download in particular: because the zip is rooted at the tenant folder, the tenant gets a summary of THEIR slice only, and its totals are computed from that tenant's own counts, never from the global manifest.

What it shows: totals cards (documents per store, collection counts, tenant count, and how many collections are tenant-owned out of the total), then a sortable table per store. The MongoDB table joins each collection against the partition `layout` captured in the manifest, so ownership (`direct`/`transitive`/`global`/`preserved`), the field used and whether the rule was inferred or explicit are visible per collection — which is the fastest way to audit, from an export alone, exactly what a tenant restore would and would not touch. The Tenants section expands per tenant into users/documents/files/elastic plus a per-collection breakdown.

Interactive without a framework: click any column header to sort (numeric-aware), a filter box that matches across every table and tenant row, a "Hide empty" toggle that dims/hides zero-count rows, collapse-all, and a dark/light toggle.

Embedding detail worth keeping: the JSON is escaped with `</` -> `<\/` before being written into the script tag, otherwise a string containing `</script>` inside the data would terminate the block and break the page. Verified against the real 1.5GB backup manifest: 24 Mongo collections / 27,946 docs, 32,072 Arango, 300,265 Elastic, 6 tenants, 16/24 tenant-owned; the JSON parses back cleanly and the file contains no external URLs.

## Docs rendered light in production: CSP blocked the theme bootstrap (2026-09-17)

Shibuya does not put the colour mode in the HTML. `base.html` emits one inline script, `setColorMode(localStorage._theme || "{{ theme_color_mode }}")`, and that script is what sets `data-color-mode` and the `dark` class on `<html>`. Without it the stylesheet falls back to light.

Production sent `script-src 'self' 'wasm-unsafe-eval' https://js.arcgis.com; script-src-elem 'self' https://js.arcgis.com` with no `'unsafe-inline'` and no hash, so the browser refused that one inline block and every docs page rendered light, in incognito and for every visitor, regardless of any stored preference. `color_mode: "dark"` in `docs/conf.py` was correct all along and the served HTML did contain `setColorMode(localStorage._theme||"dark")` byte-identically in local and production.

The CSP comes from `content_security_policy_middleware`, not nginx. Its `else` branch now appends a SHA-256 hash of that exact script, and only when the path starts with `/documentation`, so the application's own CSP is unchanged. The script carries no per-page data, so one hash covers the whole docs site; verified identical on `user_manual.html` and `index.html`.

Two traps worth remembering. First, Cypress strips CSP headers, so a browser test against the live page reported `data-color-mode: dark` and a dark background while real browsers were being blocked; the bug was only visible by reading the raw response headers with curl. Second, the hash is tied to shibuya's script text, so upgrading the theme can invalidate it. Recompute with `base64(sha256(<script body>))` over the exact bytes between the tags, excluding the tags themselves.

This only takes effect once `/documentation/` is routed through the application. Production currently answers that path straight from nginx (`POST` returns an nginx 405 HTML page rather than FastAPI's JSON), which is also why the tenant rebranding never runs there. Both symptoms share one cause: the production host has a stale `nginx/nginx-prod.conf`, whose current version proxies `^~ /documentation/` to `$app_backend`.

## Manage Profiles: dropdowns clipped, and live jobs on the Results tab (2026-09-20)

`app-ui-dropdown` has two placements. The default, `absolute`, renders the menu inline as `absolute top-full` inside the trigger's own `relative` wrapper, so any ancestor with a non-visible overflow clips it. The Manage Profiles page card (`data-testid="manage-profiles-page"`) is `relative overflow-hidden` — it needs that to keep the top gradient hairline inside the rounded corners — so every menu on the page was cut off at the card's bottom edge, and inside the persona/profile drawers the panel's own `overflow-y-auto` did the same. `menuPlacement="static"` is the opt-in the rest of the app already uses (tenant add/view, CTI advanced builder): it portals the menu into the first ancestor that is positioned AND actually scrolls vertically, else `document.body`, and positions it from the trigger rect plus that host's `scrollTop`. An `overflow-hidden` card is skipped by that walk precisely because it does not scroll, which is why the portal escapes the clip. All eleven dropdowns under `pages/manage-profiles` now pass it.

The Results tab no longer has a profile dropdown or the Ad Detection / Posting / Hate Speech filter buttons. It is one list for the whole user: currently running jobs first, then every finished result across all profiles and all three activities, newest first, refreshed every 5s while the tab is mounted (the parent only renders the component for the active tab, so polling stops on leaving it, and an in-flight guard prevents overlapping requests).

Live state comes from `social_profile_job`. Rather than touching the three `run_*` methods, the registry lives in `_run_and_wait`, the single poll loop all three go through: `_begin_run` records `{user_id, profile_id, platform, activity, is_manual, started_at, step}` keyed by `run_id`, the loop keeps `step` fresh from the automation service's pending replies, and a `finally` removes the entry, so the entry exists exactly while the remote job is in flight — including the timeout and exception paths. `activity` is derived from the request key (`automation/post` -> posting, `automation/ad-monitor` -> ad_detection, `automation/hate-speech-monitor` -> hate_speech), which is why early returns in `run_posting` (no persona post data) never register: nothing is running remotely yet. `GET /api/manage-profiles/results` returns those runs for the calling user plus all three result lists; the per-profile `GET /api/manage-profiles/results/{profile_id}` is untouched.

The registry is per backend process and in memory: a reload or restart forgets in-flight runs (the results themselves are in Mongo and unaffected), and with more than one uvicorn worker each worker only reports its own jobs.

A manual trigger used to answer `200 {"status":"success","message":"Ad monitoring triggered"}` even when it dispatched nothing. All three triggers loop `if profile.assigned_persona_id == persona_id and profile.session_id`, so a profile with no attached session — or one whose session file cannot be read — is skipped silently, and with the Results tab now showing live runs that reads as "the page is broken" rather than "nothing ran". They now count dispatches and raise 400 with the actual reason (no profile assigned to the persona / no session attached / session unreadable), and the post trigger only stamps `last_manual_post_trigger` once something was really dispatched, so a no-op no longer burns the once-a-day allowance.

Worth knowing when a succeeded run still leaves no row: `_run_and_wait` returns `None` on timeout (300s post, 900s ad and hate) and on any non-200 or `status: "error"` reply, so `_store_result` writes nothing even if the automation service finishes moments later; `_store_result` also drops a payload that fails `SocialAutomationResultRequest` validation with only a log line. And `run_posting` / `run_ad_monitoring` fire the same payload at the automation service a second time after the poll loop has already finished and stored the result — a duplicate dispatch whose result nobody collects. `run_hate_speech_monitoring` does not do that, which suggests the two extra calls are leftovers. None of these are fixed yet.

The assignment row now says so instead of hiding it: a profile with no `session_id` shows a `No session attached` badge plus the line "Monitoring cannot run until a session is connected", its Post/Ad buttons are disabled, and an `Attach session` button picks an existing session for that platform in one click and `PUT /api/manage-profiles/profiles/{id}` attaches it (which also flips `connection_status` to connected). It never captures: only a session that is `verified` AND not already used by another profile qualifies, so an unverified or taken session leaves the button disabled, with the row explaining that no verified session exists and to capture and verify one in the Sessions tab. Capturing stays where it belongs, in the Sessions tab.

"Session not found for selected platform" when editing a profile was a dropped field, not a missing session. The drawer sends the whole form on save, `platform` included, but `SocialProfileUpdateRequest` had no `platform` field, so FastAPI discarded it: the profile kept its old platform while `update_profile` validated the newly picked session against that old platform via `_validate_profile_session(record, profile.platform, data.session_id)`. Switching the facebook profile to x and attaching the verified x session therefore looked up `{platform: "facebook", session_id: "<x session>"}` and 404'd, and the platform change could never have persisted anyway. The request model now carries `platform`, and `_apply_platform_change` runs first so the session is validated against the incoming platform. It normalises through `_safe_platform` (so " X " is a no-op against a stored `x`), refuses an empty value, refuses a change that would put the profile's assigned persona on a platform where that persona already has one (the same rule `assign_profile` enforces), and clears `session_id` + sets `disconnected` when the platform moves without a new session in the payload, so a session can never stay attached to a profile of a different platform.

Running rows can now be stopped, and a run that dies no longer disappears without a trace. `cancel_run(user_id, run_id)` only flags a run the caller owns; `_run_and_wait` checks that flag at the top of every poll, so a stop lands within one `POLL_INTERVAL_SECONDS` (5s) and the `finally` clears the registry entry as usual. `POST /api/manage-profiles/results/runs/{run_id}/stop` 404s once the run is no longer active, which is also what the client gets if it races the run finishing.

Every exit that is not a result — cancel, non-200 reply, `status: "error"`, timeout — now writes a failed row through `ProfileManager.store_run_failure` (a `SocialPostResult` / `SocialAdDetectionResult` / `SocialHateSpeechResult` with `error=True` and the reason: "Stopped from the dashboard", "Automation service request failed (500)", the service's own message, or "Timed out after 900s"). So the Running row is replaced by a Failed row carrying the reason on the next 5s poll, rather than vanishing. The remote job itself is not cancelled — the automation service has no cancel endpoint — we stop waiting on it and stop storing its result, which is what the Stop button promises.

Results can be flushed, and the Results tab filters by profile. `DELETE /api/manage-profiles/results` empties the calling user's `social_automation_result` record (all three lists); with `?profile_id=<id>` it drops only that profile's rows and leaves the rest. It never touches `active_runs` — those live in the in-memory job registry, not in Mongo, so a running row survives a clear and its eventual result or failure row is written afterwards as usual. A user with no result record is a no-op 200. The client asks for confirmation first and the wording follows the filter: with a profile picked in the dropdown it clears that profile only, with "All profiles" it clears everything, and the button is disabled while nothing finished is visible (running rows alone are not clearable). The profile dropdown is client-side only — it filters the already-fetched overview by `profile_id` on both running and finished rows — and uses the dropdown's default inline placement, the same as the side filter. The manage-profiles card used to be `overflow-hidden`, which clipped an inline menu at the card's bottom edge and was the reason the assignment dropdowns had gone through the `menuPlacement="static"` portal; the clip is gone (the rounded corners and background already clip themselves) so every dropdown on the page is the plain inline one.

The Results tab also has a "Show" dropdown next to the profile filter. "Ads" (default) lists only the ad-detection rows. "Posts" lists every crawled post the hate-speech monitor has stored for the profile in focus (or for all profiles when none is picked) as one flat, newest-first list, each with its Hate Speech / Normal badge, label, profile, engagement counts and link, deduped per profile by URL across runs; running and failed posting / hate-speech rows show above it so a run in flight or a failure is not hidden, and a posting row never appears in the Ads view. Posts come from two places: the persona's own published posts (`post_results` rows with no error, shown with a Published badge) and the crawled posts the hate-speech monitor stored (`SocialHateSpeechResult.posts`, with their Hate Speech / Normal badge and engagement counts). A published post used to be just a URL; `SocialPostResult` now also carries `post_text` and `image_url`, filled in by `run_posting` from the persona's `caption` / `image_url` before the automation reply is stored (the automation service itself only returns the URL), so older rows show the link without text. The clear button ignores the view: it clears the selected profile (or everything) on the server, which drops both ads and posts.

"Posts were made, still can't see it" turned out to be a run that never ran. The manual trigger answered 200 and stamped `last_manual_post_trigger`, but `run_posting` exited on "No post data found for persona combination ('unspecified', '18-24', ('Animals', 'Comedy'))" before dispatching anything, so no result and no failure row were written and every retry hit the once-a-day guard. Two causes: `persona_posts` is seeded only for `male` / `female` (never `unspecified`), and the early return recorded nothing. `load_persona_posts` now tries the exact gender first and falls back to any gender for the same age group and interest set (an `unspecified` persona goes straight to the fallback); if there is still nothing, `run_posting` writes a failed posting row with the reason, and `trigger_post_monitoring` checks `has_post_data` first and answers 400 with the persona's combination instead of pretending to dispatch.

The once-a-day rule is no longer keyed on the trigger stamp. `_profiles_with_manual_post_today` looks at the stored `post_results` and only counts a manual, non-error row with a `post_url` dated today; a profile in that set is skipped, and the "Manual post can only be publish once a day for a profile." 400 is raised only when every runnable profile of the persona was skipped for that reason. A trigger that failed, timed out, or never dispatched therefore does not burn the day. `last_manual_post_trigger` is still stamped for reference but no longer gates anything; the stale stamp from the failed 10:27 run was cleared by hand in Mongo (`social_profile_management`, persona SUPERMAN) so the same day could be retried.

Manage-profiles client layout: component files hold only the component class. Backend-mirror types stay in `model/manage-profiles.model.ts`; UI-only types (tab, modal and confirmation unions, extension state, popup mode/save event, the results view/activity unions and the `ManageProfileResultRow` / `ManageProfilePostRow` view models) live in `model/manage-profiles.interfaces.model.ts`; every literal list or number (tabs, purpose options, max sessions, shimmer rows, results refresh interval, view options, activity labels, running titles) is in `constants/manage-profiles.constants.ts`; and `manage-profiles.util.ts` carries the pure helpers (`safePlatform`, platform/profile label resolvers, the four row builders, `buildResultRows`, `flattenPostRows`, `sortNewestFirst`, `pluralize`), all taking the profiles/platforms lists as arguments so they have no component state. The results component now only wires signals to those helpers. Note the repo lint forbids `record[key]` with a variable key; use `getOwnProperty` from `shared/utils/type-guards.util`.

Orion-Social's automation now covers every platform the extension captures (threads, reddit, pinterest, youtube, tiktok, quora, okru, patreon, hashnode, behance on top of x, facebook, instagram, linkedin), each as its own session / publish / ad-detection class in the same shape as the original X files, and `automation_handler.py` maps all of them to the one `social:detect-ads` script. Nothing changed on this side: `run_posting` / `run_ad_monitoring` already dispatch by profile platform. Two operational facts matter here: the session state handed to Orion-Social must include `userAgent` and `localStorage` (the manager now uses both), and a captured session is single-tenant, so do not fan out several automation jobs against the same profile at once or the site logs the session out. The full per-platform findings live in Orion-Social/NOTES.md.

## Session capture window isolation (2026-09-21)

Symptom: clicking Fetch session for a platform with no saved session (Instagram) opened the capture window already signed in to an old account, showing that account's banners ("Your email may not be secure"). Fetch must always start signed out; only Verify and Edit are allowed to restore a saved session file.

The backend was already correct: `capture_session` attaches `payload.seed` only when a `session_id` is passed (Edit), and `verify_session` is the only other place a session file is read. The leak was entirely in the extension (`Orion-Crawler/extension/assets/core`). `startCapture` cleared the site's cookies only when the window was incognito or a seed was present. Firefox runs the add-on without private-window access, so the capture window shares the normal cookie jar, and a fresh Fetch inherited whatever login was sitting there. That login was usually put there by the extension itself, because neither a capture nor an Edit cleaned up when it finished: the captured or seeded account stayed signed in in the browser and surfaced in the next Fetch, even after the session was deleted in the app.

Now every capture backs up the site's cookies (non-incognito only), clears them, and for a fresh Fetch also loads the site once to wipe localStorage, sessionStorage, IndexedDB, Cache Storage and service workers before the real load. `releaseCapture(entry)` clears the capture's cookies and restores the backup; it runs when the capture completes, when the window is closed, when a newer Fetch replaces the window, and on every early exit of `startCapture`. It is guarded by `entry.dirty` so the several callers cannot double-run it and wipe the restored cookies. This mirrors what `openVerifyWindow` / `closeVerifyWindow` already did.

Checked in a throwaway headless Firefox (web-ext + RDP): planted `sessionid` / `ds_user_id` on `.instagram.com`, sent a fresh `orion-session`; during capture only Instagram's anonymous cookies existed (`csrftoken`, `mid`, `ig_did`, `datr`, `wd`) with the planted pair held in `entry.cookieBackup`; after closing the window the planted pair was back and the capture cookies were gone. Needs `./run.sh extension -d` in Orion-Crawler plus Reload in `about:debugging`.

## Tenant import from an exported file (2026-09-21)

Export already existed at two granularities: `GET /api/admin/backups/{id}/download` zips a whole backup, and `GET /api/tenant/backups/{id}/download` zips one tenant's slice (`{filename}_{tenant_id}/` holding `mongo/`, and `tenants/<secondary>/` for each secondary of a primary). Restore existed too (`POST .../tenants/{tenant_id}/restore` for admins, `POST /api/tenant/backups/{id}/restore` for a tenant) but only from a backup already on disk in `backup_root`; nothing could ingest a downloaded zip, so a tenant could not be moved to another install.

Import is that missing half and is deliberately nothing more than a staging step in front of the unchanged `restore_tenant`. `start_tenant_import` streams the upload to `backup_root/import_tenant_<ts>_<rand>/import.zip`, extracts it (every member path is resolved and must stay inside the stage dir; a bad zip or one that is not a tenant export is a 422), finds the single tenant dir, reads the tenant id from the first document of `mongo/db_tenant_model.ndjson` rather than trusting the file name, moves that dir to `<stage>/tenants/<tenant_id>/`, and then runs the same guards and job as a restore (`restore_marker` / `tenant_restore_marker` 409s, the single-job lock, heartbeat, `finish` DONE/FAILED) before calling `restore_tenant(stage_name, tenant_id, source="import")`. Because the staged folder is shaped exactly like a backup, `_tenant_backup_dir` resolves it and `_child_tenant_dirs` picks up the secondaries, so importing a primary's export restores the primary and its secondaries and importing a single secondary's export restores just that one, with the usual rollback point, validation and cache refresh. The stage dir is removed in `finally`; one abandoned by a crash is swept by `sweep_orphaned_backups` after the normal age cutoff, the same as a rollback dir.

Permissions mirror export. `POST /api/admin/backups/import` (root admin) accepts any tenant. `POST /api/tenant/backups/import` (same dependencies as the tenant restore) only accepts a file whose tenant id is the caller's own tenant or a tenant whose live `parent_tenant_id` is the caller, so a primary can import itself (with its secondaries) or an individual secondary it owns, and a secondary can only import itself; anything else is a 403. The parent check reads the live tenant collection first: a tenant that exists is only yours if its live `parent_tenant_id` is you, so an export cannot re-parent an existing tenant by lying. Only when the tenant does not exist any more (deleted, or moved from another install) does the `parent_tenant_id` inside the exported tenant document count, which is what lets a primary re-import a secondary it deleted; that creates the tenant afresh under the caller, the same thing a primary may do by hand, and the exported `db_keys` row brings the tenant's encryption key back with it. The Backup & Restore page has an Import button in both scopes that asks for confirmation and then follows the restore job flow.

## Persona Monitoring triggers are per profile (2026-09-21)

The Post and Ad buttons on the Persona Monitoring tab used to fire by persona: the client sent `assigned_persona_id`, and `trigger_post_monitoring` / `trigger_ad_monitoring` looped every profile assigned to that persona and dispatched a run for each. Since several profiles can share one persona, clicking the button on one row silently ran the scan on all of them. The daily scheduler was never affected — `social_profile_job` already iterates profiles and looks the persona up per profile.

The manual trigger now matches. The routes moved to `POST /api/manage-profiles/profiles/{profile_id}/trigger-post-monitoring` and `.../trigger-ad-monitoring` (the same shape as the hate-speech trigger), the client sends the row's `profile_id`, and the backend resolves exactly that profile: `_runnable_persona` 400s if no persona is assigned or no session is attached, then the persona is looked up from the profile, the session is read and one run is dispatched. The once-a-day post rule is checked for that profile only, and `has_post_data` still gates on the persona's content. Error messages are profile-scoped ("No persona is assigned to this profile yet." etc.) and the success notification names the profile and platform rather than the persona. The `test_routes.py` mirrors and the Cypress intercept (`profiles/prof1/...`) follow the new path.

## Who may export / import which tenant (2026-09-21)

Export lives on each row of the tenant list (`GET /api/tenants/{tenant_id}/export`, the latest backup slice of that tenant) and Import on the Backup & Restore page. Access is the same on both, enforced server side and mirrored by the buttons. A **root admin** may export or import a **primary** tenant or a **standalone** tenant, never a secondary directly: `_is_secondary_tenant` answers from the live `parent_tenant_id` map and, for an import of a tenant that does not exist yet, from the `parent_tenant_id` inside the uploaded `db_tenant_model.ndjson`, and either sends a 403 ("Secondary tenants are exported/imported through their primary tenant"). A **primary owner** may export or import itself and its own secondaries (`_ensure_import_allowed`, live parent map), while a secondary tenant's own users get neither: the export route carries the same `tenant_backup_allowed` dependency as the tenant backup routes, which 403s any caller whose tenant has a parent. The tenant list hides the Export button with the existing `canEditTenant` rule (admin: rows without a parent; primary: its rows). Because a primary's export is its whole tenant dir including `tenants/<secondary>/`, importing it restores the primary and all its secondaries in one go; that is how secondaries travel between installs.

Also fixed on the way: `root_admin_required` (admin tenant-level restore, list-backup-tenants, admin import) depended on `role_required(...)`, which returns the *role* rather than the user, so `current_user.tenant_id` was always empty and the guard 403'd everyone ("Tenant level restore is limited to root tenant admins"). It now takes `get_current_user` for the user and keeps `role_required` as a second dependency for the admin check.

## Tenant restore / import always ends in a consistent state (2026-09-21)

Every failure in `restore_tenant` (used by restore and import alike) is covered. Anything wrong with the request — bad zip, path escape, not a tenant export, invalid id, wrong owner, secondary via admin — is rejected before the database is touched and the staging folder is deleted. A restore or import already running, or an interrupted one on disk, refuses the new one with a 409. If the rollback point cannot be written nothing has been modified yet and the run aborts. Once data is being replaced, any exception (Mongo, Elastic, files) or a failed validation restores the primary and every secondary from the rollback snapshot, which holds Mongo, Elastic and files for each of them, refreshes the caches and reports "rolled back". Only a failure of that rollback itself leaves the tenant for an operator: the marker and the snapshot are kept (snapshot dirs start with `rollback_` and the orphan sweep never touches them) and the job says manual intervention is required.

The remaining hole was a process crash in the middle of a restore. The startup hook `resolve_interrupted_tenant_restore` used to log a CRITICAL pointing at `python restore_tenant.py`, a script that does not exist, and stop. It now performs the rollback itself: `_restore_from_rollback` walks `<rollback>/tenants/<id>/` (one flat entry per restored tenant — the primary and each secondary), runs the same restore engine and validation on each, clears the marker, removes the snapshot and refreshes caches, then marks the job failed with "was rolled back automatically". If that rollback fails the marker and snapshot stay for manual recovery exactly as before. Mongo and Elastic are both initialised before the hook runs (service_manager starts Elastic first), so the recovery has everything it needs.

## Export and import always state the recovery point (2026-09-21)

Exports are slices of the one main backup (AWS's guidance for pooled multi-tenant databases is the same: one shared backup, "defer the cost of segregation until it is required"; per-tenant backups are impractical at scale). That means an export can be days older than it looks, and the danger is the sequence "export, delete the tenant, import, assume the last hour is in there". Tenants therefore do NOT get an Instant Backup button (it would fire a full backup of every tenant per client); only the admin has it. Instead the recovery point is made impossible to miss, the way the RDS console shows the exact restorable time before a restore:

- Export (tenant row) first calls `GET /api/tenants/{id}/export-info` and confirms "Export "<name>" as of the last backup taken on <date> (<age>)?"; when the backup is older than 24 hours the popup is a warning and says so. The download keeps the server's file name `<backup_time>_<tenant_id>.zip`, so the age stays visible on disk.
- Import (Backup & Restore page) parses the `YYYY_MM_DD_HH_MM_SS` prefix of the chosen file (backup names are UTC) and confirms "This export is from <date> (<age>). Restoring replaces the tenant (and its sub tenants, if any) with that state - anything changed since is lost."; a renamed file with no timestamp gets "date unknown ... may be older than it looks". Both live in `shared/utils/backup-age.util.ts` (`parseBackupTimestamp`, `formatRelativeAge`, `isStaleBackup`).

The industry's real safety net for the delete-then-regret case is a soft-delete window (Microsoft keeps deleted objects 30 days, Azure Backup 14-180 days); tenants here are deleted for good, so that is the recommended follow-up.

## A tenant under restore shows maintenance, nothing else does (2026-09-21)

A full backup restore puts the whole site in maintenance mode; a tenant-level restore or import never did, so users of the tenant being restored could briefly see half-emptied collections while nothing told them why. There is now a per-tenant fence next to the global flag: `maintenance_state` keeps an in-memory set of tenant ids under restore (`fence_tenants` / `release_tenants` / `is_tenant_fenced`), and `tenant_resolution_middleware`, which already resolves the tenant of every request from its host, answers `503 {"detail": "Tenant service unavailable"}` when the resolved tenant or its `parent_tenant_id` is in that set — the same per-tenant signal the client already turns into `/static/maintenance.html`, so no client change was needed. Only the maintenance page's own assets are exempt; `/api/public` is deliberately not, so the page keeps waiting while fenced and returns to the app by itself once the fence lifts. Every other tenant, and the admin on the default host, is unaffected.

`restore_tenant` raises the fence for the primary and each secondary right after writing the restore marker and before the first destructive write, and lowers it on success or after a successful rollback; if the rollback itself fails the fence is kept on purpose, so a broken tenant serves the maintenance page rather than corrupt data until an operator fixes it. The startup recovery does the same around `_restore_from_rollback` (fenced while the snapshot is re-applied, released on success, kept on failure). Note the fence is in memory: a process restart drops it, which is fine because the startup hook re-fences while it re-applies the snapshot and the service is not marked available until that hook has run. A primary that restores itself from its own page is fenced too and lands on the maintenance page until the restore completes; an admin restoring it from the default host keeps the normal progress view.

## Restoring a tenant no longer logs its users out (2026-09-21)

After importing his own tenant a primary admin was greeted with "Logged out due to multiple active sessions". The single-session check compares the live session with `db_user_account.current_session_id`, and a tenant restore replaces the user documents with the backup's copies, whose `current_session_id` is whatever it was when the backup ran — so every logged-in user of the restored tenant failed the check on the next request. `current_session_id` is runtime state, not backup data: `_restore_tenant_mongo` now reads each live user's `current_session_id` for the scope before the delete and writes it back onto the re-inserted documents, so accounts, roles and permissions come from the backup while open sessions survive. Users that exist only in the backup keep its value, which the next login overwrites anyway. The same path serves rollbacks, so a rolled-back restore keeps sessions too.

## Orion Mail for tenants (2026-09-21)

Orion Mail was hard-limited to the root tenant: `_assert_orion_mail_allowed` refused the `orion_mail` permission unless the target user's tenant was `is_default` and the caller was the root admin, `create_tenant_user` refused it outright, and the client hid both the permission option and the profile-menu entry unless `tenant.isDefault`. All of those gates are gone; whoever may already edit a tenant's users (its maintainer, or the root admin for the default tenant) may hand out `orion_mail`, and the profile menu shows Orion Mail to admins, tenant maintainers and any user holding the permission. The SSO endpoints never cared about the tenant (`_identity_for_user` already carried `tenant_id`), so nothing changed there.

What did need work is the browser leg of the SSO. Orion Mail's `/auth/login` bounced the browser to `ORION_INTELLIGENCE_PUBLIC_URL/api/sso/mail/authorize`, i.e. the root host, but a tenant user's `access_token` cookie is host-only on `slug.<TENANT_BASE_DOMAIN>`, so they would land on the root login page with no way in. The Orion Mail entry in the profile menu now opens `<mail>/auth/login?origin=<mail>&orion_origin=<current origin>`, and Orion Mail (`routes/auth_routes.py`) accepts `orion_origin` only when it is the configured public origin or a subdomain of `ORION_INTELLIGENCE_TENANT_BASE_DOMAIN` (defaults to the public URL's hostname; set it explicitly when tenants live under a different base domain than the public URL) with the same scheme and port, anything else is a 400. The accepted origin is remembered in an `orion_mail_orion_origin` cookie (path `/auth`, 30 days) so the mail client's own re-login after session expiry, the "Orion account" link and the logout redirect all go back to the tenant's host instead of the root one; a stale or forged cookie falls back to the public URL rather than blocking login. The exchange/verify calls stay server-to-server over the internal URL and are unchanged. Verified against the live stack with a throwaway `zgmail` tenant user: mail login → `zgmail.localhost:4200/api/sso/mail/authorize` → callback → `/auth/me` reported the tenant user with `orion_account_url` on the tenant host.

## Tenant restore only writes rows that belong to the tenant (2026-09-21)

The restore engine scoped its delete correctly but inserted every row of every archive file as long as the `_id` was new, so a hand-edited export could carry a `role: admin` user stamped with the root tenant id, rows planted under another user's id, or a nested `tenants/<other tenant id>` folder whose "restore" would wipe and replace that tenant. Exports are plain zips and any tenant maintainer may import their own, so this was a full-takeover path. Three checks close it, all in `tenant_backup_manager.py`: `_in_scope` applies the same partition rule used for the delete to each archive row before insert (tenant field must equal the tenant, user field must be one of its users, the tenant document must carry its own id) and counts the rest as skipped; `_tenant_restore_scope` takes archive user ids only when they are valid object ids, stamped with the tenant, and not owned by another live tenant, which also removes the `session_data/<id>` path-traversal that a string `_id` allowed; and `restore_tenant` runs the import ownership rule on every nested child folder (live parent must be this tenant, or the archive's parent field for a tenant that no longer exists) before touching anything. Regression tests reproduce the crafted export and the foreign child folder.

## Tenant exports are opaque outside the server (2026-09-21)

A tenant export used to be the raw backup folder zipped: every user's bcrypt hash, raw verification tokens, session ids and all case/alert data in plain text, readable by whoever downloaded it (a primary maintainer for its secondaries) and editable before import. CIS Control 11.3 asks for recovery data to carry the same protection as the live data, and Vault snapshots / RDS exports never leave unencrypted, so the download is now an outer zip with two entries: `index.html`, a static summary rendered by the backend (`BackupReport.render_export`, template `export_report.html`: backup name and date, export time, and per tenant slug/id, users, per-collection and per-index counts, files, secondaries tagged) with no script and nothing that reads neighbouring files, and `tenant.enc`, the tenant folder zipped as before and encrypted with `ExportCipher`: AES-256-GCM in 1 MiB records, key derived from `ENCRYPTION_KEY`, a random base nonce per file, record index and a final flag bound as associated data so records cannot be reordered, dropped or truncated. Import (`_unwrap_export`) opens the outer zip, decrypts `tenant.enc` into the staging area and then follows the unchanged extract/ownership/restore path; an old plain zip, a file from another server or any modified byte is rejected with 422 before anything is staged. Only this server can read or accept its exports, so moving a tenant to another deployment requires the same `ENCRYPTION_KEY`. The admin's whole-site backup download is unchanged (root only, not importable). `resolve_download` no longer writes a report into the stored backup folder; the summary is built in memory per download.

## Remaining import hardening (2026-09-21)

Four more gaps from the tenant backup audit, all in `tenant_backup_manager.py` unless noted. Elastic: `_restore_tenant_elastic` bulk-indexed every hit in the archive by its `_id`, so a crafted export could plant SIEM documents under another tenant or overwrite that tenant's documents outright; hits whose `_source.tenant_id` is not the restored tenant are now dropped and the rest are written with `create`, so an `_id` that already exists (it can only belong to another tenant after the scoped delete) is left untouched and counted. Tenant record: `db_tenant_model` is restored from the archive like any row, which let a maintainer rewrite `user_quota`, `is_primary`, `parent_tenant_id`, `is_default`, `status`, `verified`, `slug` on their own tenant, and even an untouched older export undid admin downgrades; the admin-owned fields (`BACKUP_TENANT_ADMIN_FIELDS`) are now read from the live record before the delete and written back after the insert, the same way `current_session_id` is kept for users, and a tenant that no longer exists comes back with `is_default` false and, when it has a parent, `is_primary` false. Job lock: `start_tenant_import` staged and unpacked the upload before taking the backup job lock, so a backup starting meanwhile made the import vanish behind a 200 that carried the other job's status; the lock is now taken first with the heartbeat running through staging, a busy lock is a 409, and a rejected upload finishes the job as failed before the error is returned. Size: `_extract_archive` adds up the declared sizes and refuses with 413 when they exceed the free space divided by `BACKUP_DISK_HEADROOM` or `BACKUP_IMPORT_MAX_INFLATION` times the archive, which stops zip bombs from filling the shared backups volume; the two import routes get their own nginx locations with `client_max_body_size 4g`, unbuffered proxying and a 900 s read timeout so real exports larger than the global 32 MB cap can be imported at all.

## Tenant resolution and login gates (2026-09-21)

`tenant_resolution_middleware` picked the hostname from `X-Forwarded-Host` before `Host`. The Angular dev proxy needs that (it rewrites `Host` to `127.0.0.1:8443` and forwards the real one, so `slug.localhost:4200` only resolves through the forwarded header), but nginx never sets or strips the header in production, so any client could name any tenant, including the internal `trusted-web-main` branch that binds the tenant from the caller's own token or falls back to the default tenant. The forwarded header is now honoured only when `config.DEBUG` is true (`PRODUCTION` != "1"), the same switch `EnforceHTTPSMiddleware` already uses for its dev-only relaxation, so a production `.env` must keep `PRODUCTION='1'`; and the `trusted-web-main` branch is taken only when no `X-Real-IP` is present, which every proxied request carries and direct docker-network callers such as Orion Uptime do not. The name-based fallback that decrypted every tenant's name for an unknown subdomain is gone: migration 1.0.3.15 backfilled a slug on every tenant and both creation paths set one, so it only served as an unauthenticated full-collection scan.

`login()` returned a 2FA temp token before the tenant checks at the bottom of the function, and `verify_2fa_and_issue` and `refresh_token` only validated the parent tenant, so users with 2FA in a disabled or unverified tenant logged in and every session kept renewing after an admin disabled the tenant. `get_parent_tenant`, which all three paths already call, now rejects the user's own tenant when it is unverified ("account approval pending") or disabled ("account blocked"), and `login()` calls it before the 2FA branch. Signup under a primary now requires that primary to be verified and not disabled, so a switched-off primary cannot keep collecting sub-tenants that reserve its pool quota. Tenant slugs come from the first label of the signup email domain; `assert_slug_available` refuses the reserved names (`www`, `mail`, `api`, `admin`, `static`, `app`, `localhost` and the first label of `APP_URL` / `PRODUCTION_DOMAIN` / `TENANT_BASE_DOMAIN`, so `@try.example` can no longer squat the production host) and answers 400 for a slug another tenant already holds instead of a 500 from the unique index; it runs before `create_tenant`'s try block so the cleanup path cannot swallow the error.

## A maintainer account only leaves with its tenant (2026-09-21)

A tenant with no maintainer user is a dead tenant: `login()` refuses every user of it with "Maintainer user not found", the admin cannot create or delete users in another tenant, and `update_tenant` crashed on the `password_reset_required` save. Three paths could produce one: `delete_user` only refused admins and cross-tenant targets, so a maintainer could delete themselves; `update_user` only refused *adding* the maintainer license for non-admins, so it could be removed from the holder; and a signup that saved the tenant but failed on the user left it empty. `delete_user` now refuses any user holding the maintainer license regardless of who asks (tenant deletion removes users directly and is unaffected), `update_user` refuses a license list that drops `maintainer` from a holder, and the `password_reset_required` write is guarded like the child-tenant path. The Manage Profile page hides the Delete button and disables the license dropdown on maintainer rows so the UI matches.

## One data key per tenant, enforced by the database (2026-09-21)

`get_or_create_dek` was find-then-insert with nothing stopping two inserts: `db_keys.tenant_id` was declared `Field(index=True)` but the application never calls odmantic's `configure_database`, so not even that index existed, and two first calls for a new tenant (signup and the first request that needs the key, two workers in production) could each create a DEK, after which `get_profile_dek` returned whichever Mongo found first and everything encrypted under the other one became unreadable. `ensure_indexes` now creates `unique_key_per_tenant`, a unique index on `tenant_id` restricted to string values so the mock rows without a tenant id in the test database do not collide, and `create_dek` treats a duplicate-key error as "someone else won" and returns the stored key instead of raising. Verified against the live dev Mongo with twenty concurrent `create_dek` calls for one id: one row, one key for all twenty callers.

## Tenant manager loose ends (2026-09-21)

User creation checked the pooled quota and then inserted the user with nothing in between, so concurrent requests from a sub-tenant (or two workers in production) all passed the check and overshot the primary's pool. `TenantManager.quota_lock(tenant)` is a Redis lock keyed on the quota pool (the parent for a secondary, the tenant itself otherwise) and both creation paths, `create_tenant_user` and `AccountManager.create_user`, now take it around the check and the save; the lock lives in Redis so it holds across gunicorn workers, and the tests patch it to a no-op. Tenant deletion removed only users, keys, settings, connectors and chat shares; alerts, cases, audit logs and takedown requests all carry `tenant_id` and were left behind for good, so they joined `TENANT_SCOPED_MODELS`. A non-admin calling `update_tenant` with a tenant id that is neither their own nor a managed child used to fall through and apply the payload to their own tenant; it is now a 403. The cleanup after a failed `create_tenant` removed `db_keys` by `id` instead of `tenant_id`, which matched nothing and left the freshly created DEK behind.

## Blocked tenants sign in and see a block screen (2026-09-21)

Two things were wrong with how a tenant went dark. A disabled tenant, or the children of a primary that was demoted or disabled, were refused at login with a bare "account blocked" and nobody could tell why; and a primary that ran over its user or tenant quota saw the limited-access banner while its secondaries, which consume that very quota, kept working as if nothing had happened. There is now one tenant-level state, `TenantManager.access_block_reason(tenant)`: "Account disabled by administrator" when the tenant is disabled, "Access suspended: your primary tenant is no longer active" for a child whose parent is missing, demoted, disabled or unverified, and "Access suspended: your primary tenant exceeded its quota" for a child whose parent is over either quota; the primary itself keeps the banner so its maintainer can fix things, and the value is cached for five seconds per tenant because it is evaluated on every request. `tenant_resolution_middleware` answers `403 {"detail": <reason>, "access_blocked": true}` for every `/api/` path of a blocked tenant except login, logout, the session probe, `/api/public` and static assets, so the client can still sign in and learn the reason. Login therefore no longer refuses disabled tenants or children of demoted primaries (`get_parent_tenant` keeps refusing only unverified tenants, and the "User quota exceeded" refusal of non-maintainer logins stays); the session payload carries `accessBlocked`, `app.component` replaces the shell with a full-screen block page with a Log out button while it is set, and the HTTP interceptor sets it from any `access_blocked` 403 so an admin disabling a tenant takes effect on the next request of an open session. Child quota allocation also charges sibling reservations now, the same way `count_quota_tenant_usage` charges the primary, so a primary can no longer hand out more quota than it has and lock out its own users. Verified on the live stack: with `xmailorion` over its user quota its secondary answers 403 on every API path while the primary and standalone tenants do not, and a maintainer of the secondary signs in, sees the block screen, gets 403 on the app's own calls and can log out.

## Fence first, then snapshot (2026-09-21)

`restore_tenant` used to take the rollback snapshot, write the marker and only then fence the tenant, so a request that wrote during the snapshot had its write erased by a later rollback, and nothing stopped extension sockets, which `BaseHTTPMiddleware` never sees, from writing throughout. The fence is now raised before the rollback point, followed by `_quiesce_tenant_writers`: it closes the open extension sockets of every user in the restore scope and then waits `RESTORE_QUIESCE_DRAIN_SECONDS` so requests that were already past the middleware can finish before the snapshot is taken; if the snapshot fails the fence is released with the cleanup. New socket connections check `maintenance_state.is_tenant_fenced` on the user's tenant at connect time and are closed with 1013 (try again later) while the fence is up. The backup tests zero the drain delay through an autouse fixture.

## Restore skips what no longer belongs (2026-09-21)

Two more restore edge cases. A primary's backup nests its secondaries, so restoring the primary used to bring back every secondary in the archive, including ones the admin had deleted on purpose since the backup; `restore_tenant` now skips a nested folder whose tenant no longer exists live and logs it, so a deliberately removed secondary stays removed while an accidentally removed one is still recoverable by importing its own export, which `_ensure_import_allowed` accepts for a tenant that is not live when the archive names the importer as its parent. And a user row whose username or email had since been taken by a user of another tenant made `insert_many` throw on the unique index, which failed and rolled back the entire import; `_insert_tenant_batch` now catches the bulk-write error, keeps every row Mongo did insert (the write is unordered), counts the duplicate-key rows as skipped alongside the `_id` clashes and logs each one by id and username, and still re-raises for any error that is not a duplicate key.

## A restore must leave someone who can sign in (2026-09-21)

The user-level guards that keep a maintainer from being deleted or stripped of the license do not reach the restore engine, which deletes a tenant's users and re-inserts the archive's rows; an archive with an empty or partial user file, or one whose maintainer row was skipped for a username clash, produced a tenant nobody could log into, and `_validate_tenant_restore` only checked that the tenant document existed. It now also counts the tenant's users holding the maintainer license after the restore, or `role == admin` for the default tenant, and reports "would have no maintainer" when there are none, which fails validation and triggers the normal rollback from the snapshot taken before the restore began.

## Restore state shared correctly across stacks and workers (2026-09-21)

Three operational gaps around the tenant restore markers. The e2e stack mounted the same `./backend/backups` folder as the dev stack, so a test-stack start would find a dev restore marker, apply the dev snapshot into the test database, and delete the marker and the snapshot, destroying a snapshot kept for manual recovery or the rollback point of a dev restore in progress; each stack's marker also 409-blocked the other. `docker-compose-testing.yml` now mounts `./backend/backups_test` (ignored, created and owned by `run.sh` like the dev folder). The rollback sweep deleted any `rollback_*` folder older than twelve hours while checking only the global marker, so the snapshot kept after a failed tenant rollback was removed by the next scheduled backup and startup recovery then failed forever; both sweeps now skip the folder the tenant marker points at, and if the snapshot is nevertheless gone the startup recovery logs it as critical, records the failure on the job and clears the marker so restores are not blocked indefinitely. Production runs gunicorn with four workers while the tenant fence lived in one worker's memory, so three workers kept serving a tenant under restore and all four ran the startup recovery at once; the fence is now a file next to the maintenance flag (`static/.fenced_tenants`, read with the same one-second cache), a start with no marker clears any stale fence left by a crash before the marker was written, and the startup recovery runs under a Redis lock so one worker rolls back while the others wait and then find nothing to do.

## Verification pass and the last residuals (2026-09-21)

An independent re-read of the working tree against all 28 audit findings confirmed 25 closed and left three partial, now closed as well. The tenant fence file moved from `static/`, which the e2e stack also bind-mounts, to the backups folder, which is per stack, so a test-stack start can no longer clear a dev fence (the global `.maintenance` flag in `static/` is still shared by both stacks, as it always was, because nginx reads it there). Sub-tenant signup now derives the new child's starting quota from the same reservation-based usage the admin path uses, so a signup can no longer push the primary's reservations past its quota and block the whole pool. A restore or import that left records out now says so in the job message ("N records belonged to another tenant and were left out"), with the per-record detail in the server log. Two residuals from the same pass: `start_tenant_restore` answers 409 when a job is already running instead of a 200 carrying the other job's status, and the startup recovery leaves the marker alone when the job store reports a restore still running in another worker, so a respawned gunicorn worker cannot roll back a live restore. `AccountManager.create_user` is unreachable (no route) and was left as is.

## Code-scanning alerts (2026-09-21)

Nine open alerts from CodeQL, Scorecard and Codacy. The two CodeQL "clear-text logging/storage of sensitive information" hits point at the logger's sinks, so `log_controller` now redacts before anything is written or printed: values that follow `password`, `secret`, `token`, `authorization`, `cookie`, `api_key`, `access_token` or `refresh_token` in `k=v`, `k: v` or JSON `"k": "v"` form become `***`, as do bearer tokens; CodeQL does not recognise a regex as a sanitiser, so the alerts may need to be dismissed as fixed once the leak path is confirmed closed. The two "incomplete URL substring sanitization" hits were test assertions of the form `"evil.com" in payload`, now `count()`/set checks. The "replacement of a substring with itself" in `backup_report.html` was a no-op that tried to undo the `<\/` escaping `JSON.parse` already understands; removed. Scorecard's pinned-dependencies alert on the docs Dockerfile is closed by installing with `--require-hashes`: `docs/requirements.in` keeps the four direct pins and `docs/requirements.txt` is the hash-locked tree generated with `uv pip compile --generate-hashes --python-version 3.12 requirements.in -o requirements.txt` inside the docs base image (re-run that after changing `requirements.in`); the install was verified in that image. The Codacy reimport and the two try/except/pass hits are a removed duplicate import and two silent excepts that now log a warning with the exception.

## The daily social run shows up as running and can be stopped (2026-09-21)

The daily social loop (`run_daily_social_profiles`) walks every account, posting then ad monitoring, and each of those jobs already registers itself in `active_runs`, so it appeared in the Results tab as an "Automate" row with a Stop button and in the Persona Monitoring tab as the "scan running" badge hopping from account to account. Stop only cancelled the one job in flight, though, and the loop went straight on to the next account, so from the dashboard nothing seemed to stop and the manual Post/Ad triggers stayed refused with "Daily run scheduler is currently running". Cancelling a scheduled run now also raises `_stop_daily`, which the loop checks before every account and every purpose, so the daily run ends after the job in flight and the scheduler records the day as completed, which means a backend restart does not start it again. The Stop button on a scheduled row reads "Stop daily run" so the effect is clear; manual runs are unaffected.
