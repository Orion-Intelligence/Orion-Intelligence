(user-manual)=

# User Manual

:::{admonition} At a glance
:class: tip

This guide explains how to use the Orion platform UI, including navigation, search, analytics, investigations, and administration features. Some modules are license-gated or role-gated, so your sidebar may show fewer items than the examples below.
:::

## Overview

Orion is an intelligence platform for exploring indexed data, running targeted lookups, reviewing risk signals, and pivoting between related entities. Most day-to-day work follows the same pattern:

1. Open a module from the left sidebar.
2. Search for a keyword, domain, email, IP, username, or entity.
3. Refine the result set with filters, analytics, or module-specific views.
4. Open a result card or detail page for deeper investigation.

```{figure} ../screenshots/homepage.png
:alt: Orion homepage
:width: 100%

Orion homepage and primary workspace.
```

## Screen Layout

### Left Sidebar

The left sidebar is the main navigation area. It groups modules by use case and exposes subcategories where applicable.

```{figure} ../screenshots/navbar.png
:alt: Orion sidebar
:width: 45%

Primary navigation in the expanded sidebar.
```

### Search Bar

The search bar is the fastest way to start an investigation. You can enter a free-text query, apply indexed filters, and choose how Orion interprets the search terms.

```{figure} ../screenshots/searchbar.png
:alt: Global search bar
:width: 90%

Global search with filter and search-mode controls.
```

### Result Workspace

Searches usually return a mix of cards, tables, summaries, and analytics panels. From there you can:

- open a detailed result page
- pivot into related modules
- export or review metadata
- open graph-based views where available

## Homepage

The homepage acts as the platform landing page and summary view. It typically includes:

- a search-first entry point
- high-level trend or heatmap visuals
- top-level statistics
- general and leaked data summaries

```{figure} ../screenshots/index.png
:alt: Homepage summary widgets
:width: 100%

Homepage widgets and summary panels.
```

### Key Homepage Areas

- `Statistics`: quick visual summaries such as top actors, regions, or activity patterns.
- `General Index`: broad indexed content across supported sources.
- `Leaked Index`: exposed or sensitive content that usually needs faster review.
- `Recent Results`: direct paths into the latest collected or matched records.

```{figure} ../screenshots/generalindex.png
:alt: General index
:width: 100%

Example of index-level summaries.
```

```{figure} ../screenshots/leakedindex.png
:alt: Leaked index
:width: 100%

Leaked index summary view.
```

## Search, Filters, and Analytics

### Search Modes

The `Tools` area in search lets you control how terms are matched:

- `Match Any Term (OR)`: returns broader results.
- `Match All Terms (AND)`: returns records containing every term.
- `Match Full Query`: returns only exact-query matches.

```{figure} ../screenshots/searchtype.png
:alt: Search type options
:width: 70%

Search matching modes.
```

### Filters

Filters narrow results by indexed fields such as entity type, source, network, platform, or module-specific properties. In most modules you can:

- add one or more filters from the filter list
- type directly to find a specific filter
- clear all active filters at once

```{figure} ../screenshots/filter.png
:alt: Search filters
:width: 80%

Filter controls for refining result sets.
```

### Analytics Panel

The analytics view summarizes what the current query returned. Depending on the module, it may include:

- keyword insights
- result distribution
- counts by category
- URL, title, or network breakdowns

```{figure} ../screenshots/keywordinsight.png
:alt: Keyword insights
:width: 55%

Keyword and result insight summaries.
```

```{figure} ../screenshots/resultgeneral.png
:alt: Result analytics
:width: 75%

Expanded analytics and supporting result data.
```

## Navigation Reference

The exact menu depends on your role and license, but the platform commonly includes the following sections.

| Module | Purpose | Typical views |
| --- | --- | --- |
| Homepage | Starting point and overview | Dashboard, statistics, indexes |
| General Intelligence | Broad indexed intelligence content | All, General, Forums, News, Stolen, Drugs, Hacking, Marketplaces, Cryptocurrency, Leaks |
| Data Breach | Breach datasets and exposure tracking | All, Databases, Tracking |
| Defacement | Website compromise and phishing monitoring | All, Hacked, Phishing, Databases |
| Social | Intelligence from social and community platforms | All, Telegram, Twitter, Mastodon, Pastebin, Forum, Reddit |
| Exploit | Vulnerability and exploitation intelligence | All, CVE, Tools, ZeroDay |
| Feed | News-style intelligence stream | News |
| Dump | Indexed dump and listing sources | Listing |
| Stealer Logs | Stolen credential and IOC analysis | IOCs |
| Web Scans | On-demand web and asset scanning | Basic Scan, Port Scan, Repository Scan, SEO Scan, APK Scan |
| Entity API | Live lookup workflows for supported entities | Email Breach, Social Scanner, Wanted List, National Identity, Playstore Scanner, Software Scanner, File Scanner, Crypto Scanner |
| Network Intel | Domain and IP recon | Host Recon, IP Scan, Vulnerability Scan |
| Social Intel | Username and profile mapping | Graph and list-based investigation |
| CTI Graph | Relationship mapping | Cluster, Document, Property pivots |
| Whistle Blowing | External anonymous reporting portal | External link |
| Links | Directory of tracked links | Link list and source references |
| Onion Link | Direct onion access entry | External link |
| Documentation | Product documentation | External docs |

## Module Guide

### General Intelligence

General Intelligence is the main indexed search area for broad-source intelligence. Use it when you want to start with a keyword or topic and then narrow down from a large corpus.

Subcategories include:

- `All`: combined view across the module
- `General`: uncategorized or mixed intelligence
- `Forums`: forum and discussion content
- `News`: relevant news articles or posts
- `Stolen`: stolen or exposed data references
- `Drugs`: listings or mentions related to illicit drug activity
- `Hacking`: exploit, malware, or offensive-security discussions
- `Marketplaces`: marketplace listings and trade activity
- `Cryptocurrency`: crypto-related intelligence and traces
- `Leaks`: leaked documents, datasets, or credentials

```{figure} ../screenshots/genericresults.png
:alt: General intelligence results
:width: 100%

General Intelligence result view.
```

### Data Breach

Use Data Breach to investigate known breach datasets and to check whether a specific identity has been exposed.

- `All`: combined breach view
- `Databases`: breach records and structured leak data
- `Tracking`: lookup workflow for checking whether an email appears in known breach sources

```{figure} ../screenshots/email.png
:alt: Data breach tracking
:width: 100%

Example of a breach-tracking style lookup.
```

### Defacement

Defacement tracks compromised websites and related activity.

- `All`: consolidated defacement view
- `Hacked`: unauthorized website changes or takeover cases
- `Phishing`: deceptive pages designed to steal information
- `Databases`: records tied to backend compromise or exposed data

Users typically review the target URL, attacker or team name, IP, server details, and date of detection.

### Social

The Social module consolidates intelligence gathered from supported social and community platforms. It is useful for early warning, chatter monitoring, leak discovery, and actor tracking.

Supported views include:

- `All`
- `Telegram`
- `Twitter`
- `Mastodon`
- `Pastebin`
- `Forum`
- `Reddit`

```{figure} ../screenshots/news.png
:alt: Social or feed-style content view
:width: 100%

Example of a stream-oriented result view.
```

### Exploit

Exploit focuses on vulnerability-related intelligence and exploitation context.

- `CVE`: records tied to public vulnerability identifiers
- `Tools`: references to tooling, modules, or proof-of-concept material
- `ZeroDay`: high-risk, unpatched, or newly surfaced vulnerability content

Use this section to move from a known flaw or product name into related exploitation data.

### Feed

Feed is the news-oriented stream of intelligence items. It is useful for analysts who want a quick review of recent reporting and emerging topics without starting from a structured query.

### Entity API

Entity API runs targeted lookups for supported entity types. Unlike normal indexed search, these workflows are used for direct retrieval and enrichment.

Available lookup types:

- `Email Breach`
- `Social Scanner`
- `Wanted List`
- `National Identity`
- `Playstore Scanner`
- `Software Scanner`
- `File Scanner`
- `Crypto Scanner`

```{figure} ../screenshots/APIs.png
:alt: Entity API module
:width: 100%

Entity API lookup workspace.
```

### Web Scans

Web Scans performs on-demand analysis against web assets and related targets.

- `Basic Scan`: quick initial assessment
- `Port Scan`: exposed ports and services
- `Repository Scan`: repository review for secrets, exposures, or risks
- `SEO Scan`: metadata and discoverability checks
- `APK Scan`: Android package inspection

Use Web Scans when you need live target analysis rather than indexed historical content.

### Network Intel

Network Intel supports domain and IP reconnaissance.

- `Host Recon`: resolve a domain into infrastructure details
- `IP Scan`: inspect a specific IP address
- `Vulnerability Scan`: review security issues, headers, and related findings for a target

```{figure} ../screenshots/networklink.png
:alt: Network intelligence workflow
:width: 100%

Network intelligence and linked infrastructure review.
```

### Dump

Dump provides access to indexed dump and listing material collected from monitored sources such as channels, forums, and other leak-sharing locations. Use filters to narrow the list by source, type, or origin.

### Stealer Logs

Stealer Logs is designed for investigating data harvested by infostealer malware. It is typically used to find compromised:

- domains
- email addresses
- IP addresses
- usernames
- passwords or related credential traces

The `Advanced` option enables a more precise query builder so analysts can combine conditions with logical operators.

### Social Intel

Social Intel maps usernames, profiles, and related entities across supported platforms. It is intended for identity-centric investigations.

Typical capabilities include:

- username discovery across platforms
- graph-based relationship mapping
- scan history review
- entity management and enrichment

### CTI Graph

CTI Graph opens in a separate tab and visualizes relationships between documents, properties, and clusters. It is useful for pivot-heavy investigations where you need to see how records connect.

Common filter paths include:

- `Cluster`: general, leak, defacement, or chat-oriented groupings
- `Document`: pivot from a known document ID
- `Property`: pivot from a value such as email or hash

Users can also:

- toggle graph physics
- expand the canvas
- inspect detail panels
- read color indicators for node meaning

```{figure} ../screenshots/linktab.png
:alt: Graph-oriented investigation view
:width: 100%

Relationship-focused investigation view.
```

### Whistle Blowing

If enabled for the deployment, `Whistle Blowing` opens an external anonymous reporting portal. This entry is separate from the core investigation modules and is intended for secure disclosure workflows.

### Links

Links acts as a directory of tracked URLs and references. It is useful when you want to review source locations directly rather than search by content first.

### Onion Link

If enabled in the deployment, `Onion Link` opens the platform's onion address in a separate tab. This is primarily a convenience shortcut for users operating through Tor-enabled workflows.

### Documentation

The `Documentation` item opens the published product documentation in a new tab.

## Account and Administration

Administrative and profile functions are grouped under the user area at the top of the sidebar. Available options depend on permissions.

```{figure} ../screenshots/settings.png
:alt: Account and settings area
:width: 100%

Profile, settings, and administration area.
```

### Account

The account area is used to manage personal settings such as:

- profile details
- sign-in preferences
- two-factor authentication, if enabled
- visual theme preferences

### Users

The users area allows authorized staff to review and manage platform users. Typical actions include:

- viewing user details
- checking role and status
- creating a user
- editing an existing user
- updating access or subscription information

### Audit Log

Audit Log records access activity so administrators can review who signed in and when.

### Tenant

Tenant features support multi-organization deployments. Each tenant can manage its own users and settings within its assigned scope.

### System Settings

System Settings is used for deployment-level customization such as:

- branding
- logo updates
- application naming
- theme defaults
- language or presentation settings

## Practical Tips

:::{admonition} Recommended workflow
:class: note

If you are new to Orion, start in `Homepage` or `General Intelligence`, then narrow the investigation with filters. Move into `Data Breach`, `Stealer Logs`, `Entity API`, or `Network Intel` only after you know what entity or signal you want to validate.
:::

:::{admonition} Access differences
:class: important

If a section described in this guide is missing from your sidebar, it is usually disabled by license, deployment configuration, or account role rather than being absent from the product entirely.
:::
