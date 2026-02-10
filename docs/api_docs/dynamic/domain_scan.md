# Dynamic: domain_scan

## Description

Scan a target domain using the configured scanning engine.

The request is an HTTP POST and expects a JSON body matching the `DomainScanRequest` schema:

```json
{
  "domain": "www.bbc.com",
  "scanType": "basic"
}
```

Fields:
- **domain**   — target domain or host to scan (e.g. `www.bbc.com`)
- **scanType** — scan mode selector. Supported values:
  - `basic`    — infrastructure & HTTP intelligence (security headers, caching, CSP, CORS, etc.)
  - `advanced` — same as `basic`, plus port scanning and service-level inspection
  - `seo`      — SEO metadata, indexing and ranking-related signals
  - `repo`     — linked repository scan (GitHub/GitLab, exposed files, commit metadata)
  - `subdomains`     — Enumerates and returns subdomains associated with the provided domain
  - `dns`     — Performs reverse DNS lookup and ping test to return hostname and connectivity status for a given IP
  - `wayback`     — Retrieves historical archived snapshots and timestamps of the provided domain from web archive sources
- **checkLive**   - check to get live subdomains
Payload examples by **scanType** (all share the same schema; only `scanType` changes):

```json
{
  "domain": "www.bbc.com",
  "scanType": "basic"
}
```

```json
{
  "domain": "www.bbc.com",
  "scanType": "advanced"
}
```

```json
{
  "domain": "www.bbc.com",
  "scanType": "seo"
}
```

```json
{
  "domain": "https://github.com/globaleaks/globaleaks-whistleblowing-software",
  "scanType": "repo"
}
```

```json
{
  "domain": "www.bbc.com",
  "scanType": "subdomains",
  "checkLive": false
}
```

```json
{
  "domain": "192.168.156.55",
  "scanType": "dns"
}
```

```json
{
  "domain": "www.bbc.com",
  "scanType": "wayback"
}
```

## Response

Scan results for the selected `scanType`, returned as a JSON object with a top-level **result** field.

For **basic / advanced / seo** scans, the structure of `result` is typically:

- **meta** — scan metadata:
  - **URL**              — fully qualified URL that was scanned (e.g. `https://www.bbc.com`)
  - **Host**             — resolved host name (e.g. `www.bbc.com`)
  - **Port**             — port and protocol (e.g. `443 SSL`)
  - **Scanned_on_date**  — human-readable scan date (e.g. `December 07, 2025`)
  - **Scanned_by**       — scanner identity (e.g. `Orion Intelligence`)

- **summary** — map of category name → count of findings in that category, such as:
  - `Headers`, `Caching Findings`, `Caching`, `CSP/Policy`, `CORS`, `General`, `Informational`

- **threats** — map of category name → list of findings, each containing:
  - **header**       — finding title or header (e.g. `Permissions-Policy`)
  - **description**  — detailed explanation of the issue
  - **confidence**   — confidence level (`High`, `Medium`, `Low`)
  - **risk**         — risk level (`High`, `Medium`, `Low`, `Informational`)

- **proofs** — map of category name → list of evidence items, each containing:
  - **header**       — finding title or header
  - **proof**        — HTML/response snippet or other raw evidence
  - **confidence**   — confidence level
  - **risk**         — risk level

- **grade** — overall security/quality grade (e.g. `D`)
- **grade_counts** — totals of findings by severity:
  - **high**, **medium**, **low**, **informational**

For **advanced** scans, the structure is the same as `basic` but may include additional port and service
intelligence within **meta** and/or as extra categories in **summary**/**threats**.

For **repo** scans, `result` has the same top-level structure but often with empty findings when no issues
are detected. A typical `repo` scan looks like:

```json
{
  "result": {
    "meta": {
      "URL": "https://github.com/globaleaks/globaleaks-whistleblowing-software",
      "Host": "github.com",
      "Port": "443 SSL",
      "Scanned_on_date": "December 07, 2025",
      "Scanned_by": "Orion Intelligence"
    },
    "summary": {},
    "threats": {},
    "proofs": {},
    "grade": "A",
    "grade_counts": {
      "high": 0,
      "medium": 0,
      "low": 0,
      "informational": 0
    }
  }
}
```

The exact number of findings and the categories under **summary**, **threats**, and **proofs** depend on the
target and the selected `scanType`.

For **subdomains** scans, the structure of `result` is typically:

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

For **dns** scans, the structure of `result` is typically:

- **ip** — IP address provided by the user
- **hostname** — reverse-resolved hostname mapped to the IP address (if available)
- **ping** — connectivity status indicating whether the IP responds to ping requests (true or false)

```json
{
  "result": {
    "ip": "111.68.99.6",
    "hostname": "ns1.itsoul.com.pk",
    "ping": false
  }
}
```

For **wayback** scans, the structure of `result` is typically:

- **meta** — scan metadata:
  - **URL** — fully qualified URL that was scanned (e.g. https://bbc.com/)
  - **Host** — domain host (e.g. bbc.com)
  - **Scanned_on_date** — human-readable scan date
  - **Scanned_by** — scanner identity (e.g. Orion Intelligence)

- **snapshots** — list of archived website snapshots:
  - **timestamp** — date and time when the snapshot was captured
  - **url** — archived snapshot URL from the web archive

- **count** — total number of snapshots discovered
- **status** — scan execution status (e.g. success)
- **message** — human-readable summary of the scan result

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
