# Dynamic: software_scan

## Description

Scan for software or game titles to identify the presence of cracked, pirated, or unofficial distributions across indexed sources.

This scan is typically used to detect:
- Cracked software
- Pirated games
- Modded or repackaged distributions
- Unofficial download sources

## Request

The request is an HTTP POST and expects a JSON body using a dynamic text-based schema.

```json
{
  "text": {
    "name": "gta"
  }
}
```

## Request Fields

- **text** — query container
  - **name** — software or game name to scan  
    Examples:
    - `gta`
    - `grand theft auto`
    - `photoshop`
    - `windows 11`

## Response

Scan results are returned as a JSON object with a top-level **result** array.

Each object in the **result** array represents a discovered software or game entry from indexed sources.

### Result Fields

Each result item may contain:

- **m_app_name** — detected software or game title
- **m_package_id** — normalized or derived identifier
- **m_app_url** — source URL where the software was found
- **m_network** — source network (e.g. `clearnet`)
- **m_version** — version, build, size, or release information
- **m_content_type** — content classification tags (e.g. `pc_game`)
- **m_download_link** — download links if available
- **m_apk_size** — APK size when applicable
- **m_latest_date** — latest observed publication or update date
- **m_mod_features** — mod or feature notes

### Example Response

```json
{
  "result": [
    {
      "m_app_name": "Grand Theft Auto V / GTA 5 (Legacy) – v1.0.3411/1.70 + NVE Platinum Modpack + Bonus Content",
      "m_package_id": "https---fitgirl-repacks.site-grand-theft-auto-v-",
      "m_app_url": "https://fitgirl-repacks.site/grand-theft-auto-v/",
      "m_network": "clearnet",
      "m_version": "(thanks to AR-81!): 114 GB",
      "m_content_type": ["pc_game"],
      "m_download_link": [],
      "m_apk_size": null,
      "m_latest_date": "2024-12-17",
      "m_mod_features": ""
    }
  ]
}
```
