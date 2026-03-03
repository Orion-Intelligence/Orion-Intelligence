# Socail: profile_following

## Description

Scrapes and extracts the list of accounts that a specific social media user is currently following. This API allows for competitive analysis, interest mapping, and network connection discovery by retrieving follow lists up to a specified limit.
The API is ideal for identifying the influencers, brands, or communities that a specific target account engages with.

Supported request fields:

- **platform** — The target social media network
- **username** — The profile handle to scrape
- **max_following** - The maximum number of **following** records to retriev

Example request payload:

```json
{
  "platform": "Instagram",
  "username": "sarcaxxm",
  "max_followers": 1000
}
```

## Response

The API returns a structured object containing an array of usernames found in the "following" list, alongside the platform metadata and request status.

Field semantics for each element under **result**:

- **following** — An array of strings representing the handles/usernames of accounts followed by the target
- **platform** — The social media network targeted in the request
- **username** — The handle/username of the profile being scraped
- **status** — The current operational status of the account or the task

Example response:
```json
{
    "result": {
        "following": [
            "mark_r1chard09",
            "starboy_beastfire",
            "lion_ettia",
            "ariannacodes",
            "adm_aint_coo",
            "gregorycrowther160",
            "instagram"
        ],
        "platform": "instagram",
        "username": "sarcaxxm",
        "status": "active"
    }
}
```