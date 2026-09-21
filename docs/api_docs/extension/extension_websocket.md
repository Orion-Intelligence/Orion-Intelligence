# Extension: extension_websocket

## Description

These endpoints handle the WebSocket connection lifecycle for real-time communication between the Orion server and the browser extension.

### WebSocket Ticket Generation
**Endpoint:** `POST /api/extension/ws-ticket`

Generates a short-lived, single-use ticket to securely authenticate the WebSocket connection. The generated ticket is valid for 30 seconds.

This endpoint does not require a request payload.

### WebSocket Connection
**Endpoint:** `WEBSOCKET /api/extension/socket`

Establishes a bi-directional WebSocket connection for sending instructions and receiving scraped data. Clients can authenticate using an extension cookie or by appending the ticket as a query parameter (`?ticket=<TICKET>`).

## Response

The `ws-ticket` endpoint returns a cryptographic ticket string.

Example response for `POST /api/extension/ws-ticket`:
```json
{
  "ticket": "random-secure-string-ticket-here"
}
```

Upon successful WebSocket connection, the server sends a confirmation JSON payload:
```json
{
  "detail": "Connected"
}
```
