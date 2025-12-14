# Search: breach

## Description

Search breach / leak intelligence reports aggregated from ransomware blogs, extortion sites, leak forums, and darkweb data-dump portals; returns a paginated list of breach announcements and related metadata.

Request body (`search_leak_param_model`):
- **q** — free-text search term applied across title, content, location, industry, team name, domains, etc. (default: empty string)
- **category** — logical content bucket. `"all"` searches across consolidated leak indices; other values may restrict the search to specific collections such as `"leaks"`, `"tracking"`, or `"news"` depending on deployment (default: `"all"`). When `"all"`, the backend runs a consolidated ranked search over the core leak index.
- **page** — page number of the paginated result set (1-based; default: `1`).
- **safe** — safe-search toggle. When `true`, sensitive or graphic content is filtered or down-ranked; when `false`, all matching breach items are returned (frontend maps `"yes"/"no"` to this boolean).
- **network** — web layer filter; one of:
  - `"all"` — no restriction
  - `"clearnet"` — surface web sources
  - `"onion"` — Tor hidden services
  - `"i2p"` — I2P hidden services
- **matchtype** — logical operator for combining the main query and filters; usually `"or"` (default) or `"and"`.
- **daterange** — optional creation/ingestion date range for the leak document in `YYYY-MM-DD,YYYY-MM-DD` format; empty string means no date filter. This maps to `m_creation_date`.
- **content** — content-type key such as: `all`, `breach`, `credential`, `ransomware`, `phishing`, `scam`, `malware`, `infostealer`, `c2`, `ddos`, `exploit`, `leak`, `logs`, `vpn`, `carding`, `rat`, `keylogger`, `spyware`, `sqlinjection`, `xss`, `supplychain`, `insider`, `fraud`, `obfuscation`, `crack`, `cheats`, `cve`, `zero_day`, `rootkit`, `apt`, `threat_intel`, `darkweb`, `rce`, `lpe`, `exfiltration`, `persistence`, `reconnaissance`, `hack`, `news`, `credentials_common`, `war`
- **entity_filter** — IOC-style structured filter map of `field_name → [values]`. This allows precise filtering on specific leak attributes. Example valid payload:
```json
{
  "entity_filter": {
    "m_country": ["Germany"],
    "m_team": ["BROTHERHOOD"],
    "m_industry": ["Electricity, Oil & Gas"],
    "m_network": ["onion"],
    "m_domain": ["ib-laudi.de"]
  }
}
```
Commonly supported fields include (but are not limited to):
- `m_country` — affected country or countries
- `m_location` — free-text or structured location
- `m_team` — ransomware / leak group name (for example `"BROTHERHOOD"`)
- `m_industry` — victim industry vertical (for example `"Agricultural Sector"`, `"Electricity, Oil & Gas"`, `"Jewelry & Watch Retail"`)
- `m_domain` — victim or leak domains
- `m_network` — network type (`"clearnet"`, `"onion"`, `"i2p"`)
- `m_content_type` or `content_type` — internal classification tags (for example `"leaks"`, `"ransomware"`, `"darkweb"`)
- `m_language` — language codes (for example `"en"`)
- `m_person` — people or organisation names extracted from the leak
- `m_scrap_file` — scraper/source identifier
- any other indexed IOC-style fields exposed by the underlying leak index.

Minimal example request:
```json
{
  "q": "Germany energy sector",
  "category": "all",
  "page": 1,
  "network": "onion",
  "safe": true,
  "daterange": "2025-11-20,2025-12-05",
  "entity_filter": {
    "m_country": ["Germany"],
    "m_team": ["BROTHERHOOD"]
  },
  "matchtype": "or"
}
```

## Response

Breach/leak search results as a JSON object describing matching breach announcements and data-dump entries.

Top-level response keys:
- **Result** — list of breach/leak report objects
- **Suggestions** — optional list of suggested queries or corrections (may be omitted or empty depending on backend implementation)
- **Page_Count** — number of pages for the current query and filters (may be fractional depending on scoring and backend pagination strategy)

Each entry in **Result** typically contains a subset of the following fields:
- **m_title** — title of the leak/announcement (for example `"Ingenieurbüro Laudi"`, `"Ninas Jewellery"`)
- **m_url** — primary URL of the leak page (often the group’s onion site landing page)
- **m_base_url** — base/source URL of the leak site
- **m_network** — network type such as `onion`, `clearnet`, or `i2p`
- **m_content** — full leak description or structured summary including organisation, country, data size, and embedded links
- **m_important_content** — condensed or highlighted version of `m_content` optimised for summarisation/search
- **m_content_type** — high-level classification tags, commonly including `"leaks"` and potentially other internal tags
- **m_industry** — victim’s industry vertical (for example `"Agricultural Sector"`, `"Electricity, Oil & Gas"`, `"Jewelry & Watch Retail"`)
- **m_location** — list of locations/regions attached to the victim
- **m_country** — list of affected countries (for example `["Germany"]`, `["Australia"]`)
- **m_team** — ransomware / leak group name (for example `"BROTHERHOOD"`)
- **m_websites** — list of victim websites (for example `"https://www.ib-laudi.de/"`)
- **m_logo_or_images** — list of logo / screenshot URLs hosted on the leak site
- **m_dumplink** — list of direct links to leaked files (documents, spreadsheets, images, etc.)
- **m_person** — people or organisation names extracted from the dump, when available
- **m_language** — language(s) of the leak content (for example `["en"]`)
- **m_domain** — list of domains associated with the leak (victim domain and/or leak portal domain)
- **m_scrap_file** — internal scraper identifier for the leak source
- **m_hash** — stable internal hash identifier for the leak record used for deduplication
- **m_update_date** — last update timestamp of the leak record
- **m_creation_date** — first time the leak record was ingested
- **rank_index** — internal ranking/index identifier (for example `"leak_model"`)
- **_score** — search-engine relevance score
- **_rank** — rank position of the document in the current result set
- **m_embedding** — optional internal embedding vector used for semantic search (large numeric array; primarily for internal use and usually not required by clients)

Example response:
```json
{
  "Result": [
    {
      "m_title": "Announcement",
      "m_url": "http://brohoodyaifh2ptccph5zfljyajjabwjjo4lg6gfp4xb6ynw5w7ml6id.onion/",
      "m_screenshot": "45422919581257033639454756554585",
      "m_base_url": "http://brohoodyaifh2ptccph5zfljyajjabwjjo4lg6gfp4xb6ynw5w7ml6id.onion/",
      "m_content": "Title: Announcement\nOrganization: Agricultural Sector\nCountry: Germany\n...",
      "m_important_content": "Title: Announcement\nOrganization: Agricultural Sector\nCountry: Germany\n...",
      "m_network": "onion",
      "m_content_type": ["leaks"],
      "m_industry": "Agricultural Sector",
      "m_logo_or_images": ["http://.../images/announcement/logo.png"],
      "m_location": ["Germany"],
      "m_team": "BROTHERHOOD",
      "m_country": ["Germany"],
      "m_domain": ["brohoodyaifh2ptccph5zfljyajjabwjjo4lg6gfp4xb6ynw5w7ml6id.onion"],
      "m_scrap_file": "_brohoodyaifh2ptccph5zfljyajjabwjjo4lg6gfp4xb6ynw5w7ml6id",
      "m_hash": "ca1c7476db86b66c05773f62b85ea5ab0042cd356744ad189f218d16b29db344",
      "m_update_date": "2025-12-03T19:13:20.077156+00:00",
      "m_creation_date": "2025-12-03T19:13:20.077203+00:00",
      "rank_index": "leak_model",
      "_score": 0.2,
      "_rank": 1
    },
    {
      "m_title": "Ingenieurbüro Laudi",
      "m_url": "http://brohoodyaifh2ptccph5zfljyajjabwjjo4lg6gfp4xb6ynw5w7ml6id.onion/",
      "m_network": "onion",
      "m_content_type": ["leaks"],
      "m_industry": "Electricity, Oil & Gas",
      "m_websites": ["https://www.ib-laudi.de/"],
      "m_location": ["Germany"],
      "m_team": "BROTHERHOOD",
      "m_country": ["Germany"],
      "m_dumplink": ["http://.../files/230629 Berechnung Raumluftmengen LPH4.xlsx", "..."]
    }
  ],
  "Page_Count": 1
}
```


Additionally, the response may include automatically extracted indicators of compromise (IOCs). Only indicators that are actually found in the underlying content are returned; IOC fields with no data are omitted from the response.

Supported IOC / enrichment fields:
- **m_phone_number** — Phone Numbers
- **m_email** — Emails
- **m_domain** — Domains
- **m_country** — Country
- **m_url** — URLs
- **m_cve** — CVE & CWE
- **m_ip** — IP Addresses
- **m_yara_rule** — YARA Rules
- **m_encoded_urls** — Encoded URLs
- **m_file_paths** — File Paths
- **m_credit_card** — Credit Cards
- **m_org** — Organizations
- **m_company_name** — Company Names
- **m_person** — Persons
- **m_location** — Locations
- **m_language** — Languages
- **m_user_agents** — User Agents
- **m_asns** — ASNs
- **m_team** — Teams
- **m_hashtag** — Hashtags
- **m_mention** — Mentions
- **m_social_media_profiles** — Social Media Profiles
- **m_currencies** — Currencies
- **m_crypto_address** — Crypto Addresses
- **m_xmpp_addresses** — XMPP Addresses
- **m_enterprise_attack_tactics** — Enterprise ATT&CK Tactics
- **m_enterprise_attack_techniques** — Enterprise ATT&CK Techniques
- **m_document_id** — Document IDs
- **m_au_abn** — Australian IDs
- **m_us_passport** — US IDs
- **m_us_bank_number** — US Bank Numbers
- **m_platform** — Platform
- **m_author** — Author
- **m_industry** — Industry
- **m_scrap_file** — Scrap Script
