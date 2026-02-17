# Dynamic: subdomain_scan

## Description

Scan a target domain using the configured scanning engine.

The request is an HTTP POST and expects a following JSON schema:

```json
{
  "domain": "www.bbc.com",
  "checkLive": false
}
```

Fields:
- **domain**   — target domain or host to scan (e.g. `www.bbc.com`)
- **checkLive**   - check to get live subdomains

## Response

The response is a JSON object containing a **result** object.

The structure of `result` is typically:
- **meta** — scan metadata:
  - **URL** — fully qualified URL that was scanned (e.g. https://bbc.com/)
  - **Host** — root domain used for enumeration (e.g. bbc.com)
  - **Scanned_on_date** — human-readable scan date (e.g. February 05, 2026)
  - **Scanned_by** — scanner identity (e.g. Orion Intelligence)

- **subdomains** — list of discovered subdomains associated with the provided domain.

```json
{
  "result": {
    "meta": {
      "URL": "https://bbc.com/",
      "Host": "bbc.com",
      "Scanned_on_date": "February 05, 2026",
      "Scanned_by": "Orion Intelligence"
    },
    "subdomains": [
      "a1.api.bbc.com",
      "access.api.bbc.com",
      "account-api.api.bbc.com"
    ]
  }
}
```