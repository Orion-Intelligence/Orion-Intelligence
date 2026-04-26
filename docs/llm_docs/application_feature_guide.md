(application-feature-guide)=

# Application Feature Guide

:::{admonition} Purpose
:class: tip

This guide is written for two audiences: users who need step-by-step instructions and assistant systems that need reliable answers to questions such as "where do I go to use this feature?" or "why can I not see this module?". It complements the user manual by organizing the application by feature, route, prerequisites, and task flow.
:::

## How To Use This Guide

Each feature entry follows the same pattern:

- **Use When** explains the user goal.
- **Where To Go** gives the navigation path and route.
- **Access Notes** lists role, license, or system-setting constraints when visible in the application or backend route configuration.
- **Steps** gives the direct workflow.
- **If It Is Not Visible** gives the most likely reason.

When answering user questions, prefer the most specific feature entry. If a user asks about a broad task, start with the recommended module and then mention nearby alternatives.

## Universal Concepts

### Roles And Visibility

Orion is role-aware and license-aware. A feature can be hidden or blocked because of:

- the user's role
- the user's account status
- the tenant license
- a module license such as `module:ai` or `module:feeder`
- subscription access
- system settings such as `AI Endpoint Enabled`
- mobile layout restrictions for some modules

Common roles referenced by the backend include:

- `admin`
- `crawler`
- `member`
- `analyst`
- `demo`

### Main Navigation

Most authenticated workflows live under:

```text
/dashboard
```

The profile and tenant workspace lives under:

```text
/dashboard/profile
```

Search and investigation modules usually live directly under `/dashboard`, while user, alert, settings, and tenant tools usually live under `/dashboard/profile`.

### Global Search Pattern

Many result modules share the same workflow:

1. Open the relevant module.
2. Enter a keyword, IOC, entity, domain, hash, CVE, username, email, or phrase in the search input.
3. Choose a search mode if available.
4. Turn on `Advance` if filter controls are needed.
5. Apply filters.
6. Open a result card or row.
7. Review the report, metadata, graph pivots, JSON view, screenshots, and AI summary if available.

Search modes can include:

- Match semantic query
- Match any term
- Match individual terms
- Match full query

### Reports

Report pages are opened by clicking a result. The route usually includes a category and `m_hash`.

Common report capabilities:

- read extracted content
- inspect metadata fields
- view JSON
- open screenshots where available
- export or copy details where available
- open AI summary or report chat where the AI module is enabled
- pivot to related entities or graph views

## Entry, Authentication, And Onboarding

### Login

**Use When:** A user needs to access the Orion application.

**Where To Go:** Login page  
**Route:** `/login`

**Steps:**

1. Open the application.
2. If redirected to login, enter the account username or email.
3. Enter the password.
4. Complete any configured verification step.
5. Continue into the dashboard.

**If It Does Not Work:**

- Confirm the account is active.
- Confirm the user has completed any verification email step.
- Use password reset if credentials are unknown.
- Ask an administrator to check user status and tenant assignment.

### Signup

**Use When:** A new user or tenant needs to request an account.

**Where To Go:** Signup page  
**Route:** `/signup`

**Steps:**

1. Open the signup page.
2. Enter the required company and user information.
3. Submit the form.
4. Complete email verification if required.
5. Wait for tenant or administrator approval when configured.

**If It Is Not Visible:** Some deployments hide public signup or require admin-created accounts.

### Password Reset

**Use When:** A user cannot log in because the password is forgotten.

**Where To Go:** Password reset page  
**Routes:** `/reset`, `/reset/:token`

**Steps:**

1. Open the reset page.
2. Enter the registered email address.
3. Submit the reset request.
4. Open the reset link from email.
5. Enter and confirm the new password.
6. Return to login and sign in.

### Welcome And Notifications

**Use When:** A deployment uses post-login notifications, welcome messages, or tokenized onboarding.

**Where To Go:** Welcome or notification screens  
**Routes:** `/welcome`, `/welcome/:token`, `/notification`

**Steps:**

1. Follow the link or login redirect.
2. Review the displayed message.
3. Continue to the dashboard.

### Tenant Onboarding

**Use When:** A tenant account must finish setup before the main dashboard is available.

**Where To Go:** Onboarding  
**Route:** `/onboarding`

**Steps:**

1. Enter company or tenant information.
2. Add initial IOC monitoring values when requested.
3. Confirm setup.
4. Continue to the dashboard.

**If It Does Not Work:**

- Confirm the account belongs to a tenant.
- Confirm the tenant has an active license.
- Ask an administrator or maintainer to verify tenant status.

## Dashboard And Overview

### Dashboard Home

**Use When:** A user wants the primary search-first landing page.

**Where To Go:** Sidebar -> Home or dashboard default  
**Routes:** `/dashboard`, `/dashboard/home`, `/dashboard/profile/homepage`

**Steps:**

1. Open the dashboard.
2. Use the search input for broad investigation.
3. Select a tab such as IOCs, Deep Search, or Network Intelligence if shown.
4. Review overview cards, statistics, alerts, and insight panels.
5. Click a summary, card, or alert to open details.

**If It Is Not Visible:** The homepage can change by role, tenant type, license, and onboarding state.

### Statistics

**Use When:** A user wants high-level counts and visual summaries.

**Where To Go:** Profile -> Statistics  
**Route:** `/dashboard/profile/statistics`

**Steps:**

1. Open the Statistics page.
2. Review system or tenant insight cards.
3. Use visible charts and summaries for triage.
4. Pivot to the relevant module when a metric requires investigation.

### Directory And Links

**Use When:** A user wants saved links, monitored external references, or directory-style resources.

**Where To Go:** Sidebar -> Links or Directory  
**Route:** `/dashboard/directory`

**Steps:**

1. Open Directory.
2. Browse available links or monitored resources.
3. Search or filter if controls are available.
4. Open the relevant resource.

## Search And Investigation Modules

### Consolidated Investigation

**Use When:** The user has one query and wants multiple result channels at once.

**Where To Go:** Dashboard -> Consolidated  
**Routes:** `/dashboard/consolidated/all`, `/dashboard/profile/consolidated/all`

**Access Notes:** Protected by subscription access.

**Steps:**

1. Open Consolidated.
2. Enter a query such as an IOC, domain, email, username, organization, keyword, or hash.
3. Submit the search.
4. Review the IOCs, Deep Search, and Network Intel views.
5. Use filters to narrow results.
6. Open relevant result reports.
7. Pivot to a specialized module if one result type dominates.

**Best For:** Early triage when the user is not sure which module is most relevant.

### General Intelligence

**Use When:** The user wants broad indexed intelligence about a topic, actor, organization, keyword, event, or source.

**Where To Go:** Sidebar -> General Intelligence  
**Route Pattern:** `/dashboard/strategic/:category`

**Common Categories:** `all`, forums, news, stolen, drugs, hacking, marketplaces, cryptocurrency, leaks.

**Steps:**

1. Open General Intelligence.
2. Start with `All` unless the source category is already known.
3. Search the keyword, organization, event, domain, actor, product, or phrase.
4. Enable advanced filters when needed.
5. Open a result to inspect the full report.

### Data Breach

**Use When:** The user is checking breach records, exposed identity data, or tracking datasets.

**Where To Go:** Sidebar -> Data Breach  
**Route Pattern:** `/dashboard/breach/:category`

**Common Categories:** `all`, databases, tracking.

**Steps:**

1. Open Data Breach.
2. Choose `All` for broad search or a narrower category.
3. Search an email, username, organization, domain, credential marker, or keyword.
4. Apply filters.
5. Open the report to review exposure details.

### Discussion And Social Search

**Use When:** The user wants indexed social or discussion content, including platform chatter.

**Where To Go:** Sidebar -> Discussion or Social  
**Routes:** `/dashboard/discussion/all`, `/dashboard/social/all`

**Common Social Categories:** `telegram`, `twitter`, `mastodon`, `pastebin`, `forum`, `reddit`.

**Steps:**

1. Open Discussion or Social.
2. Select a platform category if known.
3. Search a username, channel, topic, keyword, domain, or IOC.
4. Open a chat or social report.
5. Use report metadata to pivot into related users, entities, or graph tools.

### Feed

**Use When:** The user wants current reporting or a stream-style intelligence reading view.

**Where To Go:** Sidebar -> Feed  
**Route Pattern:** `/dashboard/feed/:category`

**Default Category:** `news`

**Steps:**

1. Open Feed.
2. Choose the feed category.
3. Search or browse recent items.
4. Open a feed report for details.

### Exploit Intelligence

**Use When:** The user is investigating vulnerabilities, exploit tooling, CVEs, or zero-day references.

**Where To Go:** Sidebar -> Exploit  
**Route Pattern:** `/dashboard/exploit/:category`

**Common Categories:** `all`, `tools`, `cve`, `zeroday`.

**Steps:**

1. Open Exploit.
2. Choose `All`, `CVE`, `Tools`, or `ZeroDay`.
3. Search the CVE, product, exploit name, actor, or keyword.
4. Open a result report.
5. Review affected products, indicators, references, and extracted metadata.

### Defacement

**Use When:** The user is investigating hacked websites, phishing pages, website defacement, or related incidents.

**Where To Go:** Sidebar -> Defacement  
**Route Pattern:** `/dashboard/defacement/:category`

**Common Categories:** `all`, `hacked`, `phishing`, `databases`.

**Steps:**

1. Open Defacement.
2. Choose the incident category.
3. Search by domain, organization, attacker handle, keyword, or URL.
4. Open the defacement report.
5. Review screenshot, metadata, detected entities, and extracted indicators.

### Dump Listings

**Use When:** The user is looking for dump listings, leak URLs, or dump-related source references.

**Where To Go:** Sidebar -> Dump  
**Routes:** `/dashboard/dump/listing`, `/dashboard/dump/credential`

**Access Notes:** Protected by subscription access.

**Steps:**

1. Open Dump.
2. Choose Listing for dump references or Credential for credential-like records.
3. Search the leak URL, domain, keyword, or identifier.
4. Open matching records.

### Stealer Logs

**Use When:** The user is investigating stealer-log IOCs and credential-related artifacts.

**Where To Go:** Sidebar -> Stealer logs  
**Route:** `/dashboard/stealerlogs/iocs`

**Access Notes:** Protected by subscription access.

**Steps:**

1. Open Stealer logs.
2. Search for domain, IP, email, username, URL, or other indicator.
3. Review returned credential or IOC records.
4. Pivot into reports or alerts when relevant.

## Live Lookup And Entity API

### Entity API Overview

**Use When:** The user already has a concrete input and wants targeted enrichment.

**Where To Go:** Sidebar -> Entity API  
**Route Base:** `/dashboard/api`

**Access Notes:** Protected by subscription access.

**General Steps:**

1. Open Entity API.
2. Choose the correct scanner.
3. Enter the target value.
4. Submit.
5. Review the returned result card or report.

### Email Breach

**Use When:** The user wants to check an email address against breach or exposure data.

**Where To Go:** Entity API -> Email Breach  
**Route:** `/dashboard/api/email-breach`

**Steps:**

1. Open Email Breach.
2. Enter the email address.
3. Submit the lookup.
4. Review breach exposure, matches, and any available metadata.

### Social Scanner

**Use When:** The user wants direct enrichment for a username, handle, or social profile.

**Where To Go:** Entity API -> Social Scanner  
**Route:** `/dashboard/api/social-scanner`

**Steps:**

1. Open Social Scanner.
2. Enter the username, handle, or supported social value.
3. Submit.
4. Review discovered profiles, metadata, or platform matches.

### Wanted List

**Use When:** The user wants to check a person or entity against wanted-list style data.

**Where To Go:** Entity API -> Wanted List  
**Route:** `/dashboard/api/wanted-list`

**Steps:**

1. Open Wanted List.
2. Enter the name or identifier.
3. Submit.
4. Review matching records and confidence information.

### National Identity

**Use When:** The user wants to check supported national identity data.

**Where To Go:** Entity API -> National Identity  
**Route:** `/dashboard/api/national-identity`

**Steps:**

1. Open National Identity.
2. Enter the supported identity value.
3. Submit.
4. Review returned identity information.

### Playstore Scanner

**Use When:** The user wants to inspect an Android application or Play Store reference.

**Where To Go:** Entity API -> Playstore Scanner  
**Route:** `/dashboard/api/playstore-scanner`

**Steps:**

1. Open Playstore Scanner.
2. Enter the application reference, package, or supported value.
3. Submit.
4. Review application metadata and risk indicators.

### Software Scanner

**Use When:** The user wants to check software-related indicators or package references.

**Where To Go:** Entity API -> Software Scanner  
**Route:** `/dashboard/api/software-scanner`

**Steps:**

1. Open Software Scanner.
2. Enter the software name, package, URL, or supported value.
3. Submit.
4. Review related metadata and detected risk.

### File Scanner

**Use When:** The user wants to upload a file and extract IOCs.

**Where To Go:** Entity API -> File Scanner  
**Route:** `/dashboard/api/file-scanner`

**Steps:**

1. Open File Scanner.
2. Upload the file.
3. Start analysis.
4. Wait for extraction to finish.
5. Review extracted IOCs and analysis output.
6. Use returned indicators as pivots in Consolidated, IOC Search, or alerts.

### Text Analysis

**Use When:** The user wants to analyze raw text for spam, malicious URLs, or suspicious content.

**Where To Go:** Entity API -> Text Analysis  
**Route:** `/dashboard/api/text-analysis`

**Access Notes:** Uses AI/Nexus analysis endpoints. If `AI Endpoint Enabled` is off, backend AI analysis routes are blocked.

**Steps:**

1. Open Text Analysis.
2. Paste the text to analyze.
3. Submit.
4. Review the classification, extracted values, and risk indicators.

### Crypto Scanner

**Use When:** The user wants to inspect a cryptocurrency address or related crypto artifact.

**Where To Go:** Entity API -> Crypto Scanner  
**Route:** `/dashboard/api/crypto-scanner`

**Steps:**

1. Open Crypto Scanner.
2. Enter the cryptocurrency address or supported value.
3. Submit.
4. Review related metadata, risk, and linked activity.

## Scanning And Infrastructure

### Basic Web Scan

**Use When:** The user wants to scan a website or web-facing target.

**Where To Go:** Sidebar -> Scan  
**Route:** `/dashboard/scan`

**Steps:**

1. Open Scan.
2. Enter the target domain or URL.
3. Choose the scan type if available.
4. Start the scan.
5. Review the report and extracted indicators.

### Network Intel

**Use When:** The user wants infrastructure reconnaissance, IP scanning, host recon, vulnerability checks, or geo-assisted pivots.

**Where To Go:** Sidebar -> Network Intel  
**Routes:** `/dashboard/netint`, `/dashboard/scanner/network-scan`

**Access Notes:** Protected by subscription access. The sidebar can disable it in mobile mode.

**Steps:**

1. Open Network Intel.
2. Choose Host Recon, IP Scan, or Vulnerability Scan.
3. Enter the target domain, host, or IP.
4. Start the scan.
5. Review DNS, IP, port, vulnerability, location, or host details.
6. Pivot into reports or export findings when available.

### Repository Scan

**Use When:** The user wants to scan a repository or code-facing target.

**Where To Go:** Web Scans -> Repository Scan  
**Route:** `/dashboard/scanner/repository-scan`

**Steps:**

1. Open Repository Scan.
2. Enter the repository URL or supported reference.
3. Start the scan.
4. Review detected exposure, metadata, or risk findings.

### SEO Scan

**Use When:** The user wants SEO or web metadata inspection for a target.

**Where To Go:** Web Scans -> SEO Scan  
**Route:** `/dashboard/scanner/seo-scan`

**Steps:**

1. Open SEO Scan.
2. Enter the target domain or URL.
3. Start the scan.
4. Review metadata and scan output.

### APK Scan

**Use When:** The user wants to upload and analyze an Android APK.

**Where To Go:** Web Scans -> APK Scan  
**Route:** `/dashboard/scanner/apk-scan`

**Steps:**

1. Open APK Scan.
2. Upload the APK file.
3. Start analysis.
4. Review permissions, behaviors, static indicators, and extracted IOCs.

## AI Features

### AI Workspace

**Use When:** The user wants to chat with or summarize intelligence content using the AI workspace.

**Where To Go:** Dashboard search AI button or Profile -> AI  
**Route:** `/dashboard/profile/ai`

**Access Notes:**

- Requires AI module/license for non-admin users where enforced.
- Requires `AI Endpoint Enabled` in System Settings.
- Backend blocks AI endpoints when `ai_endpoint_enabled` is `"0"`.

**Steps:**

1. Open the homepage or profile workspace.
2. Click the AI button near the homepage search tabs, or navigate to Profile -> AI.
3. Enter the prompt, question, or content.
4. Submit.
5. Review the answer.
6. Continue the conversation or pivot to a report.

**If It Is Not Visible Or Fails:**

- Check System Settings -> `AI Endpoint Enabled`.
- Confirm the tenant has the AI module license.
- Confirm the user role can access the AI workspace.
- If a direct API call returns `403`, the endpoint is disabled by system settings.

### AI Report Summary

**Use When:** The user wants an AI-generated summary of a report.

**Where To Go:** Open a report -> AI Summary button  
**Backend Route:** `/api/nlp/summarize/ai`

**Access Notes:** Blocked when `AI Endpoint Enabled` is off.

**Steps:**

1. Open any supported report.
2. Click the AI Summary action if visible.
3. Wait for summarization.
4. Review the generated summary.

### Report Chat

**Use When:** The user wants to ask questions about report content.

**Where To Go:** Supported report -> Chat or AI report assistant  
**Backend Routes:** `/api/nlp/chat/report`, `/api/nexus/chat`

**Access Notes:** Blocked when `AI Endpoint Enabled` is off.

**Steps:**

1. Open a supported report.
2. Open the report chat widget.
3. Ask a specific question about the report.
4. Review the response.

## Graph And Relationship Analysis

### CTI Graph

**Use When:** The user wants to map relationships between documents, entities, IOCs, and properties.

**Where To Go:** Sidebar -> CTI Graph  
**Route:** `/dashboard/ctigraph`

**Steps:**

1. Open CTI Graph.
2. Search or load a graph context.
3. Inspect connected nodes and edges.
4. Use context menus to expand, pivot, hide, or inspect nodes.
5. Switch to list view if needed.
6. Export the graph when required.

### Social Intel

**Use When:** The user wants graph-style social profile mapping and relationship analysis.

**Where To Go:** Sidebar -> Social Intel  
**Routes:** `/dashboard/social-intel`, `/dashboard/social-graph`

**Steps:**

1. Open Social Intel.
2. Search for a username, handle, profile, or platform identity.
3. Review metadata, global presence, followers, following, posts, images, and relationships where available.
4. Switch between graph and list views.
5. Open profile details or related popups for deeper inspection.

## Profile, Tenant, Alerts, And Administration

### Tenant Homepage And Alert Summary

**Use When:** A tenant user wants alert summaries, monitored IOC status, and quick actions.

**Where To Go:** Profile -> Homepage  
**Route:** `/dashboard/profile/homepage`

**Steps:**

1. Open Profile Homepage.
2. Review monitored IOC and alert cards.
3. Open an alert category.
4. Start or cancel scans if available.
5. Add or manage custom alert values.

### Alerts

**Use When:** The user wants to inspect tenant alert findings by type.

**Where To Go:** Profile -> Alerts or a tenant alert card  
**Route Pattern:** `/dashboard/profile/alerts/:type`

**Steps:**

1. Open the alert category.
2. Review alert rows or cards.
3. Use filters to narrow results.
4. Open a finding.
5. Mark as seen, update, delete, export, or pivot where available.

### Add Custom Alert

**Use When:** The user wants to add monitored custom alert values.

**Where To Go:** Profile -> Add Custom Alert  
**Route:** `/dashboard/profile/addcustomalert`

**Steps:**

1. Open Add Custom Alert.
2. Choose the alert type or category.
3. Enter the monitored value.
4. Save.
5. Return to alerts or homepage to monitor results.

### Manage IOCs

**Use When:** The user wants to manage monitored IOC values for the tenant or profile.

**Where To Go:** Profile -> IOC  
**Route:** `/dashboard/profile/ioc`

**Steps:**

1. Open IOC management.
2. Review existing IOC categories and values.
3. Add, edit, or remove monitored indicators.
4. Save changes.
5. Run or wait for alert scanning as configured.

### Account Settings

**Use When:** The user wants to update profile, avatar, theme, two-factor settings, or account preferences.

**Where To Go:** Profile -> Account  
**Route:** `/dashboard/profile/account`

**Steps:**

1. Open Account Settings.
2. Edit allowed profile fields.
3. Update image if needed.
4. Toggle preferences such as theme, two-factor, or profile visibility where available.
5. Save changes.

### Tenant Settings

**Use When:** A tenant maintainer or member needs to update tenant information and tenant branding.

**Where To Go:** Profile -> Tenant Settings  
**Route:** `/dashboard/profile/tenant-settings`

**Access Notes:** Some edit controls are restricted by role and license. Maintainer features require maintainer access.

**Steps:**

1. Open Tenant Settings.
2. Review tenant details.
3. Enter edit mode if available.
4. Update tenant fields or image.
5. Save changes.

### System Settings

**Use When:** An administrator needs to manage platform-wide branding, links, language, onion address, and feature flags.

**Where To Go:** Profile -> System Settings  
**Route:** `/dashboard/profile/system-settings`

**Access Notes:** Update route requires admin role.

**Steps:**

1. Open System Settings.
2. Click edit.
3. Update app name, language, onion address, homepage links, branding assets, or feature toggles.
4. Toggle `AI Endpoint Enabled` to allow or block AI UI and AI backend endpoints.
5. Save.
6. Confirm service status displays the expected state.

### Users

**Use When:** An administrator or maintainer needs to manage users.

**Where To Go:** Profile -> Users or Tenant -> View Profiles  
**Routes:** `/dashboard/profile/users`, `/dashboard/tenant/view-profiles`

**Steps:**

1. Open Users or View Profiles.
2. Search or review the user list.
3. Open a user profile.
4. Update allowed fields, role, status, or tenant assignment where available.
5. Save.

### User Activity

**Use When:** A user or administrator wants to inspect a user's profile activity.

**Where To Go:** User profile link  
**Route:** `/dashboard/profile/user/:user_id`

**Steps:**

1. Open a user profile from Users or a profile link.
2. Review activity information.
3. Return to the previous administration page.

### Tenant Administration

**Use When:** An administrator needs to view tenant records.

**Where To Go:** Tenant -> View Tenants or Profile -> Tenant  
**Routes:** `/dashboard/tenant/view-tenants`, `/dashboard/profile/tenant`

**Steps:**

1. Open tenant administration.
2. Review tenant rows or cards.
3. Open a tenant for details.
4. Update tenant state where controls are available.

### Audit Logs

**Use When:** An administrator, maintainer, or demo-capable role needs to review audit history.

**Where To Go:** Profile -> Audit Log or Tenant -> Audit Log  
**Routes:** `/dashboard/profile/auditlog`, `/dashboard/tenant/auditlog`

**Steps:**

1. Open Audit Log.
2. Filter by user, event, date, tenant, or available fields.
3. Review actions.
4. Delete audit entries only if the role allows it.

### Event Management

**Use When:** The user needs to manage event-related profile workspace data.

**Where To Go:** Profile -> Event Management  
**Route:** `/dashboard/profile/event-management`

**Steps:**

1. Open Event Management.
2. Review available event rows or controls.
3. Add, update, or inspect events where controls are available.

### Feeder Management

**Use When:** The user needs to upload, manage, enable, disable, or transfer feeder scripts.

**Where To Go:** Profile -> Feeder  
**Route:** `/dashboard/profile/feeder`

**Access Notes:** Requires `module:feeder`; some owner operations require admin.

**Steps:**

1. Open Feeder.
2. Review the catalog and existing scripts.
3. Upload a script or values where allowed.
4. Enable, disable, clear, delete, or transfer ownership as needed.
5. Confirm script status.

## Support And External Tools

### Support Modal

**Use When:** The user needs to contact support.

**Where To Go:** Support link or support button in the UI

**Steps:**

1. Open Support.
2. Enter email, subject, and message.
3. Submit.
4. Wait for confirmation.

### Documentation Link

**Use When:** The user wants product documentation.

**Where To Go:** Sidebar -> Documentation

**Access Notes:** Visibility can be controlled by system settings such as documentation or pricing link flags.

**Steps:**

1. Open Documentation from the sidebar or header.
2. Browse the user manual, module introduction, feature guide, or API docs.

### Onion Link

**Use When:** The deployment exposes an onion address.

**Where To Go:** Sidebar -> Onion Link

**Access Notes:** Only appears when the system setting `s_onion` is configured.

**Steps:**

1. Open the Onion Link from the sidebar.
2. Use the configured onion address in a supported browser.

### Whistle Blowing

**Use When:** The deployment exposes a whistle-blowing link.

**Where To Go:** Sidebar -> Whistle Blowing

**Access Notes:** Visibility depends on system metadata settings.

**Steps:**

1. Open Whistle Blowing from the sidebar when visible.
2. Follow the external or configured workflow.

## Troubleshooting By Symptom

### A Feature Is Missing From The Sidebar

Most likely causes:

1. The user role does not allow it.
2. The tenant license does not include it.
3. The user is in demo, free, or restricted mode.
4. The account has not completed onboarding.
5. The UI is in mobile mode and the feature is hidden.
6. A system setting is disabled.

Recommended action:

1. Confirm the user role.
2. Confirm tenant license modules.
3. Confirm account status.
4. Confirm system settings.
5. Ask an administrator to verify access.

### AI Button Is Missing

Most likely causes:

1. `AI Endpoint Enabled` is off.
2. The tenant does not have the AI module.
3. The user role cannot access AI.
4. The AI route is blocked by backend setting.

Recommended action:

1. Go to System Settings.
2. Turn on `AI Endpoint Enabled`.
3. Confirm AI module license.
4. Retry the AI workspace or report summary.

### AI API Returns 403

Meaning:

```text
AI endpoint is disabled
```

Recommended action:

1. Open System Settings.
2. Enable `AI Endpoint Enabled`.
3. Save settings.
4. Retry the request.

### Search Returns No Results

Recommended action:

1. Try a broader module such as Consolidated or General Intelligence.
2. Switch search mode to Match any term.
3. Remove filters.
4. Confirm the category is correct.
5. Try a normalized IOC format.
6. Check whether the data source has been ingested.

### Report Does Not Open

Recommended action:

1. Confirm the result hash is still valid.
2. Refresh the search.
3. Try opening the result from the original module.
4. Confirm the current user has access to that module.

### Scan Does Not Complete

Recommended action:

1. Confirm the input format is valid.
2. Check whether the service requires a license.
3. Retry with a smaller or clearer target.
4. Ask an administrator to check backend scanner availability.

### System Setting Does Not Save

Recommended action:

1. Confirm the current user is an administrator.
2. Check required fields such as app name and URLs.
3. Ensure URLs start with `http://` or `https://`.
4. Ensure `AI Endpoint Enabled` saves as enabled or disabled.

## Recommended Answers For Common Questions

### "Where do I search everything at once?"

Use Consolidated:

```text
Dashboard -> Consolidated
/dashboard/consolidated/all
```

For tenant profile workflow:

```text
Profile -> Consolidated
/dashboard/profile/consolidated/all
```

### "How do I scan a file for IOCs?"

Use File Scanner:

```text
Entity API -> File Scanner
/dashboard/api/file-scanner
```

Upload the file, start analysis, then review extracted IOCs.

### "How do I scan an APK?"

Use APK Scan:

```text
Web Scans -> APK Scan
/dashboard/scanner/apk-scan
```

Upload the APK, run analysis, then review permissions, behaviors, and IOCs.

### "How do I check an email breach?"

Use Email Breach:

```text
Entity API -> Email Breach
/dashboard/api/email-breach
```

Enter the email and submit the lookup.

### "How do I investigate a CVE?"

Use Exploit:

```text
Exploit -> CVE
/dashboard/exploit/cve
```

Search the CVE and open matching reports.

### "How do I investigate a hacked website?"

Use Defacement:

```text
Defacement -> Hacked or Phishing
/dashboard/defacement/hacked
/dashboard/defacement/phishing
```

Search the domain or attacker handle and open the report.

### "How do I use AI?"

Use AI Workspace:

```text
Profile -> AI
/dashboard/profile/ai
```

If the AI button is missing, check System Settings -> `AI Endpoint Enabled` and confirm the AI module license.

### "How do I manage monitored IOCs?"

Use Profile IOC:

```text
Profile -> IOC
/dashboard/profile/ioc
```

Add, edit, or remove monitored indicators.

### "How do I add a custom alert?"

Use Add Custom Alert:

```text
Profile -> Add Custom Alert
/dashboard/profile/addcustomalert
```

Choose the alert type, enter the value, and save.

### "How do I change branding or system-wide settings?"

Use System Settings:

```text
Profile -> System Settings
/dashboard/profile/system-settings
```

Admin role is required for saving platform configuration.

### "How do I manage feeder scripts?"

Use Feeder:

```text
Profile -> Feeder
/dashboard/profile/feeder
```

The `module:feeder` license is required.
