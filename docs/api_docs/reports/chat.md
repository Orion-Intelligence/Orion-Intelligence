# Report: chat

## Description

Get a specific chat intelligence report focused on messaging platforms such as Telegram by its report ID.

The request is an HTTP GET and accepts:
- **doc_id** (path) — string identifier of the chat report document
- **lang** (query, optional) — language code used to localize analytical summaries when available.

No request body is required.

## Response

Chat intelligence report consolidating one chat message or a small thread (for example from Telegram), returned as a single JSON object.

Core response fields typically include:
- **m_content** — normalized text content of the message (main body text)
- **m_caption** — original caption text, often mirroring **m_content** for media posts
- **m_message_date** — message date in `YYYY-MM-DD` format
- **m_message_id** — platform-specific message identifier (e.g. Telegram message id)
- **m_message_sharable_link** — deep link to the message (e.g. `https://t.me/...`)
- **m_channel_id** — internal or platform channel identifier
- **m_views** — number of views or impressions for the message
- **m_sender_name** — human-readable sender name (may include additional text)
- **m_sender_username** — sender username/handle (e.g. Telegram `@` handle)
- **m_message_type** — list of message types (e.g. `["photo"]`, `["text"]`)
- **m_media_url** — URL pointing to the media or message (for example a Telegram web link)
- **m_media_caption** — caption/description related to the attached media
- **m_reply_to_message_id** — message id of the parent message when this is a reply
- **m_message_status** — message processing status in the system (e.g. `success`)
- **m_channel_name** — human-readable channel name (e.g. `Mash`)
- **m_weblink** — list of additional links associated with the channel or message (e.g. invite links)
- **m_users** — list of user identifiers or usernames referenced in the message (e.g. `["Tiarkasir"]`)
- **m_content_type** — high-level internal labels for the content (e.g. `["text"]`)
- **m_sender_id** — numeric sender id on the platform
- **m_sender_is_bot** — boolean indicating whether the sender is a bot
- **m_is_forwarded** — boolean indicating whether the message is a forwarded message
- **m_forwarded_date** — original forward date when **m_is_forwarded** is true
- **m_is_reply** — boolean indicating whether the message is a reply
- **m_pinned** — boolean indicating whether the message is pinned in the channel
- **m_location** — list of location strings extracted from the content (e.g. city or area names)
- **m_social_media_profiles** — list of social profile URLs mentioned in the message content
- **m_domain** — list of domains extracted from links in the message
- **m_platforms** — list of platforms referenced or linked (e.g. `["instagram"]`)
- **m_cluster_id** — internal logical cluster/group identifier for related chat items (e.g. `chat`)
- **m_document_id** — internal document id used by the system for this chat record
- **m_hash** — internal content hash used for deduplication and correlation
- **m_creation_date** — timestamp when the message document was created/ingested
- **m_edit_date** — last edit timestamp for the message (if it was edited)
- **m_organization** — list of organizations or entities mentioned (e.g. `Boeing`)
- **m_language** — detected language(s) of the message content (e.g. `["ru"]`)

Depending on the platform and message type, additional enrichment fields may be present, such as media metadata, reaction counts or extended thread context.

Example response:
```json
{
  "m_content": "Причина сигнала бедствия Boeing 777-200 — возгорание одного из двигателей. На данный момент пожар потушен. Сейчас самолёт вырабатывает топливо, готовясь к возвращению в Домодедово в 22:40. Экипаж работает штатно, паники на борту нет. UPD. На судне находятся 412 пассажиров и 13 членов бортовой команды. Подписывайся на Mash",
  "m_caption": "Причина сигнала бедствия Boeing 777-200 — возгорание одного из двигателей. На данный момент пожар потушен. Сейчас самолёт вырабатывает топливо, готовясь к возвращению в Домодедово в 22:40. Экипаж работает штатно, паники на борту нет. UPD. На судне находятся 412 пассажиров и 13 членов бортовой команды. Подписывайся на Mash",
  "m_message_date": "2025-12-03",
  "m_message_id": "69893",
  "m_message_sharable_link": "https://t.me/mash/69893",
  "m_channel_id": "1117628569",
  "m_views": "401445",
  "m_sender_name": "TIAR None",
  "m_sender_username": "Tiarkasir",
  "m_message_type": ["photo"],
  "m_media_url": "https://t.me/mash/69893",
  "m_media_caption": "9 9 1 0 0 0 2 3 0 0 RUKO SENTRA NIAGA KALIMALANG BLOK B-1 NO.24 JALAN AHMAD YANI, KAYURINGIN BELAKANG MALL BCP •QEYSA •LENKA •MEMEY •SANSAN •KHANZA •ALEXA •ANITA •SENA •ESSA •NAOMI •MPIE •VITTA •CATRIN •MUTIA •FELISHA •ARRA •LALA •KIKI •EVA ID INSTAGRAM https://www.instagram.com/new_king_spa_bekasi_selatan?igsh=Znk4cWY3OG1udzZ3 BOKING DISINI @Tiarkasir LOKASI https://maps.app.goo.gl/sNzBhjnHhk7bgF2WA WA https://wa.me/qr/YGHM5GCX7SBFG1 SAYA TUNGGU KEHADIRANNYA SELALU BOS KU",
  "m_reply_to_message_id": "69892",
  "m_message_status": "success",
  "m_channel_name": "Mash",
  "m_weblink": ["https://t.me/+mBgDVq0QTftmY2Ji"],
  "m_users": ["Tiarkasir"],
  "m_content_type": ["text"],
  "m_sender_id": "1117628569",
  "m_sender_is_bot": false,
  "m_is_forwarded": false,
  "m_forwarded_date": "2025-11-05 08:29:26",
  "m_is_reply": true,
  "m_pinned": false,
  "m_location": ["KAYURINGIN"],
  "m_social_media_profiles": ["https://www.instagram.com/new_king_spa_bekasi_"],
  "m_domain": ["instagram.com"],
  "m_platforms": ["instagram"],
  "m_cluster_id": "chat",
  "m_document_id": "e233d6042cec2a3239a701d0eebebe3430f72543c0fd0e20de00f228808cafa5",
  "m_hash": "e233d6042cec2a3239a701d0eebebe3430f72543c0fd0e20de00f228808cafa5",
  "m_creation_date": "2025-12-03T21:36:59.858292+00:00",
  "m_edit_date": "2025-12-03 19:40:44",
  "m_organization": ["Boeing"],
  "m_language": ["ru"]
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
