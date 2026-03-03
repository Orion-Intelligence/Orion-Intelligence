# Socail: profile_followers

## Description

Scrapes and extracts the follower list of a specified social media account. This API allows for targeted data collection of an account's audience up to a user-defined limit, providing insights into community composition and user reach.
The API is primarily used for audience mapping, lead generation, and verifying account influence.

Supported request fields:

- **platform** — The target social media network
- **username** — The profile handle to scrape
- **max_followers** - The maximum number of **follower** records to retrieve

Example request payload:

```json
{
  "platform": "Instagram",
  "username": "sarcaxxm",
  "max_followers": 1000
}
```

## Response

The API returns a consolidated list of usernames following the target profile, along with the processing status and request metadata.

Field semantics for each element under **result**:

- **followers** — An array of strings containing the usernames of the account's followers
- **platform** — The social media network targeted in the request
- **username** — The handle/username of the profile being scraped
- **status** — The current operational status of the account or the task

Example response:
```json
{
    "result": {
        "followers": [
            "userisun.stable",
            "fatimahh_050",
            "abdullah_affan34",
            "munir.379",
            "hamnaa._.111",
            "ayeshaa2_6"
        ],
        "platform": "instagram",
        "username": "sarcaxxm",
        "status": "active"
    }
}
```