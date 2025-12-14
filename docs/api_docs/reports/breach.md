# Report: breach

## Description

Get a specific breach monitoring report for a tracked website or asset by its report ID.

The request is an HTTP GET and accepts:
- **doc_id** (path) — string identifier of the breach report document
- **lang** (query, optional) — language code for localized narrative content when available.

No request body is required.

## Response

Single breach monitoring report document, returned as a JSON object representing the tracked website or asset and associated breach data.

Example response:
```json
{
  "m_title": "Columbus Regional Healthcare System",
  "m_url": "http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion/",
  "m_screenshot": "69993154316451142028569605097804",
  "m_base_url": "http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion",
  "m_content": "Columbus Regional Healthcare System has one of the highest volume and most experienced robotic surgical programs in Southeastern North Carolina. http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion/",
  "m_important_content": "Columbus Regional Healthcare System has one of the highest volume and most experienced robotic surgical programs in Southeastern North Carolina.",
  "m_network": "onion",
  "m_content_type": ["leaks"],
  "m_weblink": ["https://crhealthcare.org/"],
  "m_dumplink": ["https://crhealthcare.org/"],
  "m_company_name": "Columbus Regional Healthcare System",
  "m_location": ["US"],
  "m_team": "diaxin",
  "m_scrap_file": "_7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd",
  "m_language": ["en"],
  "m_domain": [
    "7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion",
    "crhealthcare.org"
  ],
  "m_hash": "1a17b87ad12262b38a81419c3d1cc8c57868ce62b9e32e042ff1b20a9aefacc0",
  "m_update_date": "2025-12-03T20:46:34.909368+00:00",
  "m_creation_date": "2025-12-03T20:46:34.909391+00:00",
  "content_type": ["ddos", "darkweb"]
}
```

Common fields and their meaning:
- **m_title** — human-readable title of the victim or breached asset
- **m_url** — leak or post URL on the darkweb/dump source
- **m_screenshot** — screenshot identifier (use `/api/search/breach/screenshot/{m_screenshot}`)
- **m_base_url** — base onion/clearnet URL of the leak site
- **m_content** — full textual content of the breach announcement
- **m_important_content** — condensed summary of the breach
- **m_network** — network type (e.g. `onion`)
- **m_content_type** — internal category labels (e.g. `leaks`)
- **m_weblink** — URLs pointing to the victim’s clearnet web presence
- **m_dumplink** — URLs referencing claimed leaked data
- **m_company_name** — normalized company/organization name
- **m_location** — list of associated country/region codes
- **m_team** — threat actor or ransomware group name
- **m_scrap_file** — internal scraper identifier
- **m_language** — detected language(s)
- **m_domain** — domains associated with the leak site and victim
- **m_hash** — internal hash used for deduplication and correlation
- **m_update_date** — last update timestamp
- **m_creation_date** — ingestion timestamp
- **content_type** — high-level classification tags (e.g. `ddos`, `darkweb`)


Additionally, the response may include automatically extracted indicators of compromise (IOCs). Only indicators that are actually found in the underlying content are returned; IOC fields with no data are omitted from the response.

Supported IOC / enrichment fields:
- **m_phone_number** — Phone Numbers
- **m_email** — Emails
- **m_domain** — Domains
- **m_country** — Country
- **m_url** — URLs
- **m_cve** — CVE & CWE
- **m_ip** — IP Addresses
- **m_yara_rule** — YARA Rules
- **m_encoded_urls** — Encoded URLs
- **m_file_paths** — File Paths
- **m_credit_card** — Credit Cards
- **m_org** — Organizations
- **m_company_name** — Company Names
- **m_person** — Persons
- **m_location** — Locations
- **m_language** — Languages
- **m_user_agents** — User Agents
- **m_asns** — ASNs
- **m_team** — Teams
- **m_hashtag** — Hashtags
- **m_mention** — Mentions
- **m_social_media_profiles** — Social Media Profiles
- **m_currencies** — Currencies
- **m_crypto_address** — Crypto Addresses
- **m_xmpp_addresses** — XMPP Addresses
- **m_enterprise_attack_tactics** — Enterprise ATT&CK Tactics
- **m_enterprise_attack_techniques** — Enterprise ATT&CK Techniques
- **m_document_id** — Document IDs
- **m_au_abn** — Australian IDs
- **m_us_passport** — US IDs
- **m_us_bank_number** — US Bank Numbers
- **m_platform** — Platform
- **m_author** — Author
- **m_industry** — Industry
- **m_scrap_file** — Scrap Script
