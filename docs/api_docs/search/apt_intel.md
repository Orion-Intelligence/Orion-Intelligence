# Search: APT Intel

## Description

Search APT actor and malware intelligence reports across the Actors & Malware data set.

This endpoint corresponds to `/api/search/apt-intel` and expects a JSON body matching the consolidated search request model used by indexed investigation modules.

Supported request fields include:

- **q** - free-text query over actor names, malware families, aliases, report titles, descriptions, IOCs, and related metadata.
- **category** - high-level selector. Use `all` for actor and malware results together, `apt` for actor reports, or `malware` / `malware-bazaar` for malware records.
- **page** - page number for paginated results.
- **network** - network scope when applicable.
- **daterange** - optional date range in `YYYY-MM-DD,YYYY-MM-DD` format.
- **content** - content or report-type selector where supported by the active category.
- **entity** - primary IOC/entity dimension for the query.
- **matchtype** - logical operator for combining query and filters.
- **must** - when true, values under **entity_filter** must be present in matched documents.
- **entity_filter** - structured IOC/entity filters, such as family, country, reporter, hashes, domains, IPs, CVEs, URLs, or aliases depending on the selected data source.

Example request payload:

```json
{
  "q": "lazarus",
  "category": "apt",
  "page": 1,
  "network": "all",
  "daterange": "2026-01-01,2026-07-01",
  "content": "all",
  "entity": "",
  "matchtype": "or",
  "must": false,
  "entity_filter": {
    "m_country": ["KP"],
    "m_family": ["Lazarus"]
  }
}
```

## Response

APT Intel search results containing actor, malware, and related threat-intelligence records.

The response is a paginated result object. Result rows can include:

- **doc_id** - document identifier for the report detail endpoint.
- **rank_index** - source index, usually APT or malware.
- **m_title** - actor, malware family, signature, or report title.
- **m_content** - normalized report body or description.
- **m_family** - malware or actor family where present.
- **m_signature** - malware signature where present.
- **m_country** - associated countries where present.
- **m_reporter** - reporting source where present.
- **m_url** - source URLs or references.
- **m_hash** - internal content hash or malware hash fields where present.
- **m_creation_date / m_update_date** - ingestion and update timestamps.

Use `GET /api/search/apt/{doc_id}` for actor report details and `GET /api/search/malware/{doc_id}` for malware report details.
