# Dynamic: ip_resolve

## Description

Resolve a domain name to its associated IP addresses (both IPv4 and IPv6) using DNS A and AAAA record queries.

The request is an HTTP POST and expects a JSON body matching the `DNSResolveRequest` schema:

```json
{
  "domain": "www.bbc.com"
}
```

Fields:
- **domain** — target domain name to resolve (e.g. `www.bbc.com`, `google.com`, `example.org`)

## Response

DNS resolution results returned as a JSON object with a top-level **result** field.

- **domain** — the domain name that was resolved (e.g. `www.bbc.com`)
- **ips** — list of resolved IP addresses (both IPv4 and IPv6), e.g. `["151.101.0.81", "151.101.64.81", "2a04:4e42::81", "2a04:4e42:200::81"]`

## Example Responses

### Standard Domain Resolution

```json
{
  "result": {
    "domain": "www.bbc.com",
    "ips": [
      "151.101.0.81",
      "151.101.64.81",
      "151.101.128.81",
      "151.101.192.81"
    ]
  }
}
```

### Domain with IPv4 and IPv6

```json
{
  "result": {
    "domain": "google.com",
    "ips": [
      "142.250.185.46",
      "2607:f8b0:4004:c07::71",
      "2607:f8b0:4004:c07::64",
      "2607:f8b0:4004:c07::8b"
    ]
  }
}
```

### Domain Resolution Failure

```json
{
  "result": {
    "domain": "nonexistent-domain-12345.com",
    "ips": []
  }
}
```

## Resolution Process

The resolver executes DNS queries with progress updates:

1. **5%** - `queued` - Resolution queued
2. **30%** - `resolving_A` - Querying IPv4 addresses (A records)
3. **70%** - `resolving_AAAA` - Querying IPv6 addresses (AAAA records)
4. **100%** - `done` - Resolution complete

## DNS Record Types

- **A Records (IPv4)** — Returns IPv4 addresses in dotted-decimal notation (e.g. `151.101.0.81`)
- **AAAA Records (IPv6)** — Returns IPv6 addresses in colon-hexadecimal notation (e.g. `2a04:4e42::81`)

## Response Behavior

- IPv4 addresses (A records) are listed first
- IPv6 addresses (AAAA records) follow
- If no A records exist, only AAAA records are returned
- If no AAAA records exist, only A records are returned
- If neither exist, an empty `ips` array is returned
- All discovered IPs are included (no deduplication)

## Status Polling

For tracking resolution progress:

```
GET /api/dns/status?domain=www.bbc.com
```

Response:
```json
{
  "status": "pending",
  "progress": 30,
  "step": "resolving_A"
}
```

Status values: `idle`, `pending`, `done`, `error`

## Error Handling

### Domain Not Found
```json
{
  "result": {
    "domain": "nonexistent.com",
    "ips": []
  }
}
```

### Network/Timeout Error
```json
{
  "status": "error",
  "progress": 100,
  "step": "error",
  "result": {
    "error": "DNS query timeout"
  }
}
```

## Notes

- Uses system default DNS servers
- Standard timeout: 5 seconds per record type
- No caching applied (queries are fresh)
- Follows CNAME chains automatically
- Rate limiting: 100 queries per minute per IP
- Average resolution time: 50-200ms