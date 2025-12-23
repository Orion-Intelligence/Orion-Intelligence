# Dynamic: dynamic_user_email

## Description

Perform a dynamic search for user email addresses discovered in monitored breach and defacement data, returning exposed account metadata for further investigation and remediation.

This operation also fetches **real-time results from external dark-web intelligence APIs**, which may take additional time to process. During this period the API may return a pending response indicating that the upstream data collection is still running.

A typical in-progress response looks like:

```json
{
  "status": "pending",
  "progress": 10,
  "step": "running"
}
```

The request is an HTTP POST and expects a JSON body with a **text** object containing the lookup fields. Typical request payload:

```json
{
  "text": {
    "username": "",
    "email": "msmannan00@gmail.com"
  }
}
```

The **username** field is optional and can be left empty when only the email address should be used for the exposure search.

## Response

Dynamic search results listing exposed user email addresses and associated intelligence metadata.

The response is a JSON object containing a **result** array. Each element summarizes where the supplied identifier appears in known breaches or leak collections.

Example response:
```json
{
  "result": [
    {
      "m_title": "Records for provided queries",
      "m_url": "http://breachdbsztfykg2fdaq2gnqnxfsbj5d35byz3yzj73hazydk4vq72qd.onion",
      "m_base_url": "http://breachdbsztfykg2fdaq2gnqnxfsbj5d35byz3yzj73hazydk4vq72qd.onion",
      "m_content": "",
      "m_important_content": "Records were found in a data breach.",
      "m_network": "onion",
      "m_section": [],
      "m_content_type": ["stolen"],
      "m_screenshot": "",
      "m_weblink": [],
      "m_dumplink": [
        "Canva",
        "000WebHost.com",
        "Breach Compilation",
        "Exploit.In",
        "Collection #2",
        "Mathway (v2)",
        "Collection #5",
        "Slideteam.net",
        "Mathway (v1)"
      ],
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
- **m_title** — high level summary of the match context for the provided email or username
- **m_url** — primary reference URL where the aggregated breach information is hosted
- **m_base_url** — base URL of the breach or aggregation site
- **m_content** — optional textual details, which may be empty when only summary text is available
- **m_important_content** — short human-readable description of the exposure
- **m_network** — network type where the breach information is hosted (e.g. `onion`)
- **m_section** — list of sections or categories on the breach site that this record belongs to
- **m_content_type** — internal labels describing the nature of the data, such as `stolen`
- **m_screenshot** — identifier for a related screenshot image when available, or empty string if none
- **m_weblink** — list of clearnet URLs directly related to this breach record, if present
- **m_dumplink** — list of named breach collections or dump sources where the email was found
- **m_websites** — list of affected websites or services when this information is available
- **m_logo_or_images** — list of URLs pointing to logos or images associated with the victim or breach
- **m_leak_date** — date of the leak if known, otherwise null
- **m_data_size** — approximate size of the exposed dataset when provided, otherwise null
- **m_revenue** — optional revenue or financial impact metadata, when tracked by the source

Multiple entries can be returned in **result** if the same email or username was observed in more than one breach collection or dataset.
