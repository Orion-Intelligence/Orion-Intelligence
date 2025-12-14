# Search: telegram

## Description

Search Telegram-based chat intelligence and return metadata for matching chat reports.

This endpoint executes a keyword and IOC-aware search over Telegram chat collections (channels, groups, and supergroups) ingested by Orion.

The request is an HTTP POST and expects a JSON body matching the `search_chat_param_model` schema.

Typical request payload:

```json
{
  "q": "ransomware leak",
  "page": 1,
  "content": "all",
  "category": "all",
  "network": "all",
  "daterange": "2025-12-01,2025-12-08",
  "entity": "",
  "matchtype": "or",
  "platform": "telegram",
  "must": false,
  "messagedate": "",
  "entity_filter": {
    "m_team": ["example_team"],
    "m_domain": ["example.com"]
  }
}
```

Field semantics (request):
- **q** — free-text query string matched against message text, caption and selected metadata.
- **page** — result page number for pagination (1-based).
- **content** — logical content category of chat documents (for example `all`, `text`, `media`).
- **category** — high-level ML category (for example `all`, `leak`, `exploit`, `general`).
- **network** — network selector, typically `all` or `clearnet` for Telegram web endpoints.
- **daterange** — ingestion/update date range in `YYYY-MM-DD,YYYY-MM-DD` format.
- **entity** — free-text IOC / entity string to match across enriched fields (domains, hashes, emails, etc.).
- **matchtype** — logical operator used when combining query and filters (`or` or `and`).
- **platform** — platform name; for this endpoint it is usually `telegram`.
- **must** — when `true`, entities specified in **entity**/**entity_filter** must be present in results.
- **messagedate** — explicit message date filter in `YYYY-MM-DD` format (platform message date).
- **entity_filter** — structured IOC filter (e.g. `m_team`, `m_domain`, `m_hashtag`) where each key is an
  enriched field and the value is a list of required values.

## Response

Telegram chat search results containing paginated metadata for matching chat intelligence reports.

Typical response fields:
- **total** — total number of chat records matching the query and filters.
- **page** — current result page number.
- **results** — list of chat message objects, each summarizing one Telegram message or small thread.

Each element under **results** commonly includes:
- **m_message_id** — platform-specific message identifier.
- **m_channel_id** — internal or platform channel identifier.
- **m_channel_name** — human-readable channel name.
- **m_sender_name** — display name of the sender.
- **m_sender_username** — sender username/handle.
- **m_message_date** — message date in `YYYY-MM-DD` format.
- **m_content** — normalized message text.
- **m_caption** — media caption (if applicable).
- **m_message_sharable_link** — deep link to the message (e.g. `https://t.me/...`).
- **m_media_url** — URL of attached media (if present).
- **m_message_type** — list of message types (e.g. `["text"]`, `["photo"]`).
- **m_views** — view/impression count (if available).
- **m_network** — network classification (typically `clearnet`).
- **m_content_type** — internal classification labels for the chat item.
- **m_language** — detected language(s) of the message.
- **m_domain, m_hashtag, m_mention, m_team, m_location** — enriched IOCs/entities when present.

Example response:
```json
{
  "total": 42,
  "page": 1,
  "results": [
    {
      "m_message_id": 123456,
      "m_channel_id": 987654321,
      "m_channel_name": "Example Ransomware Channel",
      "m_sender_name": "Example Threat Actor",
      "m_sender_username": "example_actor",
      "m_message_date": "2025-12-07",
      "m_message_sharable_link": "https://t.me/example_channel/123456",
      "m_content": "New victim announced: ExampleCorp. Data will be leaked in 7 days.",
      "m_caption": "",
      "m_media_url": "",
      "m_message_type": ["text"],
      "m_views": 10543,
      "m_network": "clearnet",
      "m_content_type": ["text"],
      "m_language": ["en"],
      "m_team": ["example_ransom_group"],
      "m_domain": ["examplecorp.com"],
      "m_location": ["US"],
      "m_hashtag": ["#ransomware"],
      "m_mention": [],
      "m_social_media_profiles": [],
      "m_hash": "abc123...",
      "m_creation_date": "2025-12-07T09:15:00Z"
    }
  ]
}
```
