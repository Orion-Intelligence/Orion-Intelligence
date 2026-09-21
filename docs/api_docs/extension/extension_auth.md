# Extension: extension_auth

## Description

These endpoints handle authentication, token refreshing, and logout for the Orion browser extension.

### Extension Login
**Endpoint:** `POST /api/extension/login`

Authenticates an extension client using username and password, linking the session to an active system session.

**Request Payload:**
```json
{
  "username": "user1",
  "password": "secure_password"
}
```

### Extension Refresh
**Endpoint:** `POST /api/extension/refresh`

Refreshes an active extension session token using the existing extension cookie.

This endpoint does not require a request payload.

### Extension Logout
**Endpoint:** `POST /api/extension/logout`

Logs out the extension, disconnects any active WebSockets, and invalidates the session token.

This endpoint does not require a request payload.

## Response

The API returns authentication status and an `access_token` for login and refresh endpoints. The logout endpoint confirms successful session termination.

Example response for `POST /api/extension/login`:
```json
{
  "detail": "Logged in",
  "access_token": "ey..."
}
```
