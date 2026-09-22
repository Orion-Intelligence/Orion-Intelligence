# Social: social_connections

## Description

Searches and retrieves connections between a specific profile and other users on a given platform. This maps the interactive network of the profile based on mentions, comments, or followers/following relationships. This endpoint corresponds to `POST /api/social/connections`.

Supported request fields:

- **profile_username** (or **username**) — account handle / username to scrape 
- **platform** — name of the social media platform 
- **query** (optional) — specific connection query or target connection username
- **limit** (optional) — maximum number of connections to retrieve (default: 500)
- **post_url** (optional) — specific post URL to extract connections from

Example request payload:

```json
{
  "username": "sarcaxxm",
  "platform": "Instagram",
  "limit": 100
}
```

## Response

The API returns a list of connected profiles with interaction details.

Example response:
```json
{
  "result": [
    {
      "connection_username": "zarafatima_.xo",
      "interaction_type": "comment",
      "frequency": 5
    }
  ]
}
```
