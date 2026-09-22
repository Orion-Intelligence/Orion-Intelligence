# Social: recon_status

## Description

Retrieves the current status of an ongoing dynamic social reconnaissance scan based on the provided search query. This endpoint corresponds to `POST /api/social/recon/status` and requires an active scan session.

Supported request fields:

- **query** — The name, alias, or search string that was used to start the recon scan.

Example request payload:

```json
{
  "query": "Usman Ali"
}
```

## Response

The API returns the current status and progress of the social recon scan.

Example response:
```json
{
  "status": "running",
  "progress": 45,
  "message": "Scanning social networks..."
}
```
