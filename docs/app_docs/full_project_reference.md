(full-project-reference)=

# Full Project Reference

This generated reference gives a source-level map of the Orion repository. It is intended as the entry point for developers and LLM retrieval systems that need to understand the entire maintainable codebase.

## Generated Reference Set

- `application_feature_guide.md`: user-facing feature guide with routes, prerequisites, and steps.
- `feature_catalog.json`: structured feature catalog for LLM/RAG retrieval.
- `swagger_api_reference.md`: `/docs` and `/openapi.json` exposed API reference with request and response samples.
- `backend_api_reference.md`: FastAPI endpoint reference generated from decorators.
- `frontend_source_reference.md`: Angular route, component, service, directive, and template reference.
- `source_file_inventory.md`: per-file source inventory.
- `source_file_inventory.json`: machine-readable source inventory.

## Coverage Summary

- Source files inventoried: **798**
- Backend API endpoints discovered: **198**
- Angular artifacts discovered: **210**

## Counts By Area

| Area | Files |
| --- | ---: |
| client | 522 |
| backend | 204 |
| docs | 67 |
| root | 5 |

## Counts By File Kind

| Kind | Files |
| --- | ---: |
| angular component | 140 |
| angular template | 139 |
| typescript | 84 |
| backend manager/service | 76 |
| backend model | 74 |
| documentation | 61 |
| angular service/resolver/guard | 60 |
| typescript model | 47 |
| backend python | 45 |
| stylesheet | 15 |
| backend test | 14 |
| text | 11 |
| backend route module | 10 |
| json data/config | 7 |
| angular directive | 5 |
| angular pipe | 5 |
| configuration | 3 |
| angular routes | 1 |
| script | 1 |

## Backend Architecture Map

- `backend/routes`: FastAPI routers and public route entry points.
- `backend/configs`: authentication, role, status, license, limiter, Swagger, and exception wiring.
- `backend/orion/api/interactive`: user-facing managers for search, account, alert, tenant, graph, feeder, feedback, signup, payment, directory, and homepage workflows.
- `backend/orion/api/server`: server-side crawl, config, and entity managers used by route handlers and ingestion callbacks.
- `backend/orion/services`: infrastructure services for Mongo, Elastic, Arango, Redis, sessions, encryption, mail, STIX, and logging.
- `backend/orion/middleware`: security headers, service readiness, content policy, and admin cache middleware.
- `backend/migrations`: migration runner and migration scripts.
- `backend/tests`: pytest coverage for services, pages, auth, search, routes, and fake model helpers.

## Frontend Architecture Map

- `client/src/app/app.routes.ts`: Angular route tree and lazy component loading.
- `client/src/app/pages`: dashboard pages, graph pages, scans, login/signup/onboarding, profile, tenant, dump, credentials, and AI workspace surfaces.
- `client/src/app/sections/report`: report templates and report social-interaction widgets.
- `client/src/app/shared`: reusable models, guards, resolvers, directives, partials, services, icons, styles, and constants.
- `client/src/app/services`: application state, dashboard/search state, auth, alerts, audit logs, license checks, export, directory, and notifications.
- `client/cypress`: end-to-end tests, controllers, fixtures, and support helpers.

## How To Use This Documentation With An LLM

1. Use `feature_catalog.json` first for user questions about where to go or how to use a feature.
2. Use `swagger_api_reference.md` for API requests that appear in the live `/docs` Swagger UI.
3. Use `backend_api_reference.md` for broader backend route/source access, roles, license, and settings questions.
4. Use `frontend_source_reference.md` for UI component, route, and template behavior questions.
5. Use `source_file_inventory.json` to locate files by class, function, selector, route, or API path.
6. Use `source_file_inventory.md` when a human-readable source map is needed.

## Known Limits

This is static documentation. It reports code structure and direct strings from source files. It does not execute every runtime path, infer dynamic authorization from every helper, or expand minified/generated bundles and binary assets as implementation files.
