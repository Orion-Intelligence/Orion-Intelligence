# Social: profile_videos

## Description

Scrapes and retrieves a detailed feed of videos from a requested social media account based on the provided platform and username. This API extracts video-specific data including engagement metrics, captions, and comments.
The API is useful for social media monitoring, sentiment analysis, and tracking video engagement on platforms like YouTube, TikTok, or Instagram.

Supported request fields:

- **platform** — name of the social media platform (e.g. YouTube, TikTok)
- **username** — account handle / username to scrape
- **max_videos** (optional) — maximum number of videos to retrieve (default: 5, max: 100)
- **max_comments** (optional) — maximum number of comments to retrieve per video (default: 10, max: 100)
- **comment_offset** (optional) — offset for comment pagination (default: 0)

Example request payload:

```json
{
  "platform": "YouTube",
  "username": "PewDiePie",
  "max_videos": 5,
  "max_comments": 10
}
```

## Response

The API returns a structured list of videos containing engagement statistics, captions, timestamps, and a collection of user comments.

Field semantics for each element under **result** typically include:

- **status** — Current state of the video
- **post_url** / **video_url** — Direct link to the video
- **datetime** — Timestamp of when the video was published
- **caption** / **title** — The text description or title of the video
- **likes** — Total number of likes
- **comments** — Total count of comments
- **shares** — Number of times the video has been shared
- **views** — Number of video views
- **comments_text** — A collection of raw text strings from the comments section
