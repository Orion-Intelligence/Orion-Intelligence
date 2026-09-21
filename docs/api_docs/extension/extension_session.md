# Extension: extension_session

## Description

Retrieves the current status of the extension session, including connection health between the extension, the system, and the WebSocket server. This endpoint corresponds to `GET /api/extension/session`.

This endpoint does not require a request payload.

## Response

The API returns a JSON object containing the username and active connection status flags.

Example response:
```json
{
  "username": "admin",
  "detail": "Active",
  "system_connected": true,
  "extension_connected": true
}
```
