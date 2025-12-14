# Search: consolidated

## Description

Search across all report types (breach/leak, exploit, generic/strategic, chat, social, etc.) and return a
consolidated, section-grouped set of report metadata.

The request is an HTTP POST and expects a JSON body matching the `search_consolidated_param_model` schema.
A typical request payload might look like:

```json
{
  "q": "okta",
  "page": 1,
  "network": "all",
  "matchtype": "or",
  "safe": false,
  "daterange": "2025-11-01,2025-12-07",
  "content": "all",
  "entity": "",
  "must": false,
  "entity_filter": {
    "m_company_name": ["Okta"],
    "m_country": ["US"]
  }
}
```

Semantics:
- **q** — free-text query across all supported indices
- **page** — page number for paginated results
- **network** — network filter (e.g. `all`, `clearnet`, `onion`, `i2p`)
- **matchtype** — logical query mode, typically `or` or `and`
- **safe** — when true, enables additional safety/content restrictions
- **daterange** — optional date range filter in `YYYY-MM-DD,YYYY-MM-DD` format
- **content** — high-level content type filter when supported (e.g. `all`, `leaks`, `news`)
- **entity / entity_filter** — IOC/entity-based filters (e.g. `m_company_name`, `m_domain`, `m_country`)
- **must** — when true, entity filters are treated as mandatory (must-match) conditions

Unlike the ranked variant, this consolidated endpoint groups results by section/index. Each group contains its
own total and list of matching documents and is suitable for driving dashboards and per-section drill-down.

## Response

Consolidated, section-grouped search results across all enabled indices.

The response is a JSON object where each top-level key corresponds to a logical section or model
(for example `breach`, `exploit`, `generic`, `chat`, `social`). Each section contains its own metadata and
list of matching reports.

Typical structure:
- **breach / leak** — grouped breach/leak reports (ransomware notes, data leak posts, etc.)
- **exploit** — exploit/CVE-related documents
- **generic / strategic** — generic darkweb/clearnet documents (forums, marketplaces, generic pages)
- **chat** — chat/Telegram-driven intelligence items
- **social** — social media-based threat intel posts

Example response:
```json
{
  "breach": {
    "total": 2,
    "page": 1,
    "results": [
      {
        "doc_id": "breach-123",
        "m_title": "Okta customer data leak announced",
        "m_company_name": "Okta Inc.",
        "m_domain": ["okta.com"],
        "m_network": "onion",
        "m_content_type": ["leaks"],
        "m_hash": "abc123...",
        "m_creation_date": "2025-12-06T09:10:00Z",
        "m_update_date": "2025-12-07T08:45:00Z"
      }
    ]
  },
  "exploit": {
    "total": 1,
    "page": 1,
    "results": [
      {
        "doc_id": "exploit-456",
        "m_title": "PoC for Okta SSO misconfiguration abuse",
        "m_url": "https://example.com/exploit/okta-poc",
        "m_platform": ["Web"],
        "m_content_type": ["exploit"],
        "m_hash": "def456...",
        "m_creation_date": "2025-12-05T14:20:00Z"
      }
    ]
  },
  "chat": {
    "total": 0,
    "page": 1,
    "results": []
  },
  "social": {
    "total": 1,
    "page": 1,
    "results": [
      {
        "doc_id": "social-789",
        "m_sender_name": "@threatintelfeed",
        "m_message_date": "2025-12-07",
        "m_content": "New Okta-related access sale spotted on darkweb.",
        "m_platform": "mastodon",
        "m_network": "clearnet",
        "content_type": ["threat_intel", "news"],
        "m_hash": "ghi789..."
      }
    ]
  }
}
```

Exact sections and fields depend on enabled modules and query filters, but the grouped structure remains
consistent: each top-level section exposes `total`, `page`, and a list of result objects containing common
metadata fields like **doc_id**, **m_title**, **m_network**, **m_content_type**, and hash/timestamp fields.
