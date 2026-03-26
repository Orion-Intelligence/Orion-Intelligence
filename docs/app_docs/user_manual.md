(user-manual)=

# User Manual

:::{admonition} Scope
:class: tip

This manual is written for the Orion web application as implemented in this repository. It covers the main user experience, search and investigation workflows, live lookup tools, graph views, tenant workflows, and administrative screens. Some features appear only for specific licenses, tenants, or roles.
:::

## About This Guide

Orion is an investigation and monitoring platform that combines indexed intelligence, live lookups, graph exploration, tenant workflows, and platform administration in one interface. Users typically work in one of four ways:

1. Search indexed data from the main dashboard.
2. Run a targeted lookup or scan against a domain, file, email, IP, username, or other entity.
3. Open a report view to inspect metadata, evidence, and relationships.
4. Manage tenant, user, alert, and platform settings based on role permissions.

This document is organized around those tasks.

```{contents}
:local:
:depth: 2
```

## Access and Entry Points

### Login

The standard entry point is the login screen. Depending on deployment settings, users may also encounter:

- account onboarding
- welcome or notification screens
- password reset flows

```{figure} ../screenshots/login-page.png
:alt: Orion login page
:width: 90%

Login screen used for standard account access.
```

```{admonition} Role-aware experience
:class: note

The sidebar, available modules, and some actions are controlled by role, tenant state, and license assignment. Two users in the same deployment may not see the same menu.
```

### Password Reset

The reset flow supports two stages:

- requesting a reset link by email
- submitting a new password using a tokenized reset link

The new-password form includes password-strength guidance and confirmation validation.

```{figure} ../screenshots/password-reset.png
:alt: Password reset request page
:width: 90%

Password reset workflow entry point.
```

### Tenant Onboarding

New tenant users may be routed through a multi-step onboarding flow before using the main dashboard. The onboarding wizard includes:

1. company information
2. IOC setup
3. confirmation

During onboarding, users can define monitored IOC values by category before entering the main application.

## Main Application Layout

After authentication, Orion opens inside the `dashboard` workspace.

```{figure} ../screenshots/homepage-overview.png
:alt: Orion homepage
:width: 100%

Orion dashboard landing view.
```

The main UI is centered around four areas:

- the left sidebar for navigation
- the global search and module toolbar
- the result or report workspace
- slide-out or inline filter panels

### Left Sidebar

The left sidebar is the primary navigation system. It groups features by investigation area and by operational purpose.

```{figure} ../screenshots/homepage-overview.png
:alt: Orion sidebar
:width: 100%

Expanded sidebar with major modules and support links.
```

The sidebar can include:

- user profile and account pages
- indexed search modules
- live scan and API modules
- graph tools
- support links such as `Onion Link`, `Links`, and `Documentation`

### Global Search Area

Most data-driven modules share the same search pattern:

- a search box
- optional advanced filtering
- optional search tools
- an optional right-side filter drawer

```{figure} ../screenshots/homepage-searchbar.png
:alt: Global search bar
:width: 90%

Search bar with search, advanced mode, and tools controls.
```

### Result Workspace

The result area changes by module, but commonly includes:

- a result count
- cards or row-based entries
- analytics summaries
- filters
- pagination
- empty, loading, and no-result states

## Global Search Workflow

The search bar is the main entry point for indexed investigation.

### Basic Search

In standard mode, users can enter a free-text query and submit it immediately. Orion then loads results for the current module or route context.

### Advanced Search Toggle

The `Advance` toggle enables the filter overlay below the search bar. When enabled, Orion exposes indexed filter controls that let users narrow the query more precisely.

### Tools Menu

The `Tools` section provides search behavior controls and, in some contexts, sorting options.

```{figure} ../screenshots/homepage-searchbar.png
:alt: Search type controls
:width: 90%

Search entry area with search mode and tools controls.
```

Available search modes in the main result workflow include:

- `Match Semantic`
- `Match any term (OR)`
- `Match individual terms (AND)`
- `Match full query`

These modes affect how broadly or narrowly Orion interprets the query.

### Search Filters

When advanced mode is enabled, users can add indexed filters to refine the result set.

```{figure} ../screenshots/search-filters.png
:alt: Search filters
:width: 80%

Filter controls for refining indexed search.
```

Across the application, filter panels typically support:

- dropdown selection
- text input
- date range input
- apply
- reset

### Selected Filter Bar

When entity filters, sidebar filters, or non-default search tools are active, Orion can display a selected-filter bar showing what is currently affecting the result set.

## Homepage

The homepage is the default overview for many users and acts as a search-first dashboard.

The homepage typically includes:

- the global search entry point
- high-level summaries
- statistics or insight cards
- general and leaked index summaries

For some privileged roles, the homepage also includes a draggable insight panel layered over the main search experience. Other users may instead see a simplified search-first landing view or a tenant-home style alert summary, depending on license assignment and whether the account belongs to a default tenant.

### Homepage Summary Areas

- `General Index`: broad indexed content gathered across supported sources.
- `Leaked Index`: sensitive, exposed, or higher-priority findings.
- `Recent or featured results`: direct pivots into current records.
- `Insight blocks`: charts and counts used for quick triage.

```{figure} ../screenshots/homepage-overview.png
:alt: Homepage dashboard
:width: 100%

Homepage overview with summary panels and search-first layout.
```

```{figure} ../screenshots/tenant-homepage.png
:alt: Tenant homepage dashboard
:width: 100%

Tenant-oriented homepage with alert and monitoring summaries.
```

## Analytics and Result Insights

Orion exposes analytics alongside search results to help analysts understand the composition of the returned dataset.

```{figure} ../screenshots/consolidated-insights.png
:alt: Keyword insights
:width: 75%

Keyword-level insight and result analysis.
```

```{figure} ../screenshots/consolidated-results.png
:alt: General result analytics
:width: 100%

Expanded result insight and breakdown panels.
```

Depending on module and query, analytics can summarize:

- keyword frequency
- category distribution
- result volume
- network or source distribution
- URL and title breakdowns

## Navigation Reference

The exact menu depends on license and permissions, but the Orion UI commonly exposes the following modules.

| Module | Primary purpose | Typical views |
| --- | --- | --- |
| Homepage | Entry point and overview | search, summaries, statistics |
| General Intelligence | Broad indexed intelligence search | All, General, Forums, News, Stolen, Drugs, Hacking, Marketplaces, Cryptocurrency, Leaks |
| Data Breach | Breach records and exposure checks | All, Databases, Tracking |
| Defacement | Website compromise monitoring | All, Hacked, Phishing, Databases |
| Social | Social and community-source intelligence | All, Telegram, Twitter, Mastodon, Pastebin, Forum, Reddit |
| Exploit | Vulnerability and exploit intelligence | All, CVE, Tools, ZeroDay |
| Consolidated | Combined multi-source investigation | IOCs, Deep Search, Network Intel |
| Feed | News-style intelligence stream | News |
| Dump | Dump and listing sources | Listing |
| Stealer Logs | Credential and IOC investigation | IOCs |
| Web Scans | Live web-target scanning | Basic Scan, Port Scan, Repository Scan, SEO Scan, APK Scan |
| Entity API | Entity-based live lookups | Email Breach, Social Scanner, Wanted List, National Identity, Playstore Scanner, Software Scanner, File Scanner, Crypto Scanner |
| Network Intel | Domain, IP, and vulnerability recon | Host Recon, IP Scan, Vulnerability Scan |
| Social Intel | Username and profile mapping | graph and list views |
| CTI Graph | Cyber relationship mapping | cluster, document, property pivots |
| Links | Link directory and monitored references | directory listing |
| Onion Link | External onion access | external link |
| Whistle Blowing | External reporting portal | external link |
| Documentation | Published documentation | external docs |

## Indexed Investigation Modules

### Consolidated

The consolidated view is Orion's combined investigation workspace. It is designed for users who want one query to drive multiple result channels instead of searching each module separately.

The consolidated route can expose three major tabs:

- `IOCs`
- `Deep Search`
- `Network Intel`

Depending on the query and license state, this view can combine:

- grouped indexed results
- stealer-log matches for qualifying queries such as emails or URLs
- embedded network or scan-style pivots

Use consolidated search for first-pass triage when you want breadth before moving into a dedicated module.

```{figure} ../screenshots/consolidated-results.png
:alt: Consolidated investigation results
:width: 100%

Combined result workflow used for broad first-pass triage.
```

### General Intelligence

General Intelligence is the primary broad-spectrum indexed search area. Use it when you want to search topics, entities, or keywords across multiple kinds of sources.

Subcategories:

- `All`
- `General`
- `Forums`
- `News`
- `Stolen`
- `Drugs`
- `Hacking`
- `Marketplaces`
- `Cryptocurrency`
- `Leaks`

```{figure} ../screenshots/general-intelligence-results.png
:alt: General intelligence results
:width: 100%

General Intelligence result workflow.
```

Typical use cases:

- surveying discussions around a topic
- reviewing leak mentions
- exploring dark-web marketplace activity
- scanning mixed-source intelligence for a keyword

### Data Breach

The Data Breach module is used for known breach data and identity exposure checks.

Subcategories:

- `All`
- `Databases`
- `Tracking`

Use `Databases` when you want structured breach records. Use `Tracking` when checking whether a specific email or identity appears in known breach data.

```{figure} ../screenshots/data-breach-tracking.png
:alt: Email breach tracking
:width: 100%

Example of a breach tracking workflow.
```

### Defacement

Defacement tracks websites that were altered, hijacked, cloned, or otherwise compromised.

Subcategories:

- `All`
- `Hacked`
- `Phishing`
- `Databases`

The detail view commonly exposes:

- target URL
- date saved
- attacker or defacer
- team name
- server or IOC context
- breach or source reference
- IP and location

```{figure} ../screenshots/defacement-report.png
:alt: Defacement report view
:width: 100%

Defacement result detail with target and attacker context.
```

### Social

The Social module aggregates intelligence from social and community platforms.

Supported views:

- `All`
- `Telegram`
- `Twitter`
- `Mastodon`
- `Pastebin`
- `Forum`
- `Reddit`

Use this module for:

- early warning and chatter monitoring
- leak discovery
- discussion tracking
- platform-specific searches

```{figure} ../screenshots/social-report.png
:alt: Social or feed-style intelligence results
:width: 100%

Example of a stream-oriented social intelligence view.
```

### Exploit

Exploit focuses on vulnerability and exploit-related intelligence.

Key views:

- `CVE`
- `Tools`
- `ZeroDay`

This module is useful when starting from:

- a known vulnerability ID
- a product or platform with public exploit coverage
- a threat report mentioning exploit tooling

### Feed

Feed is the stream-oriented intelligence area for news-style content and current reporting. It is useful for users who want a curated readout without first building a structured query.

### Dump

Dump exposes indexed dump and listing material gathered from monitored sources such as channels, leak-sharing locations, and relevant websites. Use filters to narrow by source, type, or origin.

The dump page also provides a dedicated search field for leak URLs, making it more direct than the broader keyword-first search used in other modules.

Common usage patterns include:

- browsing leak or dump listings with page-level filters
- pivoting directly from a known leak URL
- reviewing channel-style or site-style dump references without opening a broader module first

```{figure} ../screenshots/dump-listing.png
:alt: Dump listing workflow
:width: 100%

Dump listing view with direct leak URL search.
```

## Stealer Logs

Stealer Logs is a dedicated credential and IOC investigation workflow for infostealer-derived data.

### Search Modes

The stealer-log search bar supports two operating modes:

- `Basic`
- `Advanced`

### Basic Mode

Basic mode lets users search by a selected tag. Available tags include:

- `All`
- `Domain`
- `Email`
- `Credit Card`
- `IP`

Validation is applied to tag-specific inputs where needed.

### Advanced Filter Builder

Advanced mode exposes a row-based query builder that supports:

- `WHERE`
- `AND`
- `OR`

Each row combines:

- an operator
- a data tag
- a value

This is the preferred mode for precise hunting across large stealer datasets.

### Result Metrics

The Stealer Logs results page surfaces quick metrics such as:

- search elapsed time
- total results
- asset count
- aggregated count

### Supporting Actions

The toolbar can include:

- password scheme view
- domain or subdomain helper
- result download

The password-scheme helper is useful when you want to inspect likely password formats or schema patterns. The domain helper provides a fast pivot into related host or subdomain exploration without leaving the stealer-log workflow.

### Result Review

The results area is designed for:

- large record volumes
- structured credential review
- pagination
- ranked result handling

:::{admonition} Common use case
:class: note

Use Stealer Logs when you already have a domain, email, or IP and need to confirm whether it appears in infostealer-derived material.
:::

```{figure} ../screenshots/stealer-logs-results.png
:alt: Credential and stealer-log results
:width: 100%

Structured result review for credential-focused investigations.
```

## Live Lookup and Scan Modules

### Entity API

Entity API is used for targeted live lookups rather than passive indexed browsing.

Available lookup types:

- `Email Breach`
- `Social Scanner`
- `Wanted List`
- `National Identity`
- `Playstore Scanner`
- `Software Scanner`
- `File Scanner`
- `Crypto Scanner`

```{figure} ../screenshots/entity-api-email-breach.png
:alt: Entity API view
:width: 100%

Entity API interface for live lookup workflows.
```

Typical use cases:

- breach validation for a single email
- identity enrichment
- app and software lookups
- file analysis
- crypto-address context

### File Scanner

The file-scanner workflow supports two related use cases:

- file IOC extraction
- APK analysis

Supported behavior includes:

- file-type validation
- size validation
- upload and processing progress
- grouped IOC output
- export and print for supported scan types

For file IOC extraction, Orion groups indicators into categories such as URLs, packages, permissions, tampering markers, and other extracted values based on the uploaded content.

### Web Scans

Web Scans is the live scanning area for web-facing targets.

Available scan types:

- `Basic Scan`
- `Port Scan`
- `Repository Scan`
- `SEO Scan`
- `APK Scan`

The standard web-scan workflow includes:

1. enter a target domain or repository-style URL
2. run the scan
3. wait for loading-step progress
4. review the generated report

The report commonly includes:

- a security grade
- host and port
- TLS status
- scan metadata such as `Scanned On` and `Scanned By`
- categorized findings
- evidence or proof blocks
- download and print actions

Finding sections also show severity and confidence labels, so the report can be used for quick triage as well as export.

Scan failures are handled with retry guidance and error messaging.

```{figure} ../screenshots/web-scan-report.png
:alt: Web scan report
:width: 100%

Web scan report with security posture, findings, and metadata.
```

### Network Intel

Network Intel provides live recon workflows for domains and IPs.

Tabs:

- `Host Recon`
- `IP Scan`
- `Vulnerability Scan`

```{figure} ../screenshots/network-intel-host-recon.png
:alt: Network intelligence view
:width: 100%

Network Intel module for recon and vulnerability review.
```

#### Host Recon

Host Recon is used to resolve a domain into infrastructure and network information. It commonly surfaces DNS-style and IP-related context for the queried host.

#### IP Scan

IP Scan focuses on a specific IP and can expose service or infrastructure context derived from the target address.

#### Vulnerability Scan

Vulnerability Scan reviews security issues for a supplied target and includes:

- progress feedback
- elapsed time
- downloadable report output
- cancel support during scanning

#### Common Toolbar Features

The Network Intel toolbar can include:

- query input
- status indicators
- result count
- elapsed time
- download report
- cancel current run
- optional geo search support for relevant views

Geo support is especially relevant when working from host-oriented results and wanting to pivot from a location or coordinates into nearby IP discovery.

```{figure} ../screenshots/network-intel-geo-modal.png
:alt: Network Intel geo modal
:width: 80%

Geo-assisted pivot modal used from network results.
```

## Graph Investigation Modules

### CTI Graph

CTI Graph is the relationship-mapping module for cyber threat intelligence pivots.

It opens in its own tabbed workspace and supports multiple sessions.

Key concepts:

- `Cluster` nodes
- `Document` nodes
- `Property` nodes
- grouped nodes
- directional connections

#### Core CTI Features

- session tabs
- sidebar filters
- graph and list views
- node search and highlighting
- physics toggle
- expand or collapse controls
- right-side listings panel
- import and export support
- report export

The listings panel provides a document-oriented summary of the current graph state, while the legend explains node and edge types.

### Social Intel

Social Intel is a graph-based username and profile mapping workspace.

It supports:

- username scanning
- graph view
- list view
- graph search
- image-based workflows
- editable connections
- custom entity management
- scan history and jobs
- metadata and profile popups

#### Social Intel Layout

The workspace includes:

- a tab bar
- a collapsible left home menu
- a graph toolbar
- a central graph or list panel
- a right-side entity manager

#### Graph Functions

Users can:

- scan a username
- switch between graph and list views
- enable or disable graph physics
- search nodes directly on the graph
- inspect profile summaries
- open metadata popups
- fetch profiles, posts, images, followers, and following data
- manage custom entities
- rename graph aliases for display

The legend distinguishes user profiles, platforms, platform groups, custom entities, and connection types.

## Result and Report Workflows

Most indexed modules eventually lead into a report page. Report pages are one of the most important parts of the product because they consolidate the searchable record, its metadata, and pivot actions.

### Report Toolbar

The shared report header can expose:

- download
- export report
- translation
- AI summary
- share
- open source URL
- open CTI graph

The exact buttons depend on the record and deployment configuration.

When available, this toolbar is the fastest way to export, translate, summarize, share, or pivot the current record into graph analysis.

### Result Insights Side Panel

In consolidated workflows, Orion also provides a dedicated insights panel beside the main result stream. This side panel can expose:

- keyword insights
- general coverage summaries
- threat-actor search helpers
- unique URL lists
- expandable extracted-data sections

This panel is intended for quick triage and narrowing before opening individual reports.

In practice, it helps answer three questions quickly:

- what themes dominate this result set
- whether actor- or URL-based pivots are available
- which extracted sections are worth opening in full reports

```{figure} ../screenshots/consolidated-insights.png
:alt: Result insights side panel
:width: 75%

Result insights side panel with URL and extracted-data pivots.
```

### General Report Page

The general report view commonly includes:

- title
- description or important content
- web reference
- source URL
- published date
- network
- last-checked date
- content-type tags
- freshness status

Some report layouts also expose quick links, downloadable record output, or direct pivot actions to graph and sharing tools from the same header.

```{figure} ../screenshots/social-report.png
:alt: Report content view
:width: 100%

Typical report layout with content and structured context.
```

### Metadata Panel

The metadata panel is expandable and lets users browse extracted values by category. Common tabs include:

- content
- section
- organization
- entity or person
- other extracted attributes

This is the main place to inspect structured extraction results from the record.

```{figure} ../screenshots/report-json-viewer.png
:alt: Report metadata sections
:width: 90%

Expandable metadata and extracted-section review.
```

### Screenshot and JSON Sections

For relevant breach records, the report may also include:

- screenshot preview
- JSON record viewer
- report mapping

The JSON viewer is useful for raw structured inspection, while report mapping helps users navigate relationships and related record context.

```{figure} ../screenshots/report-json-viewer.png
:alt: Report JSON viewer
:width: 90%

JSON inspection view for raw structured report data.
```

### AI Chat and Summary

If an AI endpoint is configured, users may also see:

- AI summary generation
- chat over the report content

For chat-style and social-style records, report pages can also include:

- channel or source title
- source URL
- report sharable link
- sender details
- message identifiers
- views, likes, shares, comments, tags, or retweets
- expandable metadata blocks
- JSON inspection

This makes the report page suitable for both analyst review and downstream sharing.

### Defacement Report Page

The defacement report is a streamlined variant focused on target and attacker context. It includes:

- target URL
- saved date
- defacer or IOC type
- team
- source breach reference
- IP
- location
- metadata panel
- JSON viewer

## Links, Support, and External Navigation

### Directory

The `Directory` page presents monitored live services and related records in a browsing-oriented layout. It differs from the normal search-result workflow by focusing on monitored entries and operational visibility rather than keyword-first investigation.

Common behaviors include:

- page-level filtering
- paginated or progressively loaded directory entries
- monitoring-status style browsing
- service and reference review across monitored live entries

```{figure} ../screenshots/directory-monitoring.png
:alt: Directory and monitoring view
:width: 85%

Monitoring-oriented directory workflow.
```

### Links

The `Links` sidebar item acts as the user-facing entry into the directory-style workflow above.

### Onion Link

If configured, `Onion Link` opens the deployment’s onion address in a separate tab.

### Whistle Blowing

If enabled, `Whistle Blowing` opens an external anonymous reporting portal. This is outside the main indexed investigation workflow.

### Documentation

The `Documentation` entry opens the published documentation site in a new tab.

## Profile, Tenant, and Alert Workflows

The user profile area at the top of the sidebar contains user-specific and tenant-specific pages.

```{figure} ../screenshots/account-settings.png
:alt: Account settings page
:width: 100%

Profile, settings, and administrative workspace.
```

### Account Settings

The account page allows the current user to review and manage:

- profile image
- username
- role
- tenant or location display
- assigned licenses
- two-factor authentication
- theme preference

The page also shows the currently running platform version. It is focused on the current user rather than the tenant as a whole.

```{figure} ../screenshots/account-settings.png
:alt: Account settings form
:width: 100%

Current-user profile and account settings form.
```

### Tenant Homepage

For tenant users, the profile homepage may function as a tenant intelligence and alert workspace instead of a simple profile landing page.

Depending on license and role, this page can include:

- homepage search
- alert export
- scan-all or flush-all actions
- risk summary cards
- category alert cards
- monitored IOC counts

In some deployments, this page behaves differently by role:

- maintainers or higher-license users may receive the full alert-and-action workspace
- analysts may see a simpler search-first homepage variant
- some users may see an insights-only fallback instead of tenant alert controls

The summary area commonly displays:

- critical alerts
- high-risk alerts
- medium-risk alerts
- low-risk alerts

Category cards provide quick access to alert-specific drill-down reports.

The profile area also supports alert-focused routes such as:

- `alerts/<type>` for category-specific alert reports
- `addcustomalert` for creating custom alert definitions where enabled

```{figure} ../screenshots/tenant-homepage.png
:alt: Tenant homepage alerts view
:width: 100%

Tenant homepage with alert and monitoring summary cards.
```

### Manage IOCs

The IOC management page allows tenants to maintain the set of monitored values used in searches and alerting.

Capabilities include:

- IOC category search
- horizontal category browsing
- adding IOC values
- removing IOC values
- clearing all IOC values

This page is especially important for tenant-driven monitoring workflows.

### Statistics

The `Statistics` page in the profile area reuses the insight-oriented summary experience for users who want a visual overview without returning to the main homepage.

### Profile Consolidated View

The profile area also contains a consolidated-search route. Functionally, it behaves like the main consolidated workspace but sits within profile and tenant-oriented workflows.

### Tenant Settings

Tenant Settings stores tenant-level identity and contact information.

Depending on permissions, users can:

- upload a tenant image
- review assigned licenses
- review license count
- review assigned user quota
- edit phone
- edit country
- edit city or state

Some fields remain read-only depending on role. The page also acts as a tenant overview by summarizing the tenant name, status-style badges, location, assigned quota, and current license list.

```{figure} ../screenshots/tenant-settings.png
:alt: Tenant settings page
:width: 100%

Tenant settings and tenant-level license summary.
```

## User and Tenant Administration

### Tenant Users

The `Users` view is the main tenant user-management page.

It supports:

- viewing users in a table or mobile card layout
- adding a user
- expanding a user row for details
- changing status
- editing assigned licenses
- deleting a user

Displayed information commonly includes:

- username
- email
- role
- status
- subscription
- licenses

The page also respects quota-based restrictions.

```{figure} ../screenshots/tenant-users.png
:alt: Tenant users page
:width: 100%

Tenant user-management view with quotas, roles, and licenses.
```

### Tenant Administration

The `Tenants` view is used by higher-privilege roles to manage tenant records across the platform.

It supports:

- reviewing tenant information
- expanding a tenant for detail and editing
- changing verification state
- changing quota
- changing status
- updating tenant licenses

Displayed fields include:

- company name
- country
- subscription
- verification state
- user quota
- status
- license assignments

### Audit Logs

Audit Logs provide a searchable activity trail across user and tenant actions.

```{admonition} Audit data shown
:class: note

The audit log list typically shows a timestamp, actor, tenant, and event description for each recorded entry.
```

The audit-log page supports:

- export
- filtering
- pagination
- desktop and mobile layouts

```{figure} ../screenshots/audit-logs.png
:alt: Audit log page
:width: 100%

Audit log workspace with filters and export actions.
```

## System Administration

### System Settings

System Settings is the primary platform-level configuration page.

It includes two main groups:

- asset and branding configuration
- application and service configuration

#### Asset Management

Administrators can manage brand and UI images such as:

- primary logo
- wide light logo
- wide dark logo
- authentication dashboard icon

#### Configuration

Editable platform settings can include:

- application name
- language
- onion address
- data-source URL
- adversaries URL
- pricing URL
- documentation visibility
- whistle-blowing visibility

#### Service Status

The page also shows read-only runtime flags such as:

- API allowed
- AI endpoint enabled

Depending on deployment data, this area may also function as a quick verification point for platform version, enabled services, and branding visibility choices.

```{figure} ../screenshots/system-settings.png
:alt: Administrative and system settings workspace
:width: 100%

Administrative settings and platform-management view.
```

## Practical Workflows

### Workflow 1: Broad Investigation

1. Start in `Homepage` or `General Intelligence`.
2. Enter a keyword or topic.
3. Use `Advance` and sidebar filters to narrow the results.
4. Switch search mode if the results are too broad or too narrow.
5. Open a report for the most relevant record.
6. Review metadata and open CTI Graph if a relationship pivot is needed.

### Workflow 2: Identity Exposure Check

1. Open `Data Breach` or `Entity API`.
2. Search for an email or identity value.
3. Review breach details or live lookup results.
4. Use Stealer Logs if deeper credential evidence is required.

### Workflow 3: Infrastructure Review

1. Open `Network Intel` or `Web Scans`.
2. Enter a domain or IP.
3. Run the appropriate recon or scan view.
4. Review the report, severity, and evidence.
5. Export the report if it needs to be shared externally.

### Workflow 4: Profile Mapping

1. Open `Social Intel`.
2. Scan a username.
3. Review the graph or list view.
4. Open profile summaries and metadata popups.
5. Add custom entities or manage connections if needed.

### Workflow 5: Tenant Monitoring

1. Configure IOC values in `Profile > IOC`.
2. Review alert summaries from the tenant homepage.
3. Open category alert reports for the highest-risk items.
4. Export alerts when sharing findings internally.

## Notes and Limitations

:::{admonition} Feature availability
:class: important

If a module described in this manual is not visible in your sidebar, the most common reasons are role restrictions, license restrictions, or deployment-level configuration toggles.
:::

:::{admonition} External modules
:class: note

Some sidebar items open new tabs or external services rather than rendering inside the main Orion workspace. `CTI Graph`, `Social Intel`, `Onion Link`, `Whistle Blowing`, and `Documentation` may behave this way depending on route and deployment setup.
:::

:::{admonition} Recommended starting point
:class: tip

New users should begin with `Homepage`, `General Intelligence`, `Data Breach`, and `Stealer Logs` before moving into graph tools, tenant administration, or system administration.
:::
