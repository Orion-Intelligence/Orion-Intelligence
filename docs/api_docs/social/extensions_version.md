# Social: extensions_version

## Description

Retrieves the current version of the social reconnaissance extension deployed on the system. This endpoint corresponds to `GET /api/social/extensions/version`.

This endpoint does not require any request payload.

## Response

The API returns the extension version information.

Example response:
```json
{
  "version": "1.2.5",
  "status": "up_to_date"
}
```
