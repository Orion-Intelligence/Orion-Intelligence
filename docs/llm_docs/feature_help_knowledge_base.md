(feature-help-knowledge-base)=

# Feature Help Knowledge Base

This page is the primary retrieval source for assistants that need to help users navigate Orion, choose the right feature, and complete a workflow step by step. It is intentionally organized by user intent rather than source files.

## Assistant Answering Rules

When a user asks how to use the application:

1. Match the user's words to the feature title or aliases.
2. Tell the user where to go in the UI before mentioning API or implementation details.
3. Give short step-by-step instructions.
4. Mention role, license, and setting requirements only when they affect visibility or access.
5. If the user cannot see a feature, check role, tenant state, license, account status, and system settings.
6. Use API documentation only when the user asks for API integration or programmatic access.
7. Do not answer normal user navigation questions from source-file inventory documents.

## Best Retrieval Sources

| User question type | Best source |
| --- | --- |
| Where do I go for a feature? | `feature_help_knowledge_base.md` or `feature_catalog.json` |
| How do I complete a workflow? | `application_feature_guide.md` or `user_manual.md` |
| Which public API do I call? | `swagger_api_reference.md` |
| Where is this implemented in code? | source reference files, only for developer questions |

## Feature Index

| Feature | Category | Routes | Common user wording |
| --- | --- | --- | --- |
| [Login](#login) | Access And Onboarding | `/login` | sign in, log in, authentication, access account |
| [Signup](#signup) | Access And Onboarding | `/signup` | register, create account, tenant signup, new account |
| [Password Reset](#password-reset) | Access And Onboarding | `/reset, /reset/:token` | forgot password, reset password, change forgotten password |
| [Tenant Onboarding](#tenant-onboarding) | Access And Onboarding | `/onboarding` | onboarding, company setup, tenant setup, first login setup |
| [Homepage](#homepage) | Overview | `/dashboard, /dashboard/home, /dashboard/profile/homepage` | home, dashboard home, landing page, overview |
| [Global Search](#global-search) | Search And Investigation | `/dashboard/home, /dashboard/profile/homepage, /dashboard/consolidated/all` | search bar, advanced search, filters, match type, semantic search |
| [Consolidated Investigation](#consolidated-investigation) | Search And Investigation | `/dashboard/consolidated/all, /dashboard/profile/consolidated/all` | consolidated, search everything, deep search, ioc search, all results, cross module search |
| [General Intelligence](#general-intelligence) | Indexed Investigation Modules | `/dashboard/strategic/all, /dashboard/strategic/:category` | strategic, general search, general intelligence, news search, forums, marketplaces |
| [Data Breach](#data-breach) | Indexed Investigation Modules | `/dashboard/breach/all, /dashboard/breach/:category` | breach, data breach, databases, tracking, exposed credentials, leaked identity |
| [Discussion And Social Search](#discussion-and-social-search) | Indexed Investigation Modules | `/dashboard/discussion/all, /dashboard/social/all, /dashboard/social/:category` | discussion, social, telegram, twitter, mastodon, pastebin |
| [Feed](#feed) | Indexed Investigation Modules | `/dashboard/feed/news, /dashboard/feed/:category` | feed, news feed, intelligence feed, recent reports |
| [Exploit Intelligence](#exploit-intelligence) | Indexed Investigation Modules | `/dashboard/exploit/all, /dashboard/exploit/cve, /dashboard/exploit/tools, /dashboard/exploit/zeroday` | exploit, cve, vulnerability, zeroday, zero day, tools |
| [Defacement](#defacement) | Indexed Investigation Modules | `/dashboard/defacement/all, /dashboard/defacement/hacked, /dashboard/defacement/phishing, /dashboard/defacement/databases` | defacement, hacked website, phishing, compromised website, defacer |
| [Dump Listings](#dump-listings) | Indexed Investigation Modules | `/dashboard/dump/listing, /dashboard/dump/credential` | dump, leak listing, dump listing, credential dump |
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
| [Basic Web Scan](#basic-web-scan) | Scan Modules | `/dashboard/scan` | scan, web scan, basic scan, website scan |
| [Network Intel](#network-intel) | Scan Modules | `/dashboard/netint, /dashboard/scanner/network-scan` | network intel, network scan, host recon, ip scan, vulnerability scan, infrastructure recon |
| [Repository Scan](#repository-scan) | Scan Modules | `/dashboard/scanner/repository-scan` | repository scan, repo scan, code scan |
| [SEO Scan](#seo-scan) | Scan Modules | `/dashboard/scanner/seo-scan` | seo scan, metadata scan, website metadata |
| [APK Scan](#apk-scan) | Scan Modules | `/dashboard/scanner/apk-scan` | apk scan, android apk analysis, mobile app analysis, apk iocs |
| [AI Workspace](#ai-workspace) | AI Features | `/dashboard/profile/ai` | ai, ai workspace, chat ai, ai assistant, llm, summarize |
| [AI Report Summary](#ai-report-summary) | AI Features | `report pages` | ai summary, summarize report, report summary, ai suggest |
| [Report Chat](#report-chat) | AI Features | `supported report pages` | report chat, chat with report, ask report, nexus chat |
| [CTI Graph](#cti-graph) | Graph Investigation | `/dashboard/ctigraph` | cti graph, graph, relationship graph, entity graph, threat graph |
| [Social Intel](#social-intel) | Graph Investigation | `/dashboard/social-intel, /dashboard/social-graph` | social intel, social graph, social mapper, profile graph, username graph |
| [Tenant Homepage And Alert Summary](#tenant-homepage-and-alert-summary) | Profile And Alerts | `/dashboard/profile/homepage` | tenant homepage, alert summary, profile homepage, monitored alerts |
| [Alerts](#alerts) | Profile And Alerts | `/dashboard/profile/alerts/:type` | alerts, alert report, tenant alerts, ioc alerts |
| [Add Custom Alert](#add-custom-alert) | Profile And Alerts | `/dashboard/profile/addcustomalert` | add alert, custom alert, monitor value, new alert |
| [Manage IOCs](#manage-iocs) | Profile And Alerts | `/dashboard/profile/ioc` | ioc, manage iocs, tenant iocs, monitored indicators |
| [Account Settings](#account-settings) | Settings | `/dashboard/profile/account` | account, profile settings, theme, 2fa, profile visibility, avatar |
| [Tenant Settings](#tenant-settings) | Settings | `/dashboard/profile/tenant-settings` | tenant settings, tenant branding, company settings |
| [System Settings](#system-settings) | Settings | `/dashboard/profile/system-settings` | system settings, branding, app name, language, ai endpoint enabled, documentation allowed |
| [Users](#users) | Administration | `/dashboard/profile/users, /dashboard/tenant/view-profiles` | users, manage users, view profiles, tenant users |
| [User Activity](#user-activity) | Administration | `/dashboard/profile/user/:user_id` | user activity, profile activity, user profile |
| [Tenant Administration](#tenant-administration) | Administration | `/dashboard/tenant/view-tenants, /dashboard/profile/tenant` | tenant administration, view tenants, tenants |
| [Audit Logs](#audit-logs) | Administration | `/dashboard/profile/auditlog, /dashboard/tenant/auditlog` | audit logs, auditlog, activity log, admin logs |
| [Event Management](#event-management) | Administration | `/dashboard/profile/event-management` | event management, events |
| [Feeder Management](#feeder-management) | Administration | `/dashboard/profile/feeder` | feeder, feeder scripts, crawler scripts, upload script, script owner |
| [Directory And Links](#directory-and-links) | Support And Documentation | `/dashboard/directory` | directory, links, resources, external links |
| [Support](#support) | Support And Documentation | `support overlay` | support, contact support, help, support modal |
| [Documentation](#documentation) | Support And Documentation | `sidebar documentation link, /docs` | documentation, docs, manual, help center, feature guide |
| [Onion Link](#onion-link) | Support And Documentation | `sidebar onion link` | onion, tor, onion link, dark web link |
| [Whistle Blowing](#whistle-blowing) | Support And Documentation | `sidebar whistle blowing link` | whistle blowing, whistleblowing, report leak, anonymous report |

## Access And Onboarding

### Login

- **Feature ID:** `login`
- **User asks for:** sign in; log in; authentication; access account
- **Where to go:** `/login`
- **Roles:** `all`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open the login page.
2. Enter username or email.
3. Enter password.
4. Complete verification if configured.
5. Continue to the dashboard.

**When the user cannot see it**

- Confirm the account is active.
- Use password reset if credentials are unknown.
- Ask an administrator to verify account status.

### Signup

- **Feature ID:** `signup`
- **User asks for:** register; create account; tenant signup; new account
- **Where to go:** `/signup`
- **Roles:** `public`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open the signup page.
2. Enter required user and company information.
3. Submit the form.
4. Complete email verification if required.
5. Wait for tenant or administrator approval when configured.

**When the user cannot see it**

- Some deployments disable public signup.
- Ask an administrator to create the account if signup is unavailable.

### Password Reset

- **Feature ID:** `password_reset`
- **User asks for:** forgot password; reset password; change forgotten password
- **Where to go:** `/reset`, `/reset/:token`
- **Roles:** `public`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open the reset page.
2. Enter the registered email address.
3. Submit the request.
4. Open the reset link from email.
5. Enter and confirm the new password.
6. Return to login.

**When the user cannot see it**

- Check email delivery.
- Request a new reset link if the token expired.

### Tenant Onboarding

- **Feature ID:** `tenant_onboarding`
- **User asks for:** onboarding; company setup; tenant setup; first login setup
- **Where to go:** `/onboarding`
- **Roles:** `tenant users`
- **Licenses:** `tenant license`
- **Settings:** none

**How to guide the user**

1. Open onboarding after login.
2. Enter tenant or company information.
3. Add initial IOC values when requested.
4. Confirm setup.
5. Continue to the dashboard.

**When the user cannot see it**

- Confirm tenant assignment.
- Confirm the tenant has an active license.
- Ask an administrator to verify onboarding state.


## Overview

### Homepage

- **Feature ID:** `homepage`
- **User asks for:** home; dashboard home; landing page; overview
- **Where to go:** `/dashboard`, `/dashboard/home`, `/dashboard/profile/homepage`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open the dashboard homepage.
2. Use the global search input for broad investigation.
3. Select IOCs, Deep Search, or Network Intelligence if shown.
4. Review overview cards and insights.
5. Open a card, alert, or result for details.

**When the user cannot see it**

- Homepage content varies by role, tenant, license, and onboarding state.


## Search And Investigation

### Global Search

- **Feature ID:** `global_search`
- **User asks for:** search bar; advanced search; filters; match type; semantic search
- **Where to go:** `/dashboard/home`, `/dashboard/profile/homepage`, `/dashboard/consolidated/all`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open a search-capable module.
2. Enter the query.
3. Choose search mode if needed.
4. Turn on Advance for filters.
5. Apply filters.
6. Submit.
7. Open a result report.

**When the user cannot see it**

- Remove filters if no results appear.
- Use Match any term for broader matching.
- Try Consolidated for cross-module discovery.

### Consolidated Investigation

- **Feature ID:** `consolidated`
- **User asks for:** consolidated; search everything; deep search; ioc search; all results; cross module search
- **Where to go:** `/dashboard/consolidated/all`, `/dashboard/profile/consolidated/all`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open Consolidated.
2. Enter an IOC, domain, email, username, hash, organization, or keyword.
3. Submit the search.
4. Review IOCs, Deep Search, and Network Intel tabs.
5. Use filters.
6. Open relevant reports.

**When the user cannot see it**

- If hidden, confirm subscription access.
- Try General Intelligence if Consolidated is not available.


## Indexed Investigation Modules

### General Intelligence

- **Feature ID:** `general_intelligence`
- **User asks for:** strategic; general search; general intelligence; news search; forums; marketplaces; crypto intelligence
- **Where to go:** `/dashboard/strategic/all`, `/dashboard/strategic/:category`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open General Intelligence.
2. Start with All unless a category is known.
3. Search a keyword, actor, organization, domain, product, event, or phrase.
4. Use filters.
5. Open a report.

**When the user cannot see it**

- Use Consolidated for broader cross-module search.
- Use Feed for stream-style news reading.

### Data Breach

- **Feature ID:** `data_breach`
- **User asks for:** breach; data breach; databases; tracking; exposed credentials; leaked identity
- **Where to go:** `/dashboard/breach/all`, `/dashboard/breach/:category`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Data Breach.
2. Choose All, Databases, or Tracking.
3. Search an email, username, organization, domain, credential marker, or keyword.
4. Apply filters.
5. Open the breach report.

**When the user cannot see it**

- Use Email Breach for a direct email lookup.
- Use Stealer Logs for credential artifact pivots.

### Discussion And Social Search

- **Feature ID:** `discussion_social_search`
- **User asks for:** discussion; social; telegram; twitter; mastodon; pastebin; forum; reddit; chat reports
- **Where to go:** `/dashboard/discussion/all`, `/dashboard/social/all`, `/dashboard/social/:category`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Discussion or Social.
2. Choose a platform category if known.
3. Search a username, channel, topic, keyword, domain, or IOC.
4. Open a chat or social report.
5. Use metadata for pivots.

**When the user cannot see it**

- Use Social Intel for relationship mapping instead of indexed content search.

### Feed

- **Feature ID:** `feed`
- **User asks for:** feed; news feed; intelligence feed; recent reports
- **Where to go:** `/dashboard/feed/news`, `/dashboard/feed/:category`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Feed.
2. Choose the feed category.
3. Search or browse recent items.
4. Open a feed report.

**When the user cannot see it**

- Use General Intelligence for more precise filtered search.

### Exploit Intelligence

- **Feature ID:** `exploit`
- **User asks for:** exploit; cve; vulnerability; zeroday; zero day; tools
- **Where to go:** `/dashboard/exploit/all`, `/dashboard/exploit/cve`, `/dashboard/exploit/tools`, `/dashboard/exploit/zeroday`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Exploit.
2. Choose All, CVE, Tools, or ZeroDay.
3. Search a CVE, product, exploit name, actor, or keyword.
4. Open a report.
5. Review references and extracted metadata.

**When the user cannot see it**

- Use General Intelligence if the vulnerability context is broader than exploit records.

### Defacement

- **Feature ID:** `defacement`
- **User asks for:** defacement; hacked website; phishing; compromised website; defacer
- **Where to go:** `/dashboard/defacement/all`, `/dashboard/defacement/hacked`, `/dashboard/defacement/phishing`, `/dashboard/defacement/databases`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Defacement.
2. Choose Hacked, Phishing, Databases, or All.
3. Search by domain, URL, organization, attacker handle, or keyword.
4. Open the defacement report.
5. Review screenshot, metadata, and extracted indicators.

**When the user cannot see it**

- Use Basic Web Scan for live inspection of a current website.

### Dump Listings

- **Feature ID:** `dump`
- **User asks for:** dump; leak listing; dump listing; credential dump
- **Where to go:** `/dashboard/dump/listing`, `/dashboard/dump/credential`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open Dump.
2. Choose Listing or Credential.
3. Search the leak URL, domain, keyword, or identifier.
4. Open matching records.

**When the user cannot see it**

- If hidden, confirm subscription access.
- Use Stealer Logs for stealer-specific credential artifacts.

### Stealer Logs

- **Feature ID:** `stealerlogs`
- **User asks for:** stealer logs; stealerlogs; credential iocs; stolen credentials
- **Where to go:** `/dashboard/stealerlogs/iocs`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open Stealer Logs.
2. Search a domain, IP, email, username, URL, or indicator.
3. Review returned credential or IOC records.
4. Pivot to reports or alerts when relevant.

**When the user cannot see it**

- If hidden, confirm subscription access.


## Live Lookup Modules

### Entity API Overview

- **Feature ID:** `entity_api`
- **User asks for:** entity api; live api; lookup tools; entity lookup
- **Where to go:** `/dashboard/api`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open Entity API.
2. Choose the scanner matching the target.
3. Enter the value.
4. Submit.
5. Review returned data.

**When the user cannot see it**

- If hidden, confirm subscription access.

### Email Breach

- **Feature ID:** `email_breach_lookup`
- **User asks for:** email breach; email lookup; breached email; check email
- **Where to go:** `/dashboard/api/email-breach`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open Email Breach.
2. Enter the email address.
3. Submit the lookup.
4. Review breach exposure and metadata.

**When the user cannot see it**

- Use Data Breach for broader indexed breach searches.

### Social Scanner

- **Feature ID:** `social_scanner`
- **User asks for:** social scanner; username lookup; profile lookup; handle lookup
- **Where to go:** `/dashboard/api/social-scanner`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open Social Scanner.
2. Enter the username, handle, or profile value.
3. Submit.
4. Review discovered profiles or metadata.

**When the user cannot see it**

- Use Social Intel for graph-style profile mapping.

### Wanted List

- **Feature ID:** `wanted_list`
- **User asks for:** wanted list; wanted scan; person lookup
- **Where to go:** `/dashboard/api/wanted-list`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open Wanted List.
2. Enter the name or identifier.
3. Submit.
4. Review matching records.

**When the user cannot see it**

- Try alternate name formats if no match appears.

### National Identity

- **Feature ID:** `national_identity`
- **User asks for:** national identity; identity lookup; national id
- **Where to go:** `/dashboard/api/national-identity`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open National Identity.
2. Enter the supported identity value.
3. Submit.
4. Review returned identity information.

**When the user cannot see it**

- Confirm the identity value format is supported.

### Playstore Scanner

- **Feature ID:** `playstore_scanner`
- **User asks for:** playstore scanner; android app lookup; app scanner; package lookup
- **Where to go:** `/dashboard/api/playstore-scanner`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open Playstore Scanner.
2. Enter the application reference or package.
3. Submit.
4. Review app metadata and risk indicators.

**When the user cannot see it**

- Use APK Scan if you have the APK file rather than a store reference.

### Software Scanner

- **Feature ID:** `software_scanner`
- **User asks for:** software scanner; software lookup; package scanner
- **Where to go:** `/dashboard/api/software-scanner`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open Software Scanner.
2. Enter the software name, package, URL, or supported value.
3. Submit.
4. Review metadata and detected risk.

**When the user cannot see it**

- Try exact package names or URLs if broad names return too many results.

### File Scanner

- **Feature ID:** `file_scanner`
- **User asks for:** file scanner; file analysis; extract iocs from file; ioc extraction
- **Where to go:** `/dashboard/api/file-scanner`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open File Scanner.
2. Upload the file.
3. Start analysis.
4. Wait for extraction.
5. Review extracted IOCs and analysis output.

**When the user cannot see it**

- Confirm the file type and size are supported.
- Use returned IOCs in Consolidated or IOC alerts.

### Text Analysis

- **Feature ID:** `text_analysis`
- **User asks for:** text analysis; spam analysis; malicious url analysis; nexus analyze text
- **Where to go:** `/dashboard/api/text-analysis`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`, `module:ai`
- **Settings:** `ai_endpoint_enabled`
- **Related backend APIs:** `/api/nexus/analyze-text`

**How to guide the user**

1. Open Text Analysis.
2. Paste text to analyze.
3. Submit.
4. Review classification, extracted values, and risk indicators.

**When the user cannot see it**

- If API returns 403, enable AI Endpoint Enabled in System Settings.
- Confirm AI module license.

### Crypto Scanner

- **Feature ID:** `crypto_scanner`
- **User asks for:** crypto scanner; cryptocurrency address; wallet lookup; crypto analysis
- **Where to go:** `/dashboard/api/crypto-scanner`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open Crypto Scanner.
2. Enter the cryptocurrency address or supported value.
3. Submit.
4. Review metadata, risk, and linked activity.

**When the user cannot see it**

- Confirm the address format and chain are supported.


## Scan Modules

### Basic Web Scan

- **Feature ID:** `basic_web_scan`
- **User asks for:** scan; web scan; basic scan; website scan
- **Where to go:** `/dashboard/scan`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Scan.
2. Enter the target domain or URL.
3. Choose scan type if available.
4. Start scan.
5. Review the report and extracted indicators.

**When the user cannot see it**

- Confirm the target is a valid domain or URL.
- Check scanner service availability if the scan does not complete.

### Network Intel

- **Feature ID:** `network_intel`
- **User asks for:** network intel; network scan; host recon; ip scan; vulnerability scan; infrastructure recon
- **Where to go:** `/dashboard/netint`, `/dashboard/scanner/network-scan`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open Network Intel.
2. Choose Host Recon, IP Scan, or Vulnerability Scan.
3. Enter the domain, host, or IP.
4. Start the scan.
5. Review DNS, IP, port, vulnerability, location, or host details.

**When the user cannot see it**

- If hidden, confirm subscription access.
- Network Intel may be disabled in mobile mode.

### Repository Scan

- **Feature ID:** `repository_scan`
- **User asks for:** repository scan; repo scan; code scan
- **Where to go:** `/dashboard/scanner/repository-scan`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open Repository Scan.
2. Enter the repository URL or reference.
3. Start the scan.
4. Review exposure, metadata, or risk findings.

**When the user cannot see it**

- Confirm repository URL format and accessibility.

### SEO Scan

- **Feature ID:** `seo_scan`
- **User asks for:** seo scan; metadata scan; website metadata
- **Where to go:** `/dashboard/scanner/seo-scan`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open SEO Scan.
2. Enter the target domain or URL.
3. Start the scan.
4. Review metadata and scan output.

**When the user cannot see it**

- Confirm the target URL starts with http or https if required.

### APK Scan

- **Feature ID:** `apk_scan`
- **User asks for:** apk scan; android apk analysis; mobile app analysis; apk iocs
- **Where to go:** `/dashboard/scanner/apk-scan`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open APK Scan.
2. Upload the APK file.
3. Start analysis.
4. Review permissions, behaviors, static indicators, and extracted IOCs.

**When the user cannot see it**

- Confirm the uploaded file is an APK.
- Use Playstore Scanner if you only have a store reference.


## AI Features

### AI Workspace

- **Feature ID:** `ai_workspace`
- **User asks for:** ai; ai workspace; chat ai; ai assistant; llm; summarize
- **Where to go:** `/dashboard/profile/ai`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `module:ai`
- **Settings:** `ai_endpoint_enabled`
- **Related backend APIs:** `/api/nlp/parse/ai`, `/api/nlp/summarize/ai`, `/api/nlp/chat/report`, `/api/nexus/chat`, `/api/nexus/analyze-text`

**How to guide the user**

1. Open Profile -> AI or click the homepage AI button.
2. Enter the prompt, question, or content.
3. Submit.
4. Review the response.
5. Continue the conversation or pivot to a report.

**When the user cannot see it**

- If the button is missing, enable AI Endpoint Enabled in System Settings.
- If API returns 403, AI Endpoint Enabled is off.
- Confirm AI module license.

### AI Report Summary

- **Feature ID:** `ai_report_summary`
- **User asks for:** ai summary; summarize report; report summary; ai suggest
- **Where to go:** `report pages`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `module:ai`
- **Settings:** `ai_endpoint_enabled`
- **Related backend APIs:** `/api/nlp/summarize/ai`

**How to guide the user**

1. Open a supported report.
2. Click AI Summary if visible.
3. Wait for summarization.
4. Review the generated summary.

**When the user cannot see it**

- If hidden or blocked, check AI Endpoint Enabled and AI license.

### Report Chat

- **Feature ID:** `report_chat`
- **User asks for:** report chat; chat with report; ask report; nexus chat
- **Where to go:** `supported report pages`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** `module:ai`, `scanning for nexus chat`
- **Settings:** `ai_endpoint_enabled`
- **Related backend APIs:** `/api/nlp/chat/report`, `/api/nexus/chat`

**How to guide the user**

1. Open a supported report.
2. Open the report chat widget.
3. Ask a specific question.
4. Review the answer.

**When the user cannot see it**

- If API returns 403, enable AI Endpoint Enabled.
- Confirm the user can access the report.


## Graph Investigation

### CTI Graph

- **Feature ID:** `cti_graph`
- **User asks for:** cti graph; graph; relationship graph; entity graph; threat graph
- **Where to go:** `/dashboard/ctigraph`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open CTI Graph.
2. Search or load a graph context.
3. Inspect nodes and edges.
4. Use context menus to expand or pivot.
5. Switch to list view if needed.
6. Export the graph if required.

**When the user cannot see it**

- Use a result report first if you need a concrete graph starting point.

### Social Intel

- **Feature ID:** `social_intel`
- **User asks for:** social intel; social graph; social mapper; profile graph; username graph
- **Where to go:** `/dashboard/social-intel`, `/dashboard/social-graph`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Social Intel.
2. Search for a username, handle, profile, or platform identity.
3. Review metadata, profiles, followers, following, posts, images, and relationships.
4. Switch between graph and list views.
5. Open profile details or popups.

**When the user cannot see it**

- Use Social Search for indexed content rather than profile relationship mapping.


## Profile And Alerts

### Tenant Homepage And Alert Summary

- **Feature ID:** `profile_homepage_alerts`
- **User asks for:** tenant homepage; alert summary; profile homepage; monitored alerts
- **Where to go:** `/dashboard/profile/homepage`
- **Roles:** `member`, `admin`, `analyst`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Profile Homepage.
2. Review monitored IOC and alert cards.
3. Open an alert category.
4. Start or cancel scans if available.
5. Add or manage custom alert values.

**When the user cannot see it**

- Content varies by role, license, and tenant state.

### Alerts

- **Feature ID:** `alerts`
- **User asks for:** alerts; alert report; tenant alerts; ioc alerts
- **Where to go:** `/dashboard/profile/alerts/:type`
- **Roles:** `member`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open an alert category.
2. Review alert rows or cards.
3. Use filters.
4. Open a finding.
5. Mark seen, update, delete, export, or pivot where available.

**When the user cannot see it**

- Confirm the tenant has monitored IOCs.
- Run alert scan if available.

### Add Custom Alert

- **Feature ID:** `add_custom_alert`
- **User asks for:** add alert; custom alert; monitor value; new alert
- **Where to go:** `/dashboard/profile/addcustomalert`
- **Roles:** `member`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Add Custom Alert.
2. Choose the alert type or category.
3. Enter the monitored value.
4. Save.
5. Return to alerts or homepage.

**When the user cannot see it**

- Confirm the user has member access and active account status.

### Manage IOCs

- **Feature ID:** `ioc_management`
- **User asks for:** ioc; manage iocs; tenant iocs; monitored indicators
- **Where to go:** `/dashboard/profile/ioc`
- **Roles:** `member`, `admin`, `analyst`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Profile -> IOC.
2. Review IOC categories and values.
3. Add, edit, or remove indicators.
4. Save changes.
5. Run or wait for alert scanning as configured.

**When the user cannot see it**

- Confirm the value format is valid for the selected IOC type.


## Settings

### Account Settings

- **Feature ID:** `account_settings`
- **User asks for:** account; profile settings; theme; 2fa; profile visibility; avatar
- **Where to go:** `/dashboard/profile/account`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Account Settings.
2. Edit allowed profile fields.
3. Update image if needed.
4. Toggle preferences such as theme, two-factor, or profile visibility.
5. Save changes.

**When the user cannot see it**

- Some fields may be read-only depending on role.

### Tenant Settings

- **Feature ID:** `tenant_settings`
- **User asks for:** tenant settings; tenant branding; company settings
- **Where to go:** `/dashboard/profile/tenant-settings`
- **Roles:** `member`, `admin`
- **Licenses:** `non-free for some edit controls`, `maintainer for some workflows`
- **Settings:** none

**How to guide the user**

1. Open Tenant Settings.
2. Review tenant details.
3. Enter edit mode if available.
4. Update tenant fields or image.
5. Save changes.

**When the user cannot see it**

- Confirm role and license if edit controls are missing.

### System Settings

- **Feature ID:** `system_settings`
- **User asks for:** system settings; branding; app name; language; ai endpoint enabled; documentation allowed; onion address
- **Where to go:** `/dashboard/profile/system-settings`
- **Roles:** `admin`
- **Licenses:** none
- **Settings:** `api_allowed`, `ai_endpoint_enabled`, `s_onion`, `meta_info`
- **Related backend APIs:** `/api/public/update`, `/api/system/image`

**How to guide the user**

1. Open System Settings.
2. Click edit.
3. Update app name, language, onion address, homepage links, branding assets, or feature toggles.
4. Toggle AI Endpoint Enabled to allow or block AI UI and AI backend endpoints.
5. Save settings.

**When the user cannot see it**

- Admin role is required to save settings.
- URLs must start with http:// or https://.
- AI Endpoint Enabled is stored as ai_endpoint_enabled.


## Administration

### Users

- **Feature ID:** `users`
- **User asks for:** users; manage users; view profiles; tenant users
- **Where to go:** `/dashboard/profile/users`, `/dashboard/tenant/view-profiles`
- **Roles:** `admin`, `member`
- **Licenses:** `subscription or maintainer depending on workflow`
- **Settings:** none

**How to guide the user**

1. Open Users or View Profiles.
2. Search or review the user list.
3. Open a user profile.
4. Update allowed fields, role, status, or tenant assignment.
5. Save.

**When the user cannot see it**

- Confirm maintainer/admin access if user management controls are missing.

### User Activity

- **Feature ID:** `user_activity`
- **User asks for:** user activity; profile activity; user profile
- **Where to go:** `/dashboard/profile/user/:user_id`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open a user profile from Users or a profile link.
2. Review activity information.
3. Return to the previous administration page.

**When the user cannot see it**

- Confirm the user ID exists and current user can view it.

### Tenant Administration

- **Feature ID:** `tenant_administration`
- **User asks for:** tenant administration; view tenants; tenants
- **Where to go:** `/dashboard/tenant/view-tenants`, `/dashboard/profile/tenant`
- **Roles:** `admin`
- **Licenses:** `subscription`
- **Settings:** none

**How to guide the user**

1. Open tenant administration.
2. Review tenant rows or cards.
3. Open a tenant for details.
4. Update tenant state where controls are available.

**When the user cannot see it**

- Admin role is required for all-tenant view.

### Audit Logs

- **Feature ID:** `audit_logs`
- **User asks for:** audit logs; auditlog; activity log; admin logs
- **Where to go:** `/dashboard/profile/auditlog`, `/dashboard/tenant/auditlog`
- **Roles:** `admin`, `member`, `demo`
- **Licenses:** `maintainer for tenant audit route`
- **Settings:** none

**How to guide the user**

1. Open Audit Log.
2. Filter by user, event, date, tenant, or available fields.
3. Review actions.
4. Delete audit entries only if allowed.

**When the user cannot see it**

- Confirm role and maintainer license if audit logs are hidden.

### Event Management

- **Feature ID:** `event_management`
- **User asks for:** event management; events
- **Where to go:** `/dashboard/profile/event-management`
- **Roles:** `admin`, `member`, `analyst`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Event Management.
2. Review available event rows or controls.
3. Add, update, or inspect events where controls are available.

**When the user cannot see it**

- Confirm the module is enabled for the current role.

### Feeder Management

- **Feature ID:** `feeder`
- **User asks for:** feeder; feeder scripts; crawler scripts; upload script; script owner
- **Where to go:** `/dashboard/profile/feeder`
- **Roles:** `admin`, `member`, `crawler`
- **Licenses:** `module:feeder`
- **Settings:** none
- **Related backend APIs:** `/api/profile/feeder/catalog`, `/api/profile/feeder/scripts`, `/api/profile/feeder/upload`

**How to guide the user**

1. Open Feeder.
2. Review the catalog and existing scripts.
3. Upload a script or values where allowed.
4. Enable, disable, clear, delete, or transfer ownership as needed.
5. Confirm script status.

**When the user cannot see it**

- If hidden, confirm module:feeder license.
- Owner transfer requires admin.


## Support And Documentation

### Directory And Links

- **Feature ID:** `directory`
- **User asks for:** directory; links; resources; external links
- **Where to go:** `/dashboard/directory`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Directory or Links.
2. Browse available resources.
3. Search or filter if controls are available.
4. Open the relevant resource.

**When the user cannot see it**

- Some links are deployment-specific.

### Support

- **Feature ID:** `support`
- **User asks for:** support; contact support; help; support modal
- **Where to go:** `support overlay`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** none

**How to guide the user**

1. Open Support.
2. Enter email, subject, and message.
3. Submit.
4. Wait for confirmation.

**When the user cannot see it**

- Enter a valid email address and non-empty message.

### Documentation

- **Feature ID:** `documentation_link`
- **User asks for:** documentation; docs; manual; help center; feature guide
- **Where to go:** `sidebar documentation link`, `/docs`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** `home_header_pricing_allowed`

**How to guide the user**

1. Open Documentation from the sidebar or header.
2. Browse the platform introduction, module introduction, user manual, feature guide, or API docs.

**When the user cannot see it**

- Visibility can depend on system metadata settings.

### Onion Link

- **Feature ID:** `onion_link`
- **User asks for:** onion; tor; onion link; dark web link
- **Where to go:** `sidebar onion link`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** `s_onion`

**How to guide the user**

1. Open the Onion Link from the sidebar.
2. Use the configured onion address in a supported browser.

**When the user cannot see it**

- The link only appears when s_onion is configured in System Settings.

### Whistle Blowing

- **Feature ID:** `whistle_blowing`
- **User asks for:** whistle blowing; whistleblowing; report leak; anonymous report
- **Where to go:** `sidebar whistle blowing link`
- **Roles:** `admin`, `member`, `analyst`, `demo`
- **Licenses:** none
- **Settings:** `S_HOME_HEADER_WHISTLE_BLOWING_ALLOWED`

**How to guide the user**

1. Open Whistle Blowing from the sidebar when visible.
2. Follow the configured external workflow.

**When the user cannot see it**

- Visibility depends on system metadata settings.

## Notes For LLM Integration

- Use `feature_catalog.json` for structured retrieval, ranking, and alias matching.
- Use this page when the answer should be readable and step-based.
- Keep source inventory files out of normal user-help prompts unless the user is asking a developer or implementation question.
- If a feature is controlled by `ai_endpoint_enabled`, explain that administrators can enable or disable AI endpoints from System Settings.
