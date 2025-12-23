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
