# Introduction To Modules

:::{admonition} Scope
:class: tip

This page introduces the major Orion product modules and explains how they fit together. It is written as a product map, not a step-by-step user manual and not a low-level developer reference.
:::

## About This Guide

Orion Intelligence is organized as a group of connected investigation modules rather than one single search page. Some modules are search-first, some are scan-first, some are graph-oriented, and some are administrative. Together they support the full investigation lifecycle:

1. discover a signal
2. narrow and enrich it
3. inspect a report
4. pivot into related data
5. manage tenants, alerts, and system settings

This document explains what each module is for and when to use it.

```{contents}
:local:
:depth: 2
```

## How To Read The Platform

The Orion module set is easiest to understand in six groups:

| Group | What it does | Typical modules |
| --- | --- | --- |
| Entry and overview | search-first landing and high-level summaries | Homepage, Statistics |
| Indexed investigation | query indexed intelligence sources | General Intelligence, Data Breach, Defacement, Social, Exploit, Dump |
| Combined investigation | merge multiple result channels around one query | Consolidated |
| Live lookup and scan | run direct, targeted checks | Entity API, Web Scans, Network Intel |
| Relationship analysis | map entities and pivots visually | CTI Graph, Social Intel |
| Tenant and administration | manage users, alerts, quotas, branding, settings | Users, Tenants, Audit Logs, Account Settings, Tenant Settings, System Settings |

## Entry And Overview Modules

### Homepage

Homepage is the primary landing area for many users. It acts as a search-first overview rather than a static welcome page.

Depending on role, tenant state, and license assignment, Homepage can function as:

- a direct search starting point
- an insight dashboard with counts and summaries
- a tenant alert overview
- a simplified landing experience for restricted users

Use Homepage when you want to start broad and decide which module to enter next.

### Statistics

Statistics is the summary-oriented view for users who want visual coverage information without starting with an immediate query. It is useful for high-level monitoring, trend review, and quick triage.

## Indexed Investigation Modules

Indexed modules are the core analyst-facing search surfaces. They operate on collected and processed data that has already been ingested into the platform.

### General Intelligence

General Intelligence is the broadest indexed search module. It is used when the analyst wants to search for a topic, keyword, organization, product, actor, or event across mixed source types.

Typical subviews include:

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

This is usually the best starting point when the user only has a broad concept and needs initial coverage.

### Data Breach

Data Breach focuses on breach records, exposed credentials, and identity exposure checks.

Typical subviews include:

- `All`
- `Databases`
- `Tracking`

Use this module when starting from:

- an email address
- a known breached identity
- a need to verify whether a person or account appears in breach datasets

### Defacement

Defacement tracks hacked, altered, cloned, or phishing-related website incidents. It is more operationally focused than General Intelligence because it emphasizes target and attacker context.

Typical subviews include:

- `All`
- `Hacked`
- `Phishing`
- `Databases`

Use Defacement when you are investigating compromised websites, defacer identity, or site-level incident evidence.

### Social

Social aggregates intelligence from community and social-style sources. It is useful for chatter discovery, leak references, early warning, and platform-specific narrative tracking.

Typical subviews include:

- `All`
- `Telegram`
- `Twitter`
- `Mastodon`
- `Pastebin`
- `Forum`
- `Reddit`

Use Social when timing, conversation context, or platform origin matters as much as the content itself.

### Exploit

Exploit covers vulnerability and exploit-related material. It is intended for users starting from a vulnerability identifier, exploit reference, tooling name, or active exploit discussion.

Typical subviews include:

- `All`
- `CVE`
- `Tools`
- `ZeroDay`

This module is useful for vulnerability intelligence and exploit monitoring workflows.

### Feed

Feed is a stream-style reading surface for current reporting and intelligence-style news. It is less about constructing a precise query and more about scanning active reporting and recent coverage.

### Dump

Dump focuses on dump and listing material gathered from monitored sources. It differs from General Intelligence because it emphasizes dump listings and leak references directly, including dedicated leak-URL searching.

Use Dump when the key artifact is:

- a leak URL
- a dump listing
- a dump-related source reference

## Combined Investigation Module

### Consolidated

Consolidated is the cross-module triage workspace. Instead of forcing the user to choose one indexed module first, it lets a single query drive multiple result channels in parallel.

Typical views include:

- `IOCs`
- `Deep Search`
- `Network Intel`

Use Consolidated when:

- you want breadth before precision
- you are still deciding which pivot matters most
- you need both indexed results and supporting enrichment around the same query

Consolidated is especially useful early in an investigation because it can combine search, insight panels, and pivot opportunities in one place.

## Live Lookup And Scan Modules

These modules do not rely only on previously indexed content. They run targeted checks or live workflows against supplied input.

### Entity API

Entity API is the lookup-oriented module for direct checks against a supplied entity.

Typical lookup types include:

- `Email Breach`
- `Social Scanner`
- `Wanted List`
- `National Identity`
- `Playstore Scanner`
- `Software Scanner`
- `File Scanner`
- `Crypto Scanner`

Use Entity API when the user already has a concrete entity and wants direct enrichment rather than broad indexed discovery.

### Web Scans

Web Scans is the live scanning surface for web-facing targets. It is used for target inspection, posture review, and evidence-driven reporting.

Typical scan types include:

- `Basic Scan`
- `Port Scan`
- `Repository Scan`
- `SEO Scan`
- `APK Scan`

Use Web Scans when starting from:

- a domain
- a website
- a repository
- a mobile application package

### Network Intel

Network Intel is the infrastructure-focused live recon module.

Typical tabs include:

- `Host Recon`
- `IP Scan`
- `Vulnerability Scan`

Use Network Intel when the user needs:

- domain-to-IP resolution
- service and port context
- infrastructure review
- vulnerability findings
- geo-assisted pivots

## Relationship And Graph Modules

### CTI Graph

CTI Graph is the cyber relationship-mapping module. It is intended for cases where the investigation is no longer about a single search result and instead becomes a network of documents, properties, entities, and associations.

Use CTI Graph when you need to:

- connect records together
- inspect clusters
- pivot from one property to another
- export or explain a relationship model

This module is especially valuable after the user has already identified promising records elsewhere in the platform.

### Social Intel

Social Intel is the graph-oriented social-identity mapping module. It focuses on usernames, profiles, platforms, and relationships across social ecosystems.

Use Social Intel when the investigation centers on:

- username reuse
- profile correlation
- follower or connection review
- graph-based social mapping

It complements the Social search module: Social finds content, while Social Intel maps identities and relationships.

## Support And External Modules

### Directory

Directory is a browsing-oriented view for monitored and crawled service references. It is less query-centric than the main search modules and more useful for reviewing monitored services as a catalog.

### Links

Links is the navigation entry into the directory-style workflow. It acts as the user-facing path to monitored service browsing.

### Onion Link

Onion Link opens the deployment’s onion endpoint when that capability is enabled. It is an external-access bridge rather than an analytical module.

### Whistle Blowing

Whistle Blowing opens the secure reporting path used for direct or anonymous submissions where that feature is enabled. It is adjacent to the investigation platform but distinct from the analyst workflow itself.

### Documentation

Documentation links to the published docs set so users can move between the application and written guidance without leaving the platform context entirely.

## Profile, Tenant, And Administration Modules

These modules govern user identity, tenant operations, quotas, and platform configuration.

### Account Settings

Account Settings is the current-user profile area. It is used for the personal account surface rather than tenant-wide administration.

Common concerns here include:

- user identity details
- image and profile information
- assigned licenses
- two-factor settings
- theme and preference choices

### Tenant Homepage

Tenant Homepage is the tenant-scoped monitoring and alert overview. Depending on role and licensing, it can act as a dashboard for alert counts, monitored IOC coverage, and tenant summary actions.

### Manage IOCs

Manage IOCs is the tenant-maintained list of monitored values used in alerting and related search workflows. This module matters because tenant monitoring quality depends directly on the IOC set being maintained correctly.

### Tenant Settings

Tenant Settings stores tenant-level information such as identity, contact, quota, and assigned licenses. It is the central administrative page for tenant configuration.

### Users

Users is the tenant user-management page. It is used to add, review, update, and remove tenant users while respecting quota and role constraints.

### Tenants

Tenants is the higher-privilege administration surface for multi-tenant oversight across the platform. It is used to manage tenant state, licensing, verification, and quotas.

### Audit Logs

Audit Logs provides a trace of platform activity across user and tenant actions. It is the main administrative history view for reviewing who performed what action and when.

### System Settings

System Settings is the platform-wide configuration page. It is used for branding, feature visibility, application identity, and selected runtime status indicators.

This is the administrative module that affects the product globally rather than one user or one tenant.

## How Modules Work Together

A useful way to think about Orion is as a layered investigation flow:

1. start broad in `Homepage`, `General Intelligence`, or `Consolidated`
2. move into a specialist indexed module such as `Data Breach`, `Defacement`, `Social`, `Exploit`, or `Dump`
3. open a report for detailed review
4. pivot into `Entity API`, `Web Scans`, `Network Intel`, `CTI Graph`, or `Social Intel`
5. finish in tenant or administrative modules if action, alerting, or governance is needed

This means the modules are not isolated products. They are connected stages of one investigation system.

## Choosing The Right Module

### Start Here If You Have A Broad Topic

Use:

- `Homepage`
- `General Intelligence`
- `Consolidated`

### Start Here If You Have A Specific Artifact

Use:

- `Data Breach` for exposed identities or emails
- `Dump` for leak URLs and dump references
- `Entity API` for direct entity checks
- `Network Intel` for infrastructure targets
- `Web Scans` for target scanning

### Start Here If You Need Relationships

Use:

- `CTI Graph` for cyber relationship mapping
- `Social Intel` for identity and profile mapping

### Start Here If You Need Governance Or Administration

Use:

- `Users`
- `Tenants`
- `Audit Logs`
- `Tenant Settings`
- `System Settings`

## Related Documents

- [Introduction To Platform](./introduction_to_platform.md)
- [User Manual](./user_manual.md)
- [Developer Documentation](./developer_documentation.md)
- [Orion Android Application](./orion_android_application.md)
