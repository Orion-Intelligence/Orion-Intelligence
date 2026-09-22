# Social: recon_cancel

## Description

Cancels an ongoing dynamic social reconnaissance scan for the authenticated user. This endpoint corresponds to `POST /api/social/recon/cancel`. It interrupts any active background scraping tasks associated with the user's session.

This endpoint does not require any request payload.

## Response

The API returns a confirmation message indicating that the scan has been successfully canceled.

Example response:
```json
{
  "status": "success",
  "message": "Scan cancelled successfully"
}
```
