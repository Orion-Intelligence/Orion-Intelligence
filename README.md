<div align="center">
  <h1>
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="client/src/assets/images/sidebar/search_nav_logo.png">
      <source media="(prefers-color-scheme: light)" srcset="client/src/assets/images/shared/logo-wide-light.svg">
      <img src="client/src/assets/images/shared/logo-wide-light.svg" alt="Orion Intelligence" width="460">
    </picture>
  </h1>

  <h3>A unified investigation platform for OSINT and cyber intelligence.</h3>
  <p>Collect, search, enrich, correlate, visualize, and share intelligence from one analyst workspace.</p>

  <p>
    <a href="https://orion-search.readthedocs.io"><strong>Documentation</strong></a>
    &nbsp;·&nbsp;
    <a href="https://orion-search.readthedocs.io/en/latest/app_docs/user_manual.html"><strong>User guide</strong></a>
    &nbsp;·&nbsp;
    <a href="https://stats.uptimerobot.com/xV0BS3KMq7"><strong>Service status</strong></a>
  </p>

  <p>
    <a href="https://github.com/Orion-Intelligence/Orion-Intelligence/actions/workflows/build.yml"><img src="https://github.com/Orion-Intelligence/Orion-Intelligence/actions/workflows/build.yml/badge.svg?branch=trusted-main" alt="Build"></a>
    <a href="https://github.com/Orion-Intelligence/Orion-Intelligence/actions/workflows/test.yml"><img src="https://github.com/Orion-Intelligence/Orion-Intelligence/actions/workflows/test.yml/badge.svg?branch=trusted-main" alt="Tests"></a>
    <a href="https://stats.uptimerobot.com/xV0BS3KMq7"><img src="https://img.shields.io/uptimerobot/status/m802042352-33d9c489257791a41a505a06?label=web%20app&logo=googlechrome" alt="Web App"></a>
    <a href="https://stats.uptimerobot.com/xV0BS3KMq7"><img src="https://img.shields.io/uptimerobot/status/m802042420-50c04caf485479764330029b?label=docs&logo=readthedocs" alt="Docs"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-commercial%20EULA-2f81f7" alt="Commercial EULA"></a>
  </p>

  <p>
    <a href="https://app.codacy.com/gh/Orion-Intelligence/Orion-Intelligence/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade"><img src="https://app.codacy.com/project/badge/Grade/54342c0b3ffd4ae2ad9bcf701b2500f7" alt="Codacy Badge"></a>
    <a href="https://app.codacy.com/gh/Orion-Intelligence/Orion-Intelligence/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage"><img src="https://app.codacy.com/project/badge/Coverage/54342c0b3ffd4ae2ad9bcf701b2500f7" alt="Codacy Coverage"></a>
    <a href="https://github.com/Orion-Intelligence/Orion-Intelligence/actions/workflows/github-code-scanning/codeql"><img src="https://github.com/Orion-Intelligence/Orion-Intelligence/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL Analysis"></a>
    <a href="https://developer.mozilla.org/en-US/observatory/analyze?host=try.orionintelligence.org"><img src="https://img.shields.io/badge/observatory-A%2B-brightgreen" alt="MDN HTTP Observatory"></a>
    <a href="https://securityheaders.com/?q=https%3A%2F%2Ftry.orionintelligence.org%2F&followRedirects=on"><img src="https://img.shields.io/badge/security%20headers-A%2B-brightgreen" alt="Security Headers"></a>
    <a href="https://www.ssllabs.com/ssltest/analyze.html?d=try.orionintelligence.org&latest"><img src="https://img.shields.io/static/v1?label=SSLLabs&message=A%2B&color=brightgreen" alt="SSLLabs"></a>
    <a href="https://pagespeed.web.dev/analysis/https-orion-genesistechnologies-org/hfe5h3u485?form_factor=desktop"><img src="https://img.shields.io/badge/PageSpeed%20Insights-100%25-brightgreen" alt="PageSpeed Insights"></a>
    <a href="https://github.com/Orion-Intelligence/Orion-Intelligence/actions/workflows/build.yml"><img src="https://img.shields.io/badge/Lighthouse%20Performance-Run%20Artifacts-blue" alt="Lighthouse Performance"></a>
  </p>
</div>

---

## Overview

Orion Intelligence is a web-based platform that brings browser-assisted research, indexed search, crawling, data aggregation, enrichment, and analyst workflows into one operational environment. It is designed for investigations that need more than isolated lookup tools: analysts can move from discovery to correlation, reporting, case work, and controlled sharing without leaving the platform.

The wider Orion ecosystem adds specialized collectors, crawlers, social-intelligence services, AI assistance, and isolated workspace execution.

<table>
  <tr>
    <td width="50%" valign="top">
      <strong>OSINT analysts</strong><br><br>
      Discover, filter, enrich, and pivot across public-source intelligence.
    </td>
    <td width="50%" valign="top">
      <strong>Threat-intelligence teams</strong><br><br>
      Track breaches, actors, malware, infrastructure, exploits, and indicators.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>Investigators and researchers</strong><br><br>
      Build cases, connect entities, preserve artifacts, and produce reports.
    </td>
    <td width="50%" valign="top">
      <strong>Platform operators</strong><br><br>
      Manage tenants, users, licenses, audit activity, integrations, and system settings.
    </td>
  </tr>
</table>

### Explore Orion

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="#platform-preview"><strong>Platform preview →</strong></a><br><br>
      See the primary analyst surfaces.
    </td>
    <td width="50%" valign="top">
      <a href="#core-capabilities"><strong>Core capabilities →</strong></a><br><br>
      Understand what the platform provides.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="#orion-ecosystem"><strong>Orion ecosystem →</strong></a><br><br>
      Explore the connected Orion modules.
    </td>
    <td width="50%" valign="top">
      <a href="#security-licensing-and-responsible-use"><strong>Security, licensing, and responsible use →</strong></a><br><br>
      Review the project boundaries.
    </td>
  </tr>
</table>

---

## Platform Preview

The homepage is a search-first investigation workspace with intelligence summaries, recent activity, geographic context, and direct pivots into deeper workflows.

<p align="center">
  <a href="docs/screenshots/homepage-overview-20260326.png">
    <img src="docs/screenshots/homepage-overview-20260326.png" alt="Orion Intelligence homepage overview" width="1200">
  </a>
</p>

<details>
  <summary><strong>Explore more platform screens</strong></summary>
  <br>
  <table>
    <tr>
      <td align="center" valign="top"><a href="docs/screenshots/consolidated-insights-20260326.png"><img src="docs/screenshots/consolidated-insights-20260326.png" alt="Consolidated intelligence insights" width="300"></a><br><sub>Consolidated intelligence</sub></td>
      <td align="center" valign="top"><a href="docs/screenshots/cti-graph-20260326.png"><img src="docs/screenshots/cti-graph-20260326.png" alt="Cyber-threat intelligence graph" width="300"></a><br><sub>CTI graph analysis</sub></td>
      <td align="center" valign="top"><a href="docs/screenshots/social-intel-20260326.png"><img src="docs/screenshots/social-intel-20260326.png" alt="Social intelligence workspace" width="300"></a><br><sub>Social intelligence</sub></td>
    </tr>
    <tr>
      <td align="center" valign="top"><a href="docs/screenshots/case-management-view-20260326.png"><img src="docs/screenshots/case-management-view-20260326.png" alt="Case management workspace" width="300"></a><br><sub>Case management</sub></td>
      <td align="center" valign="top"><a href="docs/screenshots/satellite-map-overview-20260326.png"><img src="docs/screenshots/satellite-map-overview-20260326.png" alt="Satellite intelligence map" width="300"></a><br><sub>Satellite intelligence</sub></td>
      <td align="center" valign="top"><a href="docs/screenshots/network-intel-host-recon-20260326.png"><img src="docs/screenshots/network-intel-host-recon-20260326.png" alt="Network intelligence host reconnaissance" width="300"></a><br><sub>Network intelligence</sub></td>
    </tr>
    <tr>
      <td align="center" valign="top"><a href="docs/screenshots/chat-share-public-view-20260326.png"><img src="docs/screenshots/chat-share-public-view-20260326.png" alt="Public shared AI chat" width="300"></a><br><sub>Controlled chat sharing</sub></td>
      <td align="center" valign="top"><a href="docs/screenshots/tenant-administration-20260326.png"><img src="docs/screenshots/tenant-administration-20260326.png" alt="Tenant administration" width="300"></a><br><sub>Tenant administration</sub></td>
      <td align="center" valign="top"><a href="docs/screenshots/audit-logs-20260326.png"><img src="docs/screenshots/audit-logs-20260326.png" alt="Audit logs" width="300"></a><br><sub>Audit and oversight</sub></td>
    </tr>
  </table>
  <p align="center"><a href="docs/screenshots"><strong>Browse all documentation screenshots →</strong></a></p>
</details>

---

## Core Capabilities

<table>
  <tr>
    <td width="50%" valign="top">
      <strong>Unified search</strong><br><br>
      Search and filter indexed intelligence across breach, social, exploit, stealer-log, discussion, feed, and general-intelligence datasets.
    </td>
    <td width="50%" valign="top">
      <strong>Entity and network intelligence</strong><br><br>
      Run entity lookups, host reconnaissance, IP and DNS analysis, vulnerability scans, and file or text analysis.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>Correlation and visualization</strong><br><br>
      Explore CTI and social graphs, consolidated findings, geographic heatmaps, satellite intelligence, and related entities.
    </td>
    <td width="50%" valign="top">
      <strong>AI-assisted analysis</strong><br><br>
      Use Nexus chat and report assistance for summaries, triage, and investigation context, subject to deployment configuration.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>Case operations</strong><br><br>
      Create cases, preserve artifacts, track entities and tasks, move work through investigation stages, and produce reports.
    </td>
    <td width="50%" valign="top">
      <strong>Sharing and export</strong><br><br>
      Generate structured exports and token-scoped, read-only public views for selected cases and chats.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>Multi-tenant administration</strong><br><br>
      Manage tenants, users, licenses, feature access, branding, alerts, integrations, audit logs, and system settings.
    </td>
    <td width="50%" valign="top">
      <strong>Extensible collection</strong><br><br>
      Feed current data into Orion through crawlers, collectors, browser-assisted workflows, and adjacent Orion services.
    </td>
  </tr>
</table>

## How Orion Fits Together

```mermaid
flowchart LR
    A[Public and monitored sources] --> B[Crawlers, collectors, and browser workflows]
    B --> C[Processing, normalization, and enrichment]
    C --> D[(Search, document, cache, and graph services)]
    D --> E[Orion Intelligence platform]
    E --> F[Search and reports]
    E --> G[Graphs and geospatial analysis]
    E --> H[AI and case workflows]
    E --> I[Exports and controlled sharing]
```

Orion Intelligence is the primary analyst-facing platform. Collection, AI, sandboxing, and specialist processing are supplied by the connected modules listed in the [Orion ecosystem](#orion-ecosystem).

---

## Orion Ecosystem

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://github.com/Orion-Intelligence/Orion-Intelligence"><strong>Orion Intelligence</strong></a><br><br>
      Analyst-facing investigation platform and API layer.
    </td>
    <td width="50%" valign="top">
      <a href="https://github.com/Orion-Intelligence/Orion-Dark-Nexus"><strong>Orion Dark Nexus</strong></a><br><br>
      AI-assisted investigation, chat orchestration, and secure workspace management.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://github.com/Orion-Intelligence/Orion-Sandbox"><strong>Orion Sandbox</strong></a><br><br>
      Isolated execution infrastructure for untrusted workspace code.
    </td>
    <td width="50%" valign="top">
      <a href="https://github.com/Orion-Intelligence/Orion-Crawler"><strong>Orion Crawler</strong></a><br><br>
      Hidden-web and monitored-source crawling engine.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://github.com/Orion-Intelligence/Orion-Collector"><strong>Orion Collector</strong></a><br><br>
      Framework for collecting data from custom sources.
    </td>
    <td width="50%" valign="top">
      <a href="https://github.com/Orion-Intelligence/Orion-Micros"><strong>Orion Micros</strong></a><br><br>
      Supporting backend processing and service modules.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://github.com/Orion-Intelligence/Orion-Browser"><strong>Orion Browser</strong></a><br><br>
      Browser-assisted private collection workflows.
    </td>
    <td width="50%" valign="top">
      <a href="https://github.com/Orion-Intelligence/Orion-Social"><strong>Orion Social</strong></a><br><br>
      Social-intelligence collection and analysis services.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://github.com/Orion-Intelligence/Orion-Leaks"><strong>Orion Leaks</strong></a><br><br>
      Leak-focused ingestion and handling.
    </td>
    <td width="50%" valign="top">
      <a href="https://github.com/Orion-Intelligence/Orion-Tor2Web"><strong>Orion Tor2Web</strong></a><br><br>
      Tor-to-web access support.
    </td>
  </tr>
</table>

## Documentation

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://orion-search.readthedocs.io"><strong>Documentation home →</strong></a><br><br>
      Entry point for published Orion documentation.
    </td>
    <td width="50%" valign="top">
      <a href="https://orion-search.readthedocs.io/en/latest/app_docs/introduction_to_platform.html"><strong>Introduction →</strong></a><br><br>
      Product purpose and high-level concepts.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://orion-search.readthedocs.io/en/latest/app_docs/user_manual.html"><strong>User manual →</strong></a><br><br>
      Analyst-facing workflows and feature guidance.
    </td>
    <td width="50%" valign="top">
      <a href="https://orion-search.readthedocs.io/en/latest/app_docs/security_documentation.html"><strong>Security documentation →</strong></a><br><br>
      Security architecture and operational controls.
    </td>
  </tr>
</table>

---

## Security, Licensing, and Responsible Use

> [!IMPORTANT]
> This repository is distributed under the [Cybersage Technologies Commercial End-User License Agreement](LICENSE). It is not licensed under MIT.

> [!CAUTION]
> Report vulnerabilities through the process in [SECURITY.md](SECURITY.md); do not publish sensitive details in a public issue.

> [!NOTE]
> Orion is intended for authorized research, investigation, and defensive security work. Users are responsible for obtaining permission, protecting collected data, and complying with applicable law and policy.

Protect credentials, access tokens, private datasets, and customer information from unauthorized disclosure.

---

<div align="center">
  <a href="https://github.com/Orion-Intelligence/Orion-Intelligence"><strong>GitHub</strong></a>
  &nbsp;·&nbsp;
  <a href="https://orion-search.readthedocs.io"><strong>Documentation</strong></a>
  &nbsp;·&nbsp;
  <a href="https://stats.uptimerobot.com/xV0BS3KMq7"><strong>Status</strong></a>
  &nbsp;·&nbsp;
  <a href="https://www.orionintelligence.org/collaboration"><strong>Collaboration</strong></a>
</div>
