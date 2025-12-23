# Search: defacement

## Description

Search defacement intelligence reports by keyword, threat group, or affected domain; returns metadata for matching defacement reports.

This endpoint corresponds to `/api/search/defacement` and expects a JSON body matching the `search_defacement_param_model` schema.

Supported request fields:
- **q** — free-text search query over normalized titles, content and metadata (e.g. banner text, domains).
- **category** — ML-based classifier label (e.g. `all`, `currency`, `forums`, `news`, `leaks`, etc.); can be safely left as `all` to avoid category filtering.
- **page** — page number for paginated results (1-based integer).
- **network** — network scope for the search: `all`, `clearnet`, `onion`, `i2p`, `freenet`.
matching defacement documents.
- **daterange** — optional date range in `YYYY-MM-DD,YYYY-MM-DD` format to restrict results based on creation or update time.
- **attacker** — raw attacker string (actual attacker name as it appears in the source content).
- **must** — if `true`, filtered values (attacker, team, IOC entities) must be present in the document; if `false`, they are treated as optional/boosting filters.
- **matchtype** — logical operator for multi-valued filters: `and` (all values must match) or `or` (any value can match).
- **team** — normalized defacer / hacker / threat actor name (e.g. `mthcht`).
- **content** — high-level defacement content type such as `phishing`, `hacked`, or `databases`.
- **entity_filter** — IOC-based filter object where keys are IOC/metadata fields and values are lists of allowed values (for example domains, IPs, countries, emails, etc.).

Example request payload:
```json
{
  "q": "Hacked by",
  "category": "all",
  "page": 1,
  "network": "onion",
  "daterange": "2025-12-01,2025-12-07",
  "attacker": "mthcht",
  "must": true,
  "matchtype": "and",
  "team": "mthcht",
  "content": "phishing",
  "entity_filter": {
    "m_domain": ["github.com"],
    "m_country": ["US"],
    "m_ip": ["192.0.2.10"]
  }
}
```

## Response

Defacement intelligence search results with metadata for each matching defacement report.

The response is a JSON object containing pagination metadata and a list of defacement documents:

- **total** — total number of matching defacement reports.
- **page** — current page number.
- **page_size** — number of documents returned in this page.
- **results** — list of defacement report summary objects.

Each element in **results** typically includes:
- **doc_id** — internal document identifier to be used with the defacement report detail API.
- **m_title** — defacement/phishing page title or banner text (e.g. `Hacked by mthcht`).
- **m_team** — normalized defacer / hacker / threat actor name.
- **m_base_url** — base URL or service where the content originates (e.g. `https://github.com/`).
- **m_url** — concrete URL of the defaced or phishing page.
- **m_ioc_type** — high-level classification of the event (e.g. `phishing`, `defacement`).
- **m_leak_date** — first observed date for the event.
- **m_network** — network type (`clearnet`, `onion`, `i2p`, etc.).
- **m_domain** — list of domains involved in the event.
- **m_content_type** — classification labels (e.g. [`defacement`, `phishing`]).
- **m_important_content** — key snippet summarizing the defacement.
- **m_screenshot** — screenshot identifier for the defaced page.
- **m_update_date** — last time this document was updated in the system.
- **m_creation_date** — first time the document was created/ingested.
- **m_hash** — internal document hash used for deduplication.

Example response:
```json
{
  "total": 42,
  "page": 1,
  "page_size": 10,
  "results": [
    {
      "doc_id": "c4d0d2d2-3c0a-4e2d-a0f5-9a1c7f9e3c01",
      "m_title": "Hacked by mthcht",
      "m_team": "mthcht",
      "m_base_url": "https://github.com/",
      "m_url": "https://github.com/some-victim-repo",
      "m_ioc_type": "phishing",
      "m_leak_date": "2025-12-01T18:22:41.032Z",
      "m_network": "clearnet",
      "m_domain": [
        "github.com",
        "victim.org"
      ],
      "m_content_type": [
        "defacement",
        "phishing"
      ],
      "m_important_content": "Hacked by mthcht – database dumped and leaked.",
      "m_screenshot": "69993154316451142028569605097804",
      "m_update_date": "2025-12-02T10:05:12.910Z",
      "m_creation_date": "2025-12-01T18:22:41.032Z",
      "m_hash": "9b4b1f15f1f94a5fb3a4a0ea0dcbf9a0"
    }
  ]
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
