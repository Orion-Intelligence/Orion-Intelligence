# Socail: profile_posts

## Description

Scrapes and retrieves a detailed feed of posts from a requested social media account based on the provided platform and username. This API extracts post-specific data including engagement metrics, media types, and audience interactions.
The API is useful for social media monitoring, sentiment analysis, influencer tracking, and digital footprint assessment.

Supported request fields:

- **platform** — name of the social media platform (e.g. Instagram, Twitter, Facebook, etc.)
- **username** — account handle / username to scrape

Example request payload:

```json
{
  "platform": "Instagram",
  "username": "sarcaxxm"
}
```

## Response

The API returns a structured list of posts containing engagement statistics, captions, timestamps, and a collection of user comments and mentions.

Field semantics for each element under **result**:

- **status** — Current state of the post (e.g., active, deleted)
- **post_url** — Direct permanent link to the social media post
- **datetime** — ISO 8601 formatted timestamp of when the post was published
- **caption** — The text description or body content of the post
- **likes** — Total number of likes/reactions received
- **comments** — Total count of comments on the post
- **shares** — Number of times the post has been shared
- **views** — Number of video or post views (if applicable)
- **media_type** — Type of content (e.g., text, video, image, carousel)
- **media_url** — Direct link to the hosted media file (blob or CDN URL)
- **connections** — List of usernames mentioned or interacting frequently with the post
- **comments_text** — A collection of raw text strings from the user comments section

Example response:
```json
{
    "result": [
        {
            "status": "active",
            "post_url": "https://www.instagram.com/sarcaxxm/p/DU600SiiAKJ/",
            "datetime": "2026-02-19T00:20:07.000Z",
            "caption": "roza iftaar hone me kitne time reh gya hai guys?",
            "likes": "55000",
            "comments": "359",
            "shares": "0",
            "views": "0",
            "media_type": "text",
            "media_url": "",
            "connections": [
                "zarafatima_.xo",
                "aleeza_ox"
            ],
            "comments_text": [
                "1st sehri done 🥰🥰",
                "RamzanHolic 🥀"
            ]
        }
    ]
}
```