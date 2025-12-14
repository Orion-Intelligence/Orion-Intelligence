# Dynamic: dynamic_social

## Description

Perform a dynamic search for social media identifiers and related email addresses found in breach and defacement data, helping uncover exposed or impersonated social accounts.

The request is an HTTP POST and expects a JSON body with a **text** object containing the social handle or username to look up.

Example request payload:

```json
{
  "text": {
    "username": "bitcoin"
  }
}
```

The **username** field should contain the social identifier to be resolved across monitored platforms and breach-related datasets.

## Response

Dynamic search results listing exposed or observed social media identifiers and related contact details.

The response is a JSON object containing a **result** array. Each element describes one occurrence of the provided username on a monitored platform.

Example response:
```json
{
  "result": [
    {
      "m_title": "User bitcoin found on https://twitter.com",
      "m_url": "https://twitter.com/bitcoin",
      "m_base_url": "https://twitter.com",
      "m_content": "",
      "m_important_content": "Found on: https://twitter.com/bitcoin",
      "m_network": "clearnet",
      "m_section": [],
      "m_content_type": ["stolen"],
      "m_screenshot": "",
      "m_weblink": ["https://twitter.com/bitcoin"],
      "m_dumplink": ["https://twitter.com/bitcoin"],
      "m_websites": [],
      "m_logo_or_images": [],
      "m_leak_date": null,
      "m_data_size": null,
      "m_revenue": null
    },
    {
      "m_title": "User bitcoin found on https://clubhouse.com",
      "m_url": "https://clubhouse.com/@bitcoin",
      "m_base_url": "https://clubhouse.com",
      "m_content": "",
      "m_important_content": "Found on: https://clubhouse.com/@bitcoin",
      "m_network": "clearnet",
      "m_section": [],
      "m_content_type": ["stolen"],
      "m_screenshot": "",
      "m_weblink": ["https://clubhouse.com/@bitcoin"],
      "m_dumplink": ["https://clubhouse.com/@bitcoin"],
      "m_websites": [],
      "m_logo_or_images": [],
      "m_leak_date": null,
      "m_data_size": null,
      "m_revenue": null
    }
  ]
}
```

Field semantics for each element under **result**:
- **m_title** — summary line indicating the username and the platform where it was found
- **m_url** — direct URL to the profile or page for the discovered account
- **m_base_url** — base URL of the platform (e.g. `https://twitter.com`, `https://clubhouse.com`)
- **m_content** — optional additional text content, which may be empty when only metadata is stored
- **m_important_content** — short human-readable description of the finding (for example `Found on: https://twitter.com/bitcoin`)
- **m_network** — network type where the account is hosted (typically `clearnet`)
- **m_section** — optional list of sections/categories on the platform or in the underlying dataset
- **m_content_type** — internal classification labels for the record (e.g. `stolen` to indicate possible compromise or risk)
- **m_screenshot** — identifier for a screenshot of the profile or page, when available, or empty string
- **m_weblink** — list of direct profile URLs for the discovered account on that platform
- **m_dumplink** — list of links or references within breach/collection data pointing to this account
- **m_websites** — list of associated websites when available
- **m_logo_or_images** — list of URLs for logos, avatars or images tied to the account
- **m_leak_date** — date of the leak or earliest observation if known, otherwise null
- **m_data_size** — size of associated dataset when this information is available, otherwise null
- **m_revenue** — optional revenue/financial impact metadata when tracked by the backend

Multiple entries can be returned in **result** when the same username is observed on different social platforms or in various breach-related datasets.
