# Extension: extension_artifacts

## Description

Serves the built extension artifacts (browser extensions, policy configurations, and update manifests) for installation on Chrome or Firefox. This endpoint corresponds to `GET /ext/{artifact:path}`.

**Path Parameters:**
- **artifact** — The relative path to the requested extension file (e.g., `chrome/orion-social-chrome.crx`, `firefox/orion-social-firefox.xpi`, etc.).

Supported files include:
- `.crx` (Chrome Extension)
- `.zip` (Unpacked Chrome Extension)
- `updates.xml` / `updates.json`
- Enterprise Policy configurations (`.json`, `.reg`, `.mobileconfig`)

## Response

The API returns the requested file as a downloadable binary or configuration text file with the appropriate `Content-Type` headers.
