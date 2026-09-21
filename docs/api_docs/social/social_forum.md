# Social: social_forum

## Description

Scans forums and community discussion boards to identify profiles or discussions associated with a specific query. This API is designed for digital reconnaissance, mapping out forum activity, and uncovering online discussions related to the target.

Supported request fields:

- **query** — The name, alias, or search string to locate across forums.
- **max_results** (optional) — maximum number of results to retrieve (default: 50, max: 100)

Example request payload:

```json
{
  "query": "hacker123",
  "max_results": 50
}
```

## Response

The API returns a categorized array of results containing forum-specific metadata and potential profile or discussion matches.

Field semantics for each element under **result** typically include:

- **metadata**
    - **platform** — The name of the forum or community site
    - **username** — The specific identifier or handle used on that platform
    - **url** — The direct link to the forum profile or discussion
- **Data**
    - **title** — The display title of the forum page or thread
    - **snippet** — A summary of the user's bio or recent forum posts
