# Socail: recon_image_search

## Description

Performs a reverse image search to identify and locate a specific person or profile across various digital platforms. By uploading an image, the API scans social networks, professional portfolios, and public databases to find matching visual identities and their associated social handles.
This API is a powerful tool for OSINT (Open Source Intelligence), identity verification, and cross-platform profile linking.

Supported File Types:
- image: .png, .jpg, .jpeg


## Response

The API returns a list of identified platform matches, including the exact URL of the matched profile and the metadata associated with the visual hit.

Field semantics for each element under **result**:

- **metadata**
    - **platform** — The website or social network where a match was found (e.g., Upwork, Devpost)
    - **username** — The specific username or regional identifier found on the platform
    - **social_handle** — The registered handle associated with the visual identity
    - **url** — The base URL of the matching platform
    - **timestamp** — The exact date and time the search was processed
    - **image_path** — Internal reference path to the uploaded temporary file
    - **status** — The current status of the found profile (e.g., active)
- **data**
    - **title** — The page title of the matched result
    - **snippet** — A brief text summary or bio found alongside the image
    - **real_name** — The legal or displayed name of the individual (if publicly available)
    - **matched_page** — The direct URL to the profile or page where the image hit occurred

Example response:
```json
{
   "result": [
        {
            "metadata": {
                "platform": "upwork",
                "username": "en-gb",
                "social_handle": "upwork",
                "url": "https://www.upwork.com/",
                "timestamp": "2026-02-27T07:05:28.006703+00:00",
                "image_path": "tmp_uploads/5e9042deff014d24a17a042702891edd.png",
                "status": "active"
            },
            "data": {
                "title": "",
                "snippet": "",
                "real_name": null,
                "matched_page": "https://www.upwork.com/en-gb/freelancers/~018a513076547a14a0..."
            }
        }
    ]
}
```