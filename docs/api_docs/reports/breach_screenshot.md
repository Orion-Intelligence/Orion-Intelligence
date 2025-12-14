# Report: breach_screenshot

## Description

Retrieve the screenshot image associated with a specific breach report, stored in WebP format.

The request is an HTTP GET and accepts:
- **filename** (path) — base filename of the screenshot without extension.

No request body is required.

## Response

WebP screenshot image that visually represents the breached website or resource described in the associated breach report. The service automatically appends the `.webp` extension, and the response payload is the raw image bytes.

Example:
- Request: `GET /api/search/breach/screenshot/69993154316451142028569605097804`
- Effective file retrieved: `69993154316451142028569605097804.webp`
- Response headers: `Content-Type: image/webp` with the binary image data in the body.
