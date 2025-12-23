# Dynamic: dynamic_cracked

## Description

Perform a dynamic search for cracked credentials or applications identified in breach and defacement datasets, highlighting high-risk compromised apps, accounts and password reuse exposure.

The request is an HTTP POST and expects a JSON body with a **text** object. For APK/app lookups, the backend currently supports using a Play Store URL to identify cracked or repackaged versions:

```json
{
  "text": {
    "playstore": "https://play.google.com/store/apps/details?id=com.jrzheng.supervpnfree&hl=en"
  }
}
```

The **playstore** field should contain a valid Google Play application URL for which cracked or modified artifacts should be discovered.

## Response

Dynamic search results listing cracked or modified application artifacts with related context and metadata.

The response is a JSON object containing a **result** array. Each element describes one discovered artifact, such as a cracked APK:

Example response:
```json
{
  "result": [
    {
      "m_app_name": "SuperVPN Fast VPN Client v3.0.3.apk",
      "m_package_id": "com.jrzheng.supervpnfree",
      "m_app_url": "https://filecr.com/android/supervpn-fast-vpn-client/",
      "m_network": "clearnet",
      "m_version": "3.0.3",
      "m_content_type": ["apk"],
      "m_download_link": [],
      "m_apk_size": null,
      "m_latest_date": "2025-10-30",
      "m_mod_features": ""
    }
  ]
}
```

Field semantics for each element under **result**:
- **m_app_name** — name of the discovered app artifact (often includes version and `.apk` suffix)
- **m_package_id** — application package identifier (e.g. `com.jrzheng.supervpnfree`)
- **m_app_url** — URL of the site hosting the cracked or redistributed app (e.g. warez/file hosting site)
- **m_network** — network type where the artifact is hosted (typically `clearnet`)
- **m_version** — discovered application version string
- **m_content_type** — internal labels describing artifact type (e.g. `apk`)
- **m_download_link** — list of direct download URLs for the artifact when available (may be empty)
- **m_apk_size** — APK file size when known, otherwise null
- **m_latest_date** — most recent observation date for this artifact
- **m_mod_features** — description of modifications, cracks or extra features, if provided by the source

Multiple entries can be returned in **result** if the same Play Store app is found across different cracked repositories or mirrors. Duplicate-looking entries may indicate separate sources with the same version and metadata.
