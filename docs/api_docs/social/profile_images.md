# Socail: profile_images

## Description

Retrieves a collection of images associated with a specific social media profile. This API performs a deep search across indexed web resources to locate profile pictures, shared posts, and media assets linked to the requested username and platform.
The API is particularly effective for digital asset discovery, profile verification, and visual content archival.

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

The API returns an object containing an array of image metadata, including direct source URLs, thumbnails for optimized previewing, and the original page titles where the images were discovered.

Field semantics for each element under **result**:

- **searched_username** — The account handle used to perform the image search
- **platform** — The social media network targeted
- **total_found** — The count of unique image assets successfully retrieved
- **images**
    - **image_url** — The direct high-resolution link to the hosted image
    - **thumbnail** — A compressed version of the image for faster loading/previews
    - **title** — The metadata title or caption associated with the image source
    - **source** — The search engine or index used to locate the media

Example response:
```json
{
    "result": {
        "searched_username": "sarcaxxm",
        "platform": "instagram",
        "total_found": 10,
        "images": [
            {
                "image_url": "https://lookaside.instagram.com/seo/google_widget/crawler/?media_id=3625261035619386821",
                "thumbnail": "https://tse2.mm.bing.net/th/id/OIP.Ie7AsRvJ_QTzkNIZkQ9ZrAHaJQ?pid=Api",
                "title": "Sarcaxxm🇵🇸 | good for us tho | Instagram",
                "source": "Bing"
            }
        ]
    }
}
```