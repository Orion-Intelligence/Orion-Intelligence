# Search: social

## Description

Search social media intelligence reports using free-text queries and structured filters such as hashtag, platform, organization, domain, or country.

The request is an HTTP POST with a JSON body matching the `search_social_param_model` schema:

```json
{
  "q": "#ransomware data leak",
  "page": 1,
  "content": "all",
  "category": "all",
  "network": "all",
  "daterange": "2025-11-01,2025-12-07",
  "matchtype": "or",
  "platform": "mastodon",
  "must": false,
  "entity_filter": {
    "m_hashtag": ["#ransomware", "#databreach"],
    "m_organization": ["ThreatFox"],
    "m_domain": ["ioc.exchange"]
  }
}
```

Field semantics (request):
- **q** — free-text query applied to normalized social post content (message text, hashtags, mentions, URLs).
- **page** — page number for paginated search results (1-based).
- **content** — content-type key such as `all`, `breach`, `credential`, `ransomware`, `phishing`, `scam`, `malware`, `infostealer`, `c2`, `ddos`, `exploit`, `leak`, `logs`, `vpn`, `carding`, `rat`, `keylogger`, `spyware`, `sqlinjection`, `xss`, `supplychain`, `insider`, `fraud`, `obfuscation`, `crack`, `cheats`, `cve`, `zero_day`, `rootkit`, `apt`, `threat_intel`, `darkweb`, `rce`, `lpe`, `exfiltration`, `persistence`, `reconnaissance`, `hack`, `news`, `credentials_common`, `war`; derived from internal `content_type` tags.
- **category** — ML-based classifier for social content categories (campaign/theme); use `all` to disable.
- **network** — network filter for the underlying source (`all`, `clearnet`, `onion`, `i2p`); social content is typically `clearnet`.
- **daterange** — optional ingestion/date range in `YYYY-MM-DD,YYYY-MM-DD` format.
- **matchtype** — logical operator (`or` or `and`) controlling how query and filters are combined.
- **platform** — social platform filter (e.g. `twitter`, `mastodon`, `telegram`, `discord`), mapped to the underlying **m_platform** field.
- **must** — when true, all values in **entity_filter** are treated as mandatory constraints.
- **entity_filter** — IOC/enrichment filter map where keys are enrichment fields (for example `m_hashtag`, `m_mention`, `m_organization`, `m_domain`, `m_country`, `m_language`) and values are lists of values that documents must/may contain depending on **must**.

## Response

Social media intelligence search results containing metadata for each matching social report.

The response is a JSON object with pagination info and a list of social post summaries:
- **Result** — list of normalized social media entries
- **Suggestions** — optional list of query suggestions (may be empty)
- **Page_Count** — total number of result pages as a floating-point value

Each result usually exposes a subset of the social report fields:
- **m_sender_name** — display name or handle of the posting account (e.g. `@abuse_ch`)
- **m_message_sharable_link** — platform-specific link/path to the post (e.g. `https://x.com/anyrun_app/status/1861024182210900357`)
- **m_content** — normalized text content, including hashtags, mentions and links
- **m_content_type** — internal labels describing the social collector/source type (e.g. `["social_collector"]`)
- **m_message_date** — date the post was created in `YYYY-MM-DD` format
- **m_channel_url** — URL of the profile, channel or account page
- **m_message_id** — platform-specific unique identifier
- **m_platform** — social platform name (e.g. `twitter`, `mastodon`)
- **m_network** — network type (typically `clearnet`)
- **content_type** — high-level classification tags (e.g. `["malware", "ddos", "threat_intel", "news"]`)
- **m_username** — usernames/handles associated with the posting account
- **m_scrap_file** — internal scraper identifier
- **m_organization** — organizations or projects referenced
- **m_language** — detected languages
- **m_hashtag** — list of hashtags extracted from the content
- **m_mention** — list of mentioned accounts
- **m_domain** — list of referenced domains
- **m_hash** — internal content hash
- **m_creation_date** — ingestion timestamp
- optionally, IOC/enrichment fields such as `m_ip`, `m_url`, `m_cve`, `m_crypto_address`, etc.

Example response:
```json
{
  "Result": [
    {
      "m_sender_name": "@anyrun_app",
      "m_message_sharable_link": "https://x.com/anyrun_app/status/1861024182210900357",
      "m_content": "ALERT: Potential ZERO-DAY, Attackers Use Corrupted Files to Evade Detection (1/3)...",
      "m_content_type": ["social_collector"],
      "m_message_date": "2024-11-25",
      "m_channel_url": "https://x.com/anyrun_app",
      "m_message_id": "1861024182210900357",
      "m_platform": "twitter",
      "m_network": "clearnet",
      "content_type": ["credential", "ransomware", "phishing", "malware", "ddos", "exploit", "xss"],
      "m_username": ["anyrun_app"],
      "m_scrap_file": "_twitter",
      "m_language": ["en"],
      "m_hashtag": ["#ANYRUN", "#antivirus"],
      "m_mention": ["@anyrun_appalert"],
      "m_domain": ["x.com"],
      "m_hash": "7872303ba1faefc7d645ecd551c7dfcf64f7d963413e66beda38dc9161e4c43a",
      "m_creation_date": "2025-12-04T12:38:19.665394+00:00"
    }
  ],
  "Suggestions": [],
  "Page_Count": 278.1
}
```
