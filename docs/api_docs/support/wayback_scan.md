# Dynamic: wayback_scan

## Description

Retrieves historical archived snapshots and timestamps of the provided domain from web archive sources

The request is an HTTP POST and expects a following JSON schema:

```json
{
    "domain": "www.bbc.com"
}
```

Fields:
- **domain**   — target domain or host to scan (e.g. `www.bbc.com`)

## Response

The response is a JSON object containing a **result** object.

The structure of `result` is typically:
- **ip** — IP address provided by the user
- **hostname** — reverse-resolved hostname mapped to the IP address (if available)
- **ping** — connectivity status indicating whether the IP responds to ping requests (true or false)


```json
{
  "result": {
    "meta": {
      "URL": "https://www.bbc.com",
      "Host": "bbc.com",
      "Scanned_on_date": "February 05, 2026",
      "Scanned_by": "Orion Intelligence"
    },
    "snapshots": [
      {
        "timestamp": "2025-11-07 00:41:44",
        "url": "http://web.archive.org/web/20251107004144/http://bbc.com/"
      }
    ],
    "count": 90,
    "status": "success",
    "message": "Found 90 snapshots in the last 3 months (1 per day)"
  }
}

```