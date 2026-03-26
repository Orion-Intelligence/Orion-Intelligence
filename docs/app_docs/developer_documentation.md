(developer-documentation)=

# Developer Documentation

:::{admonition} Scope
:class: tip

This page is for engineers working on the Orion Intelligence codebase in this repository. It focuses on architecture, runtime services, development workflows, testing, documentation generation, and operational boundaries. It intentionally avoids exposing real secrets or environment-specific credentials.
:::

## About This Guide

Orion Intelligence is a containerized investigation platform with a web client, backend APIs, search infrastructure, monitoring surfaces, and documentation tooling. In practical terms, developers usually interact with the system in five ways:

1. build and start the stack
2. work on the Angular client and Django-style backend services
3. run automated tests and seeded flows
4. update search, collector, or API behavior
5. maintain documentation and screenshot generation

This document is organized around those tasks.

```{contents}
:local:
:depth: 2
```

## System Overview

Orion Intelligence combines user-facing investigation workflows with backend search, scanning, and administrative services. The repository primarily represents the web application layer that sits between collected data and analyst workflows.

At a high level, the system includes:

- a frontend client under `client/`
- backend application code under `backend/`
- container orchestration through Docker Compose
- a build-and-run entry script in `run.sh`
- generated and maintained documentation under `docs/`

The wider Orion ecosystem also references adjacent projects such as crawlers, collectors, and other supporting components, but this repository is centered on the search and investigation platform itself.

## Core Architecture

### Primary Layers

The application is easiest to understand as four cooperating layers:

| Layer | Main responsibility | Typical technologies |
| --- | --- | --- |
| Presentation | analyst UI, reports, settings, tenant flows | Angular, Cypress |
| Application | APIs, orchestration, auth, search logic, scans | Python backend services |
| Data and Search | indexing, persistence, caching, task state | Elasticsearch, MongoDB, Redis, ArangoDB |
| Delivery and Ops | containers, reverse proxy, static delivery, health checks | Docker Compose, NGINX |

### Frontend

The frontend lives in `client/` and powers:

- dashboard navigation
- search and filtering
- report pages
- graph and social-intel views
- tenant and system administration pages

The UI is built as a routed Angular application and is tested with Cypress end-to-end coverage.

### Backend

The backend lives in `backend/` and provides:

- user and tenant APIs
- indexed search endpoints
- report and metadata retrieval
- scan and lookup APIs
- documentation and public API descriptions
- test fixtures and mocks

Backend routes and generated API docs are also used to drive the published docs set under `docs/api_docs/`.

### Supporting Services

The running platform depends on several stateful services. The exact compose file varies by mode, but the logical service map is stable:

- `Elasticsearch` for search and indexed retrieval
- `MongoDB` for document-style persistence
- `Redis` for cache and queue-like coordination
- `ArangoDB` for graph-oriented workloads used by parts of the platform
- `NGINX` for delivery and reverse-proxy behavior

In some environments, additional operational surfaces may exist for API docs, logs, or task monitoring. Those are deployment concerns, not core application concepts.

## Repository Map

The most important top-level paths are:

| Path | Purpose |
| --- | --- |
| `client/` | frontend application, Cypress tests, client build config |
| `backend/` | API, business logic, docs routes, static test fixtures |
| `docs/` | application docs, API docs, screenshots, docs-side e2e helpers |
| `nginx/` | NGINX configuration variants |
| `run.sh` | local orchestration entry point |
| `docker-compose*.yml` | environment-specific stack definitions |

## Runtime and Environment

### Environment Configuration

The project uses a root `.env` file for service and application settings. This file can include:

- service credentials
- runtime mode toggles
- feature flags
- domain and deployment settings
- testing mode state

:::{warning}
Do not place real credentials in documentation, examples, screenshots, or committed sample files. If sensitive values were ever committed historically, rotate them and remove them from version history.
:::

### Build Modes

`run.sh` supports multiple build and startup paths. The two most important developer-facing modes are:

- `build -t` for the testing/instrumented workflow
- default or production-oriented build flags for standard deployment paths

In testing mode, the script enables the application’s testing flag, builds the client, prepares backend assets, builds the containers, and waits for test services to become reachable before Cypress or protected backend tests run.

### Compose Variants

The repository includes multiple compose definitions so the same codebase can be started in different modes:

- default local mode
- testing mode
- testing mode with backend test execution
- production-oriented mode

Developers should treat the compose file as the runtime contract for the application. If a feature depends on an external service, health check, or environment variable, the compose configuration is where that dependency becomes operational.

## Local Development Workflow

### Standard Flow

For most application work, the practical loop is:

1. update code in `client/`, `backend/`, or docs
2. run `./run.sh build -t`
3. wait for the test service to become ready
4. run targeted Cypress or backend tests
5. inspect the UI or generated docs output

### Frontend Work

When changing user-facing behavior, common touchpoints include:

- route components under `client/src/app/pages/`
- shared report and layout partials under `client/src/app/shared/`
- controller helpers under `client/cypress/e2e/controllers/`
- Cypress specs under `client/cypress/e2e/`

UI changes should be validated against:

- route-level navigation
- filter and report behavior
- tenant/admin permission differences
- responsive layout where relevant

### Backend Work

When changing APIs or data behavior, common touchpoints include:

- route handlers and managers in `backend/`
- generated docs helpers in `backend/routes/docs/`
- test coverage under `backend/tests/`
- mock search data under `backend/static/test/mocks/`

Backend changes should be validated against both API behavior and the frontend workflows that consume those responses.

## Testing Strategy

### Frontend End-to-End Tests

The main UI verification layer is Cypress. The test suite covers:

- login and account flows
- search and filter behavior
- tenant management
- dashboard modules
- admin and system settings
- docs screenshot generation

Tests live under `client/cypress/e2e/`. Reusable actions are extracted into controller files so large specs remain readable and less brittle.

### Backend Tests

Protected backend tests can run in a dedicated containerized path. The repository already includes a helper in `run.sh` that executes pytest in an isolated service context when the appropriate build mode is selected.

This is the preferred path for:

- manager logic
- route behavior
- serializer or schema validation
- integration points that depend on service configuration

### Fixtures and Mocks

The repository contains static mock data for predictable testing, especially around indexed search behavior. This matters because many user workflows depend on rich search results rather than simple CRUD pages.

Developers should prefer deterministic fixtures over ad hoc live data when adding or stabilizing tests.

## Documentation Workflow

### Application Docs

Application-facing documentation lives under `docs/app_docs/`. These files describe:

- the platform
- major modules
- the user manual
- developer workflows

Docs in this area should be written for scannability:

- short sections
- clear headings
- limited duplication
- role-aware wording where permissions or licenses affect visibility

### API Docs

API documentation lives under `docs/api_docs/` and is closely tied to backend route descriptions. When API output or contract wording changes, the docs and route-level descriptions should be updated together.

### Screenshot Generation

The repository includes a docs-focused Cypress screenshot flow for the user manual. The current implementation keeps the docs spec isolated from the regular Cypress discovery pattern and invokes it through the docs generation path.

At a high level, that flow:

1. builds the test stack
2. seeds tenant state
3. runs the docs screenshot spec
4. writes screenshots into `docs/screenshots/`

This keeps documentation images reproducible from the application itself instead of relying on manual capture.

## Search and Data Concepts

### Indexed Search

A large part of the platform assumes indexed, searchable result models rather than direct database-table browsing. Engineers working on result pages should think in terms of:

- query inputs
- filters
- aggregations
- result cards or tables
- metadata extraction
- report pivots

That search-first model drives homepage behavior, module pages, consolidated search, reports, and result-insight panels.

### Report-Centric UX

Many routes eventually lead to a report screen. That means backend and UI changes should preserve:

- structured metadata
- export and share actions
- JSON inspection where applicable
- graph pivots
- consistent report header behavior

Breaking report semantics usually affects more than one module.

### Tenant and Role Awareness

The application is heavily shaped by role, tenant state, and license assignment. Developers should expect different users to see different:

- sidebar entries
- homepage variants
- scan and API modules
- administrative forms
- tenant-level tools

Any feature work that assumes a universal menu or universal permission model is likely incomplete.

## Operational Notes

### Health and Service Readiness

The local stack depends on service readiness, especially for:

- the backend API
- search infrastructure
- persistence services
- test endpoints in instrumented mode

If a build succeeds but tests fail immediately, first check whether the expected services are actually healthy and reachable.

### Secrets and Safety

Documentation, examples, and tests should never normalize the use of real production credentials. Use placeholders, redacted strings, or seeded test accounts only.

### Dirty Worktrees

The repository may contain concurrent changes across docs, frontend, backend, and tests. When making updates:

- avoid reverting unrelated work
- avoid destructive git commands
- keep docs changes scoped
- preserve existing behavior unless the task explicitly requires refactor

## Practical Contributor Workflows

### Workflow 1: Add a New UI Capability

1. identify the route and template involved in `client/src/app/`
2. update the UI and any consuming service logic
3. add or adjust Cypress coverage
4. validate role and tenant behavior
5. update user-facing docs if the workflow changed

### Workflow 2: Change an API Contract

1. update backend route or manager logic
2. update backend tests or fixtures
3. verify the frontend consumer still matches the response shape
4. update API docs or application docs where wording changed

### Workflow 3: Refresh User Manual Screenshots

1. ensure the testing stack builds
2. run the docs generation path
3. confirm screenshots land in `docs/screenshots/`
4. update the manual only after verifying actual generated filenames

## Related Documents

- [User Manual](./user_manual.md)
- [Introduction To Modules](./introduction_to_modules.md)
- [Introduction To Platform](./introduction_to_platform.md)
