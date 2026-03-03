# Socail: profile_global_presence

## Description

Scans a vast ecosystem of over 100+ social networks, professional forums, and niche community sites to identify profiles associated with a specific name or query. This API is designed for digital reconnaissance, identity mapping, and background verification, providing a comprehensive view of a target's online presence across fragmented platforms.
The API distinguishes between direct URL matches (active) and potential engine-indexed matches (suggested), ensuring high-confidence results.

Supported request fields:

- **query** — The name, alias, or search string to locate across the web.

Example request payload:

```json
{
    "query": "Usman Ali"
}
```

## Response

The API returns a categorized array of results. Each entry contains platform-specific metadata and, where available, snippet data scraped from the profile.

Field semantics for each element under **result**:

- **metadata**
    - **platform** — The name of the service or website where the match was found
    - **username/social_handle** — The specific identifier or handle used on that platform
    - **url** — The direct link to the profile or the platform's search result
    - **status** 
        - active: High-confidence match based on direct URL structure
        - suggested: Potential match found via global search indexing
- **Data**
    - **title** — The display title of the profile page
    - **snippet** — A summary of the bio, follower count, or recent activity
    - **real_name** — The verified name displayed on the profile

Example response:
```json
{
    "result": [
        {
            "metadata": {
                "platform": "instagram",
                "username": "usman_unchained",
                "social_handle": "usman_unchained",
                "url": "https://www.instagram.com/",
                "timestamp": "2026-02-27T07:19:35.570506+00:00",
                "status": "suggested"
            },
            "data": {
                "title": "Usman Ali | Online Mental Health Coach",
                "snippet": "132K Followers, 3,859 Following... Guiding Muslim Professionals...",
                "real_name": "Usman Ali"
            }
        }
    ]
}
```