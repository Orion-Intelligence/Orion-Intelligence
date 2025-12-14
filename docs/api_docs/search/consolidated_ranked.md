# Search: consolidated_ranked

## Description

Search the entire database across all report types and return a single, globally relevance-ranked list of
report metadata without per-section grouping.

The request is an HTTP POST and expects a JSON body matching the `search_consolidated_param_model` schema.
It reuses the same fields as the grouped consolidated search endpoint (for example `q`, `page`, `network`,
`matchtype`, `daterange`, `entity_filter`, `must`, etc.).

Example request payload:

```json
{
  "q": "okta",
  "page": 1,
  "network": "all",
  "matchtype": "or",
  "safe": false,
  "daterange": "2025-11-01,2025-12-07",
  "content": "all",
  "entity_filter": {
    "m_company_name": ["Okta"]
  }
}
```

Unlike the grouped consolidated endpoint, this variant merges hits from all indices (breach/leak, exploit,
generic, chat, social, etc.) into a *single list* sorted by a global relevance score. Each result row
includes metadata about the source index/section so that clients can still route to the appropriate
underlying report API.

## Response

Globally ranked consolidated search results across all enabled indices.

The response is a JSON object containing a single list of hits ordered by a global relevance score, along
with pagination metadata.

Typical fields:
- **total** — total number of matched documents across all indices
- **page** — current result page
- **results** — ordered list of result objects, highest relevance first

Each element in **results** usually contains:
- **index** — logical source index/section (e.g. `leak_model`, `exploit_model`, `generic_model`,
  `chat_model`, `social_model`)
- **doc_id** — internal identifier of the document (to be used with the corresponding report API)
- **score** — search/relevance score (when exposed)
- Common metadata fields depending on the index, such as:
  - For leak/breach: **m_title**, **m_company_name**, **m_domain**, **m_network**, **m_content_type**
  - For exploit: **m_title**, **m_platform**, **m_content_type**, **m_url**
  - For chat: **m_sender_name**, **m_message_date**, **m_content**, **m_channel_name**
  - For social: **m_sender_name**, **m_message_date**, **m_content**, **m_platform**

Example response:
```json
{
  "total": 25,
  "page": 1,
  "results": [
    {
      "index": "leak_model",
      "doc_id": "breach-123",
      "score": 12.34,
      "m_title": "Okta customer data leak announced",
      "m_company_name": "Okta Inc.",
      "m_domain": ["okta.com"],
      "m_network": "onion",
      "m_content_type": ["leaks"],
      "m_hash": "abc123...",
      "m_creation_date": "2025-12-06T09:10:00Z"
    },
    {
      "index": "exploit_model",
      "doc_id": "exploit-456",
      "score": 10.87,
      "m_title": "PoC for Okta SSO misconfiguration abuse",
      "m_platform": ["Web"],
      "m_content_type": ["exploit"],
      "m_url": "https://example.com/exploit/okta-poc",
      "m_hash": "def456..."
    },
    {
      "index": "social_model",
      "doc_id": "social-789",
      "score": 9.42,
      "m_sender_name": "@threatintelfeed",
      "m_message_date": "2025-12-07",
      "m_content": "New Okta-related access sale spotted on darkweb.",
      "m_platform": "mastodon",
      "m_network": "clearnet",
      "content_type": ["threat_intel", "news"]
    }
  ]
}
```

This ranked view is optimized for global search experiences where the user wants "the most relevant
things first" regardless of which underlying index they came from, while still preserving enough
metadata to call the corresponding detailed report endpoints.
