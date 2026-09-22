# Social: profile_shorts

## Description

Scrapes and retrieves a detailed feed of short-form videos (shorts) from a requested social media account based on the provided platform and username. This API extracts short-video-specific data including engagement metrics, captions, and comments.
The API is useful for monitoring engagement on short-form content platforms like YouTube Shorts, TikTok, or Instagram Reels.

Supported request fields:

- **platform** — name of the social media platform (e.g. YouTube, TikTok, Instagram)
- **username** — account handle / username to scrape
- **max_shorts** (optional) — maximum number of shorts to retrieve (default: 5, max: 100)
- **max_comments** (optional) — maximum number of comments to retrieve per short (default: 10, max: 100)
- **comment_offset** (optional) — offset for comment pagination (default: 0)

Example request payload:

```json
{
  "platform": "YouTube",
  "username": "MrBeast",
  "max_shorts": 5,
  "max_comments": 10
}
```

## Response

The API returns a structured list of short videos containing engagement statistics, captions, timestamps, and a collection of user comments.

Field semantics for each element under **result** typically include:

- **status** — Current state of the short video
- **post_url** / **short_url** — Direct link to the short
- **datetime** — Timestamp of when the short was published
- **caption** / **title** — The text description or title of the short
- **likes** — Total number of likes
- **comments** — Total count of comments
- **shares** — Number of times the short has been shared
- **views** — Number of views
- **comments_text** — A collection of raw text strings from the comments section
