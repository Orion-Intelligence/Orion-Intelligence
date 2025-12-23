# Search: strategic

## Description

Search strategic intelligence reports using filters such as free-text query, network, date range, MITRE/STIX object type or IOC entities; returns metadata for matching strategic reports that can be opened via the strategic report API.

Request body (`search_general_param_model`):
- **q** — free-text search over title, content and enrichment fields (default: empty string)
- **page** — page number of the paginated result set (1-based)
- **network** — one of: `all`, `clearnet`, `onion`, `i2p`
- **content** — content-type key such as: `all`, `breach`, `credential`, `ransomware`, `phishing`, `scam`, `malware`, `infostealer`, `c2`, `ddos`, `exploit`, `leak`, `logs`, `vpn`, `carding`, `rat`, `keylogger`, `spyware`, `sqlinjection`, `xss`, `supplychain`, `insider`, `fraud`, `obfuscation`, `crack`, `cheats`, `cve`, `zero_day`, `rootkit`, `apt`, `threat_intel`, `darkweb`, `rce`, `lpe`, `exfiltration`, `persistence`, `reconnaissance`, `hack`, `news`, `credentials_common`, `war`
- **safe** — boolean flag enabling safe filtering of sensitive/adult content
- **daterange** — optional creation date range in `YYYY-MM-DD,YYYY-MM-DD` format applied to `m_creation_date`
- **matchtype** — logical operator for combining query / entity / filter clauses (`and` or `or`)
- **entity_filter** — IOC-style filter map of field → list of values. Example valid payload:
```json
{
  "entity_filter": {
    "m_country": ["pakistan"],
    "m_domain": ["example.com"],
    "m_person": ["john doe"]
  }
}
```
Supported fields include: `m_phone_number`, `m_email`, `m_domain`, `m_country`, `m_url`, `m_cve`, `m_ip`, `m_yara_rule`, `m_encoded_urls`, `m_file_paths`, `m_credit_card`, `m_org`, `m_company_name`, `m_person`, `m_location`, `m_language`, `m_user_agents`, `m_asns`, `m_team`, `m_hashtag`, `m_mention`, `m_social_media_profiles`, `m_currencies`, `m_crypto_address`, `m_xmpp_addresses`, `m_enterprise_attack_tactics`, `m_enterprise_attack_techniques`, `m_document_id`, `m_au_abn`, `m_us_passport`, `m_us_bank_number`, `m_platform`, `m_author`, `m_industry`, `m_scrap_file`.

Minimal example request:
```json
{
  "q": "pakistan",
  "page": 1,
  "entity_filter": { "m_country": ["pakistan"] },
  "matchtype": "or"
}
```

## Response

Strategic intelligence search results containing a paginated list of matching strategic documents.

The response is a JSON object with:
- **Result** — list of raw document records from the strategic index
- **Page_Count** — total number of pages available for the given query and filters

Each entry in **Result** is a metadata object that typically contains:
- **m_base_url** — base URL of the hidden service or site
- **m_url** — concrete crawled page URL
- **m_network** — network type, e.g. `onion`, `i2p`, `clearnet`
- **m_title** — normalized page or thread title
- **m_meta_description** — HTML meta description where available
- **m_content** — normalized full text content
- **m_important_content** — densified or highlighted important content
- **m_images** — list of image URLs extracted from the page
- **m_sub_url** — list of related sub-URLs discovered on the page
- **m_validity_score** — internal confidence/validity score (0–100)
- **m_content_type** — list of high-level classification labels such as `news`, `adult`, etc.
- **m_clearnet_links** — list of clearnet links referenced in the document
- **m_country** — list of detected country entities
- **m_location** — list of detected location/place entities
- **m_person** — list of detected person entities
- **m_organization** — list of detected organizations/platforms
- **m_language** — detected language codes
- **m_domain** — list of associated domains
- **m_update_date** — last update timestamp
- **m_creation_date** — first-seen/ingestion timestamp
- **rank_index** — internal index/model used for ranking (for example `generic_model`)
- **_score** — relevance score from the search engine
- **_rank** — rank of the document in the current result page
- Additional internal fields such as `m_hash_content`, `m_hash_url`, `m_hash` and `m_embedding` may also be present.

Example response:
```json
{
  "Result": [
    {
      "m_base_url": "http://bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion",
      "m_url": "http://bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion/news/world/asia",
      "m_network": "onion",
      "m_title": "asia latest & updates | bbc news",
      "m_meta_description": "get all the latest news, live updates and content about asia from across the bbc.",
      "m_content": "you are now following asia at least 36 dead as fire engulfs hong kong tower blocks ...",
      "m_important_content": "you are now following asia updates from your news topics will appear in firefighters are struggling ...",
      "m_images": [
        "https://ichef.bbcws2hcewhlhutm5qrjkekkg3eraphuc7ba7qh4jeinhibnx3ymxaqd.onion/ace/standard/480/cpsprodpb/726a/live/92a91ae0-cab6-11f0-8c06-f5d460985095.jpg",
        "https://ichef.bbcws2hcewhlhutm5qrjkekkg3eraphuc7ba7qh4jeinhibnx3ymxaqd.onion/ace/standard/480/cpsprodpb/c5d3/live/28ebb110-cabd-11f0-a892-01d657345866.jpg"
      ],
      "m_sub_url": [
        "http://bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion/news/topics/c2vdnvdg6xxt",
        "http://bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion/news/world"
      ],
      "m_validity_score": 65,
      "m_content_type": ["news", "adult"],
      "m_clearnet_links": [
        "instagram.com/bbcnews/",
        "tiktok.com/@bbcnews?lang=en",
        "facebook.com/bbcnews",
        "twitter.com/BBCNews"
      ],
      "m_country": [
        "India", "Japan", "China", "Hong Kong", "Pakistan",
        "New Zealand", "Australia", "Ukraine", "Israel"
      ],
      "m_location": [
        "India", "UK", "China", "South East Asia", "Hong Kong",
        "New Zealand", "Australia", "Thai", "Ukraine", "Asia"
      ],
      "m_person": ["Trump", "Xi", "Robert Irwin"],
      "m_organization": ["Bollywood"],
      "m_language": ["en"],
      "m_domain": [
        "facebook.com",
        "twitter.com",
        "instagram.com",
        "tiktok.com",
        "bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion"
      ],
      "m_update_date": "2025-11-26T18:05:48.003165+00:00",
      "m_hash_content": "8207ff33a9358d0aa0be3f9c00f0d7a29b9a1424055ad9d69c3a84d7f793f11d",
      "m_hash_url": "b9b9ababd96907acb0666bf6791d93a74162de5dd96e68eceb76394e805c30ab",
      "m_hash": "a7e0dd8c425614b37ab0acd5a793a786503779dce49b1b46dd93f5db014bbc11",
      "m_creation_date": "2025-11-26T18:05:48.003504+00:00",
      "rank_index": "generic_model",
      "_score": 0.44736758,
      "_rank": 1
    }
  ],
  "Page_Count": 1
}
```
