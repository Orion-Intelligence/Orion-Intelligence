# Socail: profile_search

## Description

Scrape public profile information for a requested social media account by platform and username; returns structured profile metadata for the specified account.
This endpoint corresponds to /api/search/social_profile and expects a JSON body containing the target platform and username.

Supported request fields:

- **platform** — name of the social media platform 
- **username** — account handle / username to scrape 

Example request payload:

```json
{
  "platform": "Instagram",
  "username": "sarcaxxm"
}
```

## Response

Social media profile scraping result with structured metadata for the requested account.

The **result** object includes:

- **profile** — structured profile metadata extracted from the requested social account
    - **real_name** — display name of the account
    - **bio** — account biography/description text
    - **location** — publicly visible location (if available)
    - **total_posts** — total number of posts published
    - **total_followers** — total number of followers
    - **total_following** — total number of accounts followed
    - **profile_url** — direct URL to the profile page
- **platform** — normalized platform name associated with the requested account
- **nusername** — username of the requested social media account
- **status** — account status (e.g. active, inactive, not_found)

Example response:
```json
{
  "result": {
    "profile": {
      "real_name": "Sarcaxxm🇵🇸",
      "bio": "i be postin cuz i cant afford a therapist\npersonal: @sarcaxxm.exe\nnew broadcast ⬇️",
      "location": "",
      "total_posts": "561",
      "total_followers": "500K",
      "total_following": "1",
      "profile_url": "https://www.instagram.com/sarcaxxm"
    },
    "platform": "instagram",
    "username": "sarcaxxm",
    "status": "active"
  }
}
```