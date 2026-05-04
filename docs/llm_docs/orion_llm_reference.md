(orion-llm-reference)=

# Orion LLM Reference

This is the canonical LLM-facing reference for Orion Intelligence. It consolidates app help, navigation guidance, feature workflows, API indexes, route maps, and source orientation into one Markdown document for retrieval and assistant grounding.

Use this file as the first retrieval document for assistant answers. It includes extensive app documentation in LLM-friendly form so assistants can explain navigation, feature use, troubleshooting, API options, and implementation ownership without needing the removed raw JSON or generated source dumps.

## Document Contract

- **Format:** Markdown only.
- **Audience:** LLM retrieval, support assistants, developers needing orientation, and operator-facing help.
- **Scope:** feature navigation, app help, workflow steps, access requirements, public API index, backend route map, frontend/backend source map, troubleshooting guidance, and retrieval rules.
- **Included app docs:** curated user manual content, module explanations, practical workflows, admin guidance, and developer orientation distilled for LLM responses.
- **Excluded:** raw JSON data, full request/response examples, full per-file inventories, generated source listings, dependency files, test fixture data, screenshots, and verbatim public-manual duplication.

## Answering Rules

1. For user navigation questions, answer from the Feature Reference before mentioning APIs or source files.
2. For workflow questions, give the route or UI area first, then concise steps, then visibility requirements if relevant.
3. For API questions, use the Public API Index for externally exposed operations and the Backend Route Map for implementation/source context.
4. For implementation questions, use the Source Map to choose files, then inspect the current repository before making claims.
5. Treat licenses, roles, tenant state, account status, and system settings as visibility gates.
6. Do not expose LLM-only docs in public ReadTheDocs navigation.
7. Prefer exact route names, endpoint paths, model names, and source file paths over broad descriptions.

## Retrieval Map

| User intent | Use this section | Notes |
| --- | --- | --- |
| Where is a feature? | Feature Reference | Match title, aliases, and route strings. |
| How do I complete a workflow? | Feature Reference and Application Help Deep Dive | Use the ordered steps, UI controls, and troubleshooting notes. |
| How does this screen work? | Application Help Deep Dive | Explain layout, controls, result states, and next actions. |
| Why can I not see a feature? | Troubleshooting And Visibility Matrix | Check roles, licenses, settings, tenant/account status. |
| Which public API do I call? | API Integration Guidance and Public API Index | These operations are exposed by `/openapi.json`. |
| Where is an API implemented? | Backend Route Map | Source file and handler names are listed. |
| Where should I edit code? | Source Map | Inspect code before changing behavior. |
| What is the product structure? | Product And Architecture | Use for high-level orientation. |

## Product And Architecture

Orion Intelligence is a threat-intelligence and investigation platform with an Angular frontend, a FastAPI backend, and service adapters for search, graph, document, tenant, alert, crawl, and enrichment workflows.

Core user areas include dashboard search, indexed investigation modules, live lookup modules, scanners, graph investigation, reports, tenant/profile administration, alert management, feeder management, documentation, and support links.

Core backend areas include route modules, interactive API managers, server/crawl managers, persistence/search service controllers, middleware, configuration, migrations, and tests.


## LLM Response Playbook

Use this playbook before composing user-facing answers. It helps keep responses consistent, direct, and grounded in the app model.

### Navigation Questions

When the user asks where to find something:

1. Name the feature or module.
2. Give the route or visible navigation path.
3. Mention the sidebar/profile/admin location if relevant.
4. Add the most likely visibility gate only when it matters.
5. Offer the next action in the screen.

Recommended shape:

- Start at `Dashboard` or the named sidebar group.
- Open the named module or profile/admin page.
- Use the control named in the relevant workflow.
- If it is missing, check role, license, tenant status, or deployment settings.

### Workflow Questions

When the user asks how to do a task:

1. Identify the best starting module.
2. Give 3 to 7 steps.
3. Name important controls exactly, such as `Advance`, `Tools`, `Match Semantic`, `Export`, `Download`, `Apply`, `Reset`, `Graph`, `List`, or `Flush All`.
4. Explain expected output or result state.
5. Add troubleshooting only after the workflow.

Do not answer workflow questions with backend file names unless the user is asking as a developer.

### Feature Visibility Questions

When the user says a feature is missing, hidden, disabled, redirected, or blocked:

1. Check role and tenant assignment.
2. Check license assignment for module-specific surfaces.
3. Check deployment settings such as documentation visibility, whistle-blowing visibility, onion address, and `ai_endpoint_enabled`.
4. Check account status, tenant verification, onboarding state, quota, subscription, or trial expiry.
5. For admin-only surfaces, verify whether the user is a tenant admin, maintainer, or higher-privilege user.

### Investigation Questions

When the user asks what module to use for an investigation:

| Starting artifact | Best first module | Follow-up pivots |
| --- | --- | --- |
| Broad topic, actor, event, organization, product | `Homepage`, `General Intelligence`, `Consolidated` | Reports, filters, CTI Graph |
| Email or identity exposure | `Data Breach`, `Entity API > Email Breach`, `Stealer Logs` | Breach report, stealer IOC, tenant IOC |
| Domain, IP, URL, host | `Network Intel`, `Web Scans`, `Consolidated > Network Intel` | DNS, subdomain, vulnerability, report export |
| Username, handle, profile image | `Social Intel`, `Social Scanner`, `Social` | Graph/list view, metadata, followers, external profile links |
| CVE, exploit, tool, product vulnerability | `Exploit`, `Network Intel`, `Web Scans` | Exploit report, vulnerability scan, CTI Graph |
| Leaked dump URL or source reference | `Dump`, `Data Breach`, `General Intelligence` | Listing review, breach detail, alerting |
| Tenant monitoring value | `Manage IOCs`, `Tenant Homepage`, `Alerts` | Scan all, export alerts, category alert cards |

### API Questions

When the user asks about API integration:

1. Use `Public API Index` for externally exposed operations.
2. Use `Backend Route Map` only when the user asks implementation/source details or hidden/internal routes.
3. Explain authentication as bearer-token based unless a specific endpoint is public.
4. For request/response shapes, inspect route models or the live `/docs` schema before giving exact payloads.
5. Mention async/polling behavior for scan-like operations where docs indicate queued or in-progress states.

### Developer Questions

When the user asks where to modify code:

1. Start with `Source Map` and `Backend Route Map`.
2. Identify the route, manager, service, frontend page, and Cypress coverage area.
3. Inspect current source before making claims about behavior.
4. Preserve role, license, tenant, and testing-mode behavior.
5. Update docs only when the user-facing workflow or API contract changes.

## Application Help Deep Dive

This section folds the public app documentation into the LLM reference so assistants can answer navigation, usage, and feature-help questions without relying on separate public manuals.

### Access, Session, And Onboarding

| Area | What users do | Help guidance |
| --- | --- | --- |
| Login | Sign in with account credentials and complete verification when configured. | If login fails, check account status, credentials, reset flow, and 2FA state. |
| Password Reset | Request a reset email, open the tokenized route, submit a new password. | New password validation can reject reused or weak values. Expired links require a new reset request. |
| Tenant Onboarding | Complete company information, seed IOC values, confirm setup, then enter the dashboard. | Onboarding can depend on tenant verification, enterprise license assignment, and initial user approval. |
| Two-Factor Authentication | Enable from account settings, view QR code, then complete OTP challenge on next login. | If 2FA blocks login, verify OTP setup state or ask an administrator to review the account. |
| Notifications | Open notification sidebar or alert details where available. | Notifications can link to tenant alert reports or category-specific alert details. |

### Main Application Layout

Orion opens inside the `dashboard` workspace after authentication. The main interface is organized around:

- **Left sidebar:** primary navigation for indexed modules, scans, graph tools, support links, profile pages, tenant pages, and admin pages.
- **Profile menu:** account settings, help/support, and logout entry points.
- **Global search area:** shared search box, advanced filters, tools, search mode controls, and selected-filter bars.
- **Result workspace:** cards, tables, report previews, analytics, pagination, empty/loading/no-result states, and report detail views.
- **Right-side or inline panels:** filters, insight panels, metadata sections, graph listings, modals, and popups.

The sidebar supports nested groups, collapsed and expanded display states, role-aware visibility, and license-aware module visibility. Users with different roles or licenses may see different menus in the same deployment.

### Global Search Controls

Most indexed modules share the same search model.

| Control | What it does | When to mention it |
| --- | --- | --- |
| Search box | Runs a free-text query in the current module context. | Any basic search workflow. |
| `Advance` | Opens advanced filtering below or beside the search bar. | When narrowing by network, content type, date, or structured fields. |
| `Tools` | Shows search behavior and sort controls. | When results are too broad, too narrow, or not ordered usefully. |
| `Match Semantic` | Uses semantic matching where supported. | Broad conceptual queries and exploratory search. |
| `Match any term (OR)` | Matches any supplied term. | Broader keyword search. |
| `Match individual terms (AND)` | Requires separate terms to match together. | Narrower multi-term search. |
| `Match full query` | Treats the full query as one phrase-like unit. | Exact or high-precision searches. |
| Selected-filter bar | Shows active filters and entity selections. | When explaining why results changed or how to clear filters. |

Advanced filters commonly support dropdowns, text input, date ranges, apply, reset, auto-apply, and manual-apply variants. Filtering affects result lists and can affect downstream report detail and metadata inspection.

### Result And Report Behavior

Indexed workflows are search-first, but most investigation paths eventually lead to a report page or modal.

Report pages commonly include:

- title, description, source URL, web reference, date, network, status, and tags
- metadata panels with extracted values grouped by category
- screenshot or JSON sections when the record supports them
- report toolbar actions such as download, export report, translation, AI summary, share, open source URL, and CTI graph pivot
- chat or AI summary controls when `ai_endpoint_enabled` is configured

The result workspace commonly supports:

- result counts, cards, tables, analytics, and insight panels
- pagination, load more, see more, see less, and row expansion
- empty, loading, no-result, and validation states
- return-to-list behavior after opening reports
- JSON-backed record inspection for technical review

### Indexed Module Help

| Module | Best for | Views and controls | Common next action |
| --- | --- | --- | --- |
| `Consolidated` | First-pass triage across multiple channels. | `IOCs`, `Deep Search`, `Network Intel`, grouped results, right-side insights. | Expand threat cards, open reports, use domain scanner, download IOC results. |
| `General Intelligence` | Broad topic, actor, organization, product, event, or mixed-source research. | `All`, `General`, `Forums`, `News`, `Stolen`, `Drugs`, `Hacking`, `Marketplaces`, `Cryptocurrency`, `Leaks`. | Filter by content/network/date, open report, pivot to graph. |
| `Data Breach` | Breach records, exposed identities, email checks. | `All`, `Databases`, `Tracking`. | Search email or identity, open breach detail, use Stealer Logs for deeper credential evidence. |
| `Defacement` | Hacked, altered, cloned, phishing, or compromised websites. | `All`, `Hacked`, `Phishing`, `Databases`. | Review target URL, defacer, team, IP, location, metadata, JSON. |
| `Social` | Social and community-source intelligence. | `All`, `Telegram`, `Twitter`, `Mastodon`, `Pastebin`, `Forum`, `Reddit`. | Track chatter, platform context, leak references, and report metadata. |
| `Exploit` | Vulnerability and exploit-related intelligence. | `All`, `CVE`, `Tools`, `ZeroDay`. | Search CVE/tool/product, open exploit report, pivot to Network Intel or Web Scans. |
| `Feed` | News-style intelligence stream and current reporting. | `News`. | Query current coverage, open report, inspect JSON-backed detail. |
| `Dump` | Dump listings, leak URLs, source references. | `Listing`, direct leak-URL search, page-level filters. | Browse listings, search a leak URL, review channel or source references. |
| `Stealer Logs` | Infostealer-derived credential and IOC hunting. | `Basic`, `Advanced`, tag filters, row expansion, result metrics. | Search domain/email/IP, build compound filters, download results, inspect password schemes. |

### Stealer Logs Details

Stealer Logs supports `Basic` and `Advanced` search modes.

- Basic mode supports tags such as `All`, `Domain`, `Email`, `Credit Card`, and `IP`.
- Advanced mode uses row-based conditions with `WHERE`, `AND`, and `OR`.
- Result metrics can include elapsed time, total results, asset count, and aggregate count.
- Supporting actions include password scheme view, domain/subdomain helper, result download, and row expansion.
- Use this module when the user already has a domain, email, IP, or credential artifact and needs deeper evidence.

### Live Lookup And Scan Help

| Module | Use when the user has | Output style | Important notes |
| --- | --- | --- | --- |
| `Entity API > Email Breach` | Email address. | Live breach validation. | Use for one-off checks; Data Breach is better for broader indexed searching. |
| `Entity API > Social Scanner` | Username or handle. | Social profile lookup. | Social Intel is better for graph expansion. |
| `Entity API > Wanted List` | Person or identity query. | Wanted-person lookup. | Good for direct identity checks. |
| `Entity API > National Identity` | National identity fields. | Identity lookup result. | Availability depends on deployment and license. |
| `Entity API > Playstore Scanner` | Android package or app query. | App metadata and risk context. | Pair with APK Scan for uploaded APK files. |
| `Entity API > Software Scanner` | Software or package name. | Software credential or exposure context. | Useful for product-oriented searches. |
| `Entity API > File Scanner` | PDF, text, image, or supported file. | Grouped IOC extraction. | Handles file type and size validation. |
| `Entity API > Crypto Scanner` | Wallet address or transaction hash. | Crypto address or transaction context. | Use for blockchain artifact checks. |
| `Web Scans` | Domain, repository URL, web target, APK. | Scan report with findings and evidence. | Reports can include grade, ports, TLS, severity, confidence, export, and print. |
| `Network Intel` | Domain, IP, infrastructure target. | Recon, IP scan, vulnerability, geo-assisted results. | Supports host recon, IP scan, vulnerability scan, download, cancel, and geo modal paths. |

### Web Scans And Network Intel

Web Scans follow a standard flow: enter target, run scan, wait for progress, review report, then download or print if needed. Reports can include security grade, host, port, TLS status, scan metadata, findings, evidence, and severity.

Network Intel is infrastructure-focused and commonly includes:

- `Host Recon` for domain-to-infrastructure context
- `IP Scan` for service and infrastructure context around an IP
- `Vulnerability Scan` for target findings, elapsed time, cancel support, and downloadable output
- Geo IoT modal support for map/manual coordinates, radius, max-IP count, and selected-coordinate reuse

If a scan fails, advise the user to verify target format, retry, check service readiness, reduce scope, or export any partial result if the UI provides one.

### Graph Investigation Help

| Graph module | Best for | Major controls | Answering guidance |
| --- | --- | --- | --- |
| `CTI Graph` | Cyber relationship mapping between clusters, documents, properties, and grouped nodes. | Sessions, filters, node search, graph/list views, listings panel, physics toggle, import/export, report export, context menu. | Use after a promising record or relation has been found in search. Explain graph view vs list view. |
| `Social Intel` | Username/profile/platform relationship mapping. | Sessions, graph/list views, add entity, manage profiles, image recon, summary popup, metadata search, followers/following, aliases, exports. | Use for profile mapping, image-based profile discovery, and related-account expansion. |

CTI Graph is useful when the investigation is no longer a single search result and the user needs relationships, clusters, entity pivots, or exportable graph evidence.

Social Intel is a multi-state workspace, not just one graph screen. It can start from a username, image, manually added entity, or previous scan job. It supports graph and list review, profile summaries, metadata search, follower/following imports, aliases, context menus, and relationship popups.

Recommended Social Intel workflow:

1. Start with a known username or uploaded image.
2. Fetch initial profile candidates.
3. Review and filter profiles in the manage-profiles modal.
4. Push selected profiles into the graph.
5. Switch between graph and list views.
6. Open summary and metadata popups.
7. Fetch followers, following, or images where useful.
8. Add aliases or custom entities if the graph needs cleanup.
9. Export the session when done.

### Profile, Tenant, And Alert Help

| Area | Purpose | Important controls |
| --- | --- | --- |
| `Account Settings` | Current-user profile, avatar, username, role, tenant/location, licenses, 2FA, theme, version. | Avatar upload, theme toggle, 2FA toggle, logout/login challenge. |
| `Tenant Homepage` | Tenant alert summary and monitoring dashboard. | Alert export, scan all, flush all, risk summary cards, category alert cards, IOC counts. |
| `Manage IOCs` | Tenant-maintained monitored values for alerting and scanning. | Category tabs, search, add values, remove values, clear all values. |
| `Tenant Settings` | Tenant identity, contact, quota, image, assigned licenses. | Upload image, edit phone/country/city/state, review license and quota. |
| `Users` | Tenant user management. | Table/card view, add user, expand row, status change, license edit, delete, quota limits. |
| `Tenants` | Platform-level tenant administration. | Verification state, quota, status, license assignment, tenant detail editing. |
| `Audit Logs` | Activity trail across user and tenant actions. | Export, date filters, pagination, reset. |
| `System Settings` | Platform branding, visibility, URLs, runtime indicators. | Logos, app name, language, onion address, docs visibility, whistle-blowing visibility, API allowed, AI endpoint enabled. |

Tenant monitoring depends on IOC quality. If alert results are poor, advise the user to review `Manage IOCs`, tenant licenses, alert categories, and scan/flush actions.

System Settings can reject oversized image uploads. The documented validation limit for the authentication dashboard icon is `1 MB`.

### Links, Support, And External Navigation

| Entry | Behavior | Notes |
| --- | --- | --- |
| `Directory` or `Links` | Browsing-oriented view of monitored live services and related records. | Supports filters, pagination, progressive loading, and date filtering. |
| `Support` | In-app help/support modal from the profile menu. | Users can enter email, subject, and message. |
| `Onion Link` | Opens configured onion endpoint. | External access bridge; depends on system metadata. |
| `Whistle Blowing` | Opens configured reporting portal. | External reporting workflow; visibility depends on settings. |
| `Documentation` | Opens published docs. | Public docs remain outside the LLM-only docs package. |

### Practical App Workflows

#### Broad Investigation

1. Start in `Homepage`, `General Intelligence`, or `Consolidated`.
2. Enter a keyword, organization, actor, product, or event.
3. Use `Advance` and sidebar filters to narrow results.
4. Switch search mode if results are too broad or too narrow.
5. Open a report.
6. Review metadata, JSON, and insights.
7. Pivot to CTI Graph if relationships matter.

#### Identity Exposure Check

1. Open `Data Breach`, `Entity API > Email Breach`, or `Stealer Logs`.
2. Search the email, username, domain, or identity value.
3. Review breach or credential evidence.
4. Open detailed reports where available.
5. Add important values to tenant IOCs if monitoring is needed.

#### Infrastructure Review

1. Open `Network Intel` or `Web Scans`.
2. Enter a domain, IP, URL, repository, or APK target.
3. Run host recon, IP scan, vulnerability scan, or web scan.
4. Review severity, evidence, TLS, ports, and metadata.
5. Export or download the report for sharing.

#### Profile Mapping

1. Open `Social Intel`.
2. Scan a username or upload an image.
3. Review candidate profiles in manage-profiles.
4. Push selected profiles to the graph.
5. Use summary, metadata, followers, following, aliases, and external links.
6. Export the session.

#### Tenant Monitoring

1. Configure monitored values in `Manage IOCs`.
2. Review summaries from the tenant homepage.
3. Open category alert reports.
4. Export alerts or flush/scan where appropriate.
5. Update IOC lists and tenant/user licenses as needs change.

## Troubleshooting And Visibility Matrix

| User symptom | Likely cause | Assistant response guidance |
| --- | --- | --- |
| Feature missing from sidebar | Role, license, tenant status, subscription state, or system setting. | Ask what role/license the user has, then point to tenant/admin settings or license assignment. |
| User redirected to onboarding | Tenant setup incomplete or verification/license not finished. | Explain the onboarding sequence and ask admin to verify tenant state if blocked. |
| Search returns no results | Query too narrow, filters active, date range empty, source not indexed. | Tell user to clear filters, switch search mode, broaden query, or use Consolidated. |
| Results too broad | Semantic/OR mode too loose or no filters. | Suggest AND/full-query mode, content/network filters, and date range. |
| Report lacks AI summary/chat | AI endpoint disabled or license/settings unavailable. | Check `ai_endpoint_enabled`, module license, and deployment config. |
| Upload fails | Unsupported type, file too large, or scanner validation. | Verify file type/size and use scanner-specific reset or `Analyze Another File`. |
| Scan is slow or stuck | Scan target scope, backend readiness, network service delay. | Suggest checking target format, cancel/retry, or waiting for polling/final status. |
| Directory appears empty | Filters active, no monitored entries, network/content/date mismatch. | Reset filters and verify monitored source availability. |
| Stealer Logs blocked | Subscription/license/paywall state. | Check module license and account subscription state. |
| Admin page unavailable | User lacks admin/maintainer role or tenant permission. | Direct user to tenant administrator or platform maintainer. |
| System image upload error | File too large, wrong image, or asset validation. | Mention `1 MB` guardrail for the authentication dashboard icon and retry with smaller image. |
| External links not visible | System metadata not configured or hidden by deployment setting. | Check onion, documentation, whistle-blowing, data-source, adversaries, and pricing URLs in System Settings. |

## API Integration Guidance

The LLM reference keeps API details compact. Use this section to choose the right API family, then use the Public API Index below for exact exposed paths.

### API Families

| Family | User workflow it supports | Typical operations |
| --- | --- | --- |
| System Info | Directory, dumps, insight dashboards. | `GET /api/directory`, `GET /api/dumps`, `GET /api/insight`, country insight. |
| Reports | Opening report detail from indexed results. | `GET /api/search/<module>/{doc_id}`, breach screenshot, STIX export. |
| Search | Indexed search modules and consolidated search. | Strategic, breach, social, exploit, defacement, stealer IOC, consolidated. |
| Entity Scans | Live lookup and scan modules. | Dynamic email, cracked, software, social, wanted, national identity, IOC extract, APK, crypto. |
| Network Intelligence | Domain/IP/vulnerability/geo recon. | Resolve IP, IP scanner, URL vulnerability scan, IoT detect, camera range scan. |
| Social Search | Social Intel and social lookup enrichment. | Recon, profile, images, reverse image, followers, following, posts, metadata. |
| Support Methods | Supporting pivots from scan and consolidated flows. | Subdomain scan, DNS scan, wayback, cross search. |
| Crawler/Ingestion | SIEM or crawler ingestion workflows. | Batch injection and index ingestion endpoints. |

### Public API Vs Backend Route Map

- Use Public API Index for external integration and user-facing API answers.
- Use Backend Route Map when a route is internal, hidden from OpenAPI, admin-only, test-only, or implementation-specific.
- Routes hidden from `/openapi.json` may still exist in `backend/routes` and may be consumed by the frontend.
- For exact payloads, inspect route models and the live OpenAPI schema. This reference intentionally avoids full JSON examples.

### Auth And Response Notes

- Most API calls require bearer-token authentication.
- Public configuration and static resource endpoints may not use the same auth requirement.
- Validation errors commonly appear as structured `422` responses.
- Unauthorized or forbidden paths commonly return `401` or `403` style errors.
- Scan-like APIs can expose progress, polling, queued, or final-result states depending on the operation.
- File and image operations can enforce type and size validation.

## Developer And Source Guidance

For developer-facing answers, tie the user-visible workflow back to the code area.

| Change type | Start in | Also inspect |
| --- | --- | --- |
| Frontend route or screen | `client/src/app/pages`, `client/src/app/app.routes.ts` | Shared components, services, Cypress specs. |
| Search behavior | `backend/routes/api_routes.py`, search managers, Elasticsearch controller | Frontend search services, filters, result components, fixtures. |
| Report detail | Report route handlers and backend models | Report page components, metadata/JSON viewers, toolbar actions. |
| Tenant/user/admin behavior | `backend/routes/tenant_routes.py`, tenant/account managers | Profile/admin pages, role/license UI visibility, Cypress tenant tests. |
| Auth/session/2FA | `backend/routes/auth_routes.py`, auth/account managers | Login/reset/account UI, session handling, Cypress auth tests. |
| Feeder behavior | `backend/routes/crawl_routes.py`, feeder manager | Feeder UI, owner/enable/disable/delete flows. |
| AI/chat behavior | `backend/routes/api_micros.py`, AI endpoint checks | Report chat UI, AI workspace, `ai_endpoint_enabled`. |
| Graph behavior | Graph managers and CTI/social pages | Canvas/list views, session import/export, context menus. |
| Documentation screenshots | `docs/e2e`, `docs/screenshots`, `docs/scripts/postprocess_screenshots.py`, `run.sh` | Cypress docs screenshot workflow. |

Keep code-change responses scoped. Orion behavior is role-aware, tenant-aware, and license-aware, so verify the affected user states before calling a change complete.

## Feature Reference

Feature count: **74**.

Every feature entry uses the same structure:

- `Feature ID`
- `User asks for`
- `Where to go`
- `Roles`
- `Licenses`
- `Settings`
- optional related backend APIs
- `Workflow`
- `Visibility And Troubleshooting`

Keep this shape for new features so LLM responses can reliably describe any feature using the same fields.

### Feature Index

| Feature | Category | Routes | Common user wording |
| --- | --- | --- | --- |
| [Login](#login) | Access And Onboarding | `/login` | sign in, log in, authentication, access account |
| [Signup](#signup) | Access And Onboarding | `/signup` | register, create account, tenant signup, new account |
| [Welcome And Email Verification](#welcome-and-email-verification) | Access And Onboarding | `/welcome, /welcome/:token` | welcome, email verification, activate account, invite link, verification token |
| [Password Reset](#password-reset) | Access And Onboarding | `/reset, /reset/:token` | forgot password, reset password, change forgotten password |
| [Two-Factor Authentication](#two-factor-authentication) | Access And Onboarding | `/login, /dashboard/profile/account` | 2fa, two factor, otp, authenticator app, qr code |
| [Tenant Onboarding](#tenant-onboarding) | Access And Onboarding | `/onboarding` | onboarding, company setup, tenant setup, first login setup |
| [Notification Page](#notification-page) | Access And Onboarding | `/notification` | notification page, confirmation message, request submitted, password reset sent |
| [Subscription And Trial Notices](#subscription-and-trial-notices) | Access And Onboarding | `/paymentGateway, subscription request modal, trial banner` | subscription, trial, paywall, upgrade, pro subscription, expiring account |
| [Sidebar And Global Navigation](#sidebar-and-global-navigation) | Overview | `dashboard sidebar` | sidebar, navigation, menu, collapsed sidebar, role visibility, license visibility |
| [Profile Menu And Logout](#profile-menu-and-logout) | Overview | `profile menu` | profile menu, sign out, logout, notifications, help menu |
| [Homepage](#homepage) | Overview | `/dashboard, /dashboard/home, /dashboard/profile/homepage` | home, dashboard home, landing page, overview |
| [Homepage Heatmap And Country Insight](#homepage-heatmap-and-country-insight) | Overview | `/dashboard/home, /dashboard/profile/homepage` | heatmap, world map, country insight, country report, map tooltip |
| [Statistics](#statistics) | Overview | `/dashboard/profile/statistics` | statistics, profile statistics, insights overview, visual overview |
| [Global Search](#global-search) | Search And Investigation | `/dashboard/home, /dashboard/profile/homepage, /dashboard/consolidated/all` | search bar, advanced search, filters, match type, semantic search |
| [Consolidated Investigation](#consolidated-investigation) | Search And Investigation | `/dashboard/consolidated/all, /dashboard/profile/consolidated/all` | consolidated, search everything, deep search, ioc search, all results, cross module search |
| [General Intelligence](#general-intelligence) | Indexed Investigation Modules | `/dashboard/strategic/all, /dashboard/strategic/:category` | strategic, general search, general intelligence, news search, forums, marketplaces, crypto intelligence |
| [Data Breach](#data-breach) | Indexed Investigation Modules | `/dashboard/breach/all, /dashboard/breach/:category` | breach, data breach, databases, tracking, exposed credentials, leaked identity |
| [Discussion And Social Search](#discussion-and-social-search) | Indexed Investigation Modules | `/dashboard/discussion/all, /dashboard/social/all, /dashboard/social/:category` | discussion, social, telegram, twitter, mastodon, pastebin, forum, reddit |
| [Feed](#feed) | Indexed Investigation Modules | `/dashboard/feed/news, /dashboard/feed/:category` | feed, news feed, intelligence feed, recent reports |
| [Exploit Intelligence](#exploit-intelligence) | Indexed Investigation Modules | `/dashboard/exploit/all, /dashboard/exploit/cve, /dashboard/exploit/tools, /dashboard/exploit/zeroday` | exploit, cve, vulnerability, zeroday, zero day, tools |
| [Defacement](#defacement) | Indexed Investigation Modules | `/dashboard/defacement/all, /dashboard/defacement/hacked, /dashboard/defacement/phishing, /dashboard/defacement/databases` | defacement, hacked website, phishing, compromised website, defacer |
| [Dump Listings](#dump-listings) | Indexed Investigation Modules | `/dashboard/dump/listing` | dump, leak listing, dump listing, leak catalog |
| [Credential Dump](#credential-dump) | Indexed Investigation Modules | `/dashboard/dump/credential` | credential dump, dump credentials, leaked username password, credential records |
| [Stealer Logs](#stealer-logs) | Indexed Investigation Modules | `/dashboard/stealerlogs/iocs` | stealer logs, stealerlogs, credential iocs, stolen credentials |
| [Entity API Overview](#entity-api-overview) | Live Lookup Modules | `/dashboard/api` | entity api, live api, lookup tools, entity lookup |
| [Email Breach](#email-breach) | Live Lookup Modules | `/dashboard/api/email-breach` | email breach, email lookup, breached email, check email |
| [Social Scanner](#social-scanner) | Live Lookup Modules | `/dashboard/api/social-scanner` | social scanner, username lookup, profile lookup, handle lookup |
| [Wanted List](#wanted-list) | Live Lookup Modules | `/dashboard/api/wanted-list` | wanted list, wanted scan, person lookup |
| [National Identity](#national-identity) | Live Lookup Modules | `/dashboard/api/national-identity` | national identity, identity lookup, national id |
| [Playstore Scanner](#playstore-scanner) | Live Lookup Modules | `/dashboard/api/playstore-scanner` | playstore scanner, android app lookup, app scanner, package lookup |
| [Software Scanner](#software-scanner) | Live Lookup Modules | `/dashboard/api/software-scanner` | software scanner, software lookup, package scanner |
| [File Scanner](#file-scanner) | Live Lookup Modules | `/dashboard/api/file-scanner` | file scanner, file analysis, extract iocs from file, ioc extraction |
| [Text Analysis](#text-analysis) | Live Lookup Modules | `/dashboard/api/text-analysis` | text analysis, spam analysis, malicious url analysis, nexus analyze text |
| [Crypto Scanner](#crypto-scanner) | Live Lookup Modules | `/dashboard/api/crypto-scanner` | crypto scanner, cryptocurrency address, wallet lookup, crypto analysis |
| [Web Scans](#web-scans) | Scan Modules | `/dashboard/scanner, /dashboard/scan` | web scans, scan menu, scanner, web target scanning |
| [Basic Web Scan](#basic-web-scan) | Scan Modules | `/dashboard/scan` | scan, web scan, basic scan, website scan |
| [Port Scan](#port-scan) | Scan Modules | `/dashboard/scan?scanType=advanced` | port scan, advanced scan, service scan, open ports |
| [Network Intel](#network-intel) | Scan Modules | `/dashboard/netint, /dashboard/scanner/network-scan` | network intel, network scan, host recon, ip scan, vulnerability scan, infrastructure recon |
| [Geo Fencing](#geo-fencing) | Scan Modules | `/dashboard/netint` | geo fencing, geo iot, camera detection, coordinate scan, geo cameras |
| [Domain Scanner Support Methods](#domain-scanner-support-methods) | Scan Modules | `domain scanner helper, supported report pivots` | subdomains, ip lookup, wayback, domain helper, support methods |
| [Repository Scan](#repository-scan) | Scan Modules | `/dashboard/scanner/repository-scan` | repository scan, repo scan, code scan |
| [SEO Scan](#seo-scan) | Scan Modules | `/dashboard/scanner/seo-scan` | seo scan, metadata scan, website metadata |
| [APK Scan](#apk-scan) | Scan Modules | `/dashboard/scanner/apk-scan` | apk scan, android apk analysis, mobile app analysis, apk iocs |
| [AI Workspace](#ai-workspace) | AI Features | `/dashboard/profile/ai` | ai, ai workspace, chat ai, ai assistant, llm, summarize |
| [AI Report Summary](#ai-report-summary) | AI Features | `report pages` | ai summary, summarize report, report summary, ai suggest |
| [Report Chat](#report-chat) | AI Features | `supported report pages` | report chat, ai chat, chat with report, ask report, nexus chat |
| [Report Pages And Metadata](#report-pages-and-metadata) | Reports | `indexed report routes, /dashboard/*/:category/:m_hash` | report page, report detail, metadata, report content, open result |
| [Report Toolbar](#report-toolbar) | Reports | `report pages` | download report, export report, translate, share, open source, cti graph pivot |
| [Result Insights Side Panel](#result-insights-side-panel) | Reports | `/dashboard/consolidated/all, supported result pages` | insights panel, keyword insights, extracted data, unique urls, actor search |
| [Report JSON And Screenshot Review](#report-json-and-screenshot-review) | Reports | `supported report pages` | json viewer, screenshot, raw record, report mapping, breach screenshot |
| [CTI Graph](#cti-graph) | Graph Investigation | `/dashboard/ctigraph` | cti graph, graph, relationship graph, entity graph, threat graph |
| [Social Intel](#social-intel) | Graph Investigation | `/dashboard/social-intel, /dashboard/social-graph` | social intel, social graph, social mapper, profile graph, username graph |
| [Tenant Homepage And Alert Summary](#tenant-homepage-and-alert-summary) | Profile And Alerts | `/dashboard/profile/homepage` | tenant homepage, alert summary, profile homepage, monitored alerts |
| [Profile Consolidated View](#profile-consolidated-view) | Profile And Alerts | `/dashboard/profile/consolidated/all` | profile consolidated, profile search, tenant consolidated, profile investigation |
| [Alerts](#alerts) | Profile And Alerts | `/dashboard/profile/alerts/:type` | alerts, alert report, tenant alerts, ioc alerts |
| [Alert Notifications Sidebar](#alert-notifications-sidebar) | Profile And Alerts | `profile notification bell, notification sidebar` | notifications, notification sidebar, alert notification, see details, clear all |
| [Add Custom Alert](#add-custom-alert) | Profile And Alerts | `/dashboard/profile/addcustomalert` | add alert, custom alert, monitor value, new alert |
| [Manage IOCs](#manage-iocs) | Profile And Alerts | `/dashboard/profile/ioc` | ioc, manage iocs, tenant iocs, monitored indicators |
| [Account Settings](#account-settings) | Settings | `/dashboard/profile/account` | account, profile settings, theme, 2fa, profile visibility, avatar |
| [Tenant Settings](#tenant-settings) | Settings | `/dashboard/profile/tenant-settings` | tenant settings, tenant branding, company settings |
| [System Settings](#system-settings) | Settings | `/dashboard/profile/system-settings` | system settings, branding, app name, language, ai endpoint enabled, documentation allowed, onion address |
| [Users](#users) | Administration | `/dashboard/profile/users, /dashboard/tenant/view-profiles` | users, manage users, view profiles, tenant users |
| [User Activity](#user-activity) | Administration | `/dashboard/profile/user/:user_id` | user activity, profile activity, user profile |
| [Tenant Administration](#tenant-administration) | Administration | `/dashboard/tenant/view-tenants` | tenant administration, view tenants, all tenants |
| [Tenant Profile Page](#tenant-profile-page) | Administration | `/dashboard/profile/tenant` | tenant profile, current tenant, tenant details, tenant state |
| [Audit Logs](#audit-logs) | Administration | `/dashboard/profile/auditlog, /dashboard/tenant/auditlog` | audit logs, auditlog, activity log, admin logs |
| [Event Management](#event-management) | Administration | `/dashboard/profile/event-management` | event management, events |
| [Feeder Management](#feeder-management) | Administration | `/dashboard/profile/feeder` | feeder, feeder scripts, crawler scripts, upload script, script owner |
| [Directory](#directory) | Support And Documentation | `/dashboard/directory` | directory, monitored services, resource catalog, service references |
| [Links](#links) | Support And Documentation | `/dashboard/directory` | links, link directory, resources, external links |
| [Support](#support) | Support And Documentation | `support overlay` | support, help and support, contact support, help, support modal |
| [Documentation](#documentation) | Support And Documentation | `sidebar documentation link, /docs` | documentation, docs, manual, help center, feature guide |
| [Onion Link](#onion-link) | Support And Documentation | `sidebar onion link` | onion, tor, onion link, dark web link |
| [Whistle Blowing](#whistle-blowing) | Support And Documentation | `sidebar whistle blowing link` | whistle blowing, whistleblowing, report leak, anonymous report |

### Access And Onboarding

#### Login

- **Feature ID:** `login`
- **User asks for:** sign in; log in; authentication; access account
- **Where to go:** `/login`
- **Roles:** `all`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open the login page.
2. Enter username or email.
3. Enter password.
4. Complete verification if configured.
5. Continue to the dashboard.

**Visibility And Troubleshooting**

- Confirm the account is active.
- Use password reset if credentials are unknown.
- Ask an administrator to verify account status.

#### Signup

- **Feature ID:** `signup`
- **User asks for:** register; create account; tenant signup; new account
- **Where to go:** `/signup`
- **Roles:** `public`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open the signup page.
2. Enter required user and company information.
3. Submit the form.
4. Complete email verification if required.
5. Wait for tenant or administrator approval when configured.

**Visibility And Troubleshooting**

- Some deployments disable public signup.
- Ask an administrator to create the account if signup is unavailable.

#### Welcome And Email Verification

- **Feature ID:** `welcome_email_verification`
- **User asks for:** welcome; email verification; activate account; invite link; verification token
- **Where to go:** `/welcome`, `/welcome/:token`
- **Roles:** `public`, `tenant users`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open the welcome link from email or invitation.
2. Confirm the verification token is present when required.
3. Complete the welcome or activation step.
4. Continue to login.
5. Sign in after the account is active.

**Visibility And Troubleshooting**

- Request a new invite or verification link if the token is expired.
- Confirm the tenant or administrator has approved the account.
- Use the notification page for confirmation or error messages after activation actions.

#### Password Reset

- **Feature ID:** `password_reset`
- **User asks for:** forgot password; reset password; change forgotten password
- **Where to go:** `/reset`, `/reset/:token`
- **Roles:** `public`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open the reset page.
2. Enter the registered email address.
3. Submit the request.
4. Open the reset link from email.
5. Enter and confirm the new password.
6. Return to login.

**Visibility And Troubleshooting**

- Check email delivery.
- Request a new reset link if the token expired.

#### Two-Factor Authentication

- **Feature ID:** `two_factor_authentication`
- **User asks for:** 2fa; two factor; otp; authenticator app; qr code
- **Where to go:** `/login`, `/dashboard/profile/account`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** account preference

**Workflow**

1. Open Account Settings.
2. Enable two-factor authentication if the control is available.
3. Sign out and return to login.
4. Scan the QR code or use the displayed secret in an authenticator app.
5. Enter the OTP code and verify login.

**Visibility And Troubleshooting**

- Confirm the user is entering the current six-digit authenticator code.
- Ask an administrator to review the account if the user loses 2FA access.
- Check clock drift on the authenticator device if codes are rejected.

#### Tenant Onboarding

- **Feature ID:** `tenant_onboarding`
- **User asks for:** onboarding; company setup; tenant setup; first login setup
- **Where to go:** `/onboarding`
- **Roles:** `tenant users`
- **Licenses:** `tenant license`
- **Settings:** none

**Workflow**

1. Open onboarding after login.
2. Enter tenant or company information.
3. Add initial IOC values when requested.
4. Confirm setup.
5. Continue to the dashboard.

**Visibility And Troubleshooting**

- Confirm tenant assignment.
- Confirm the tenant has an active license.
- Ask an administrator to verify onboarding state.

#### Notification Page

- **Feature ID:** `notification_page`
- **User asks for:** notification page; confirmation message; request submitted; password reset sent
- **Where to go:** `/notification`
- **Roles:** `public`, `tenant users`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Complete a flow that redirects to notification.
2. Read the confirmation, error, or next-step message.
3. Follow the prompted action, such as checking email or returning to login.
4. Retry the originating flow if the message indicates failure.

**Visibility And Troubleshooting**

- Confirm query parameters or route state were preserved during redirect.
- Re-run the source workflow if the page is missing expected message text.
- For password reset, request a new email if the notification confirms delivery but no email arrives.

#### Subscription And Trial Notices

- **Feature ID:** `subscription_trial_notices`
- **User asks for:** subscription; trial; paywall; upgrade; pro subscription; expiring account
- **Where to go:** `/paymentGateway`, `subscription request modal`, `trial banner`
- **Roles:** `demo`, `member`, `admin`
- **Licenses:** `module license`, `enterprise`, `trial`
- **Settings:** `home_header_pricing_allowed`, pricing URL

**Workflow**

1. Try to open a module that requires a missing license.
2. Review the subscription, paywall, or trial warning.
3. Submit a subscription request if the modal is shown.
4. Follow pricing or administrator guidance.
5. Return to the module after the license is granted.

**Visibility And Troubleshooting**

- Confirm the user has the required module license.
- Admin users can review or assign tenant and user licenses.
- Near-expiry banners can appear before access changes.


### Overview

#### Sidebar And Global Navigation

- **Feature ID:** `sidebar_global_navigation`
- **User asks for:** sidebar; navigation; menu; collapsed sidebar; role visibility; license visibility
- **Where to go:** `dashboard sidebar`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** depends on module
- **Settings:** sidebar preference, role and license visibility

**Workflow**

1. Open the dashboard.
2. Expand or collapse the sidebar.
3. Open a module group.
4. Select a subcategory or direct module link.
5. Use profile, data collection, scan, graph, and support sections according to visible permissions.

**Visibility And Troubleshooting**

- Sidebar content changes by role, license, tenant state, and mobile mode.
- If a module is missing, verify the user role and assigned license.
- Some graph and external links open in a new tab.

#### Profile Menu And Logout

- **Feature ID:** `profile_menu_logout`
- **User asks for:** profile menu; sign out; logout; notifications; help menu
- **Where to go:** `profile menu`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open the profile menu from the dashboard header.
2. Open notifications, support, account settings, or sign out.
3. Use Sign out to end the session.
4. Return to login when redirected.

**Visibility And Troubleshooting**

- If the menu does not open, refresh the dashboard session.
- Notifications depend on tenant alert data.
- Support visibility can depend on deployment settings.

#### Homepage

- **Feature ID:** `homepage`
- **User asks for:** home; dashboard home; landing page; overview
- **Where to go:** `/dashboard`, `/dashboard/home`, `/dashboard/profile/homepage`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open the dashboard homepage.
2. Use the global search input for broad investigation.
3. Select IOCs, Deep Search, or Network Intelligence if shown.
4. Review overview cards and insights.
5. Open a card, alert, or result for details.

**Visibility And Troubleshooting**

- Homepage content varies by role, tenant, license, and onboarding state.

#### Homepage Heatmap And Country Insight

- **Feature ID:** `homepage_heatmap_country_insight`
- **User asks for:** heatmap; world map; country insight; country report; map tooltip
- **Where to go:** `/dashboard/home`, `/dashboard/profile/homepage`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** insight data availability
- **Related backend APIs:** `/api/insight/country`

**Workflow**

1. Open the homepage.
2. Review the world heatmap.
3. Hover a country to view tooltip details.
4. Click a country to open the country-level report.
5. Close the report with the close button or overlay.

**Visibility And Troubleshooting**

- Heatmap output depends on available insight and country data.
- If the report is empty, confirm the backend has country insight records.
- Mobile or compact view can change heatmap interaction behavior.

#### Statistics

- **Feature ID:** `statistics`
- **User asks for:** statistics; profile statistics; insights overview; visual overview
- **Where to go:** `/dashboard/profile/statistics`
- **Roles:** `member`, `admin`
- **Licenses:** `maintainer or elevated profile access`
- **Settings:** insight data availability
- **Related backend APIs:** `/api/insight`

**Workflow**

1. Open Profile -> Statistics.
2. Review visual insight cards and summary metrics.
3. Compare statistics with homepage insight areas if needed.
4. Pivot to matching modules for detail.

**Visibility And Troubleshooting**

- If hidden, confirm profile role and license visibility.
- Empty statistics usually mean no insight data is available yet.
- Admin users may not see tenant-only profile statistics in the sidebar.


### Search And Investigation

#### Global Search

- **Feature ID:** `global_search`
- **User asks for:** search bar; advanced search; filters; match type; semantic search
- **Where to go:** `/dashboard/home`, `/dashboard/profile/homepage`, `/dashboard/consolidated/all`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open a search-capable module.
2. Enter the query.
3. Choose search mode if needed.
4. Turn on Advance for filters.
5. Apply filters.
6. Submit.
7. Open a result report.

**Visibility And Troubleshooting**

- Remove filters if no results appear.
- Use Match any term for broader matching.
- Try Consolidated for cross-module discovery.

#### Consolidated Investigation

- **Feature ID:** `consolidated`
- **User asks for:** consolidated; search everything; deep search; ioc search; all results; cross module search
- **Where to go:** `/dashboard/consolidated/all`, `/dashboard/profile/consolidated/all`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Consolidated.
2. Enter an IOC, domain, email, username, hash, organization, or keyword.
3. Submit the search.
4. Review IOCs, Deep Search, and Network Intel tabs.
5. Use filters.
6. Open relevant reports.

**Visibility And Troubleshooting**

- If hidden, confirm subscription access.
- Try General Intelligence if Consolidated is not available.


### Indexed Investigation Modules

#### General Intelligence

- **Feature ID:** `general_intelligence`
- **User asks for:** strategic; general search; general intelligence; news search; forums; marketplaces; crypto intelligence
- **Where to go:** `/dashboard/strategic/all`, `/dashboard/strategic/:category`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open General Intelligence.
2. Start with All unless a category is known.
3. Search a keyword, actor, organization, domain, product, event, or phrase.
4. Use filters.
5. Open a report.

**Visibility And Troubleshooting**

- Use Consolidated for broader cross-module search.
- Use Feed for stream-style news reading.

#### Data Breach

- **Feature ID:** `data_breach`
- **User asks for:** breach; data breach; databases; tracking; exposed credentials; leaked identity
- **Where to go:** `/dashboard/breach/all`, `/dashboard/breach/:category`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Data Breach.
2. Choose All, Databases, or Tracking.
3. Search an email, username, organization, domain, credential marker, or keyword.
4. Apply filters.
5. Open the breach report.

**Visibility And Troubleshooting**

- Use Email Breach for a direct email lookup.
- Use Stealer Logs for credential artifact pivots.

#### Discussion And Social Search

- **Feature ID:** `discussion_social_search`
- **User asks for:** discussion; social; telegram; twitter; mastodon; pastebin; forum; reddit; chat reports
- **Where to go:** `/dashboard/discussion/all`, `/dashboard/social/all`, `/dashboard/social/:category`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Discussion or Social.
2. Choose a platform category if known.
3. Search a username, channel, topic, keyword, domain, or IOC.
4. Open a chat or social report.
5. Use metadata for pivots.

**Visibility And Troubleshooting**

- Use Social Intel for relationship mapping instead of indexed content search.

#### Feed

- **Feature ID:** `feed`
- **User asks for:** feed; news feed; intelligence feed; recent reports
- **Where to go:** `/dashboard/feed/news`, `/dashboard/feed/:category`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Feed.
2. Choose the feed category.
3. Search or browse recent items.
4. Open a feed report.

**Visibility And Troubleshooting**

- Use General Intelligence for more precise filtered search.

#### Exploit Intelligence

- **Feature ID:** `exploit`
- **User asks for:** exploit; cve; vulnerability; zeroday; zero day; tools
- **Where to go:** `/dashboard/exploit/all`, `/dashboard/exploit/cve`, `/dashboard/exploit/tools`, `/dashboard/exploit/zeroday`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Exploit.
2. Choose All, CVE, Tools, or ZeroDay.
3. Search a CVE, product, exploit name, actor, or keyword.
4. Open a report.
5. Review references and extracted metadata.

**Visibility And Troubleshooting**

- Use General Intelligence if the vulnerability context is broader than exploit records.

#### Defacement

- **Feature ID:** `defacement`
- **User asks for:** defacement; hacked website; phishing; compromised website; defacer
- **Where to go:** `/dashboard/defacement/all`, `/dashboard/defacement/hacked`, `/dashboard/defacement/phishing`, `/dashboard/defacement/databases`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Defacement.
2. Choose Hacked, Phishing, Databases, or All.
3. Search by domain, URL, organization, attacker handle, or keyword.
4. Open the defacement report.
5. Review screenshot, metadata, and extracted indicators.

**Visibility And Troubleshooting**

- Use Basic Web Scan for live inspection of a current website.

#### Dump Listings

- **Feature ID:** `dump`
- **User asks for:** dump; leak listing; dump listing; leak catalog
- **Where to go:** `/dashboard/dump/listing`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Dump.
2. Choose Listing.
3. Search the leak URL, domain, keyword, or identifier.
4. Open matching records.

**Visibility And Troubleshooting**

- If hidden, confirm subscription access.
- Use Credential Dump for username and password oriented dump records.

#### Credential Dump

- **Feature ID:** `credential_dump`
- **User asks for:** credential dump; dump credentials; leaked username password; credential records
- **Where to go:** `/dashboard/dump/credential`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Dump -> Credential.
2. Search by username, email, domain, URL, password marker, or keyword.
3. Review credential-oriented records.
4. Open matching details where available.
5. Pivot to Stealer Logs if the artifact appears stealer-derived.

**Visibility And Troubleshooting**

- If hidden, confirm subscription access.
- Use Dump Listings for leak catalog entries.
- Use Stealer Logs for malware-derived credential evidence.

#### Stealer Logs

- **Feature ID:** `stealerlogs`
- **User asks for:** stealer logs; stealerlogs; credential iocs; stolen credentials
- **Where to go:** `/dashboard/stealerlogs/iocs`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Stealer Logs.
2. Search a domain, IP, email, username, URL, or indicator.
3. Review returned credential or IOC records.
4. Pivot to reports or alerts when relevant.

**Visibility And Troubleshooting**

- If hidden, confirm subscription access.


### Live Lookup Modules

#### Entity API Overview

- **Feature ID:** `entity_api`
- **User asks for:** entity api; live api; lookup tools; entity lookup
- **Where to go:** `/dashboard/api`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Entity API.
2. Choose the scanner matching the target.
3. Enter the value.
4. Submit.
5. Review returned data.

**Visibility And Troubleshooting**

- If hidden, confirm subscription access.

#### Email Breach

- **Feature ID:** `email_breach_lookup`
- **User asks for:** email breach; email lookup; breached email; check email
- **Where to go:** `/dashboard/api/email-breach`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Email Breach.
2. Enter the email address.
3. Submit the lookup.
4. Review breach exposure and metadata.

**Visibility And Troubleshooting**

- Use Data Breach for broader indexed breach searches.

#### Social Scanner

- **Feature ID:** `social_scanner`
- **User asks for:** social scanner; username lookup; profile lookup; handle lookup
- **Where to go:** `/dashboard/api/social-scanner`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Social Scanner.
2. Enter the username, handle, or profile value.
3. Submit.
4. Review discovered profiles or metadata.

**Visibility And Troubleshooting**

- Use Social Intel for graph-style profile mapping.

#### Wanted List

- **Feature ID:** `wanted_list`
- **User asks for:** wanted list; wanted scan; person lookup
- **Where to go:** `/dashboard/api/wanted-list`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Wanted List.
2. Enter the name or identifier.
3. Submit.
4. Review matching records.

**Visibility And Troubleshooting**

- Try alternate name formats if no match appears.

#### National Identity

- **Feature ID:** `national_identity`
- **User asks for:** national identity; identity lookup; national id
- **Where to go:** `/dashboard/api/national-identity`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open National Identity.
2. Enter the supported identity value.
3. Submit.
4. Review returned identity information.

**Visibility And Troubleshooting**

- Confirm the identity value format is supported.

#### Playstore Scanner

- **Feature ID:** `playstore_scanner`
- **User asks for:** playstore scanner; android app lookup; app scanner; package lookup
- **Where to go:** `/dashboard/api/playstore-scanner`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Playstore Scanner.
2. Enter the application reference or package.
3. Submit.
4. Review app metadata and risk indicators.

**Visibility And Troubleshooting**

- Use APK Scan if you have the APK file rather than a store reference.

#### Software Scanner

- **Feature ID:** `software_scanner`
- **User asks for:** software scanner; software lookup; package scanner
- **Where to go:** `/dashboard/api/software-scanner`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Software Scanner.
2. Enter the software name, package, URL, or supported value.
3. Submit.
4. Review metadata and detected risk.

**Visibility And Troubleshooting**

- Try exact package names or URLs if broad names return too many results.

#### File Scanner

- **Feature ID:** `file_scanner`
- **User asks for:** file scanner; file analysis; extract iocs from file; ioc extraction
- **Where to go:** `/dashboard/api/file-scanner`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open File Scanner.
2. Upload the file.
3. Start analysis.
4. Wait for extraction.
5. Review extracted IOCs and analysis output.

**Visibility And Troubleshooting**

- Confirm the file type and size are supported.
- Use returned IOCs in Consolidated or IOC alerts.

#### Text Analysis

- **Feature ID:** `text_analysis`
- **User asks for:** text analysis; spam analysis; malicious url analysis; nexus analyze text
- **Where to go:** `/dashboard/api/text-analysis`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`, `module:ai`
- **Settings:** `ai_endpoint_enabled`
- **Related backend APIs:** `/api/nexus/analyze-text`

**Workflow**

1. Open Text Analysis.
2. Paste text to analyze.
3. Submit.
4. Review classification, extracted values, and risk indicators.

**Visibility And Troubleshooting**

- If API returns 403, enable AI Endpoint Enabled in System Settings.
- Confirm AI module license.

#### Crypto Scanner

- **Feature ID:** `crypto_scanner`
- **User asks for:** crypto scanner; cryptocurrency address; wallet lookup; crypto analysis
- **Where to go:** `/dashboard/api/crypto-scanner`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Crypto Scanner.
2. Enter the cryptocurrency address or supported value.
3. Submit.
4. Review metadata, risk, and linked activity.

**Visibility And Troubleshooting**

- Confirm the address format and chain are supported.


### Scan Modules

#### Web Scans

- **Feature ID:** `web_scans`
- **User asks for:** web scans; scan menu; scanner; web target scanning
- **Where to go:** `/dashboard/scanner`, `/dashboard/scan`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `scanning`
- **Settings:** none

**Workflow**

1. Open Web Scans from the sidebar.
2. Choose Network Scan, Repository Scan, SEO Scan, APK Scan, or Basic Scan where available.
3. Enter the required target or upload file.
4. Run the scan.
5. Review the generated report, findings, export, or print actions.

**Visibility And Troubleshooting**

- If hidden, confirm scanning license access.
- Use Network Intel for infrastructure recon and vulnerability tabs.
- Use Entity API for direct lookup tools instead of full scan reports.

#### Basic Web Scan

- **Feature ID:** `basic_web_scan`
- **User asks for:** scan; web scan; basic scan; website scan
- **Where to go:** `/dashboard/scan`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Scan.
2. Enter the target domain or URL.
3. Choose scan type if available.
4. Start scan.
5. Review the report and extracted indicators.

**Visibility And Troubleshooting**

- Confirm the target is a valid domain or URL.
- Check scanner service availability if the scan does not complete.

#### Port Scan

- **Feature ID:** `port_scan`
- **User asks for:** port scan; advanced scan; service scan; open ports
- **Where to go:** `/dashboard/scan?scanType=advanced`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `scanning`
- **Settings:** none
- **Related backend APIs:** `/api/urlscan/domain`

**Workflow**

1. Open Scan.
2. Use the advanced or port-oriented scan type when available.
3. Enter the target domain or host.
4. Start the scan.
5. Review open ports, service-level evidence, TLS details, and findings.

**Visibility And Troubleshooting**

- If the control is not visible, use Network Intel -> IP Scan for port and service detail.
- Confirm scanning license access.
- Validate the target hostname or IP before running the scan.

#### Network Intel

- **Feature ID:** `network_intel`
- **User asks for:** network intel; network scan; host recon; ip scan; vulnerability scan; infrastructure recon
- **Where to go:** `/dashboard/netint`, `/dashboard/scanner/network-scan`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Network Intel.
2. Choose Host Recon, IP Scan, or Vulnerability Scan.
3. Enter the domain, host, or IP.
4. Start the scan.
5. Review DNS, IP, port, vulnerability, location, or host details.

**Visibility And Troubleshooting**

- If hidden, confirm subscription access.
- Network Intel may be disabled in mobile mode.

#### Geo Fencing

- **Feature ID:** `geo_fencing`
- **User asks for:** geo fencing; geo iot; camera detection; coordinate scan; geo cameras
- **Where to go:** `/dashboard/netint`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`, `osint_advanced`
- **Settings:** none
- **Related backend APIs:** `/api/netintel/iot_detect`, `/api/netintel/camera_detect_ranges`

**Workflow**

1. Open Network Intel.
2. Select Geo Fencing.
3. Choose coordinates from the map or enter them manually.
4. Set radius and maximum IP count.
5. Start the scan and review detected IPs or camera indicators.

**Visibility And Troubleshooting**

- If hidden, confirm Network Intel access and advanced OSINT licensing.
- Validate latitude and longitude format before scanning.
- Large radius or max-IP values can take longer to complete.

#### Domain Scanner Support Methods

- **Feature ID:** `domain_scanner_support_methods`
- **User asks for:** subdomains; ip lookup; wayback; domain helper; support methods
- **Where to go:** `domain scanner helper`, `supported report pivots`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** depends on source module
- **Settings:** none
- **Related backend APIs:** `/api/urlscan/subdomains`, `/api/urlscan/dns`, `/api/urlscan/wayback`

**Workflow**

1. Open a supported domain scanner helper.
2. Choose Subdomains, IP Lookup, or Wayback.
3. Enter the domain or IP required by the selected tab.
4. Run the helper scan.
5. Copy, inspect, or pivot from returned subdomains, DNS records, or archived snapshots.

**Visibility And Troubleshooting**

- Subdomains and Wayback expect a domain.
- IP Lookup expects an IP address.
- No records can mean the target is valid but has no available helper data.

#### Repository Scan

- **Feature ID:** `repository_scan`
- **User asks for:** repository scan; repo scan; code scan
- **Where to go:** `/dashboard/scanner/repository-scan`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Repository Scan.
2. Enter the repository URL or reference.
3. Start the scan.
4. Review exposure, metadata, or risk findings.

**Visibility And Troubleshooting**

- Confirm repository URL format and accessibility.

#### SEO Scan

- **Feature ID:** `seo_scan`
- **User asks for:** seo scan; metadata scan; website metadata
- **Where to go:** `/dashboard/scanner/seo-scan`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open SEO Scan.
2. Enter the target domain or URL.
3. Start the scan.
4. Review metadata and scan output.

**Visibility And Troubleshooting**

- Confirm the target URL starts with http or https if required.

#### APK Scan

- **Feature ID:** `apk_scan`
- **User asks for:** apk scan; android apk analysis; mobile app analysis; apk iocs
- **Where to go:** `/dashboard/scanner/apk-scan`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open APK Scan.
2. Upload the APK file.
3. Start analysis.
4. Review permissions, behaviors, static indicators, and extracted IOCs.

**Visibility And Troubleshooting**

- Confirm the uploaded file is an APK.
- Use Playstore Scanner if you only have a store reference.


### AI Features

#### AI Workspace

- **Feature ID:** `ai_workspace`
- **User asks for:** ai; ai workspace; chat ai; ai assistant; llm; summarize
- **Where to go:** `/dashboard/profile/ai`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `module:ai`
- **Settings:** `ai_endpoint_enabled`
- **Related backend APIs:** `/api/nlp/parse/ai`, `/api/nlp/summarize/ai`, `/api/nlp/chat/report`, `/api/nexus/chat`, `/api/nexus/analyze-text`

**Workflow**

1. Open Profile -> AI or click the homepage AI button.
2. Enter the prompt, question, or content.
3. Submit.
4. Review the response.
5. Continue the conversation or pivot to a report.

**Visibility And Troubleshooting**

- If the button is missing, enable AI Endpoint Enabled in System Settings.
- If API returns 403, AI Endpoint Enabled is off.
- Confirm AI module license.

#### AI Report Summary

- **Feature ID:** `ai_report_summary`
- **User asks for:** ai summary; summarize report; report summary; ai suggest
- **Where to go:** `report pages`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `module:ai`
- **Settings:** `ai_endpoint_enabled`
- **Related backend APIs:** `/api/nlp/summarize/ai`

**Workflow**

1. Open a supported report.
2. Click AI Summary if visible.
3. Wait for summarization.
4. Review the generated summary.

**Visibility And Troubleshooting**

- If hidden or blocked, check AI Endpoint Enabled and AI license.

#### Report Chat

- **Feature ID:** `report_chat`
- **User asks for:** report chat; ai chat; chat with report; ask report; nexus chat
- **Where to go:** `supported report pages`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `module:ai`, `scanning for nexus chat`
- **Settings:** `ai_endpoint_enabled`
- **Related backend APIs:** `/api/nlp/chat/report`, `/api/nexus/chat`

**Workflow**

1. Open a supported report.
2. Open the report chat widget.
3. Ask a specific question.
4. Review the answer.

**Visibility And Troubleshooting**

- If API returns 403, enable AI Endpoint Enabled.
- Confirm the user can access the report.


### Report Features

#### Report Pages And Metadata

- **Feature ID:** `report_pages_metadata`
- **User asks for:** report page; report detail; metadata; report content; open result
- **Where to go:** `indexed report routes`, `/dashboard/*/:category/:m_hash`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** depends on source module
- **Settings:** none
- **Related backend APIs:** `/api/search/<module>/{doc_id}`

**Workflow**

1. Run a search or open a result list.
2. Select a result card or row.
3. Review title, description, source URL, date, network, status, and tags.
4. Expand metadata sections.
5. Use report actions for export, sharing, translation, AI, or graph pivots where available.

**Visibility And Troubleshooting**

- If the report does not open, confirm the document ID and module route.
- Some metadata sections appear only when extracted values exist.
- Report controls vary by module, license, and deployment configuration.

#### Report Toolbar

- **Feature ID:** `report_toolbar`
- **User asks for:** download report; export report; translate; share; open source; cti graph pivot
- **Where to go:** `report pages`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** depends on source module and action
- **Settings:** `ai_endpoint_enabled` for AI summary
- **Related backend APIs:** STIX export endpoints, `/api/nlp/summarize/ai`

**Workflow**

1. Open a supported report.
2. Locate the report header or toolbar.
3. Choose download, export, translate, AI summary, share, open source URL, or CTI graph.
4. Confirm any modal option if prompted.
5. Review the exported file, shared link, translated view, or graph workspace.

**Visibility And Troubleshooting**

- Toolbar actions depend on report type and deployment settings.
- AI summary requires AI Endpoint Enabled and AI licensing.
- Export can be blocked if the user lacks access to the source module.

#### Result Insights Side Panel

- **Feature ID:** `result_insights_side_panel`
- **User asks for:** insights panel; keyword insights; extracted data; unique urls; actor search
- **Where to go:** `/dashboard/consolidated/all`, `supported result pages`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Consolidated or another supported result workspace.
2. Run a search.
3. Review the insights side panel.
4. Expand keyword, URL, actor, or extracted-data sections.
5. Use panel values as pivots into detailed reports or follow-up searches.

**Visibility And Troubleshooting**

- If the panel is empty, confirm the search returned enough data.
- Some insight sections require extracted metadata.
- Clear filters or broaden the query if no pivots appear.

#### Report JSON And Screenshot Review

- **Feature ID:** `report_json_screenshot_review`
- **User asks for:** json viewer; screenshot; raw record; report mapping; breach screenshot
- **Where to go:** `supported report pages`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** depends on source module
- **Settings:** none
- **Related backend APIs:** `/api/search/breach/screenshot/{filename}`

**Workflow**

1. Open a supported report.
2. Expand JSON, screenshot, or report mapping sections when present.
3. Inspect raw structured fields, screenshots, or relationship mapping.
4. Copy or export values if supported.
5. Return to the report content for analyst summary.

**Visibility And Troubleshooting**

- JSON and screenshots are shown only for record types that store them.
- Screenshot loading depends on the referenced filename and backend availability.
- Use metadata panels when raw JSON is too broad for quick review.


### Graph Investigation

#### CTI Graph

- **Feature ID:** `cti_graph`
- **User asks for:** cti graph; graph; relationship graph; entity graph; threat graph
- **Where to go:** `/dashboard/ctigraph`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open CTI Graph.
2. Search or load a graph context.
3. Inspect nodes and edges.
4. Use context menus to expand or pivot.
5. Switch to list view if needed.
6. Export the graph if required.

**Visibility And Troubleshooting**

- Use a result report first if you need a concrete graph starting point.

#### Social Intel

- **Feature ID:** `social_intel`
- **User asks for:** social intel; social graph; social mapper; profile graph; username graph
- **Where to go:** `/dashboard/social-intel`, `/dashboard/social-graph`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Social Intel.
2. Search for a username, handle, profile, or platform identity.
3. Review metadata, profiles, followers, following, posts, images, and relationships.
4. Switch between graph and list views.
5. Open profile details or popups.

**Visibility And Troubleshooting**

- Use Social Search for indexed content rather than profile relationship mapping.


### Profile And Alerts

#### Tenant Homepage And Alert Summary

- **Feature ID:** `profile_homepage_alerts`
- **User asks for:** tenant homepage; alert summary; profile homepage; monitored alerts
- **Where to go:** `/dashboard/profile/homepage`
- **Roles:** `member`, `admin`, `analyst`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Profile Homepage.
2. Review monitored IOC and alert cards.
3. Open an alert category.
4. Start or cancel scans if available.
5. Add or manage custom alert values.

**Visibility And Troubleshooting**

- Content varies by role, license, and tenant state.

#### Profile Consolidated View

- **Feature ID:** `profile_consolidated_view`
- **User asks for:** profile consolidated; profile search; tenant consolidated; profile investigation
- **Where to go:** `/dashboard/profile/consolidated/all`
- **Roles:** `member`, `admin`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Profile -> Consolidated.
2. Enter the search query or IOC.
3. Submit the search.
4. Review consolidated results inside the profile workspace.
5. Open reports or pivot back to alerts, IOCs, or tenant workflows.

**Visibility And Troubleshooting**

- If hidden, confirm subscription access.
- Use main Consolidated at `/dashboard/consolidated/all` for the same workflow outside the profile area.
- Profile sidebar selection can show this route as part of tenant-oriented workflows.

#### Alerts

- **Feature ID:** `alerts`
- **User asks for:** alerts; alert report; tenant alerts; ioc alerts
- **Where to go:** `/dashboard/profile/alerts/:type`
- **Roles:** `member`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open an alert category.
2. Review alert rows or cards.
3. Use filters.
4. Open a finding.
5. Mark seen, update, delete, export, or pivot where available.

**Visibility And Troubleshooting**

- Confirm the tenant has monitored IOCs.
- Run alert scan if available.

#### Alert Notifications Sidebar

- **Feature ID:** `alert_notifications_sidebar`
- **User asks for:** notifications; notification sidebar; alert notification; see details; clear all
- **Where to go:** `profile notification bell`, `notification sidebar`
- **Roles:** `member`, `admin`, `analyst`
- **Licenses:** none
- **Settings:** tenant alert data

**Workflow**

1. Click the profile notification bell.
2. Review alert notifications in the side panel.
3. Load more notifications if available.
4. Click See Details to open the alert report.
5. Clear notifications when no longer needed.

**Visibility And Troubleshooting**

- Notifications require tenant alert records.
- If details do not open, confirm the alert category and hash still exist.
- Clearing notifications affects the current tenant notification list.

#### Add Custom Alert

- **Feature ID:** `add_custom_alert`
- **User asks for:** add alert; custom alert; monitor value; new alert
- **Where to go:** `/dashboard/profile/addcustomalert`
- **Roles:** `member`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Add Custom Alert.
2. Choose the alert type or category.
3. Enter the monitored value.
4. Save.
5. Return to alerts or homepage.

**Visibility And Troubleshooting**

- Confirm the user has member access and active account status.

#### Manage IOCs

- **Feature ID:** `ioc_management`
- **User asks for:** ioc; manage iocs; tenant iocs; monitored indicators
- **Where to go:** `/dashboard/profile/ioc`
- **Roles:** `member`, `admin`, `analyst`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Profile -> IOC.
2. Review IOC categories and values.
3. Add, edit, or remove indicators.
4. Save changes.
5. Run or wait for alert scanning as configured.

**Visibility And Troubleshooting**

- Confirm the value format is valid for the selected IOC type.


### Settings

#### Account Settings

- **Feature ID:** `account_settings`
- **User asks for:** account; profile settings; theme; 2fa; profile visibility; avatar
- **Where to go:** `/dashboard/profile/account`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Account Settings.
2. Edit allowed profile fields.
3. Update image if needed.
4. Toggle preferences such as theme, two-factor, or profile visibility.
5. Save changes.

**Visibility And Troubleshooting**

- Some fields may be read-only depending on role.

#### Tenant Settings

- **Feature ID:** `tenant_settings`
- **User asks for:** tenant settings; tenant branding; company settings
- **Where to go:** `/dashboard/profile/tenant-settings`
- **Roles:** `member`, `admin`
- **Licenses:** `non-free for some edit controls`, `maintainer for some workflows`
- **Settings:** none

**Workflow**

1. Open Tenant Settings.
2. Review tenant details.
3. Enter edit mode if available.
4. Update tenant fields or image.
5. Save changes.

**Visibility And Troubleshooting**

- Confirm role and license if edit controls are missing.

#### System Settings

- **Feature ID:** `system_settings`
- **User asks for:** system settings; branding; app name; language; ai endpoint enabled; documentation allowed; onion address
- **Where to go:** `/dashboard/profile/system-settings`
- **Roles:** `admin`
- **Licenses:** none
- **Settings:** `api_allowed`, `ai_endpoint_enabled`, `s_onion`, `meta_info`
- **Related backend APIs:** `/api/public/update`, `/api/system/image`

**Workflow**

1. Open System Settings.
2. Click edit.
3. Update app name, language, onion address, homepage links, branding assets, or feature toggles.
4. Toggle AI Endpoint Enabled to allow or block AI UI and AI backend endpoints.
5. Save settings.

**Visibility And Troubleshooting**

- Admin role is required to save settings.
- URLs must start with http:// or https://.
- AI Endpoint Enabled is stored as ai_endpoint_enabled.


### Administration

#### Users

- **Feature ID:** `users`
- **User asks for:** users; manage users; view profiles; tenant users
- **Where to go:** `/dashboard/profile/users`, `/dashboard/tenant/view-profiles`
- **Roles:** `admin`, `member`
- **Licenses:** `subscription or maintainer depending on workflow`
- **Settings:** none

**Workflow**

1. Open Users or View Profiles.
2. Search or review the user list.
3. Open a user profile.
4. Update allowed fields, role, status, or tenant assignment.
5. Save.

**Visibility And Troubleshooting**

- Confirm maintainer/admin access if user management controls are missing.

#### User Activity

- **Feature ID:** `user_activity`
- **User asks for:** user activity; profile activity; user profile
- **Where to go:** `/dashboard/profile/user/:user_id`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open a user profile from Users or a profile link.
2. Review activity information.
3. Return to the previous administration page.

**Visibility And Troubleshooting**

- Confirm the user ID exists and current user can view it.

#### Tenant Administration

- **Feature ID:** `tenant_administration`
- **User asks for:** tenant administration; view tenants; all tenants
- **Where to go:** `/dashboard/tenant/view-tenants`
- **Roles:** `admin`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open tenant administration.
2. Review tenant rows or cards.
3. Open a tenant for details.
4. Update tenant state where controls are available.

**Visibility And Troubleshooting**

- Admin role is required for all-tenant view.

#### Tenant Profile Page

- **Feature ID:** `tenant_profile_page`
- **User asks for:** tenant profile; current tenant; tenant details; tenant state
- **Where to go:** `/dashboard/profile/tenant`
- **Roles:** `admin`, `member`
- **Licenses:** `subscription`
- **Settings:** none

**Workflow**

1. Open Profile -> Tenant.
2. Review the current tenant details.
3. Inspect tenant state, users, quota, or verification information where shown.
4. Use Tenant Settings for editable tenant identity fields.
5. Ask an administrator to update restricted tenant state fields.

**Visibility And Troubleshooting**

- If hidden, confirm role and subscription access.
- Admin users can use Tenant Administration for all-tenant review.
- Member users can be limited to their assigned tenant.

#### Audit Logs

- **Feature ID:** `audit_logs`
- **User asks for:** audit logs; auditlog; activity log; admin logs
- **Where to go:** `/dashboard/profile/auditlog`, `/dashboard/tenant/auditlog`
- **Roles:** `admin`, `member`, `demo`
- **Licenses:** `maintainer for tenant audit route`
- **Settings:** none

**Workflow**

1. Open Audit Log.
2. Filter by user, event, date, tenant, or available fields.
3. Review actions.
4. Delete audit entries only if allowed.

**Visibility And Troubleshooting**

- Confirm role and maintainer license if audit logs are hidden.

#### Event Management

- **Feature ID:** `event_management`
- **User asks for:** event management; events
- **Where to go:** `/dashboard/profile/event-management`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Event Management.
2. Review available event rows or controls.
3. Add, update, or inspect events where controls are available.

**Visibility And Troubleshooting**

- Confirm the module is enabled for the current role.

#### Feeder Management

- **Feature ID:** `feeder`
- **User asks for:** feeder; feeder scripts; crawler scripts; upload script; script owner
- **Where to go:** `/dashboard/profile/feeder`
- **Roles:** `admin`, `member`, `crawler`
- **Licenses:** `module:feeder`
- **Settings:** none
- **Related backend APIs:** `/api/profile/feeder/catalog`, `/api/profile/feeder/scripts`, `/api/profile/feeder/upload`

**Workflow**

1. Open Feeder.
2. Review the catalog and existing scripts.
3. Upload a script or values where allowed.
4. Enable, disable, clear, delete, or transfer ownership as needed.
5. Confirm script status.

**Visibility And Troubleshooting**

- If hidden, confirm module:feeder license.
- Owner transfer requires admin.


### Support And Documentation

#### Directory

- **Feature ID:** `directory`
- **User asks for:** directory; monitored services; resource catalog; service references
- **Where to go:** `/dashboard/directory`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Directory.
2. Browse monitored services or resource records.
3. Search, filter, or load more if controls are available.
4. Open the relevant service or resource entry.
5. Return to the directory list for more references.

**Visibility And Troubleshooting**

- Directory content is deployment-specific.
- If no entries appear, confirm directory data is configured.

#### Links

- **Feature ID:** `links`
- **User asks for:** links; link directory; resources; external links
- **Where to go:** `/dashboard/directory`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open the Links item in the sidebar.
2. Land on the Directory workflow.
3. Browse available resource links.
4. Open the relevant link or record.

**Visibility And Troubleshooting**

- Links is the sidebar entry into the Directory page.
- Some links depend on deployment metadata and configured directory data.

#### Support

- **Feature ID:** `support`
- **User asks for:** support; help and support; contact support; help; support modal
- **Where to go:** `support overlay`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**Workflow**

1. Open Support.
2. Enter email, subject, and message.
3. Submit.
4. Wait for confirmation.

**Visibility And Troubleshooting**

- Enter a valid email address and non-empty message.

#### Documentation

- **Feature ID:** `documentation_link`
- **User asks for:** documentation; docs; manual; help center; feature guide
- **Where to go:** `sidebar documentation link`, `/docs`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** `home_header_pricing_allowed`

**Workflow**

1. Open Documentation from the sidebar or header.
2. Browse the platform introduction, module introduction, user manual, feature guide, or API docs.

**Visibility And Troubleshooting**

- Visibility can depend on system metadata settings.

#### Onion Link

- **Feature ID:** `onion_link`
- **User asks for:** onion; tor; onion link; dark web link
- **Where to go:** `sidebar onion link`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** `s_onion`

**Workflow**

1. Open the Onion Link from the sidebar.
2. Use the configured onion address in a supported browser.

**Visibility And Troubleshooting**

- The link only appears when s_onion is configured in System Settings.

#### Whistle Blowing

- **Feature ID:** `whistle_blowing`
- **User asks for:** whistle blowing; whistleblowing; report leak; anonymous report
- **Where to go:** `sidebar whistle blowing link`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** `S_HOME_HEADER_WHISTLE_BLOWING_ALLOWED`

**Workflow**

1. Open Whistle Blowing from the sidebar when visible.
2. Follow the configured external workflow.

**Visibility And Troubleshooting**

- Visibility depends on system metadata settings.

## Public API Index

Exposed OpenAPI operation count: **55**.

Use these operations for programmatic integration questions. For request/response payload details, inspect the live `/docs` or source models because this refined LLM reference intentionally omits full samples.

### Crawler

| Method | Path | Summary |
| --- | --- | --- |
| `POST` | `/api/index/injection` | Batch inject SIEM logs |

### Entity Scans

| Method | Path | Summary |
| --- | --- | --- |
| `POST` | `/api/dynamic/user` | Dynamic user email exposure search |
| `POST` | `/api/dynamic/cracked` | Dynamic cracked credential search |
| `POST` | `/api/dynamic/software` | Dynamic software credential search |
| `POST` | `/api/urlscan/domain` | Domain, SEO, and repository scan |
| `POST` | `/api/dynamic/social` | Dynamic social_models identifier exposure search |
| `POST` | `/api/dynamic/wanted` | Searches wanted people around the Globe |
| `POST` | `/api/dynamic/national-identity` | Dynamic national identity search |
| `POST` | `/api/ioc/extract` | Extract IOCs from file(.pdf or .txt) or image(.png, .jpg or .jpeg) |
| `POST` | `/api/apk/scan` | Dynamic analysis scan to identify application metadata, cracking indicators, etc |
| `POST` | `/api/crypto/scan` | Scan cryptocurrency wallet address or transaction hash |

### Network Intelligence

| Method | Path | Summary |
| --- | --- | --- |
| `POST` | `/api/netintel/resolve_ip` | Resolve a domain to IP addresses |
| `POST` | `/api/netintel/ipscanner` | Scan an IP address for network intelligence |
| `POST` | `/api/netintel/url_vulnerability_scan` | Scan a domain URL for web vulnerabilities |
| `POST` | `/api/netintel/iot_detect` | Scan a geographic area for exposed cameras |
| `POST` | `/api/netintel/camera_detect_ranges` | Scan IP ranges for exposed cameras |

### Profile

| Method | Path | Summary |
| --- | --- | --- |
| `POST` | `/api/profile/event-management/siem/search` | Search SIEM logs |

### Reports

| Method | Path | Summary |
| --- | --- | --- |
| `GET` | `/api/search/defacement/{doc_id}` | Get defacement report |
| `GET` | `/api/search/breach/{doc_id}` | Get breach monitoring report |
| `GET` | `/api/search/news/{doc_id}` | Get breach-related news report |
| `GET` | `/api/search/exploit/{doc_id}` | Get exploit intelligence report |
| `GET` | `/api/search/strategic/{doc_id}` | Get darkweb strategic report |
| `GET` | `/api/search/chat/{doc_id}` | Get chat intelligence report |
| `GET` | `/api/search/social/{doc_id}` | Get social_models media intelligence report |
| `GET` | `/api/search/breach/screenshot/{filename}` | Get breach report screenshot |

### Search

| Method | Path | Summary |
| --- | --- | --- |
| `POST` | `/api/search/strategic` | Search strategic reports |
| `POST` | `/api/search/breach` | Search breach reports |
| `POST` | `/api/search/social` | Search social reports |
| `POST` | `/api/search/exploit` | Search exploit reports |
| `POST` | `/api/search/defacement` | Search defacement reports |
| `POST` | `/api/search/stealer/ioc` | Search stealer log reports |
| `POST` | `/api/search/consolidated` | Search consolidated reports (grouped) |

### Social Search

| Method | Path | Summary |
| --- | --- | --- |
| `POST` | `/api/social/recon` | Cross-platform identity search to locate a user's digital footprint |
| `POST` | `/api/social/profile` | Scrapes the profile of requested social account |
| `POST` | `/api/social/online/images` | Scrapes the images of requested social account |
| `POST` | `/api/social/recon/image` | Reverse image search to identify associated social profiles |
| `POST` | `/api/social/followers` | Scrapes the followers of requested social account |
| `POST` | `/api/social/following` | Scrapes the following of requested social account |
| `POST` | `/api/social/posts` | Scrapes the posts of requested social account |
| `POST` | `/api/social/metadata` | Search for specific keyword combinations linked to a username across social platforms. |

### Stix

| Method | Path | Summary |
| --- | --- | --- |
| `GET` | `/api/search/breach/stix/{doc_id}` | Get breach media intelligence report in stix format |
| `GET` | `/api/search/strategic/stix/{doc_id}` | Get strategic media intelligence report in stix format |
| `GET` | `/api/search/defacement/stix/{doc_id}` | Get defacement media intelligence report in stix format |
| `GET` | `/api/search/exploit/stix/{doc_id}` | Get exploit media intelligence report in stix format |
| `GET` | `/api/search/social/stix/{doc_id}` | Get social_models media intelligence report in stix format |
| `GET` | `/api/search/chat/stix/{doc_id}` | Get social_models media intelligence report in stix format |
| `GET` | `/api/search/news/stix/{doc_id}` | Get news media intelligence report in stix format |

### Support Method

| Method | Path | Summary |
| --- | --- | --- |
| `POST` | `/api/urlscan/subdomains` | Returns the list of associated subdomains |
| `POST` | `/api/urlscan/dns` | Reverse DNS and ping check |
| `POST` | `/api/urlscan/wayback` | Fetches archived snapshots and timestamps |
| `POST` | `/api/cross/search` | Run Cross Search |

### System Info

| Method | Path | Summary |
| --- | --- | --- |
| `GET` | `/api/directory` | Get monitored source directory |
| `GET` | `/api/dumps` | Get breach dump catalog |
| `GET` | `/api/insight` | Get system insights |
| `GET` | `/api/insight/country` | Get paginated country insights |

## Backend Route Map

Backend route entry count from static decorators: **198**.

Use this map when the user asks where an API is implemented or when a backend change must be scoped. Public OpenAPI routes are a subset of this map.

### `backend/routes/admin_routes.py`

| Method | Path | Handler | Gates |
| --- | --- | --- | --- |
| `GET` | `/admin/api/db_system_model/row-action` | `block_row_action` | - |
| `POST` | `/admin/api/db_user_account/edit/{id}` | `custom_edit_api` | - |
| `POST` | `/admin/api/db_user_account/edit/{id}/` | `custom_edit_api_trailing` | - |
| `POST` | `/api/public/update` | `update_public_config` | - |
| `DELETE` | `/api/system/image` | `update_user` | - |
| `PUT` | `/api/system/image` | `upload_system_image` | - |

### `backend/routes/api_micros.py`

| Method | Path | Handler | Gates |
| --- | --- | --- | --- |
| `POST` | `/api/cti/fetch` | `fetch_cti_label` | - |
| `POST` | `/api/nlp/parse/ai` | `parse_ai` | ai_endpoint_enabled |
| `POST` | `/api/nlp/summarize/ai` | `summarize_ai` | module:ai, ai_endpoint_enabled |
| `POST` | `/api/nlp/chat/report` | `chat_report` | ai_endpoint_enabled |
| `POST` | `/api/nexus/chat` | `nexus_chat` | scanning, ai_endpoint_enabled |
| `POST` | `/api/nexus/analyze-text` | `nexus_analyze_text` | module:ai, ai_endpoint_enabled |

### `backend/routes/api_routes.py`

| Method | Path | Handler | Gates |
| --- | --- | --- | --- |
| `POST` | `/api/search/breach` | `search_leak` | module:breach |
| `POST` | `/api/search/social` | `search_social` | - |
| `POST` | `/api/search/exploit` | `search_exploit` | - |
| `POST` | `/api/search/defacement` | `search_defacement` | - |
| `POST` | `/api/feedback/comment/{doc_id}` | `add_feedback_comment` | - |
| `GET` | `/api/feedback/{doc_id}` | `get_feedback` | - |
| `POST` | `/api/feedback/recommended/{doc_id}` | `increment_recommended_feedback` | - |
| `POST` | `/api/feedback/trust/{doc_id}` | `increment_trust_feedback` | - |
| `POST` | `/api/feedback/untrust/{doc_id}` | `increment_untrust_feedback` | - |
| `GET` | `/api/user/{user_id}/get` | `get_public_user` | - |
| `GET` | `/api/user/{user_id}/activity` | `get_public_user_activity` | - |
| `GET` | `/api/directory` | `get_directory` | - |
| `GET` | `/api/dumps` | `get_dumps` | module:dumps |
| `GET` | `/api/insight` | `get_insight` | - |
| `GET` | `/api/insight/country` | `get_country_insight` | - |
| `POST` | `/api/search/stealerlogs` | `search_stealerlog` | - |
| `POST` | `/api/search/stealer/ioc` | `search_stealer_iocs` | - |
| `POST` | `/api/search/consolidated` | `search_consolidated` | - |
| `POST` | `/api/search/consolidated/ioc` | `search_consolidated_iocs` | - |
| `GET` | `/api/search/defacement/{doc_id}` | `get_defacement_document` | module:defacement |
| `GET` | `/api/search/breach/{doc_id}` | `get_leak_document` | module:breach |
| `GET` | `/api/search/news/{doc_id}` | `get_news_document` | module:news |
| `GET` | `/api/search/exploit/{doc_id}` | `get_exploit_document` | module:exploit |
| `GET` | `/api/search/strategic/{doc_id}` | `get_general_document` | module:general |
| `GET` | `/api/search/chat/{doc_id}` | `get_chat_document` | module:chat |
| `GET` | `/api/search/social/{doc_id}` | `get_social_document` | module:social |
| `GET` | `/api/search/breach/screenshot/{filename}` | `get_screenshot` | module:breach |
| `POST` | `/api/dynamic/user` | `search_dynamic_email` | - |
| `POST` | `/api/dynamic/cracked` | `search_dynamic_cracked` | - |
| `POST` | `/api/dynamic/software` | `search_dynamic_software` | - |
| `POST` | `/api/urlscan/domain` | `parse_domain_scan` | - |
| `POST` | `/api/urlscan/subdomains` | `parse_subdomain_scan` | - |
| `POST` | `/api/urlscan/dns` | `parse_dns_scan` | - |
| `POST` | `/api/urlscan/wayback` | `parse_wayback_scan` | - |
| `POST` | `/api/urlscan/ip` | `parse_ip` | - |
| `POST` | `/api/social/scrape` | `scrape_social` | - |
| `POST` | `/api/dynamic/social` | `search_dynamic_social` | - |
| `POST` | `/api/index/injection` | `index_injection` | - |
| `POST` | `/api/dynamic/wanted` | `search_dynamic_wanted` | - |
| `POST` | `/api/dynamic/national-identity` | `search_dynamic_national_identity` | - |
| `GET` | `/api/search/breach/stix/{doc_id}` | `get_breach_stix_document` | - |
| `GET` | `/api/search/strategic/stix/{doc_id}` | `get_strategic_stix_document` | - |
| `GET` | `/api/search/defacement/stix/{doc_id}` | `get_defacement_stix_document` | - |
| `GET` | `/api/search/exploit/stix/{doc_id}` | `get_exploit_stix_document` | - |
| `GET` | `/api/search/social/stix/{doc_id}` | `get_social_stix_document` | - |
| `GET` | `/api/search/chat/stix/{doc_id}` | `get_chat_stix_document` | - |
| `GET` | `/api/graph` | `get_entity_relations` | cti_graph |
| `POST` | `/api/profile/event-management/siem/search` | `search_siem_logs` | maintainer |
| `GET` | `/api/search/news/stix/{doc_id}` | `get_news_stix_document` | - |
| `POST` | `/api/ioc/extract` | `extract_ioc` | scanning |
| `POST` | `/api/apk/scan` | `scan_apk` | scanning |
| `POST` | `/api/crypto/scan` | `crypto_scan` | scanning |
| `POST` | `/api/cross/search` | `cross_search` | scanning |
| `POST` | `/api/netintel/resolve_ip` | `resolve_ip` | - |
| `POST` | `/api/netintel/ipscanner` | `ipscanner` | - |
| `POST` | `/api/netintel/url_vulnerability_scan` | `url_vulnerability_scan` | - |
| `POST` | `/api/netintel/iot_detect` | `geo_camera_detect` | - |
| `POST` | `/api/search/strategic` | `search_general` | - |
| `POST` | `/api/netintel/camera_detect_ranges` | `geo_camera_detect_ranges` | - |
| `POST` | `/api/stix/convert/{kind}` | `convert_stix_single` | - |
| `POST` | `/api/stix/convert/{kind}/batch` | `convert_stix_batch` | - |

### `backend/routes/auth_routes.py`

| Method | Path | Handler | Gates |
| --- | --- | --- | --- |
| `POST` | `/api/verify/{token}` | `verifyUser` | - |
| `POST` | `/api/forgot` | `forgotPassword` | - |
| `POST` | `/api/subscription/request` | `subscriptionRequest` | - |
| `POST` | `/api/updatePassword` | `updatePassword` | - |
| `POST` | `/api/support` | `support` | - |
| `POST` | `/api/token` | `token` | - |
| `POST` | `/api/token/demo` | `token_demo` | - |
| `POST` | `/api/token/2fa/verify` | `verify_2fa` | - |
| `POST` | `/api/token/refresh` | `refresh_token` | - |
| `POST` | `/api/logout` | `logout` | - |
| `POST` | `/api/signup` | `signup` | - |
| `POST` | `/api/signup/verificaion` | `signup` | - |

### `backend/routes/crawl_routes.py`

| Method | Path | Handler | Gates |
| --- | --- | --- | --- |
| `POST` | `/api/profile/feeder/scripts/{script_id}/delete-value` | `delete_feeder_value` | module:feeder |
| `POST` | `/api/profile/feeder/scripts/{script_id}/toggle` | `toggle_feeder_script` | module:feeder |
| `POST` | `/api/profile/feeder/scripts/{script_id}/owner` | `transfer_feeder_script_owner` | module:feeder |
| `POST` | `/api/profile/feeder/upload` | `upload_feeder_script` | module:feeder |
| `POST` | `/api/feeder/status` | `update_feeder_script_status` | - |
| `POST` | `/api/index/leak` | `index_leak_data` | - |
| `POST` | `/api/index/news` | `index_news_data` | - |
| `POST` | `/api/index/tracking` | `index_tracking_data` | - |
| `POST` | `/api/index/exploit` | `index_exploit_data` | - |
| `POST` | `/api/index/defacement` | `index_defacement_data` | - |
| `POST` | `/api/screenshot` | `screenshot` | - |
| `POST` | `/api/index/generic` | `index_generic` | - |
| `POST` | `/api/nlp/parse` | `parse_text` | - |
| `POST` | `/api/index/chat` | `index_chat_data` | - |
| `POST` | `/api/index/social` | `index_social_data` | - |
| `POST` | `/api/index/swarm` | `index_swarm_data` | - |
| `POST` | `/api/index/sanctions` | `index_sanctions_data` | - |
| `POST` | `/api/index/entity` | `index_entities` | - |
| `GET` | `/api/feeder/{index_type}` | `feeder` | - |
| `POST` | `/api/index/dump` | `index_dump` | - |
| `POST` | `/api/index/stealerlog` | `index_stealerlog` | - |
| `GET` | `/api/parser` | `parser` | - |
| `GET` | `/api/profile/feeder/catalog` | `get_feeder_catalog` | module:feeder |
| `GET` | `/api/profile/feeder/scripts` | `get_feeder_scripts` | module:feeder |
| `GET` | `/api/profile/feeder/users` | `get_feeder_owner_users` | module:feeder |
| `POST` | `/api/profile/feeder/scripts/clear-all` | `clear_feeder_scripts` | module:feeder |
| `POST` | `/api/profile/feeder/scripts/enable-all` | `enable_feeder_scripts` | module:feeder |
| `POST` | `/api/profile/feeder/scripts/disable-all` | `disable_feeder_scripts` | module:feeder |
| `POST` | `/api/profile/feeder/scripts/{script_id}/delete` | `delete_feeder_script` | module:feeder |

### `backend/routes/public_api_routes.py`

| Method | Path | Handler | Gates |
| --- | --- | --- | --- |
| `GET` | `/api/public` | `get_public_config` | - |
| `GET` | `/api/s/static/tenant/{id}` | `get_tenant_resource` | - |
| `GET` | `/api/s/static/user/{id}` | `get_user_resource` | - |
| `GET` | `/api/s/static/favicon` | `get_system_resource` | - |
| `GET` | `/api/s/static/system/{id}` | `get_system_resource` | - |
| `GET` | `/robots.txt` | `robots_txt` | - |
| `GET` | `/api/search/stealerlogs` | `search_stealerlog` | - |

### `backend/routes/social_routes.py`

| Method | Path | Handler | Gates |
| --- | --- | --- | --- |
| `POST` | `/api/social/followers` | `search_dynamic_followers` | scanning |
| `POST` | `/api/social/following` | `search_dynamic_following` | scanning |
| `POST` | `/api/social/posts` | `search_dynamic_posts` | scanning |
| `POST` | `/api/social/entity` | `search_dynamic_entity` | scanning |
| `POST` | `/api/social/metadata` | `search_social_metadata` | scanning |
| `POST` | `/api/social/session/upsert` | `upsert_social_session` | scanning |
| `GET` | `/api/social/session/tabs` | `get_social_tabs` | scanning |
| `POST` | `/api/social/session/tab/add` | `add_social_tab` | scanning |
| `POST` | `/api/social/recon` | `search_dynamic_email` | scanning |
| `POST` | `/api/social/phone/recon` | `search_dynamic_phone_recon` | scanning |
| `POST` | `/api/social/profile` | `search_dynamic_profile` | scanning |
| `POST` | `/api/social/online/images` | `search_dynamic_online_images` | scanning |
| `POST` | `/api/social/recon/image` | `search_dynamic_image` | scanning |

### `backend/routes/tenant_routes.py`

| Method | Path | Handler | Gates |
| --- | --- | --- | --- |
| `POST` | `/api/get/current/user/chat-history` | `get_current_user_chat_history` | - |
| `POST` | `/api/update/current/user/chat-history` | `update_current_user_chat_history` | - |
| `DELETE` | `/api/tenant/image` | `update_user` | - |
| `PUT` | `/api/tenant/image` | `upload_profile_image` | - |
| `PUT` | `/api/system/image` | `upload_profile_image` | - |
| `DELETE` | `/api/user/image` | `update_user` | - |
| `PUT` | `/api/user/image` | `upload_profile_image` | - |
| `POST` | `/api/delete/user` | `delete_user` | - |
| `POST` | `/api/tenant/create/user` | `create_tenant_user` | maintainer |
| `POST` | `/api/audit/logs` | `get_audit_logs` | maintainer |
| `DELETE` | `/api/audit/{log_id}/delete` | `delete_audit_log` | - |
| `GET` | `/api/get/tenant/alert/summary` | `get_node` | - |
| `POST` | `/api/get/tenant/node` | `get_node` | - |
| `POST` | `/api/alert/add` | `add_custom_alert` | - |
| `POST` | `/api/alert/seen` | `set_alerts_seen` | - |
| `POST` | `/api/alert/delete` | `delete_alert` | - |
| `POST` | `/api/alert/update` | `update_alert` | - |
| `GET` | `/api/profile/alerts` | `get_user_alerts` | - |
| `POST` | `/api/profile/alert/scan` | `run_user_ioc_alerts` | maintainer |
| `POST` | `/api/profile/alert/scan/cancel` | `cancel_user_ioc_alerts` | maintainer |
| `POST` | `/api/profile/alerts/delete/all` | `delete_all_alerts` | maintainer |
| `POST` | `/api/profile/alerts/delete/{_type}` | `delete_typed_alerts` | maintainer |
| `POST` | `/api/get/tenant` | `get_tenant` | - |
| `POST` | `/api/profile/alert/scan/status` | `get_alert_scan_status` | - |
| `POST` | `/api/update/tenants` | `update_tenant` | maintainer |
| `POST` | `/api/users` | `get_tenant_users` | - |
| `POST` | `/api/tenants/get` | `get_all_tenants` | - |
| `POST` | `/api/update/user` | `update_user` | - |
| `POST` | `/api/update/current/user` | `update_user` | - |

### `backend/routes/test_routes.py`

| Method | Path | Handler | Gates |
| --- | --- | --- | --- |
| `POST` | `/api/dynamic/user` | `test_search_dynamic_email` | scanning |
| `POST` | `/api/dynamic/cracked` | `test_search_dynamic_cracked` | scanning |
| `POST` | `/api/forgot` | `forgotPassword` | - |
| `POST` | `/api/dynamic/software` | `test_search_dynamic_software` | scanning |
| `POST` | `/api/urlscan/dns` | `test_search_dynamic_ip_scan` | scanning |
| `POST` | `/api/urlscan/ip` | `test_search_dynamic_ip_scan` | scanning |
| `POST` | `/api/dynamic/social` | `test_search_dynamic_social` | scanning |
| `POST` | `/api/dynamic/wanted` | `test_search_dynamic_wanted` | scanning |
| `POST` | `/api/dynamic/national-identity` | `test_search_dynamic_national_identity` | scanning |
| `POST` | `/api/urlscan/domain` | `test_parse_domain` | scanning |
| `POST` | `/api/urlscan/subdomains` | `test_parse_subdomains` | scanning |
| `POST` | `/api/urlscan/wayback` | `test_parse_wayback` | scanning |
| `POST` | `/api/ioc/extract` | `extract_ioc` | - |
| `POST` | `/file/scan/{user_id}` | `file_scan` | - |
| `POST` | `/api/apk/scan` | `extract_ioc` | - |
| `POST` | `/api/crypto/scan` | `extract_crypto` | - |
| `POST` | `/api/nexus/analyze-text` | `test_nexus_analyze_text` | - |
| `POST` | `/api/cross/search` | `test_cross_search` | scanning |
| `POST` | `/api/netintel/resolve_ip` | `test_netintel_resolve_ip` | - |
| `POST` | `/api/netintel/ipscanner` | `test_netintel_ipscanner` | - |
| `POST` | `/api/netintel/url_vulnerability_scan` | `test_netintel_url_vulnerability_scan` | - |
| `POST` | `/api/netintel/iot_detect` | `test_netintel_camera_detect` | - |
| `POST` | `/api/netintel/camera_detect_ranges` | `test_netintel_camera_detect_ranges` | - |
| `POST` | `/api/social/recon` | `test_social_recon` | scanning |
| `POST` | `/api/social/recon/image` | `test_social_recon_image` | scanning |
| `POST` | `/api/social/profile` | `test_social_profile` | scanning |
| `POST` | `/api/social/online/images` | `test_social_online_images` | scanning |
| `POST` | `/api/social/posts` | `test_social_posts` | scanning |
| `POST` | `/api/social/followers` | `test_social_followers` | scanning |
| `POST` | `/api/social/following` | `test_social_following` | scanning |
| `POST` | `/api/social/entity` | `test_social_entity` | scanning |
| `POST` | `/api/social/session/upsert` | `test_social_session_upsert` | scanning |
| `GET` | `/api/social/session/tabs` | `test_social_session_tabs` | scanning |
| `POST` | `/api/social/session/tab/add` | `test_social_session_tab_add` | scanning |
| `POST` | `/api/get/tenant/node` | `test_get_tenant_node` | - |

## Source Map

Source inventory count: **749** maintainable files. This refined reference keeps area summaries and key files only; it does not embed every source file.

### Counts By Area

| Area | Files | Purpose |
| --- | ---: | --- |
| `client/src/app/pages` | 235 | Angular feature pages for dashboard, modules, profile, tenant, graph, search, login, signup, and onboarding. |
| `client/src/app/shared` | 180 | Reusable Angular models, guards, resolvers, directives, partials, constants, icons, and styles. |
| `client/cypress` | 68 | End-to-end tests, fixtures, and test support helpers. |
| `backend/orion/api/interactive` | 67 | User-facing backend managers for account, tenant, search, alerts, feeder, graph, feedback, directory, homepage, and payment workflows. |
| `backend/orion/services` | 49 | Infrastructure adapters for MongoDB, Elasticsearch, ArangoDB, Redis, sessions, encryption, mail, STIX conversion, and logging. |
| `backend/orion/api/server` | 28 | Server-side crawl, config, and entity managers used by routes and ingestion callbacks. |
| `backend` | 27 | Supporting source area. |
| `client` | 22 | Supporting source area. |
| `client/src/app/services` | 17 | Frontend API clients and state services used by pages and shared components. |
| `backend/tests` | 13 | Supporting source area. |
| `backend/routes` | 10 | FastAPI route modules and public/internal API entry points. |
| `backend/configs` | 6 | Application wiring for auth, dependencies, limiter, Swagger, settings, and exception handling. |
| `backend/migrations` | 4 | Database migration runner and versioned migration scripts. |
| `README.md` | 1 | Supporting source area. |
| `docker-compose-testing.yml` | 1 | Supporting source area. |
| `docker-compose.yml` | 1 | Supporting source area. |
| `pyproject.toml` | 1 | Supporting source area. |
| `run.sh` | 1 | Supporting source area. |

### Counts By Kind

| Kind | Files |
| --- | ---: |
| angular component | 140 |
| angular template | 139 |
| typescript | 84 |
| backend manager/service | 76 |
| backend model | 74 |
| angular service/resolver/guard | 60 |
| typescript model | 47 |
| backend python | 45 |
| stylesheet | 15 |
| backend test | 14 |
| documentation | 13 |
| text | 11 |
| backend route module | 10 |
| json data/config | 6 |
| angular directive | 5 |
| angular pipe | 5 |
| configuration | 3 |
| angular routes | 1 |
| script | 1 |

### Key Files For Implementation Questions

| Path | Kind | Summary |
| --- | --- | --- |
| `client/src/app/app.routes.ts` | angular routes | Angular route definition with 135 route path entries. |
| `client/src/app/app.config.ts` | typescript | TypeScript source module. |
| `backend/routes/admin_routes.py` | backend route module | Defines functions block_row_action, custom_edit_api, custom_edit_api_trailing, update_public_config, update_user; API routes /admin/api/db_system_model/row-action, /admin/api/db... |
| `backend/routes/api_micros.py` | backend route module | Defines functions ai_endpoint_required, fetch_cti_label, parse_ai, summarize_ai, chat_report; API routes /api/cti/fetch, /api/nexus/analyze-text, /api/nexus/chat. |
| `backend/routes/api_routes.py` | backend route module | Defines functions _scan_domain_with_type, _enforce_demo_safe_search, index_injection, search_siem_logs, search_general; API routes /api/apk/scan, /api/cross/search, /api/crypto/... |
| `backend/routes/auth_routes.py` | backend route module | Defines functions set_access_cookie, token_from_request, token, token_demo, verify_2fa; API routes /api/forgot, /api/logout, /api/signup. |
| `backend/routes/crawl_routes.py` | backend route module | Defines functions feeder, parser, get_feeder_catalog, get_feeder_scripts, get_feeder_owner_users; API routes /api/feeder/status, /api/feeder/{index_type}, /api/index/chat. |
| `backend/routes/public_api_routes.py` | backend route module | Defines functions cookie_required, get_public_config, get_tenant_resource, get_user_resource, get_system_resource; API routes /api/public, /api/s/static/favicon, /api/s/static/s... |
| `backend/routes/social_routes.py` | backend route module | Defines functions search_dynamic_email, search_dynamic_phone_recon, search_dynamic_profile, search_dynamic_online_images, search_dynamic_image; API routes /api/social/entity, /a... |
| `backend/routes/tenant_routes.py` | backend route module | Defines functions get_tenant, update_tenant, get_tenant_users, get_all_tenants, update_user; API routes /api/alert/add, /api/alert/delete, /api/alert/seen. |
| `backend/routes/test_routes.py` | backend route module | Defines functions _mock_step, _load_elastic_mock, _load_api_mock, _pending_or_api_mock, _pending_or_elastic_mock; API routes /api/apk/scan, /api/cross/search, /api/crypto/scan. |
| `backend/routes/docs/docs.py` | backend route module | Defines functions _resolve_docs_dir, _read_md, _doc. |
| `backend/orion/api/interactive/account_manager/account_manager.py` | backend manager/service | Defines classes AccountManager; API routes /api/s/static/tenant/, /api/s/static/user/. |
| `backend/orion/api/interactive/alert_manager/alert_manager.py` | backend manager/service | Defines classes AlertManager. |
| `backend/orion/api/interactive/auditlog_manager/audit_log_manager.py` | backend manager/service | Defines classes AuditLogManager. |
| `backend/orion/api/interactive/auth_manager/auth_manager.py` | backend manager/service | Defines classes auth_manager. |
| `backend/orion/api/interactive/directory_manager/directory_model.py` | backend model | Defines classes directory_model. |
| `backend/orion/api/interactive/dump_manager/dump_model.py` | backend model | Defines classes dump_model. |
| `backend/orion/api/interactive/feedback_manager/feedback_manager.py` | backend manager/service | Defines classes FeedbackManager. |
| `backend/orion/api/interactive/feeder_manager/feeder_manager.py` | backend manager/service | Defines classes FeederManager. |
| `backend/orion/api/interactive/graph_manager/graphs_model.py` | backend model | Defines classes graphs_model. |
| `backend/orion/api/interactive/hompage_manager/homepage_model.py` | backend model | Defines classes homepage_model. |
| `backend/orion/api/interactive/payment_manager/payment_manager.py` | backend manager/service | Defines classes PaymentManager. |
| `backend/orion/api/interactive/resource_manager/resource_manager.py` | backend manager/service | Defines classes ResourceManager. |
| `backend/orion/api/interactive/search_manager/search_callback_model.py` | backend model | Defines classes search_callback. |
| `backend/orion/api/interactive/search_manager/search_model.py` | backend model | Defines classes search_model. |
| `backend/orion/api/interactive/siemlog_manager/siem_log_manager.py` | backend manager/service | Defines classes SiemLogManager. |
| `backend/orion/api/interactive/signup_manager/signup_manager.py` | backend manager/service | Defines classes SignupManager. |
| `backend/orion/api/interactive/tenant_manager/tenant_manager.py` | backend manager/service | Defines classes TenantManager. |
| `backend/orion/api/interactive/account_manager/models/chat_history_model.py` | backend model | Defines classes ChatHistoryMessageModel, chat_history_model. |
| `backend/orion/api/interactive/account_manager/models/node_callback_model.py` | backend model | Defines classes UserDataModel, TenantDataModel, NodeCallbackModel. |
| `backend/orion/api/interactive/account_manager/models/user_meta_model.py` | backend model | Defines classes user_meta_model. |
| `backend/orion/api/interactive/account_manager/models/user_model.py` | backend model | Defines classes user_model. |
| `backend/orion/api/interactive/account_manager/models/user_param_model.py` | backend model | Defines classes UserStatus, user_param_model. |
| `backend/orion/api/interactive/auditlog_manager/models/audit_log_param_model.py` | backend model | Defines classes audit_log_param_model. |
| `backend/orion/api/interactive/directory_manager/directory_shared_model/directory_callback_model.py` | backend model | Defines classes directory_callback_link, directory_callback_model. |
| `backend/orion/api/interactive/directory_manager/directory_shared_model/directory_param_model.py` | backend model | Defines classes directory_param_model. |
| `backend/orion/api/interactive/dump_manager/dump_shared_model/dump_callback_model.py` | backend model | Defines classes dump_callback_link, dump_callback_model. |
| `backend/orion/api/interactive/dump_manager/dump_shared_model/dump_param_model.py` | backend model | Defines classes dump_param_model. |
| `backend/orion/api/interactive/feedback_manager/models/feedback_param_model.py` | backend model | Defines classes feedback_param_model, feedback_comment_param_model. |
| `backend/orion/api/interactive/graph_manager/graph_models/search_social_callback_model.py` | backend model | Defines classes suggestion, result_item, search_social_callback_model. |
| `backend/orion/api/interactive/graph_manager/graph_models/search_social_param_model.py` | backend model | Defines classes search_social_param_model, SocialReconRequest, SearchEngineMetaRequest, PlatformUsernameRequest. |
| `backend/orion/api/interactive/payment_manager/model/payment_param_model.py` | backend model | Defines classes PaymentParamModel. |
| `backend/orion/api/interactive/search_manager/search_data_model/search_callback_model.py` | backend model | Defines classes suggestion, result_item, search_callback_model. |
| `backend/orion/api/interactive/signup_manager/model/signup_request_model.py` | backend model | Defines classes SignupRequest, SupportRequest. |
| `backend/orion/api/interactive/tenant_manager/models/tenant_param_model.py` | backend model | Defines classes UserStatus, tenant_param_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/chat/search_chat_callback_model.py` | backend model | Defines classes search_chat_callback_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/chat/search_chat_param_model.py` | backend model | Defines classes search_chat_param_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/consolidated/search_consolidated_callback_model.py` | backend model | Defines classes grouped_consolidated_search_callback_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/consolidated/search_consolidated_param_model.py` | backend model | Defines classes search_consolidated_param_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/defacement/search_defacement_callback_model.py` | backend model | Defines classes result_item, search_defacement_callback_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/defacement/search_defacement_param_model.py` | backend model | Defines classes search_defacement_param_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/dump/search_credential_param_model.py` | backend model | Defines classes PasswordFilterModel, search_credential_param_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/dump/search_stealerlog_callback_model.py` | backend model | Defines classes suggestion, stealerlog_result_item, search_stealerlog_callback_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/dynamic/search_dynamic_param_model.py` | backend model | Defines classes search_dynamic_param_model, search_dynamic_crack_model, search_dynamic_social_model, search_dynamic_onion_search. |
| `backend/orion/api/interactive/search_manager/search_data_model/exploit/search_exploit_callback_model.py` | backend model | Defines classes result_item, search_exploit_callback_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/exploit/search_exploit_param_model.py` | backend model | Defines classes search_exploit_param_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/general/search_general_callback_model.py` | backend model | Defines classes result_item, search_general_callback_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/general/search_general_param_model.py` | backend model | Defines classes search_general_param_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/leak/search_leak_callback_model.py` | backend model | Defines classes result_item, search_leak_callback_model. |
| `backend/orion/api/interactive/search_manager/search_data_model/leak/search_leak_param_model.py` | backend model | Defines classes _search_base_param_model, search_leak_param_model, search_news_param_model, search_news_internal_param_model. |
| `backend/orion/api/server/config_manager/config_controller.py` | backend manager/service | Defines classes config_controller; API routes /api/s/static/system/, /api/s/static/system/logo_url_default.png, /api/s/static/system/logo_wide_dark_default.png. |
| `backend/orion/api/server/crawl_manager/crawl_model.py` | backend model | Defines classes crawl_model. |
| `backend/orion/api/server/entity_manager/entity_manager.py` | backend manager/service | Defines classes entity_manager. |
| `backend/orion/api/server/crawl_manager/class_model/chat_model.py` | backend model | Defines classes chat_model, chat_data_model. |
| `backend/orion/api/server/crawl_manager/class_model/credential_model.py` | backend model | Defines classes credential_model, credential_data_model. |
| `backend/orion/api/server/crawl_manager/class_model/defacement_model.py` | backend model | Defines classes CardExtractionModel, DefacementDataModel. |
| `backend/orion/api/server/crawl_manager/class_model/domain_scan_request_model.py` | backend model | Defines classes DomainScanRequest, UrlVulnerabilityScanRequest. |
| `backend/orion/api/server/crawl_manager/class_model/dump_model.py` | backend model | Defines classes DumpModel. |
| `backend/orion/api/server/crawl_manager/class_model/entity_model.py` | backend model | Defines classes entity_model. |
| `backend/orion/api/server/crawl_manager/class_model/exploit_model.py` | backend model | Defines classes CardExtractionModel, ExploitDataModel. |
| `backend/orion/api/server/crawl_manager/class_model/file_model.py` | backend model | Defines classes ScreenshotPayload. |
| `backend/orion/api/server/crawl_manager/class_model/general_model.py` | backend model | Defines classes GeneralDataModel. |
| `backend/orion/api/server/crawl_manager/class_model/ip_scan_request_model.py` | backend model | Defines classes IPScanRequest, NetIntelDeepScanRequest, ResolveIPRequest, GeoCameraDetectRequest. |
| `backend/orion/api/server/crawl_manager/class_model/leak_model.py` | backend model | Defines classes CardExtractionModel, LeakDataModel. |
| `backend/orion/api/server/crawl_manager/class_model/log_model.py` | backend model | Defines classes LogModel, LogBatchModel, InjectionLogModel, InjectionBatchRequestModel. |
| `backend/orion/api/server/crawl_manager/class_model/nlp_data_model.py` | backend model | Defines classes nlp_data_model. |
| `backend/orion/api/server/crawl_manager/class_model/open_sanctions_model.py` | backend model | Defines classes open_sanctions_data_model. |
| `backend/orion/api/server/crawl_manager/class_model/report_chat_data_model.py` | backend model | Defines classes ReportChatRequest, NexusTextAnalysisRequest. |
| `backend/orion/api/server/crawl_manager/class_model/social_model.py` | backend model | Defines classes social_model, social_data_model. |
| `backend/orion/api/server/crawl_manager/class_model/social_scrape_request_model.py` | backend model | Defines classes SocialTarget, SocialScrapeRequest. |
| `backend/orion/services/arango_manager/arango_controller.py` | backend manager/service | Defines classes arango_controller. |
| `backend/orion/services/elastic_manager/elastic_controller.py` | backend manager/service | Defines classes elastic_controller. |
| `backend/orion/services/elastic_manager/elastic_semantic_controller.py` | backend manager/service | Defines classes elastic_semantic_controller. |
| `backend/orion/services/encryption_manager/encryption_manager.py` | backend manager/service | Defines classes encryption_manager. |
| `backend/orion/services/encryption_manager/key_manager.py` | backend manager/service | Defines classes KeyManager. |
| `backend/orion/services/log_manager/log_controller.py` | backend manager/service | Defines classes log. |
| `backend/orion/services/mail_manager/mail_manager.py` | backend manager/service | Defines classes mail_manager. |
| `backend/orion/services/mongo_manager/mongo_controller.py` | backend manager/service | Defines classes mongo_controller. |
| `backend/orion/services/redis_manager/redis_controller.py` | backend manager/service | Defines classes redis_controller. |

## Data And Access Gates

- **Roles:** features may be hidden or constrained by user role and tenant membership.
- **Licenses:** module licenses such as breach, news, exploit, defacement, dumps, scanning, AI, CTI graph, and maintainer gates may affect visibility.
- **Settings:** `ai_endpoint_enabled` controls AI endpoints and AI surfaces in supported deployments.
- **Tenant/account state:** inactive users, incomplete onboarding, disabled signup, tenant branding/settings, and approval flows can change UI availability.
- **OpenAPI exposure:** routes hidden from `/openapi.json` can still exist in backend route modules; use Backend Route Map for implementation context.

## Maintenance Rules

1. Keep `docs/llm_docs` as a Markdown-only LLM package.
2. Keep curated app help in this reference so LLMs can answer navigation and feature-use questions without opening public docs.
3. Do not store raw source inventories, raw JSON catalogs, generated Swagger samples, screenshots, or verbatim copied public manuals here.
4. If feature metadata changes, update the Feature Reference and Application Help Deep Dive in this file.
5. If API routes change, refresh API Integration Guidance, Public API Index, and Backend Route Map from the current FastAPI app and route decorators.
6. If source layout changes, refresh Developer And Source Guidance, Source Map counts, and key files from the current repository.

## Known Limits

This is a static reference. It is optimized for retrieval and assistant grounding, not for exhaustive generated documentation. Before changing code or answering precise implementation behavior, inspect the live source files in the repository.
