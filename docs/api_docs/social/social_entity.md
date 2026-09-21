# Social: social_entity

## Description

Extracts and maps specific entity information (such as organizations, mentioned users, or specific hashtags) from a given social media profile. This endpoint corresponds to `POST /api/social/entity`.

Supported request fields:

- **platform** — name of the social media platform 
- **username** — account handle / username to scrape 

Example request payload:

```json
{
  "platform": "Twitter",
  "username": "osint_researcher"
}
```

## Response

The API returns the extracted entities related to the provided social profile.

Example response:
```json
{
  "result": {
    "entities": [
      {
        "type": "organization",
        "name": "Acme Corp"
      },
      {
        "type": "mention",
        "name": "john_doe"
      }
    ]
  }
}
```
