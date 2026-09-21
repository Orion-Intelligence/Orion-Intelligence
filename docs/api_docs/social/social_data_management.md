# Social: social_data_management

## Description

These endpoints manage stored social profiles data for the authenticated user, allowing appending, retrieving, and deleting collected intelligence data.

### Append Social Data
**Endpoint:** `POST /api/social/data`

Appends collected social profiles data to the user's dataset.

**Request Payload:**
- **profile_username** (or **root_username**, **username**) — The target username.
- **profiles** — List of profile data objects.
- **config** (optional) — Scraper configuration.
- **replace** (optional) — Boolean indicating if existing data should be replaced (default: false).

```json
{
  "profile_username": "johndoe",
  "profiles": [...],
  "replace": true
}
```

### Get All Social Data
**Endpoint:** `GET /api/social/data`

Retrieves all stored social profiles associated with the current user.

### Get Specific Social Profile
**Endpoint:** `GET /api/social/data/{profile_username}`

Retrieves stored social profile data for a specific username.

**Path Parameters:**
- **profile_username** — The username to retrieve data for.

### Delete Specific Social Profile
**Endpoint:** `DELETE /api/social/data/{profile_username}`

Deletes the stored social profile data for a specific username.

**Path Parameters:**
- **profile_username** — The username to delete.

## Response

These endpoints return status confirmations or the requested social profile data depending on the operation.

Example response for `GET /api/social/data/{profile_username}`:
```json
{
  "status": "success",
  "result": {
    "profile_username": "johndoe",
    "profiles": [...]
  }
}
```
