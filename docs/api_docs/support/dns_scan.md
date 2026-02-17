# Dynamic: dns_scan

## Description

Performs reverse DNS lookup and ping test to return hostname and connectivity status for a given IP

The request is an HTTP POST and expects a following JSON schema:

```json
{
  "domain": "192.168.156.55"
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
    "ip": "111.68.99.6",
    "hostname": "ns1.itsoul.com.pk",
    "ping": false
  }
}
```