# Report: social

## Description

Get a specific social media intelligence report (for example posts by ransomware groups or other threat actors) by its report ID.

The request is an HTTP GET and accepts:
- **doc_id** (path) — string identifier of the social media report document
- **lang** (query, optional) — language code for localized narrative content.

No request body is required.

## Response

Social media intelligence report containing posts and activity from monitored social platforms, returned as a single JSON object.

Core response fields typically include:
- **m_sender_name** — display name or handle of the account that posted the content (e.g. `@lu3ky13`)
- **m_message_sharable_link** — full platform URL or deep link to the post
- **m_content** — normalized text content of the post, including hashtags, mentions and links
- **m_content_type** — internal labels describing the social collector/source type (e.g. `["social_collector"]`)
- **m_message_date** — date the post was created, in `YYYY-MM-DD` format
- **m_channel_url** — URL of the profile, channel or account page
- **m_message_id** — platform-specific unique identifier for the post
- **m_platform** — social platform name (e.g. `twitter`)
- **m_network** — network type for the source (typically `clearnet`)
- **m_views** — approximate view/impression count when available
- **m_comment_count** — number of comments or replies when available
- **m_likes** — number of likes or favorites when available
- **m_retweets** — number of reshares/retweets/boosts when available
- **content_type** — high-level classification tags used by other modules (e.g. `["ddos", "exploit", "rce"]`)
- **m_name** — profile display name (e.g. `lu3ky13`)
- **m_scrap_file** — internal scraper identifier or file prefix (e.g. `_twitter`)
- **m_language** — detected language(s) of the post content (e.g. `["en"]`)
- **m_hashtag** — list of hashtags extracted from the content
- **m_mention** — list of mentioned accounts/handles in the post
- **m_currencies** — list of currencies referenced in the post
- **m_domain** — list of domains referenced in links within the post
- **m_hash** — internal content hash used for deduplication and correlation
- **m_creation_date** — timestamp when the social post document was created/ingested by the system

Depending on the platform and event type, additional enrichment fields may be present, such as reaction breakdowns, attached media details or thread/conversation context.

Example response:
```json
{
  "m_sender_name": "@lu3ky13",
  "m_message_sharable_link": "https://x.com/lu3ky13/status/1852382887246541180",
  "m_content": "Remote Code Execution (RCE) thank you \n@nahamsec\n \n\nYay, I was awarded a $7,800 bounty on \n@Hacker0x01\n! \nhttps://\nhackerone.com/lu3ky-13 #TogetherWeHitHarder #bugbounty",
  "m_content_type": ["social_collector"],
  "m_message_date": "2024-11-01",
  "m_channel_url": "https://x.com/lu3ky13",
  "m_message_id": "1852382887246541180",
  "m_platform": "twitter",
  "m_network": "clearnet",
  "m_views": "23000",
  "m_comment_count": "15",
  "m_likes": "357",
  "m_retweets": "13",
  "m_name": "lu3ky13",
  "m_scrap_file": "_twitter",
  "m_domain": [
    "x.com",
    "hackerone.com"
  ],
  "m_language": ["en"],
  "m_hashtag": ["#bugbounty", "#togetherwehitharder"],
  "m_currencies": ["USD"],
  "m_mention": ["@hacker0x01", "@lu3ky13remote", "@nahamsec"],
  "m_hash": "07b76a8a449633b73d38cc4f7c55ae970e01e942ea525a5dc9f39225de347c2d",
  "m_creation_date": "2025-12-02T11:24:10.131332+00:00",
  "content_type": ["ddos", "exploit", "rce"]
}
```


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
