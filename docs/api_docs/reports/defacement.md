# Report: defacement

## Description

Search defacement intelligence reports for hacked or phishing websites; returns a paginated list of defacement events and their metadata.

Request body (`search_defacement_param_model`):
- **q** — free-text search over URL, IP, team, attacker handle and content fields (default: empty string)
- **category** — optional category filter (default `all`)
- **page** — page number of the paginated result set (1-based)
- **network** — one of: `all`, `clearnet`, `onion`, `i2p` (default `all`)
- **daterange** — optional leak/observation date range in `YYYY-MM-DD,YYYY-MM-DD` format; empty string means no date filter
- **attacker** — attacker nick/handle to match against `m_attacker`
- **team** — defacement crew or group name to match against `m_team`
- **content** — optional content/type string (for example an IOC/incident label) depending on configuration
- **must** — when `true`, values in `entity_filter` are treated as mandatory (must) filters
- **matchtype** — logical operator for combining query / attacker / team / entity_filter clauses (`and` or `or`)
- **entity_filter** — IOC-style filter map of field → list of values. Example valid payload:
```json
{
  "entity_filter": {
    "m_ip": ["103.218.122.8"],
    "m_attacker": ["XYZ"],
    "m_team": ["Alpha Wolf"]
  }
}
```
Commonly supported fields include `m_ip`, `m_domain`, `m_country`, `m_location`, `m_attacker`, `m_team`, `m_ioc_type`, `m_web_server`, `m_social_media_profiles`, `m_scrap_file` and other IOC-style keys depending on deployment.

Minimal example request:
```json
{
  "q": "defacer.net",
  "page": 1,
  "attacker": "XYZ",
  "team": "Alpha Wolf",
  "entity_filter": { "m_ip": ["103.218.122.8"] },
  "matchtype": "or",
  "daterange": "2025-11-28,2025-12-03"
}
```

## Response

Defacement search results containing a paginated list of hacked/defaced or phishing websites.

The response is a JSON object with:
- **Result** — list of defacement report objects
- **Suggestions** — optional list of suggested queries or corrections (may be empty)
- **Page_Count** — number of pages available for the given query and filters (may be fractional depending on backend calculation)

Each entry in **Result** typically contains:
- **m_location** — geo-location or region for the affected asset, when available
- **m_attacker** — list of attacker nicknames/handles claiming the defacement
- **m_team** — defacement crew or group name
- **m_hash** — internal hash of the event/document used for deduplication
- **m_web_server** — list of observed web-server banners (for example `LiteSpeed`, `Apache`, `Cloudflare`, `unknown`)
- **m_ioc_type** — high-level classification such as `hacked`, `phishing`, etc.
- **m_content** — extracted HTML/text content or landing page text when captured
- **m_base_url** — base/source platform (for example `https://defacer.net`)
- **m_url** — URL of the defaced or phishing page
- **m_ip** — list of IP addresses associated with the defaced host
- **m_leak_date** — date the defacement was first recorded/observed
- **m_source_url** — list of source pages describing the defacement (for example the defacer.net view URL)
- **m_screenshot** — screenshot reference when available, otherwise `null`
- **m_mirror_links** — list of mirror/screenshot links for the defacement entry

Example response:
```json
{
  "Result": [
    {
      "m_location": null,
      "m_attacker": ["XYZ"],
      "m_team": "Alpha Wolf",
      "m_hash": "31d109a231bfdaa36fc757a7c749253021f04fad0c54d08455c516007c7feabb",
      "m_web_server": ["LiteSpeed"],
      "m_ioc_type": ["hacked"],
      "m_content": null,
      "m_base_url": "https://defacer.net",
      "m_url": "http://phaoboi.vn/",
      "m_ip": ["103.218.122.8"],
      "m_leak_date": "2025-12-03",
      "m_source_url": ["https://defacer.net/view/54543/"],
      "m_screenshot": null,
      "m_mirror_links": ["https://defacer.net/sc/54543"]
    }
  ],
  "Suggestions": [],
  "Page_Count": 1.2
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
