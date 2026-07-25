(help-manual)=

# Platform Help Manual

:::{admonition} Scope
:class: tip

This task-oriented manual provides concise help for the user-visible features of Orion Intelligence. Each feature includes navigation, a quick answer, operating steps, and troubleshooting guidance.

The intended audience includes application users, support personnel, analysts, tenant maintainers, and administrators. Backend details are included only when they materially affect user-visible behavior.
:::

Use this manual when you need to complete a specific task or resolve a common interface problem. For complete feature descriptions and broader workflows, see the [User Manual](./user_manual.md). For implementation and maintenance information, see the [Developer Documentation](./developer_documentation.md).

```{contents}
:local:
:depth: 2
```

## Login And 2FA

### Overview

Orion account access, login 2FA, email/password sign-in, authenticator code verification, demo login, verification-pending accounts, forced password reset redirects, login failure handling, and authenticated session entry.

**Search terms:** login, sign in, open account, access Orion, 2FA login, verify 2FA, demo login.

### Navigation

`/login`.

### Quick answer

To sign in, open `/login`, enter email and password, select Sign In, then enter the 2FA code if the 2FA screen appears.

### Steps

  1. Open `/login`.
  2. Enter Email.
  3. Enter Password.
  4. Select Sign In.
  5. If 2FA appears, enter the 6-digit authenticator code.
  6. If demo access is visible, select the demo option.

### Troubleshooting

For verification-pending accounts, use Resend mail. If forced reset is active, the app redirects to the reset page. If 2FA fails, confirm the latest authenticator code and time sync.

## Signup And Email Verification

### Overview

Public registration, new tenant account creation, username entry, company email entry, password strength, welcome token links, resend verification mail, expired verification links, and first account activation.

**Search terms:** signup, register, create account, new tenant account, verification email, welcome token, resend verification.

### Navigation

`/signup`, `/welcome`, `/welcome/:token`.

### Quick answer

To create an account, open `/signup`, fill username, company email, and password, submit the form, then open the verification email and follow the welcome link.

### Steps

  1. Open `/signup`.
  2. Enter Username.
  3. Enter Company Mail.
  4. Enter Password and satisfy the strength meter.
  5. Select Sign Up.
  6. Open the verification email.
  7. Follow `/welcome/:token`.
  8. Return to login after verification.

### Troubleshooting

If the username already exists, use suggested alternatives. If verification mail is missing, use resend verification. If token is expired/invalid, request a new verification email.

## Password Reset And Forced Password Change

### Overview

Forgotten password recovery, forced first-login password updates, reset email links, reset token pages, new password confirmation, old-password reuse validation, and return-to-login behavior.

**Search terms:** forgot password, reset password, forced password reset, change password, reset token, update password.

### Navigation

`/reset`, `/reset/:token`.

### Quick answer

To reset password, open `/reset`, submit the registered email, open the reset link, enter the new password and confirmation, then log in again.

### Steps

  1. Open `/reset`.
  2. Enter registered email.
  3. Open the reset email.
  4. Open `/reset/:token`.
  5. Enter New Password.
  6. Enter Confirm Password.
  7. Submit the reset form.
  8. Return to `/login`.

### Troubleshooting

The new password cannot match the old one. If the reset page fails, request a new token. If the user cannot log in after reset, confirm the reset completed and the new password is being used.

## Tenant Onboarding

### Overview

First-time tenant setup, company information, initial monitored IOC seeding, onboarding completion, dashboard access gating, tenant verification, license assignment, and setup-loop troubleshooting.

**Search terms:** onboarding, first setup, tenant setup, company setup, add IOCs during setup.

### Navigation

`/onboarding`.

### Quick answer

Complete onboarding by entering company information, adding optional monitored IOCs, confirming the setup, and continuing to the dashboard.

### Steps

  1. Open `/onboarding` after login.
  2. Enter company or tenant information.
  3. Continue to IOC setup.
  4. Choose IOC categories.
  5. Add IOC values.
  6. Review confirmation.
  7. Complete onboarding.
  8. Continue to dashboard.

### Troubleshooting

If onboarding loops or blocks dashboard access, confirm tenant verification, account status, license assignment, and required setup fields.

## Dashboard Shell And Sidebar

### Overview

Authenticated app navigation, left sidebar modules, collapsed/mobile menu, profile menu, notification bell, default dashboard redirects, role-based visibility, license-based menu access, and dashboard layout behavior.

**Search terms:** dashboard, sidebar, menu, navigation, missing menu item, collapsed sidebar, dashboard layout.

### Navigation

`/dashboard`.

### Quick answer

Use the left sidebar to open modules; if a feature is missing, check role, license, onboarding, tenant state, system settings, and whether the sidebar is collapsed.

### Steps

  1. Sign in.
  2. Open `/dashboard`.
  3. Expand the sidebar if collapsed.
  4. Select a module group.
  5. Open the desired module.
  6. Use the profile menu for account/admin pages.
  7. Use notifications for alerts and payment/status screens.

### Troubleshooting

Missing menu items are usually caused by role/license restrictions, disabled tenant, incomplete onboarding, collapsed/mobile sidebar, or system feature toggles.

## Global Search

### Overview

Shared free-text search across indexed intelligence modules, query submission, loading state, result counts, result cards, result rows, pagination, no-result states, broad result sets, and report opening.

**Search terms:** search, basic search, global search, query, find result, result count, no result, search old data.

### Navigation

dashboard search, `/dashboard/profile/consolidated/all`, or any indexed module.

### Quick answer

Enter a query in the search input, submit it, then inspect the returned result cards or rows.

### Steps

  1. Open the target module.
  2. Enter a query in the search input.
  3. Select the search icon or press Enter where supported.
  4. Wait for loading to finish.
  5. Review result count and cards/rows.
  6. Open a result to inspect the report.
  7. Use pagination or Load More if available.

### Troubleshooting

If results are too broad, use Advanced entity filters, Tools full-query/AND mode, and Date Range. If results appear before a query, the screen may be showing default discovery records.

## Advanced Entity Filters

### Overview

Structured indicator filtering, entity category selection, filter value chips, exact match, partial match, suggestions, selected-filter counts, email filters, domain filters, IP filters, URL filters, CVE filters, phone filters, credit card filters, crypto filters, person filters, organization filters, and social-profile filters.

**Search terms:** advanced filter, entity filter, exact email search, filter by domain, filter by IP, CVE filter, selected filters.

### Navigation

search screen > Advanced.

### Quick answer

Open Advanced, choose the entity category, enter the value, add it, select Exact Match or Partial Match, and run the search.

### Steps

  1. Open a search module.
  2. Select Advanced.
  3. Search or select an entity category.
  4. Enter the entity value.
  5. Select plus or press Enter.
  6. Choose Exact Match for precise values or Partial Match for broader values.
  7. Run the search.
  8. Remove chips or Clear Selection when needed.

### Troubleshooting

Invalid values can fail validation or return no results. Exact Match can miss differently formatted data; Partial Match can return broader results.

## Side Filter Drawer And Date Range

### Overview

Slide-out module filters, start date, end date, creation date, event date, network type, safe search, content type, source, status, index type, platform, active filter chips, old records, random-looking records, and time-bounded result narrowing.

**Search terms:** date range, old results, older data, random results, filter drawer, side filter, reset filters, no query results.

### Navigation

module screen > Filter.

### Quick answer

Open Filter, select start date and end date, select Apply, then confirm the date chip or selected filter count is visible.

### Steps

  1. Open the module.
  2. Select Filter.
  3. Choose needed dropdown filters.
  4. Open the date picker.
  5. Select start date.
  6. Select end date.
  7. Select Apply.
  8. Use Reset to clear drawer filters.

### Troubleshooting

Older data appears when no date range is active or the range is wide. Results can look random before a query because discovery/default records are loaded. Select both dates before applying.

## Search Tools And Sorting

### Overview

Query matching modes, semantic search, any-term OR matching, individual-term AND matching, full-query AND matching, strict search, broad search, exact phrase-style search, newest-first sorting, and oldest-first sorting.

**Search terms:** semantic search, exact search, AND search, OR search, full query, newest first, oldest first, search mode.

### Navigation

search screen > Tools.

### Quick answer

Open Tools and choose semantic, OR, AND, full query, newest first, or oldest first depending on the search goal.

### Steps

  1. Open a search module.
  2. Enter a query.
  3. Open Tools.
  4. Choose the matching mode.
  5. Choose sort order if available.
  6. Run the search again.

### Troubleshooting

Semantic can return related low-precision results. Use full query or AND with entity filters for strict matching.

## Report Views, Evidence, Feedback, And Comments

### Overview

Opened result reports, evidence pages, metadata review, screenshots, extracted entities, raw JSON, comments, recommend feedback, trust feedback, untrust feedback, copy actions, export actions, STIX output, downloads, and report chat controls.

**Search terms:** open report, inspect result, report details, feedback, comment, trust, untrust, recommend, export report, raw JSON.

### Navigation

click result card/row or route such as `/dashboard/breach/:category/:m_hash`.

### Quick answer

Open a result, review report evidence and metadata, then use feedback, comments, copy, export, or AI controls where available.

### Steps

  1. Run a search.
  2. Select a result card or row.
  3. Review title, content, source/reference, date, and extracted entities.
  4. Open raw JSON or screenshots if available.
  5. Use copy controls for indicators.
  6. Add Recommended, Trust, or Untrust feedback if needed.
  7. Add a comment if allowed.
  8. Export or download report where available.

### Troubleshooting

Some report types open full pages while others open modals/overlays. Commenting can be rate-limited. Profile visibility depends on user and tenant privacy settings.

## Homepage, Insights, Statistics, And Heatmap

### Overview

Dashboard overview content, homepage search, insight cards, latest documents, global summaries, tenant alert cards, world heatmap, country report panels, profile statistics, metrics, trend summaries, and role-specific homepage widgets.

**Search terms:** homepage, dashboard overview, statistics, heatmap, country report, insight cards, latest documents.

### Navigation

`/dashboard/home`, `/dashboard/profile/homepage`, `/dashboard/profile/statistics`.

### Quick answer

Use Homepage for high-level search, alert/insight overview, heatmap exploration, and quick pivots into results.

### Steps

  1. Open Dashboard or Profile > Homepage.
  2. Review summaries, insight cards, or tenant alert cards.
  3. Use the homepage search if needed.
  4. Hover or select a country on the heatmap where available.
  5. Open country/report panel.
  6. Close the panel or pivot into a module.
  7. Open Profile > Statistics for metrics.

### Troubleshooting

Homepage content depends on role, license, tenant type, and default/global tenant membership.

## General Intelligence

### Overview

Broad mixed-source intelligence discovery across open web, dark web, forums, news, stolen data references, drugs, hacking, marketplaces, cryptocurrency, leaks, topic keywords, organizations, products, actors, events, network filters, safe search, and content-type filters.

**Search terms:** general intelligence, broad search, forums, news, stolen, hacking, marketplaces, cryptocurrency, leaks.

### Navigation

sidebar > General Intelligence or `/dashboard/strategic/all`.

### Quick answer

Open General Intelligence, choose a category such as All or Forums, search the query, then filter and open reports.

### Steps

  1. Open General Intelligence.
  2. Choose All or a category.
  3. Enter query.
  4. Apply Advanced filters if needed.
  5. Apply Date Range or Network Type.
  6. Open a result.
  7. Review/export report.

### Troubleshooting

Exact values work best with entity filters and the narrowest matching module for the indicator type.

## Data Breach

### Overview

Stored breach datasets, database leaks, tracking records, identity exposure, leaked account references, email exposure, company exposure, person exposure, breach metadata, database categories, tracking categories, recent-only filters, and exact entity matching.

**Search terms:** data breach, breach records, databases, tracking, leaked email, exposed account, breach exposure.

### Navigation

sidebar > Data Breach or `/dashboard/breach/all`.

### Quick answer

Open Data Breach, choose All/Databases/Tracking, search the email or entity, apply filters, then open the breach report.

### Steps

  1. Open Data Breach.
  2. Choose All, Databases, or Tracking.
  3. Enter email, domain, person, company, or keyword.
  4. Add Email/Domain entity filter for exact searching.
  5. Apply Date Range if needed.
  6. Open a result.
  7. Review breach evidence.

### Troubleshooting

If the user specifically needs credential rows, use Stealer Logs or Consolidated IOCs. If no result appears, broaden filters or use Email Breach live lookup.

## Defacement And Compromise Monitoring

### Overview

Website compromise incidents, hacked pages, phishing sites, defacer names, attacker teams, compromised databases, target URLs, domains, server evidence, IP evidence, location evidence, saved dates, and defacement reports.

**Search terms:** defacement, hacked site, phishing site, compromised website, defacer, hacked databases.

### Navigation

sidebar > Compromise Monitoring / Defacement or `/dashboard/defacement/all`.

### Quick answer

Open Defacement, choose All/Hacked/Phishing/Databases, search the target or attacker, and open the incident report.

### Steps

  1. Open Defacement.
  2. Choose All, Hacked, Phishing, or Databases.
  3. Enter target URL, domain, defacer, team, IP, or keyword.
  4. Apply Date Range if needed.
  5. Open a matching row/card.
  6. Review target, attacker, date, server, IP, and evidence.
  7. Export or copy indicators where available.

### Troubleshooting

If a report opens as an overlay or JSON-like view, close it to return to the result list. Date range affects the result list and opened report context.

## Social Indexed Search

### Overview

Stored social posts, collected discussion records, Telegram content, Twitter content, Mastodon content, Pastebin content, forum content, Reddit content, chatter monitoring, social leak references, platform tabs, social reports, and chat reports.

**Search terms:** social search, Telegram search, Twitter search, Reddit search, forum search, Pastebin search, social posts.

### Navigation

sidebar > Social or `/dashboard/social/all`.

### Quick answer

Open Social, choose a platform tab, search the query, apply filters, then open the social/chat report.

### Steps

  1. Open Social.
  2. Choose All or a platform.
  3. Enter query.
  4. Apply platform, network, content type, or date filters.
  5. Open a social/chat result.
  6. Review message/post context and metadata.
  7. Export or open related social/chat report actions where available.

### Troubleshooting

Social search retrieves stored platform content and report records.

## Exploit

### Overview

Vulnerability intelligence, exploit intelligence, CVE identifiers, CWE weakness context, exploit tools, zero-day references, vulnerable products, proof-of-concept discussion, exploit names, exploit reports, and vulnerability report review.

**Search terms:** exploit, CVE, tools, zeroday, zero day, vulnerability, exploit report.

### Navigation

sidebar > Exploit or `/dashboard/exploit/all`.

### Quick answer

Open Exploit, choose All/CVE/Tools/ZeroDay, search the vulnerability or tool, then inspect the exploit report.

### Steps

  1. Open Exploit.
  2. Choose All, CVE, Tools, or ZeroDay.
  3. Enter CVE, product, tool, or keyword.
  4. Apply entity filters for CVE/CWE if needed.
  5. Apply Date Range if needed.
  6. Open result.
  7. Review exploit context and indicators.

### Troubleshooting

If a CVE search returns broad semantic results, use exact CVE entity filter or full-query matching.

## Feed

### Overview

News-style intelligence reading, current reporting, feed search, news search, recent intelligence articles, feed reports, source URLs, report metadata, current coverage, and reading-oriented workflows.

**Search terms:** feed, news, current reporting, intelligence news, feed report.

### Navigation

sidebar > Feed > News or `/dashboard/feed/news`.

### Quick answer

Open Feed > News, search or browse current items, then open the feed report.

### Steps

  1. Open Feed.
  2. Select News.
  3. Enter query or browse results.
  4. Apply filters if needed.
  5. Open a report.
  6. Review structured detail and raw data where available.

### Troubleshooting

If feed is too broad, use date range and content filters.

## Actors And Malware

### Overview

APT intelligence, malware-family reports, compromised actor records, actor names, campaigns, malware families, TTP context, victim and region metadata, actor detail reports, malware detail reports, APT filters, malware filters, country filters, source filters, tag filters, and investigation pivots from actor or malware result cards.

**Search terms:** actors and malware, APT intel, threat actor, malware family, actor report, malware report, compromised actors, campaign intelligence.

### Navigation

sidebar > Actors & Malware or `/dashboard/apt-intel/all`.

### Quick answer

Open Actors & Malware, search the actor, campaign, malware family, or keyword, choose APT/Malware/Compromised-Actors when needed, then open the matching report.

### Steps

  1. Open Actors & Malware.
  2. Choose All, APT, Malware, or Compromised-Actors.
  3. Enter actor, malware, campaign, sector, country, or keyword.
  4. Apply filters such as country, source, family, attacker, team, platform, tags, or date range.
  5. Run the search.
  6. Open an actor or malware report.
  7. Review entities, metadata, evidence, and export options.

### Troubleshooting

Actor and malware names can have aliases. Broaden the query or switch between APT, Malware, and Compromised-Actors when a name does not appear in the expected tab.

## Stealer Logs

### Overview

Infostealer-derived credential records, stolen password rows, credential logs, domain searches, username searches, IP address searches, channel searches, file name searches, email searches, credit card searches, advanced WHERE builder rows, AND/OR conditions, expandable assets, recent log filters, and stealer exports.

**Search terms:** stealer logs, stealerlog, stolen credentials, infostealer, leaked password, credential logs, stealer IOC.

### Navigation

sidebar > Stealer Logs > IOCs or `/dashboard/stealerlogs/iocs`.

### Quick answer

Open Stealer Logs > IOCs, select a tag or advanced filters, enter the value, execute search, expand rows, and apply Date Range for recent-only results.

### Steps

  1. Open Stealer Logs > IOCs.
  2. Choose basic tag such as Email, Domain, Username, IP Address, File Name, Channel, or Credit Card.
  3. Enter the value.
  4. Execute search.
  5. Expand rows for detailed credential/log fields.
  6. Apply Date Range when needed.
  7. Use export/download if available.
  8. Use advanced builder for multiple conditions.

### Troubleshooting

Older logs appear when Date Range is inactive. Stealer Logs is subscription/license gated. Full credential-log review supports stricter filtering than preview surfaces.

## Consolidated Workspace

### Overview

Cross-module triage, IOC rows, Deep Search, Network Intelligence pivots, grouped result sections, Social groups, Tracking groups, News groups, Leak groups, Stealers groups, Threats groups, insight panels, scanner shortcuts, expandable IOC rows, and broad query comparison.

**Search terms:** consolidated, deep search, IOC tab, network intelligence tab, cross-module search, grouped results, threats table.

### Navigation

`/dashboard/consolidated/all` or `/dashboard/profile/consolidated/all`.

### Quick answer

Open Consolidated, choose IOCs/Deep Search/Network Intelligence, enter the query, then inspect grouped sections or expandable IOC rows.

### Steps

  1. Open Consolidated.
  2. Choose IOCs, Deep Search, or Network Intelligence.
  3. Enter query.
  4. Apply filters or search tools.
  5. Review grouped result sections.
  6. Expand IOC rows in Stealers or Threats.
  7. Open reports or run scanner pivots.
  8. Export IOC rows where available.

### Troubleshooting

One section can have results while another has none. Date filters can remove IOC rows. Invalid email/tag values can trigger validation or empty states.

## Directory

### Overview

Monitored source catalogs, crawled links, source URLs, onion sources, clearnet sources, source coverage lists, network layer, index type, content type, last update metadata, source pagination, source filters, and directory browsing.

**Search terms:** directory, links, monitored sources, source list, onion sources, clearnet sources, index type.

### Navigation

sidebar > Directory or `/dashboard/directory`.

### Quick answer

Open Directory, apply network/index/content/date filters, and review monitored source records.

### Steps

  1. Open Directory.
  2. Search or browse sources.
  3. Open Filter.
  4. Choose Network Type.
  5. Choose Index Type.
  6. Choose Content Type.
  7. Apply Date Range if needed.
  8. Use pagination/load more.

### Troubleshooting

Directory searches source metadata catalogs. Indexed intelligence modules search collected content.

## Entity API - Email Breach

### Overview

Live email exposure lookup, username exposure lookup, targeted breach lookup, one-value search, structured API output, exposure status, breach fields, downloadable lookup reports, and Search APIs email-breach results.

**Search terms:** email breach, email exposure, user email lookup, check email breach, breached email.

### Navigation

`/dashboard/api/email-breach`.

### Quick answer

Open Search APIs > Email Breach, enter username/email, select Search, then review exposure results.

### Steps

  1. Open Email Breach.
  2. Enter Username or Email.
  3. Select Search.
  4. Wait for success/loading to finish.
  5. Expand result rows/cards where available.
  6. Download report if needed.

### Troubleshooting

If Search is disabled, the input is missing or invalid. If success has little data, the source had limited matching exposure.

## Entity API - Social Scanner

### Overview

Live username lookup, handle search, account identifier search, social platform presence, public profile footprints, platform matches, social profile discovery, and quick social enrichment.

**Search terms:** social scanner, username lookup, check username, social profile lookup, platform presence.

### Navigation

`/dashboard/api/social-scanner`.

### Quick answer

Open Social Scanner, enter a username, search, and review platform/profile results.

### Steps

  1. Open Search APIs > Social Scanner.
  2. Enter Username.
  3. Select Search.
  4. Wait for result.
  5. Review returned platforms/profiles.
  6. Copy or pivot values into Social Intel if needed.

### Troubleshooting

Social Scanner is a direct platform-presence lookup. Relationship mapping, profile expansion, and leak pivots are handled in the dedicated social relationship workspace.

## Entity API - Wanted List

### Overview

Live wanted-person lookup, watchlist records, sanctions-style records, law-enforcement-style records, person name search, alias search, identity risk checks, and structured wanted-list API results.

**Search terms:** wanted list, wanted person, watchlist, sanctions, person alias, search person.

### Navigation

`/dashboard/api/wanted-list`.

### Quick answer

Open Wanted List, enter the person name or alias, search, and review matching wanted/watchlist records.

### Steps

  1. Open Wanted List.
  2. Enter Person Name or Alias.
  3. Select Search.
  4. Wait for result.
  5. Expand or inspect records.
  6. Download report if available.

### Troubleshooting

If no records appear, broaden the name/alias or verify spelling.

## Entity API - National Identity

### Overview

Licensed identity lookup, CNIC-style values, mobile number lookup, phone identity records, family-number style values, national identity datasets, sensitive identity results, and structured national-identity API output.

**Search terms:** national identity, CNIC, mobile number, phone identity, identity lookup.

### Navigation

`/dashboard/api/national-identity`.

### Quick answer

Open National Identity, enter CNIC or mobile number, search, and review identity records.

### Steps

  1. Open National Identity.
  2. Enter CNIC or Mobile Number.
  3. Select Search.
  4. Wait for result.
  5. Review returned fields.
  6. Download report if available.

### Troubleshooting

Invalid format can disable Search or return no result. Visibility depends on license and deployment.

## Entity API - Playstore Scanner

### Overview

Google Play URL lookup, Android package name lookup, Play Store package search, cracked app references, redistributed mobile apps, suspicious Play Store artifacts, package intelligence, and app exposure results.

**Search terms:** Playstore scanner, app scanner, package lookup, Play Store URL, cracked key app.

### Navigation

`/dashboard/api/playstore-scanner`.

### Quick answer

Open Playstore Scanner, enter package name or Play Store URL, search, and review app intelligence.

### Steps

  1. Open Playstore Scanner.
  2. Enter Package or Playstore URL.
  3. Select Search.
  4. Wait for result.
  5. Review fields and indicators.
  6. Download report if available.

### Troubleshooting

Play Store package/URL lookup works best with package identifiers and store links.

## Entity API - Software Scanner

### Overview

Software-title lookup, game-title lookup, cracked mirrors, pirated packages, suspicious software references, unofficial downloads, configured-source exposure, software exposure results, and structured software scanner output.

**Search terms:** software scanner, cracked software, software lookup, suspicious software, software exposure.

### Navigation

`/dashboard/api/software-scanner`.

### Quick answer

Open Software Scanner, enter software name, search, and review matching software intelligence.

### Steps

  1. Open Software Scanner.
  2. Enter Software Name.
  3. Select Search.
  4. Wait for result.
  5. Review returned fields.
  6. Download report if available.

### Troubleshooting

Broaden the software name or try alternate product names if no result appears.

## Entity API - Crypto Scanner

### Overview

Crypto wallet lookup, blockchain artifact lookup, wallet address search, transaction hash search, crypto risk context, balances, received totals, sent totals, transaction counts, TXID confirmations, block height, fees, inputs, outputs, wallet pivots, and transaction pivots.

**Search terms:** crypto scanner, wallet address, transaction hash, crypto risk, blockchain lookup, TXID.

### Navigation

`/dashboard/api/crypto-scanner`.

### Quick answer

Open Crypto Analysis, enter wallet address or transaction hash, search, and review address/transaction risk details.

### Steps

  1. Open Crypto Scanner.
  2. Enter wallet address or transaction hash.
  3. Select Search.
  4. Wait for result.
  5. Review balance, transactions, risk, or TX details.
  6. Copy or export values where available.

### Troubleshooting

Invalid address/hash format can return no result. Use Social Intel Wallet/Crypto entity if the value must appear on a graph.

## File Analysis And IOC Extraction

### Overview

File uploads, choose-file workflows, 30 MB file limits, IOC extraction, indicator grouping, file metadata, extracted fields, processing states, no-finding states, failure states, copying extracted values, and file-analysis downloads.

**Search terms:** file analysis, file scanner, upload file, IOC extraction, extract IOCs, file report.

### Navigation

`/dashboard/api/file-scanner`.

### Quick answer

Open File Analysis, choose a file, wait for processing, review extracted results, and download the report if needed.

### Steps

  1. Open File Analysis.
  2. Select Choose File.
  3. Upload the file.
  4. Wait for processing.
  5. Review extracted fields and indicators.
  6. Copy values as needed.
  7. Download report or upload another file.

### Troubleshooting

If processing fails, use Try Again and verify file type/size. Empty findings can indicate limited extractable IOC content.

## Text Analysis

### Overview

Pasted text inspection, email body review, chat message review, short snippet analysis, URL list analysis, spam detection, phishing detection, malicious URL checks, unsafe indicators, URL reputation rows, confidence values, and final text verdicts.

**Search terms:** text analysis, analyze text, phishing text, spam text, malicious URL, URL reputation.

### Navigation

`/dashboard/api/text-analysis`.

### Quick answer

Open Text Analysis, paste the text, select Analyze Text, and review spam verdict and URL reputation.

### Steps

  1. Open Text Analysis.
  2. Paste text into the textarea.
  3. Keep within 5000 characters.
  4. Select Analyze Text.
  5. Review verdict, confidence, URLs, unsafe URLs, and rows.
  6. Copy or use results for investigation.

### Troubleshooting

If Analyze is disabled, text is missing or invalid. Long content should be shortened or uploaded as a file if supported.

## Web Scans And APK Analysis

### Overview

Network Scan, Repository Scan, SEO Scan, APK Scan upload, APK file upload, scan report generation, security posture grades, findings, severities, confidence values, proof blocks, code blocks, target URL input, domain input, repository input, Android package uploads, print actions, and report downloads.

**Search terms:** web scan, network scan, repository scan, SEO scan, APK scan, security posture, scan report.

### Navigation

`/dashboard/scanner/network-scan`, `/dashboard/scanner/repository-scan`, `/dashboard/scanner/seo-scan`, `/dashboard/scanner/apk-scan`.

### Quick answer

Open the scan type, enter or upload the target, run the scan, wait for completion, then review and export the report.

### Steps

  1. Open Web Scans.
  2. Choose Network Scan, Repository Scan, SEO Scan, or APK Scan.
  3. Enter domain, URL, repository, IP-like target, or upload APK.
  4. Select Search/Scan.
  5. Wait for processing.
  6. Review security posture and findings.
  7. Download or print report.

### Troubleshooting

If scan fails, verify target format, reachability, license access, and network availability. Wait for completion before exporting.

## Network Intel

### Overview

Live infrastructure reconnaissance, Host Recon, IP Scan, Vulnerability Scan, scan-depth controls, vulnerability target selection, completed vulnerability result cards, severity summaries, scanned URL metadata, request evidence, Geo Fencing, Geo IoT, domain-to-IP resolution, host details, exposed-device discovery, geographic IP range scanning, scan status, expandable DNS/IP/vulnerability rows, geo radius input, and network report downloads.

**Search terms:** network intel, NETINT, host recon, IP scan, vulnerability scan, scan depth, vulnerability depth, geo fencing, geo IoT, resolve IP.

### Navigation

`/dashboard/netint` or `/dashboard/scanner/network-scan`.

### Quick answer

Open Network Intel, choose the tab, enter the required target, run the scan, expand results, and download the report when available.

### Steps

  1. Open Network Intel.
  2. Choose Host Recon, IP Scan, Vulnerability Scan, or Geo Fencing.
  3. Enter host/domain/IP/URL or open Geo modal.
  4. For Vulnerability Scan, choose the visible scan depth before opening the target result.
  5. For Geo manual mode, enter coordinates, radius, and max IPs.
  6. Start the scan.
  7. Expand DNS/IP/vulnerability rows or open the vulnerability target.
  8. Download report after completion.
  9. Cancel while scanning if needed.

### Troubleshooting

If a domain resolves to multiple IPs, inspect each row. If download is disabled, run a scan first or wait for completion. Vulnerability detail is available only after the target scan completes.

## CTI Graph

### Overview

Threat-intelligence relationship visualization, clusters, documents, properties, group nodes, edges, graph sessions, CTI filters, advanced graph builder, graph view, list view, physics toggle, node search, context menus, maximum nodes, maximum depth, export modal, current-session export, CTI report export, and relationship exploration.

**Search terms:** CTI graph, threat graph, cluster graph, document graph, property graph, advanced graph builder, graph export, graph sessions.

### Navigation

`/dashboard/ctigraph`.

### Quick answer

Open CTI Graph, set filters, apply them, inspect graph/list view, and export session or CTI report if needed.

### Steps

  1. Open CTI Graph.
  2. Create or select a session.
  3. Choose Type: cluster, document, or property.
  4. Fill cluster type, document ID, or property value where required.
  5. Set maximum nodes and depth.
  6. Select Apply.
  7. Use graph search, graph/list toggle, physics toggle, context menu, or advanced builder controls.
  8. Open the export modal and export Current Session or CTI Report.

### Troubleshooting

If graph is empty, adjust filters or use a more specific document/property. If graph is slow, reduce node/depth limits.

## Social Intel Overview

### Overview

Live social graph mapping, username scans, image-based profile discovery, profile mapping, scan history, sessions, graph view, list view, exports, imports, profile popups, followers, following, relationships, context menus, and scan status cards.

**Search terms:** Social Intel, social mapper, social graph, username scan, image search, profile mapping, graph/list view.

### Navigation

`/dashboard/social-intel` or `/dashboard/social-graph`; `/dashboard/social-mapper` redirects to Social Intel.

### Quick answer

Open Social Intel, scan a username or upload an image, manage discovered profiles, add profiles/entities to graph, and inspect relationships in graph or list view.

### Steps

  1. Open Social Intel.
  2. Enter username and select Scan, or upload an image.
  3. Watch Scan History for status.
  4. Open Manage Profiles if candidates appear.
  5. Select profiles and update graph.
  6. Switch graph/list view as needed.
  7. Open profile summary or metadata popups.
  8. Export report/session when needed.

### Troubleshooting

Graph search filters loaded graph content. If image upload returns empty candidates, try a clearer profile image or username scan.

## Social Intel Entities

### Overview

Custom graph nodes, manual entities, API-mode entities, entity lookup pivots, email nodes, domain nodes, wallet nodes, phone nodes, breach nodes, social scanner nodes, wanted-list nodes, national-identity nodes, software/app nodes, DNS nodes, Wayback nodes, IOC nodes, APK nodes, crypto nodes, entity cards, progress states, On Graph status, delete controls, and graph focus actions.

**Search terms:** Social Intel entities, custom entity, add entity, manual entity, API entity, graph node, active entities.

### Navigation

Social Intel > Entity Manager / Add Entity.

### Quick answer

Open Add Entity, choose API or Manual mode, choose entity type, enter value/query and optional label, submit, then add or focus the entity on the graph.

### Steps

  1. Open Social Intel.
  2. Open Entity Manager or Add Entity.
  3. Choose API mode or Manual mode.
  4. Select entity type.
  5. Enter value/API query.
  6. Add optional label.
  7. Submit.
  8. Click saved entity to add/focus it on graph.

### Troubleshooting

Manual entities usually have no report data. API entities can fail if input format, license, or provider/source availability is invalid.

## Social Intel Profile Summary And Stealer-Log Pivot

### Overview

Profile summary panels, loaded-platform profile details, posts, images, metadata, profile connections, Fetch Profile Leaks, profile leak intelligence, Email Breach Results, Stealer Log Results preview, copied profile values, and profile-based leak pivots.

**Search terms:** see stealerlog in Social Intel, profile leaks, Fetch Profile Leaks, profile summary, Email Breach Results, Stealer Log Results.

### Navigation

Social Intel > profile summary popup > All Platforms Summary > Fetch Profile Leaks.

### Quick answer

Scan or load a profile, open profile summary, select Fetch Profile Leaks, then review Profile Leak Intelligence for Email Breach Results and Stealer Log Results.

### Steps

  1. Open Social Intel.
  2. Scan or load a profile with username/email.
  3. Open profile summary from graph or list view.
  4. In All Platforms Summary, select Fetch Profile Leaks.
  5. Review Email Breach Results.
  6. Review Stealer Log Results.
  7. Copy values if needed.
  8. Open Stealer Logs > IOCs for full search/date filtering.

### Troubleshooting

Fetch Profile Leaks cannot run without a username/email. If no response appears, the pivot ran but no leak/stealer data matched.

## Social Intel Followers, Following, Relationships, And Context Menu

### Overview

Social followers graph, following graph, account relationship expansion, follower fetches, following fetches, posts, images, metadata, follower popups, following tabs, connection tabs, related account scans, relationship nodes, relationship details, aliases, clearing connections, delete profile actions, remove node actions, and right-click graph context menus.

**Search terms:** followers, following, social relationships, relationship popup, set alias, delete profile, clear connections, context menu.

### Navigation

Social Intel > profile summary/list row/graph node/context menu.

### Quick answer

Open a profile or relationship node, fetch followers/following/posts/images/metadata as needed, then inspect or add related accounts to graph.

### Steps

  1. Open Social Intel graph or list view.
  2. Open profile summary or follower popup.
  3. Select Followers or Following.
  4. Fetch data when needed.
  5. Filter long lists.
  6. Select accounts to scan.
  7. Add resulting accounts to graph.
  8. Right-click nodes for alias/delete/relationship actions.

### Troubleshooting

Buttons can be disabled during active fetches, after completed data loads, or on platforms with limited relationship actions.

## AI Workspace And Report Chat

### Overview

Orion in-app chat, Profile AI, Nexus chat, report chat widgets, chat prompts, quick prompts, streamed responses, saved chat history, stream recovery, retry after interrupted streams, new conversations, cancel request controls, copy actions, edit-and-resend user messages, markdown responses, token limits, shared chat links, public read-only chat transcripts, AI visibility, and system-setting controlled chat access.

**Search terms:** AI workspace, Nexus chat, report chat, ask AI, chatbot, cancel chat, share response, shared chat, chat history, retry AI response.

### Navigation

`/dashboard/profile/ai`, `/chat-share/:shareId`, report chat panel, chat widget.

### Quick answer

Open Profile > AI or the visible report chat widget, type the question, send it, and wait for the streamed response. Use Share to create a tokenized read-only transcript when sharing is enabled.

### Steps

  1. Open Profile > AI or a report chat widget.
  2. Start a new chat if needed, or let saved history load.
  3. Type a prompt or choose a quick prompt.
  4. Send with Enter or the send button; use Shift+Enter for a new line.
  5. Wait for streaming response and status text.
  6. Cancel if needed.
  7. Copy responses, edit a user message, or retry from a recoverable error state.
  8. Select Share to create a tokenized read-only shared chat link.

### Troubleshooting

If AI is missing, check system setting, license, and deployment configuration. If a page reload leaves a user message without a Nexus answer, the workspace attempts recovery; retry only when the UI exposes retry context. Shared chat links show only the included transcript and do not grant dashboard access.

## Tenant Homepage, Alerts, And Notifications

### Overview

Tenant risk summaries, category alert cards, notification sidebar entries, IOC matches, alert detail drawers, alert detail reports, alert scanner settings, scan-all actions, scheduled alert scan configuration, flush actions, delete actions, mark-seen actions, custom alert modal, alert pivots, old alert date filtering, alert exports, alert prints, scanner pivots, API pivots, Stealer Log pivots, and admin tenant-alert review from case-management workflows.

**Search terms:** alerts, tenant homepage, alert summary, notification bell, notification sidebar, category alert, export alert, old alerts, alert scan, alert scanner settings.

### Navigation

`/dashboard/profile/homepage`, `/dashboard/profile/alerts/:type`, `/dashboard/profile/alert-scanners`, notification bell.

### Quick answer

Open Profile > Homepage, select an alert category or notification, review details, then export/print, pivot to the matching module, or adjust alert scanner settings if the role allows it.

### Steps

  1. Open Profile > Homepage.
  2. Review alert summaries and risk cards.
  3. Select a category card or notification.
  4. Open matching alert details.
  5. Apply Date Range if old alerts appear.
  6. Export or print the alert report.
  7. Mark seen, delete, flush, or run alert scan if allowed.
  8. Open Alert Scanner Settings to enable or disable future alert categories.

### Troubleshooting

Alerts depend on monitored IOCs, allowed scanner categories, and scan cycles. If old alerts show, apply Date Range. New IOCs can require the next scheduled or manual scan before alerts appear. Disabled alert scanner categories affect future scanning and visibility, not existing stored data.

## Take Down And Takedown Requests

### Overview

Compromise-report takedown initiation, defacement target URL review, public abuse-contact evidence capture, manual target URL submission, root-admin takedown queue, abuse email review, pending requests, accepted requests, denied requests, failed requests, rejection reasons, takedown email dispatch, duplicate target-domain prevention, and report status labels.

**Search terms:** take down, takedown, initiate takedown, report takedown, abuse email, takedown request, takedown in progress, takedown reported, reject takedown.

### Navigation

Compromise Monitoring or Defacement report > Initiate Takedown; `/dashboard/profile/take-down` or Profile > Takedown Requests.

### Quick answer

To request takedown action, open an eligible defacement report and select Initiate Takedown, or have a root administrator open Profile > Takedown Requests and use Report Takedown with a target URL. Root administrators review the saved evidence, then accept to dispatch the abuse email or reject with a reason.

### Steps

  1. Open a Compromise Monitoring or Defacement report with a target URL.
  2. Select Initiate Takedown.
  3. Wait while Orion captures abuse-contact evidence.
  4. Confirm the modal shows the captured abuse email and saved review entry.
  5. Root administrator opens `/dashboard/profile/take-down`.
  6. Search or filter by date range and status.
  7. Select Accept to dispatch the takedown email, or Reject and enter a reason.
  8. Reopen the source report to see Takedown in progress, Takedown reported, Takedown denied, or Takedown failed.

### Troubleshooting

If the button is missing, check defacement-module access, role, and whether the report has a target URL and report ID. If no public abuse contact is found, no request is saved. The review page is visible only to root-tenant administrators; non-root users can create eligible requests but cannot approve or deny them.

## Custom Alert Creation

### Overview

Manually created monitored alerts, custom alert modal, alert status, alert type, alert title, alert description, IOC type, alert source, alert URL, IOC value, content type, risk, custom indicator tracking, Add Alert form fields, saved alert records, alert update actions, and alert delete actions.

**Search terms:** custom alert, add alert, create alert, alert IOC, monitor custom IOC.

### Navigation

`/dashboard/profile/addcustomalert` or Profile > Homepage > Add Alert.

### Quick answer

Open Add Custom Alert, fill type/status/title/description/source/URL and one IOC bucket, then save.

### Steps

  1. Open Profile > Homepage.
  2. Select Add Alert.
  3. Enter Title.
  4. Enter Description.
  5. Choose Alert Type and IOC Type.
  6. Enter Source.
  7. Enter URL if needed.
  8. Enter IOC value.
  9. Save alert.

### Troubleshooting

If alert creation is unavailable, check role, active status, maintainer/tenant settings, alert scanner visibility, and required fields. URLs must use `http://` or `https://` where validation is enforced.

## Manage Tenant IOCs

### Overview

Tenant-level monitored indicators, IOC categories, IOC values, IOC chips, added indicator entries, remove indicator actions, clear category actions, saved monitored values, onboarding IOC setup, alert matching values, and tenant alert scan dependencies.

**Search terms:** add IOC, tenant IOC, monitored IOC, remove IOC, IOC categories, alert monitoring values.

### Navigation

`/dashboard/profile/ioc`.

### Quick answer

Open Profile > IOC, select an IOC category, type a value, add it, confirm it appears, and save/update where required.

### Steps

  1. Open Profile > IOC.
  2. Search/select IOC category.
  3. Type the value.
  4. Press Enter or Add.
  5. Confirm it appears under added IOCs.
  6. Remove wrong values by chip/delete control.
  7. Use Clear All only intentionally.
  8. Save/update if required.

### Troubleshooting

New IOCs can require matching data and the next scan cycle before alerts appear.

## Account Settings

### Overview

Signed-in user preferences, avatar upload, avatar delete, theme preference, 2FA preference, password preference, profile visibility, user metadata, public profile access from comments, and personal account page updates.

**Search terms:** account settings, avatar, profile image, theme, 2FA, password preferences, profile visibility.

### Navigation

`/dashboard/profile/account`.

### Quick answer

Open Profile > Account, edit the available user fields/preferences, upload or delete avatar if needed, and save changes.

### Steps

  1. Open Profile > Account.
  2. Edit visible profile preferences.
  3. Upload avatar if needed.
  4. Delete avatar if needed.
  5. Toggle theme/profile visibility where available.
  6. Save or let setting auto-apply depending on control.

### Troubleshooting

If public profile remains hidden, check both user profile visibility and tenant profile visibility setting.

## Tenant Settings

### Overview

Current-tenant profile configuration, tenant logo, tenant image, tenant overview, assigned licenses, quota, phone, country, city, state, tenant profile visibility, tenant alert webhook connections, Event Management toggle, editable tenant fields, read-only tenant fields, and maintainer/member tenant settings.

**Search terms:** tenant settings, tenant logo, tenant data, user profile visibility, event management toggle, tenant quota, alert webhook, Slack webhook, Jira webhook.

### Navigation

`/dashboard/profile/tenant-settings`.

### Quick answer

Open Profile > Tenant Settings, edit allowed tenant fields/toggles, upload logo if needed, and save.

### Steps

  1. Open Profile > Tenant Settings.
  2. Review tenant overview, licenses, quota, and location.
  3. Toggle edit if available.
  4. Update phone/country/city/state where allowed.
  5. Upload or delete tenant logo if needed.
  6. Connect or reconnect configured Slack/Jira alert webhooks where available.
  7. Toggle profile visibility or event management where available.
  8. Save changes.

### Troubleshooting

If fields are read-only or hidden, check role, license, free-only status, and tenant permissions.

## User Management And Create New User

### Overview

Tenant user administration, user list, Add User form, username suggestions, email, password, confirm password, forced password reset flag, role, status, subscription, licenses, module access, user disable actions, user delete actions, user update actions, account mail setup, SMTP setup, license-aware sidebar access, trial subscription banner, subscription upgrade modal, and subscription request notification.

**Search terms:** create new user, add user, user creation, Add User information, manage users, disable user, assign license, require password reset, trial banner, subscription upgrade.

### Navigation

`/dashboard/profile/users` or Profile > Users.

### Quick answer

Yes, Orion supports new user creation. Open Profile > Users, select Add User, fill the user information form, choose role/status/licenses, then select Add User.

### Steps

  1. Open Profile.
  2. Select Users.
  3. Select Add User.
  4. Enter Username.
  5. Enter Email.
  6. Enter Password.
  7. Enter Confirm Password.
  8. Choose Role.
  9. Choose Status.
  10. Select visible Licenses/module access.
  11. Set password-reset requirement if the user must change password on first login.
  12. Resolve validation errors.
  13. Select Add User.

### Troubleshooting

If Add User is disabled, configure Account Mail/SMTP fields in System Settings and confirm maintainer/tenant permissions. If username exists, use suggested alternatives. License assignment controls what sidebar groups the user can open. Limited users can see subscription prompts instead of module access, and near-expiry trial users can see a trial banner.

## Tenant Administration

### Overview

Admin-level tenant records, tenant lists, tenant profile views, tenant verification, tenant status, tenant quotas, assigned licenses, tenant image, tenant metadata, tenant users, tenant review, and admin tenant updates.

**Search terms:** tenant administration, view tenants, manage tenant, tenant profile, tenant status, tenant verification, tenant licenses.

### Navigation

`/dashboard/tenant/view-tenants`, `/dashboard/tenant/view-profiles`, `/dashboard/profile/tenant`.

### Quick answer

Open Tenant > View Tenants or Profile > Tenant, select the tenant, review details, and update allowed verification/status/license/quota fields.

### Steps

  1. Open Tenant menu.
  2. Select View Tenants or View Profiles.
  3. Search/select a tenant.
  4. Review tenant metadata, users, quotas, status, and licenses.
  5. Edit allowed fields.
  6. Save changes.

### Troubleshooting

If tenant screens are missing, check admin/maintainer role and license. Admin tenant management has broader controls than current-tenant settings.

## Audit Logs

### Overview

Application activity history, user actions, tenant actions, searches, scans, settings changes, administrative events, actors, usernames, timestamps, audit rows, audit date filters, audit exports, and audit delete permissions.

**Search terms:** audit logs, auditlog, user activity, actor search, delete audit, export audit.

### Navigation

`/dashboard/profile/auditlog` or `/dashboard/tenant/auditlog`.

### Quick answer

Open Audit Logs, search actor/username, apply Date Range, review rows, and export/delete if allowed.

### Steps

  1. Open Profile > Auditlog or Tenant > Auditlog.
  2. Search username/actor if needed.
  3. Open Filter.
  4. Apply Date Range.
  5. Review log rows.
  6. Expand details where available.
  7. Export or delete if allowed.

### Troubleshooting

If no logs appear, clear filters or widen date range. Delete is admin-only where enabled.

## Event Management

### Overview

Tenant-scoped SIEM search, raw log search, basic event query mode, advanced event filters, Event Date range, expandable event rows, raw event details, indicator fields, tenant log investigation, and Event Management visibility.

**Search terms:** event management, SIEM logs, event search, raw logs, event date, advanced event search.

### Navigation

`/dashboard/profile/event-management`.

### Quick answer

Open Event Management, enter a basic or advanced event query, apply Event Date if needed, run search, and expand event rows.

### Steps

  1. Open Profile > Event Management.
  2. Use Basic search or open Advanced search.
  3. Enter event query/filters.
  4. Apply Event Date.
  5. Run search.
  6. Review result count.
  7. Expand rows for raw details.

### Troubleshooting

If Event Management is hidden, check maintainer license, tenant setting, role, and active user status.

## Log Manager

### Overview

Admin-only operational log review, application log entries, INFO logs, WARNING logs, ERROR logs, log date filtering, log type filtering, source files, caller fields, message text, pagination, individual log file delete, flush all logs, confirmation prompts, and operational troubleshooting.

**Search terms:** log manager, system logs, application logs, error logs, warning logs, info logs, flush logs, delete log file.

### Navigation

`/dashboard/profile/log-manager` or Profile > Monitoring > Log Manager.

### Quick answer

Admins can open Monitoring > Log Manager, filter by type or date, review log entries, refresh, delete a log file, or flush all logs after confirmation.

### Steps

  1. Open Profile > Monitoring.
  2. Select Log Manager.
  3. Filter by log type if needed.
  4. Filter by available log date if needed.
  5. Review Type, Time, File, Message, and Source columns.
  6. Refresh when checking new operational output.
  7. Delete or flush logs only when operationally intended.

### Troubleshooting

Log Manager is for admins and operational troubleshooting, not analyst investigation. If it is hidden, check admin role and account status.

## Feeder Scripts

### Overview

Feeder-enabled tenant parser configuration, feeder rule catalog, Social Media rule groups, Defacement and other rule workspaces, feeder script viewing, feeder values, Add tab, View tab, Values tab, URL value upload, parser script upload, shared session upload, ownership dialogs, owner transfer, preview, search, sorting, pagination, enable status, disable status, clear all, value management, ingestion behavior, parsing behavior, and feeder license access.

**Search terms:** feeder, feeder scripts, parser upload, feeder values, feeder workspace, defacement feeder, enable feeder, disable feeder, owner dialog.

### Navigation

`/dashboard/profile/feeder`.

### Quick answer

Open Profile > Feeder, choose a rule, review scripts or values, add URL values or parser/session uploads, then enable, disable, clear, delete, or transfer ownership where permitted.

### Steps

  1. Open Profile > Feeder.
  2. Select the relevant rule from the catalog.
  3. Use View to inspect uploaded scripts or stored values.
  4. Use Add to upload a parser file, shared session ZIP, or newline-separated values when the rule supports it.
  5. Preview, search, sort, and paginate long script/value lists.
  6. Enable, disable, toggle, clear, delete, or transfer owner where allowed.
  7. Save or confirm the action.

### Troubleshooting

If Feeder is missing, check feeder license/module and tenant permission. Python parser uploads must use `.py`, shared session uploads must use `.zip`, and upload limits apply.

## Case Management

### Overview

Investigation case workspace, case list, filters, analytics, alerts mode, case creation, primary entity, related entities, artifacts, uploaded artifact files, artifact integrity verification, linked report artifacts, tasks, comments, linked cases, analyst assignment, tracking board, status movement reasons, closure, read-only closed cases, archive and unarchive, PDF export, tokenized public case shares, revoke shares, and admin tenant-alert review inside case workflows.

**Search terms:** case management, create case, case details, case filters, case analytics, case artifact, artifact integrity, linked report artifact, tracking board, move case, close case, archived cases, share case.

### Navigation

`/dashboard/profile/case-management`, `/dashboard/profile/case-management/tracking-board`, `/dashboard/profile/case-management/case-details?caseId=...`, `/case-share/:shareId`.

### Quick answer

Open Profile > Case Management, create or select a case, add entities/artifacts/tasks/comments, move the case through the tracking board with reasons, close it after resolution, then export, share, or archive where permitted.

### Steps

  1. Open Case Management.
  2. Use Case List filters or Analytics to find the case.
  3. Create a case with title, type, severity, priority, intake source, tags, and primary entity.
  4. Open Case Details.
  5. Add related entities, artifacts, linked reports, uploaded files, tasks, comments, linked cases, and analysts.
  6. Verify artifact file integrity when evidence must be checked.
  7. Move the case through Tracking Board statuses and enter a reason for each move.
  8. Close the case from the closure section after it reaches resolved.
  9. Export PDF, create/revoke public share links, or archive/unarchive where allowed.

### Troubleshooting

Case access depends on role and case-management permission. Analysts have narrower access than admins/maintainers. Closed and archived cases are read-only for update-style actions. Public case links are token scoped and do not grant dashboard access.

## System Settings

### Overview

Privileged app-wide configuration, branding images, logos, app name, language, data-source URLs, adversary URLs, pricing URLs, account mail, SMTP host, SMTP port, SMTP password, alert webhook OAuth credentials, AI toggle, documentation toggle, help toggle, whistle blowing toggle, network behavior toggles, login imagery, email-flow prerequisites, and system branding changes.

**Search terms:** system settings, SMTP settings, account mail, branding, app logo, AI toggle, documentation toggle, whistle blowing, pricing URL, alert webhook, Slack OAuth, Jira OAuth.

### Navigation

`/dashboard/profile/system-settings`.

### Quick answer

Open Profile > System Settings, select Edit, update required configuration/branding/mail fields, then Save.

### Steps

  1. Open Profile > System Settings.
  2. Select Edit.
  3. Update App Name, Language, URLs, logos, and login imagery as needed.
  4. Configure Account Mail.
  5. Configure Account Mail Password.
  6. Configure Account SMTP Server.
  7. Configure Account SMTP Port.
  8. Configure Slack/Jira alert webhook OAuth credentials if tenants will connect those providers.
  9. Save settings.

### Troubleshooting

If Add User or reset email is disabled/failing, confirm Account Mail and SMTP fields. If AI/docs/whistle links are hidden, check system toggles.

## Static Images And Branding

### Overview

Image resources, visual branding assets, system logos, login imagery, signup imagery, tenant logos, user avatars, dashboard graphics, graph sidebar images, report comment avatars, image uploads, image deletes, default image fallbacks, and cached branding refresh.

**Search terms:** logo, branding image, user avatar, tenant logo, system image, default image.

### Navigation

Account Settings, Tenant Settings, System Settings.

### Quick answer

Update user avatar in Account Settings, tenant logo in Tenant Settings, and global branding images in System Settings.

### Steps

  1. Open the relevant settings page.
  2. Select image picker/upload.
  3. Choose image.
  4. Confirm preview.
  5. Save or wait for upload success.
  6. Delete image to return to default if needed.

### Troubleshooting

If an image is missing, Orion uses default static image paths. Refresh if cached image remains after update.

## Public User Profile Activity

### Overview

Analyst profile pages, report comment avatars, profile links, public interaction history, recommended activity, trust activity, untrust activity, comment activity, report feedback comments, public metadata, hidden profiles, hidden profile sidebar state, open thread actions, user visibility settings, and tenant visibility settings.

**Search terms:** public profile, analyst profile, user activity, report activity, profile hidden, hidden profile, comment user, report feedback comments.

### Navigation

`/dashboard/profile/user/:user_id` or report comment user/avatar.

### Quick answer

Click a visible comment user/avatar or open the profile route to review public report activity.

### Steps

  1. Open a report with comments/feedback.
  2. Select the user name/avatar.
  3. Open profile if visible.
  4. Review recommendation, trust, untrust, and comment activity.
  5. Open an activity thread when the action is available.
  6. Return to report or dashboard.

### Troubleshooting

If the profile is hidden, the sidebar shows a hidden-profile state and the profile-open action is unavailable. Check both user profile visibility and tenant profile visibility settings.

## Support, Documentation, Onion Link, Links, And Whistle Blowing

### Overview

Help navigation, support modal, support email, support subject, support message, documentation link, onion access link, links directory, whistle-blowing link, reporting link, configured external resources, and visible support menu items.

**Search terms:** help, support, documentation, docs, onion link, links, whistle blowing, contact support.

### Navigation

sidebar/profile menu > Help & Support, Documentation, Onion Link, Links, Whistle Blowing.

### Quick answer

Open the relevant sidebar/profile support item; for Help & Support, fill email, subject, and message, then submit.

### Steps

  1. Open sidebar or profile menu.
  2. Select Help & Support or the external link item.
  3. For support, enter email.
  4. Enter subject.
  5. Enter message.
  6. Submit.
  7. For documentation/link items, follow the opened page.

### Troubleshooting

If a link is missing, check System Settings feature toggles and license.

## Subscription, Payment, Trial, And Locked Modules

### Overview

License access, paywalls, subscription upgrade modal, subscription request form, subscription request notification, payment gateway redirects, trial banners, remaining days, dimmed demo modules, free user restrictions, strategic search warnings, module unlock behavior, general license, breach license, defacement license, social license, exploit license, stealer logs license, scanning license, CTI graph license, social mapper license, feeder license, maintainer license, and enterprise license.

**Search terms:** subscription, payment, paywall, locked module, trial, license, cannot access module, module hidden.

### Navigation

locked module click, `/paymentGateway`, subscription prompt.

### Quick answer

If a module is locked, check the user's role/license, complete the subscription request flow if shown, or have an admin assign the required license before using it.

### Steps

  1. Try opening the module.
  2. Read the lock/paywall/subscription message.
  3. Check assigned licenses in tenant/user administration.
  4. Fill the subscription request modal if it appears.
  5. Confirm the subscription request notification.
  6. Admin assigns license/module access.
  7. Reload dashboard.

### Troubleshooting

Free/demo users have limited access. Enterprise generally unlocks the broadest module set.

## Error, Empty, Loading, Disabled, And Export States

### Overview

Shared UI state troubleshooting, empty query screens, loading states, searching states, no-result screens, failed scans, disabled submit buttons, disabled export buttons, pagination, export menus, print actions, download actions, STIX export, session export, delete confirmation, flush confirmation, and clear-all confirmation.

**Search terms:** empty state, no results, loading, disabled button, export, download, print, delete confirmation, scan failed.

### Navigation

any module with search, scan, report, graph, alert, or admin actions.

### Quick answer

Read the visible state, fix missing input/filters/access, wait for loading, or use the available export/download action after data exists.

### Steps

  1. Check whether a query/input is present.
  2. Check filters and date range.
  3. Wait for loading/scanning to finish.
  4. Expand rows or open reports if results exist.
  5. Use export/download/print when enabled.
  6. Confirm destructive actions only when intended.
  7. Reset filters if no results appear.

### Troubleshooting

Disabled export usually means completed data is missing. Disabled submit usually means missing input, invalid input, running scan, access restriction, or incomplete required settings.
