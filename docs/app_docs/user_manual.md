(orion-complete-documentation)=
# Orion Intelligence Platform
## Complete UX & Technical Documentation

:::{admonition} Scope
:class: tip

This document is the **single source of truth** for the Orion Intelligence platform.

It includes:
- ✅ Full **UX / User Manual**
- ✅ Full **Developer & System Documentation**
- ✅ Architecture, deployment, APIs, and tooling
- ✅ No missing sections
:::
---

# PART I — USER EXPERIENCE (UX)

## Introduction

Orion Intelligence is an advanced cyber‑threat intelligence and search platform designed for analysts,
security teams, and investigators. It aggregates, indexes, analyzes, and visualizes data from clearnet,
dark web, I2P, Telegram, forums, and multiple OSINT sources.

---

## Authentication & Access

- Restricted **Admin Panel**
- Role‑based access control
- Secure login with audit logging

---

## Homepage (Dashboard)

The homepage is the **central hub** of the platform.

### Key Areas
- Global search bar
- Sidebar navigation
- Analytics widgets
- General Index & Leaked Index

### Search Bar Capabilities
- Keyword search
- URL scan
- Advanced filters
- Boolean logic (OR / AND / Exact)
- Entity‑based filtering
- AI‑assisted summaries

---

## Sidebar Navigation (Modules)

1. Homepage  
2. General Intelligence  
3. Data Breach  
4. Defacement  
5. Social  
6. Live APIs  
7. Exploit  
8. Feed  
9. Data Dumps  
10. Stealer Logs  
11. CTI Graph  
12. Onion Link  
13. Links  
14. Documentation  

---

## General Intelligence

Aggregates intelligence across:
- Forums
- News
- Leaks
- Marketplaces
- Hacking
- Drugs
- Cryptocurrency
- Stolen Data

Supports unified or category‑specific analysis.

---

## Data Breach Module

Sub‑modules:
- Databases
- Emails
- Logs
- Warfare
- Cloud

Purpose:
- Identify exposed credentials
- Track breach sources
- Assess organizational risk

---

## Defacement Module

Tracks:
- Website hacks
- Phishing clones
- Database leaks

Includes:
- Attacker identity
- Timeline
- Server metadata
- Defaced URLs

---

## Social Intelligence

Monitors:
- Telegram
- Twitter (X)
- Reddit
- Forums

Use cases:
- Early threat signals
- Actor communications
- Leak announcements

---

## Live APIs

Real‑time investigation tools:
- Email lookups
- Breach verification
- Dynamic querying

---

## Exploit Intelligence

Includes:
- CVEs
- Exploit tools
- Zero‑day intelligence

Helps teams prioritize vulnerabilities based on risk.

---

## Feed

Real‑time cyber news feed:
- Breaches
- CVEs
- Threat actor activity
- Industry alerts

---

## Data Dumps

Tracks leaked datasets from:
- Telegram
- Dark web forums
- Leak platforms

Supports source‑based filtering.

---

## Stealer Logs

Displays:
- Domains
- Usernames
- Credential hashes
- Timestamps

Used for credential exposure analysis.

---

## CTI Graph

Graph‑based visualization of:
- Threat actors
- Malware
- TTPs
- IPs
- Domains
- Hashes

Supports:
- Cluster filtering
- Property searches
- MITRE ATT&CK mapping

---

## Filters & Analytics

### Analytics
- Keyword insights
- Coverage metrics
- Activity distribution

### Filters
- Network type (Onion / I2P / Clearnet)
- Date range
- MITRE TTP
- Safe search

---

## AI‑Powered Chatbot

- Context‑aware
- Explains reports
- Summarizes content
- Guides investigation

---

# PART II — DEVELOPER & SYSTEM DOCUMENTATION

## System Architecture

Core stack:
- Django (API & backend)
- Elasticsearch (search)
- MongoDB (storage)
- Redis (cache & queue)
- NGINX (proxy)
- Traefik (routing)
- Docker & Docker Compose

---

## Orion Search (Backend)

- REST APIs
- Cron jobs
- Indexing pipelines
- Scoring & enrichment

---

## Orion Crawler

Technologies:
- Python
- Celery
- TOR
- Redis
- MongoDB

Capabilities:
- Multi‑threaded crawling
- Onion & clearnet support
- Scalable worker model

---

## Orion Collector

Two modes:
1. Static (BeautifulSoup)
2. Dynamic (Selenium)

Requires:
- TOR Browser
- SOCKS5 proxy

---

## Orion Browser

- Android (Java)
- GeckoView
- Orbot integration
- Anonymous browsing

---

## Docker Services

- trusted‑web‑main
- trusted‑web‑elastic
- trusted‑web‑redis
- trustly‑web‑mongodb
- trusted‑crawler‑*
- TOR containers

---

## Deployment

```bash
git clone https://github.com/msmannan00/Orion-Search.git
cd Orion-Search
bash cronjobs.sh
```

---

## Monitoring & Tooling

### Dozzle
- Container logs
- System health

### Swagger
- API exploration
- Testing endpoints

### Flower
- Celery monitoring
- Worker diagnostics

---

## Security & Environment Control

Modes:
- Demo
- Production
- Maintenance

Controlled via environment variables.

---

## Final Notes

- Sidebar expansion requires multi‑file `toctree`
- This file is designed as **master documentation**
- Safe for Sphinx + Shibuya

---

**End of complete documentation**
