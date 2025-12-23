SYSTEM_INFO_DOCS = {
    "directory": {
        "description": (
            "Retrieve the complete list of monitored and crawled sources across Clearnet, Onion, and I2P.\n\n"
            "Supported filters:\n"
            "- **page:** page number of the result\n"
            "- **network:** all, onion, i2p, clearnet\n"
            "- **index:** all, general, leak, defacement, chat, exploit, twitter, reddit\n"
            "- **content_type:** all, general, forums, news, stolen, drugs, hacking, marketplaces, cryptocurrency, "
            "leaks, adult, tracking, chat, social\n"
            "- **daterange:** optional date range (e.g., `2025-12-03,2025-12-18`)\n\n"
            "Results include URL, detected content type(s), index classification, network layer, and last-update metadata."
        ),
        "response_description": (
            "Paginated directory results containing fields:\n"
            "- **url** — source address\n"
            "- **content_type** — detected source categories\n"
            "- **index_type** — assigned indexing group\n"
            "- **leak_model_last_update / generic_model_last_update** — last time parsed\n"
            "- **network_type** — clearnet / onion / i2p\n"
            "- **name** — resolved source identifier (if applicable)"
            "\n\nExample response:\n"
            "```json\n"
            "{\n"
            '  "total": 12345,\n'
            '  "page": 1,\n'
            '  "results": [\n'
            "    {\n"
            '      "url": "http://exampleonionforumabcdef.onion/",\n'
            '      "content_type": ["forums", "hacking"],\n'
            '      "index_type": "general",\n'
            '      "leak_model_last_update": "2025-12-05T10:15:00Z",\n'
            '      "generic_model_last_update": "2025-12-04T09:00:00Z",\n'
            '      "network_type": "onion",\n'
            '      "name": "Example Darknet Forum"\n'
            "    }\n"
            "  ]\n"
            "}\n"
            "```\n"
        ),
    },

    "dumps": {
        "description": (
            "Retrieve the complete catalog of breach dumps collected from Telegram channels and monitored websites.\n\n"
            "Supported filters:\n"
            "- **page:** page number of the result set\n"
            "- **source:** all, telegram, websites (origin of the leak, e.g., Telegram or monitored websites)\n"
            "- **group:** leak group or channel name derived from the source (e.g., Telegram channel name)\n"
            "- **status:** all, parsed, unparsed\n"
            "- **daterange:** optional date range string (e.g., `2025-01-01,2025-01-15`)\n"
            "- **q:** free-text search query applied to `leak_url`, `source`, `group`, and other indexed fields (default: `*`)\n\n"
            "Common use-cases include identifying newly leaked dumps, retrieving unparsed dumps for analysis, "
            "or filtering dumps from specific threat groups or Telegram channels."
        ),
        "response_description": (
            "Paginated dump catalog response containing:\n"
            "- **total_count** — total number of dumps matching filters\n"
            "- **page** — current page number\n"
            "- **mDumpCallbackLinks** — list of dump entries, each containing:\n"
            "  - **leak_url** — raw dump reference or asset URL\n"
            "  - **source** — origin of the leak (e.g., telegram, websites)\n"
            "  - **group** — associated leak group or channel name derived from the source (e.g., Telegram channel name)\n"
            "  - **link** — direct reference link to the dump message or file\n"
            "  - **parsed_status** — whether the dump has been parsed/processed\n"
            "  - **created_at** — first-seen timestamp of the dump"
            "\n\nExample response:\n"
            "```json\n"
            "{\n"
            '  "total_count": 152,\n'
            '  "page": 1,\n'
            '  "mDumpCallbackLinks": [\n'
            "    {\n"
            '      "leak_url": "https://t.me/example_leaks/1234",\n'
            '      "source": "telegram",\n'
            '      "group": "example_leak_group",\n'
            '      "link": "https://t.me/example_leaks/1234",\n'
            '      "parsed_status": "parsed",\n'
            '      "created_at": "2025-12-03T21:15:23Z"\n'
            "    }\n"
            "  ]\n"
            "}\n"
            "```\n"
        ),
    },
    "insight": {
        "description": (
            "Retrieve system-wide analytics and high-level intelligence metrics across all monitored data sources.\n\n"
            "This endpoint does not take any parameters and returns pre-aggregated insights computed by Orion.\n\n"
            "Returned analytics include (per data type such as general, leak, defacement):\n"
            "- Document volume and activity over time (`document_count`, `updated_5_days_ago`, `updated_9_days_ago`)\n"
            "- Freshness indicators (`most_recent`, `oldest_update`)\n"
            "- Enrichment density (`url_document_count`, `archive_document_count`, `email_document_count`, `phone_document_count`, `clearnet_document_count`)\n"
            "- Common content characteristics (`common_types`, `top_team`, `common_server`, `unique_base_urls`, `dumps_document_count`, etc.)\n\n"
            "Each metric is returned as an object containing:\n"
            "- **key** — human-readable label\n"
            "- **value** — current metric value\n"
            "- **change_weekly** — weekly change percentage (string)\n"
            "- **change_daily** — daily change percentage (string)\n\n"
            "It also returns latest documents discovered across leak, generic and defacement sources, "
            "as well as graph-style aggregations such as top teams, locations, and hashtags."
        ),
        "response_description": (
            "System-wide insight payload with three main sections:\n\n"
            "- **insights** — aggregated metrics grouped by data type (e.g. `general`, `leak`, `defacement`), each containing objects of the form:\n"
            "  - **document_count** — { key, value, change_weekly, change_daily }\n"
            "  - **most_recent / oldest_update** — { key, value, change_weekly, change_daily }\n"
            "  - **updated_5_days_ago / updated_9_days_ago** — { key, value, change_weekly, change_daily }\n"
            "  - **average_score** — { key, value, change_weekly, change_daily } (where applicable)\n"
            "  - **url_document_count, archive_document_count, email_document_count, phone_document_count, clearnet_document_count** — enrichment metrics\n"
            "  - **common_types, dumps_document_count, unique_base_urls, top_team, common_server** — category-specific metrics\n\n"
            "- **latestDocument** — latest crawled documents by model type:\n"
            "  - **leak_model, exploit_model, chat_model, generic_model, defacement_model** — each is a list of documents with:\n"
            "    - **title** — document title or caption\n"
            "    - **date** — human-readable discovery or publish date\n"
            "    - **location** — optional geo/location field\n"
            "    - **phoneNumber** — extracted phone numbers (if any)\n"
            "    - **url** — list of associated URLs\n"
            "    - **source** — origin (e.g. onion, XYZ)\n"
            "    - **hash** — internal document hash identifier\n\n"
            "- **graph_insight** — graph and aggregation-oriented insights represented as a 2-element array:\n"
            "  - index 0 — boolean flag indicating graph availability\n"
            "  - index 1 — list of aggregation objects, each including:\n"
            "    - **aggregation_name** — e.g. 'Top Teams (Leak)', 'Top Teams (Defacement)', "
            "'Top Locations (Defacement)', 'Top Hashtags (Social)'\n"
            "    - **index** — underlying model/index (e.g. `leak_model`, `defacement_model`, `chat_model`)\n"
            "    - **buckets** — list of key/count pairs representing the top entities (teams, locations, hashtags, etc.)"
            "\n\nExample response:\n"
            "```json\n"
            "{\n"
            '  "insights": {\n'
            '    "general": {\n'
            '      "document_count": {\n'
            '        "key": "Document Count",\n'
            '        "value": 57,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "most_recent": {\n'
            '        "key": "Most Recent",\n'
            '        "value": "26 Nov",\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "oldest_update": {\n'
            '        "key": "Oldest Update",\n'
            '        "value": "26 Nov",\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "updated_5_days_ago": {\n'
            '        "key": "Updated 5 Days ago",\n'
            '        "value": 0,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "updated_9_days_ago": {\n'
            '        "key": "Updated 9 Days ago",\n'
            '        "value": 0,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "average_score": {\n'
            '        "key": "Average Score",\n'
            '        "value": 50.75,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "url_document_count": {\n'
            '        "key": "URL/Document",\n'
            '        "value": 451,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "archive_document_count": {\n'
            '        "key": "Archive/Document",\n'
            '        "value": 5,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "email_document_count": {\n'
            '        "key": "Email/Document",\n'
            '        "value": 3,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "phone_document_count": {\n'
            '        "key": "Phone/Document",\n'
            '        "value": 0,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "clearnet_document_count": {\n'
            '        "key": "Clearnet/Document",\n'
            '        "value": 68,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "common_types": {\n'
            '        "key": "Common Type",\n'
            '        "value": "Adult",\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      }\n'
            '    },\n'
            '    "leak": {\n'
            '      "document_count": {\n'
            '        "key": "Document Count",\n'
            '        "value": 3,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "url_document_count": {\n'
            '        "key": "URL/Documents",\n'
            '        "value": 0,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "dumps_document_count": {\n'
            '        "key": "Dumps/Document",\n'
            '        "value": 8,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "updated_5_days_ago": {\n'
            '        "key": "Updated 5 Days ago",\n'
            '        "value": 3,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "updated_9_days_ago": {\n'
            '        "key": "Updated 9 Days ago",\n'
            '        "value": 3,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "most_recent": {\n'
            '        "key": "Most Recent",\n'
            '        "value": "03 Dec",\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "oldest_update": {\n'
            '        "key": "Oldest Update",\n'
            '        "value": "03 Dec",\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "unique_base_urls": {\n'
            '        "key": "Unique Base URLs",\n'
            '        "value": 3,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      }\n'
            '    },\n'
            '    "defacement": {\n'
            '      "document_count": {\n'
            '        "key": "Document Count",\n'
            '        "value": 12,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "updated_5_days_ago": {\n'
            '        "key": "Updated 5 Days ago",\n'
            '        "value": 6,\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "top_team": {\n'
            '        "key": "Top Team",\n'
            '        "value": "Alpha Wolf",\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      },\n'
            '      "common_server": {\n'
            '        "key": "Common Server",\n'
            '        "value": "Litespeed",\n'
            '        "change_weekly": "0%",\n'
            '        "change_daily": "0%"\n'
            '      }\n'
            '    }\n'
            '  },\n'
            '  "latestDocument": {\n'
            '    "leak_model": [\n'
            '      {\n'
            '        "title": "Announcement",\n'
            '        "date": "December 03, 2025",\n'
            '        "location": "",\n'
            '        "phoneNumber": [],\n'
            '        "url": [\n'
            '          "http://brohoodyaifh2ptccph5zfljyajjabwjjo4lg6gfp4xb6ynw5w7ml6id.onion/"\n'
            '        ],\n'
            '        "source": "onion",\n'
            '        "hash": "ca1c7476db86b66c05773f62b85ea5ab0042cd356744ad189f218d16b29db344"\n'
            '      }\n'
            '    ],\n'
            '    "exploit_model": [],\n'
            '    "chat_model": [],\n'
            '    "generic_model": [\n'
            '      {\n'
            '        "title": "shop pirated content - best hacked accounts, stolen credit cards and other hacker stuff.",\n'
            '        "date": "November 26, 2025",\n'
            '        "location": "",\n'
            '        "phoneNumber": [],\n'
            '        "url": [\n'
            '          "http://2222222dk552uwysu3xjaotjmf7basqqrhxrjundlmnzhp6yauj6puqd.onion/shop/cards/mastercard"\n'
            '        ],\n'
            '        "source": "onion",\n'
            '        "hash": "2e3fbb01cb946b9afc5c67e249ffe5431985a05e3b79c5359f2b420231257a71"\n'
            '      },\n'
            '      {\n'
            '        "title": "coin swap",\n'
            '        "date": "November 26, 2025",\n'
            '        "location": "",\n'
            '        "phoneNumber": [],\n'
            '        "url": [\n'
            '          "http://2222222m7dzmk7wffagz7cduawmrciml67s3brw2pmvjihhhuf3hukid.onion/convert/?amount_from=0.01012&from_coin=BTC&to_coin=XMR"\n'
            '        ],\n'
            '        "source": "onion",\n'
            '        "hash": "ed72d568d19e1fc76e6d6102b465fd27f244771e97927766b40bf284d3700ca7"\n'
            '      },\n'
            '      {\n'
            '        "title": "shop pirated content - best hacked accounts, stolen credit cards and other hacker stuff.",\n'
            '        "date": "November 26, 2025",\n'
            '        "location": "",\n'
            '        "phoneNumber": [],\n'
            '        "url": [\n'
            '          "http://2222222dk552uwysu3xjaotjmf7basqqrhxrjundlmnzhp6yauj6puqd.onion/shop/cards/visa"\n'
            '        ],\n'
            '        "source": "onion",\n'
            '        "hash": "ed2f9550a258229c7c7f4db6df457a34c98392c8a7178bca41dda9413c721ab9"\n'
            '      },\n'
            '      {\n'
            '        "title": "coin swap",\n'
            '        "date": "November 26, 2025",\n'
            '        "location": "",\n'
            '        "phoneNumber": [],\n'
            '        "url": [\n'
            '          "http://2222222m7dzmk7wffagz7cduawmrciml67s3brw2pmvjihhhuf3hukid.onion/convert/?amount_from=0.00164&from_coin=BTC&to_coin=DOGE"\n'
            '        ],\n'
            '        "source": "onion",\n'
            '        "hash": "649845a2c6c8d0bc13a88582ff822caf5e9fc745f47d162c3185ffac1e5b4849"\n'
            '      }\n'
            '    ],\n'
            '    "defacement_model": [\n'
            '      {\n'
            '        "title": "http://phaoboi.vn/",\n'
            '        "date": "December 03, 2025",\n'
            '        "location": "",\n'
            '        "phoneNumber": [],\n'
            '        "url": [\n'
            '          "http://phaoboi.vn/"\n'
            '        ],\n'
            '        "source": "XYZ",\n'
            '        "hash": "31d109a231bfdaa36fc757a7c749253021f04fad0c54d08455c516007c7feabb"\n'
            '      },\n'
            '      {\n'
            '        "title": "https://www.phdfpakistan.com/index.html",\n'
            '        "date": "December 03, 2025",\n'
            '        "location": "",\n'
            '        "phoneNumber": [],\n'
            '        "url": [\n'
            '          "https://www.phdfpakistan.com/index.html"\n'
            '        ],\n'
            '        "source": "XYZ",\n'
            '        "hash": "599e8416b67e070178ccbfd0b727abe01150f17a3c50dc20446c72825bf8c523"\n'
            '      },\n'
            '      {\n'
            '        "title": "https://monsite-wp.net/index.html",\n'
            '        "date": "December 03, 2025",\n'
            '        "location": "",\n'
            '        "phoneNumber": [],\n'
            '        "url": [\n'
            '          "https://monsite-wp.net/index.html"\n'
            '        ],\n'
            '        "source": "XYZ",\n'
            '        "hash": "50440bc0e8994252e3fac7299bd110afc3086bb54f171468a55e246778b8c170"\n'
            '      },\n'
            '      {\n'
            '        "title": "https://www.arc9.us/",\n'
            '        "date": "December 03, 2025",\n'
            '        "location": "",\n'
            '        "phoneNumber": [],\n'
            '        "url": [\n'
            '          "https://www.arc9.us/"\n'
            '        ],\n'
            '        "source": "XYZ",\n'
            '        "hash": "fbee8ab2e997183dc9bc2580a99f8ac6a70744fc8f51ff5ea69d7d600ca367e9"\n'
            '      }\n'
            '    ]\n'
            '  },\n'
            '  "graph_insight": [\n'
            '    true,\n'
            '    [\n'
            '      {\n'
            '        "aggregation_name": "Top Teams (Leak)",\n'
            '        "index": "leak_model",\n'
            '        "buckets": [\n'
            '          {\n'
            '            "key": "BROTHERHOOD",\n'
            '            "count": 3\n'
            '          }\n'
            '        ]\n'
            '      },\n'
            '      {\n'
            '        "aggregation_name": "Top Teams (Defacement)",\n'
            '        "index": "defacement_model",\n'
            '        "buckets": [\n'
            '          {\n'
            '            "key": "Alpha Wolf",\n'
            '            "count": 6\n'
            '          },\n'
            '          {\n'
            '            "key": "BONDOWOSO BLACK HAT",\n'
            '            "count": 4\n'
            '          },\n'
            '          {\n'
            '            "key": "Death Networks",\n'
            '            "count": 1\n'
            '          }\n'
            '        ]\n'
            '      },\n'
            '      {\n'
            '        "aggregation_name": "Top Locations (Defacement)",\n'
            '        "index": "defacement_model",\n'
            '        "buckets": []\n'
            '      },\n'
            '      {\n'
            '        "aggregation_name": "Top Hashtags (Social)",\n'
            '        "index": "chat_model",\n'
            '        "buckets": []\n'
            '      }\n'
            '    ]\n'
            '  ]\n'
            '}\n'
            "```\n"
        ),
    }
}

IOC_DOC = (
    "\n\nAdditionally, the response may include automatically extracted indicators of compromise (IOCs). "
    "Only indicators that are actually found in the underlying content are returned; IOC fields with no data "
    "are omitted from the response.\n\n"
    "Supported IOC / enrichment fields:\n"
    "- **m_phone_number** — Phone Numbers\n"
    "- **m_email** — Emails\n"
    "- **m_domain** — Domains\n"
    "- **m_country** — Country\n"
    "- **m_url** — URLs\n"
    "- **m_cve** — CVE & CWE\n"
    "- **m_ip** — IP Addresses\n"
    "- **m_yara_rule** — YARA Rules\n"
    "- **m_encoded_urls** — Encoded URLs\n"
    "- **m_file_paths** — File Paths\n"
    "- **m_credit_card** — Credit Cards\n"
    "- **m_org** — Organizations\n"
    "- **m_company_name** — Company Names\n"
    "- **m_person** — Persons\n"
    "- **m_location** — Locations\n"
    "- **m_language** — Languages\n"
    "- **m_user_agents** — User Agents\n"
    "- **m_asns** — ASNs\n"
    "- **m_team** — Teams\n"
    "- **m_hashtag** — Hashtags\n"
    "- **m_mention** — Mentions\n"
    "- **m_social_media_profiles** — Social Media Profiles\n"
    "- **m_currencies** — Currencies\n"
    "- **m_crypto_address** — Crypto Addresses\n"
    "- **m_xmpp_addresses** — XMPP Addresses\n"
    "- **m_enterprise_attack_tactics** — Enterprise ATT&CK Tactics\n"
    "- **m_enterprise_attack_techniques** — Enterprise ATT&CK Techniques\n"
    "- **m_document_id** — Document IDs\n"
    "- **m_au_abn** — Australian IDs\n"
    "- **m_us_passport** — US IDs\n"
    "- **m_us_bank_number** — US Bank Numbers\n"
    "- **m_platform** — Platform\n"
    "- **m_author** — Author\n"
    "- **m_industry** — Industry\n"
    "- **m_scrap_file** — Scrap Script\n"
)

REPORT_DOCS = {
    "defacement": {
        "description": (
            "Search defacement intelligence reports for hacked or phishing websites; returns a paginated list of "
            "defacement events and their metadata.\n\n"
            "Request body (`search_defacement_param_model`):\n"
            "- **q** — free-text search over URL, IP, team, attacker handle and content fields (default: empty string)\n"
            "- **category** — optional category filter (default `all`)\n"
            "- **page** — page number of the paginated result set (1-based)\n"
            "- **network** — one of: `all`, `clearnet`, `onion`, `i2p` (default `all`)\n"
            "- **daterange** — optional leak/observation date range in `YYYY-MM-DD,YYYY-MM-DD` format; "
            "empty string means no date filter\n"
            "- **attacker** — attacker nick/handle to match against `m_attacker`\n"
            "- **team** — defacement crew or group name to match against `m_team`\n"
            "- **content** — optional content/type string (for example an IOC/incident label) depending on configuration\n"
            "- **must** — when `true`, values in `entity_filter` are treated as mandatory (must) filters\n"
            "- **matchtype** — logical operator for combining query / attacker / team / entity_filter clauses "
            "(`and` or `or`)\n"
            "- **entity_filter** — IOC-style filter map of field → list of values. Example valid payload:\n"
            "```json\n"
            "{\n"
            "  \"entity_filter\": {\n"
            "    \"m_ip\": [\"103.218.122.8\"],\n"
            "    \"m_attacker\": [\"XYZ\"],\n"
            "    \"m_team\": [\"Alpha Wolf\"]\n"
            "  }\n"
            "}\n"
            "```\n"
            "Commonly supported fields include `m_ip`, `m_domain`, `m_country`, `m_location`, `m_attacker`, "
            "`m_team`, `m_ioc_type`, `m_web_server`, `m_social_media_profiles`, `m_scrap_file` and other IOC-style "
            "keys depending on deployment.\n\n"
            "Minimal example request:\n"
            "```json\n"
            "{\n"
            "  \"q\": \"defacer.net\",\n"
            "  \"page\": 1,\n"
            "  \"attacker\": \"XYZ\",\n"
            "  \"team\": \"Alpha Wolf\",\n"
            "  \"entity_filter\": { \"m_ip\": [\"103.218.122.8\"] },\n"
            "  \"matchtype\": \"or\",\n"
            "  \"daterange\": \"2025-11-28,2025-12-03\"\n"
            "}\n"
            "```"
        ),
        "response_description": (
            "Defacement search results containing a paginated list of hacked/defaced or phishing websites.\n\n"
            "The response is a JSON object with:\n"
            "- **Result** — list of defacement report objects\n"
            "- **Suggestions** — optional list of suggested queries or corrections (may be empty)\n"
            "- **Page_Count** — number of pages available for the given query and filters (may be fractional depending on "
            "backend calculation)\n\n"
            "Each entry in **Result** typically contains:\n"
            "- **m_location** — geo-location or region for the affected asset, when available\n"
            "- **m_attacker** — list of attacker nicknames/handles claiming the defacement\n"
            "- **m_team** — defacement crew or group name\n"
            "- **m_hash** — internal hash of the event/document used for deduplication\n"
            "- **m_web_server** — list of observed web-server banners (for example `LiteSpeed`, `Apache`, `Cloudflare`, "
            "`unknown`)\n"
            "- **m_ioc_type** — high-level classification such as `hacked`, `phishing`, etc.\n"
            "- **m_content** — extracted HTML/text content or landing page text when captured\n"
            "- **m_base_url** — base/source platform (for example `https://defacer.net`)\n"
            "- **m_url** — URL of the defaced or phishing page\n"
            "- **m_ip** — list of IP addresses associated with the defaced host\n"
            "- **m_leak_date** — date the defacement was first recorded/observed\n"
            "- **m_source_url** — list of source pages describing the defacement (for example the defacer.net view URL)\n"
            "- **m_screenshot** — screenshot reference when available, otherwise `null`\n"
            "- **m_mirror_links** — list of mirror/screenshot links for the defacement entry\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"Result\": [\n"
            "    {\n"
            "      \"m_location\": null,\n"
            "      \"m_attacker\": [\"XYZ\"],\n"
            "      \"m_team\": \"Alpha Wolf\",\n"
            "      \"m_hash\": \"31d109a231bfdaa36fc757a7c749253021f04fad0c54d08455c516007c7feabb\",\n"
            "      \"m_web_server\": [\"LiteSpeed\"],\n"
            "      \"m_ioc_type\": [\"hacked\"],\n"
            "      \"m_content\": null,\n"
            "      \"m_base_url\": \"https://defacer.net\",\n"
            "      \"m_url\": \"http://phaoboi.vn/\",\n"
            "      \"m_ip\": [\"103.218.122.8\"],\n"
            "      \"m_leak_date\": \"2025-12-03\",\n"
            "      \"m_source_url\": [\"https://defacer.net/view/54543/\"],\n"
            "      \"m_screenshot\": null,\n"
            "      \"m_mirror_links\": [\"https://defacer.net/sc/54543\"]\n"
            "    }\n"
            "  ],\n"
            "  \"Suggestions\": [],\n"
            "  \"Page_Count\": 1.2\n"
            "}\n"
            "```"
        ) + IOC_DOC,
    },
    "stix": {
        "description": (
            "Return a **STIX 2.1 bundle** for a single document.\n\n"
            "This endpoint converts an Orion document into a STIX 2.1 `bundle` (spec_version `2.1`) containing:\n"
            "- **TLP marking definitions** (AMBER and RED)\n"
            "- a primary **report** object\n"
            "- optional **infrastructure** describing the source/service (e.g., onion market/forum)\n"
            "- extracted **SCO observables** (e.g., `url`, `domain-name`, `ipv4-addr`, `ipv6-addr`, `email-addr`, "
            "`autonomous-system`, `directory`, `user-agent`)\n"
            "- an **observed-data** object referencing extracted SCOs\n"
            "- optional **indicator** objects with STIX patterns for extracted observables\n\n"
            "Request:\n"
            "- **doc_id** — required. Orion document identifier.\n"
            "- **lang** — optional. Language variant requested from backend.\n\n"
            "Notes:\n"
            "- Missing fields are skipped (no empty objects are emitted).\n"
            "- `report.object_refs` links all generated objects (indicators, infrastructure, observed-data, etc.).\n"
            "- `report.external_references` includes the source URL (when available) and Orion content hash.\n"
            "- Custom Orion metadata is exported using `x_orion_*` properties on relevant objects.\n\n"
            "Minimal example request:\n"
            "```json\n"
            "{\n"
            "  \"doc_id\": \"4856ea0a54f79ddb5ad8377ecf3b08f16491441208aaab95c095dcb0b46266a1\",\n"
            "  \"lang\": \"en\"\n"
            "}\n"
            "```"
        ),
        "response_description": (
            "A STIX 2.1 bundle matching the structure below.\n\n"
            "Top-level response fields:\n"
            "- **type**: `bundle`\n"
            "- **id**: `bundle--<uuid>`\n"
            "- **spec_version**: `2.1`\n"
            "- **objects**: array of STIX objects\n\n"
            "Objects you will commonly see in `objects`:\n"
            "1) **marking-definition** (TLP AMBER / TLP RED)\n"
            "2) **infrastructure** (optional) — e.g., onion/clearnet service context\n"
            "3) **SCOs** (optional) — `url`, `domain-name`, `ipv4-addr`, `ipv6-addr`, `email-addr`, etc.\n"
            "4) **observed-data** (optional) — references SCOs via `object_refs`\n"
            "5) **indicator** (optional) — one per IOC category with `pattern_type: stix`\n"
            "6) **report** — the primary object that ties everything together via `object_refs`\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"type\": \"bundle\",\n"
            "  \"id\": \"bundle--9b9910f5-1d12-5908-bcfc-862ad032bcf7\",\n"
            "  \"spec_version\": \"2.1\",\n"
            "  \"objects\": [\n"
            "    {\n"
            "      \"type\": \"marking-definition\",\n"
            "      \"spec_version\": \"2.1\",\n"
            "      \"id\": \"marking-definition--...\",\n"
            "      \"created\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"definition_type\": \"tlp\",\n"
            "      \"definition\": {\"tlp\": \"amber\"}\n"
            "    },\n"
            "    {\n"
            "      \"type\": \"infrastructure\",\n"
            "      \"spec_version\": \"2.1\",\n"
            "      \"id\": \"infrastructure--...\",\n"
            "      \"created\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"modified\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"name\": \"fast card service - credit cards, transfers, gift\",\n"
            "      \"description\": \"...\",\n"
            "      \"infrastructure_types\": [\"anonymization\"],\n"
            "      \"first_seen\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"last_seen\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"labels\": [\"leaks\", \"marketplaces\", \"onion\", \"orion:general\"],\n"
            "      \"object_marking_refs\": [\"marking-definition--...\"],\n"
            "      \"x_orion_network\": \"onion\"\n"
            "    },\n"
            "    {\n"
            "      \"type\": \"url\",\n"
            "      \"id\": \"url--...\",\n"
            "      \"value\": \"http://example.onion\"\n"
            "    },\n"
            "    {\n"
            "      \"type\": \"domain-name\",\n"
            "      \"id\": \"domain-name--...\",\n"
            "      \"value\": \"example.onion\"\n"
            "    },\n"
            "    {\n"
            "      \"type\": \"observed-data\",\n"
            "      \"spec_version\": \"2.1\",\n"
            "      \"id\": \"observed-data--...\",\n"
            "      \"created\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"modified\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"first_observed\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"last_observed\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"number_observed\": 1,\n"
            "      \"object_refs\": [\"domain-name--...\", \"url--...\"],\n"
            "      \"object_marking_refs\": [\"marking-definition--...\"]\n"
            "    },\n"
            "    {\n"
            "      \"type\": \"indicator\",\n"
            "      \"spec_version\": \"2.1\",\n"
            "      \"id\": \"indicator--...\",\n"
            "      \"created\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"modified\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"name\": \"Domains\",\n"
            "      \"indicator_types\": [\"malicious-activity\"],\n"
            "      \"pattern_type\": \"stix\",\n"
            "      \"pattern\": \"[domain-name:value IN ('example.onion')]\",\n"
            "      \"valid_from\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"labels\": [\"leaks\", \"marketplaces\", \"onion\", \"orion:general\"],\n"
            "      \"object_marking_refs\": [\"marking-definition--...\"]\n"
            "    },\n"
            "    {\n"
            "      \"type\": \"report\",\n"
            "      \"spec_version\": \"2.1\",\n"
            "      \"id\": \"report--...\",\n"
            "      \"created\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"modified\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"name\": \"fast card service - credit cards, transfers, gift\",\n"
            "      \"description\": \"...\",\n"
            "      \"report_types\": [\"threat-report\"],\n"
            "      \"published\": \"2025-12-09T03:35:41.659Z\",\n"
            "      \"labels\": [\"leaks\", \"marketplaces\", \"onion\", \"orion:general\"],\n"
            "      \"lang\": \"en\",\n"
            "      \"external_references\": [\n"
            "        {\"source_name\": \"source\", \"url\": \"http://example.onion\"},\n"
            "        {\"source_name\": \"content-hash\", \"external_id\": \"<hash>\"}\n"
            "      ],\n"
            "      \"object_refs\": [\n"
            "        \"indicator--...\",\n"
            "        \"infrastructure--...\",\n"
            "        \"observed-data--...\"\n"
            "      ],\n"
            "      \"object_marking_refs\": [\"marking-definition--...\"],\n"
            "      \"x_orion_doc_id\": \"<hash>\",\n"
            "      \"x_orion_network\": \"onion\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "```"
        ),
    },
    "breach": {
        "description": (
            "Get a specific breach monitoring report for a tracked website or asset by its report ID.\n\n"
            "The request is an HTTP GET and accepts:\n"
            "- **doc_id** (path) — string identifier of the breach report document\n"
            "- **lang** (query, optional) — language code for localized narrative content when available.\n\n"
            "No request body is required."
        ),
        "response_description": (
            "Single breach monitoring report document, returned as a JSON object representing the tracked website "
            "or asset and associated breach data.\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"m_title\": \"Columbus Regional Healthcare System\",\n"
            "  \"m_url\": \"http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion/\",\n"
            "  \"m_screenshot\": \"69993154316451142028569605097804\",\n"
            "  \"m_base_url\": \"http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion\",\n"
            "  \"m_content\": \"Columbus Regional Healthcare System has one of the highest volume and most experienced robotic surgical programs in Southeastern North Carolina. http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion/\",\n"
            "  \"m_important_content\": \"Columbus Regional Healthcare System has one of the highest volume and most experienced robotic surgical programs in Southeastern North Carolina.\",\n"
            "  \"m_network\": \"onion\",\n"
            "  \"m_content_type\": [\"leaks\"],\n"
            "  \"m_weblink\": [\"https://crhealthcare.org/\"],\n"
            "  \"m_dumplink\": [\"https://crhealthcare.org/\"],\n"
            "  \"m_company_name\": \"Columbus Regional Healthcare System\",\n"
            "  \"m_location\": [\"US\"],\n"
            "  \"m_team\": \"diaxin\",\n"
            "  \"m_scrap_file\": \"_7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd\",\n"
            "  \"m_language\": [\"en\"],\n"
            "  \"m_domain\": [\n"
            "    \"7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion\",\n"
            "    \"crhealthcare.org\"\n"
            "  ],\n"
            "  \"m_hash\": \"1a17b87ad12262b38a81419c3d1cc8c57868ce62b9e32e042ff1b20a9aefacc0\",\n"
            "  \"m_update_date\": \"2025-12-03T20:46:34.909368+00:00\",\n"
            "  \"m_creation_date\": \"2025-12-03T20:46:34.909391+00:00\",\n"
            "  \"content_type\": [\"ddos\", \"darkweb\"]\n"
            "}\n"
            "```\n\n"
            "Common fields and their meaning:\n"
            "- **m_title** — human-readable title of the victim or breached asset\n"
            "- **m_url** — leak or post URL on the darkweb/dump source\n"
            "- **m_screenshot** — screenshot identifier (use `/api/search/breach/screenshot/{m_screenshot}`)\n"
            "- **m_base_url** — base onion/clearnet URL of the leak site\n"
            "- **m_content** — full textual content of the breach announcement\n"
            "- **m_important_content** — condensed summary of the breach\n"
            "- **m_network** — network type (e.g. `onion`)\n"
            "- **m_content_type** — internal category labels (e.g. `leaks`)\n"
            "- **m_weblink** — URLs pointing to the victim’s clearnet web presence\n"
            "- **m_dumplink** — URLs referencing claimed leaked data\n"
            "- **m_company_name** — normalized company/organization name\n"
            "- **m_location** — list of associated country/region codes\n"
            "- **m_team** — threat actor or ransomware group name\n"
            "- **m_scrap_file** — internal scraper identifier\n"
            "- **m_language** — detected language(s)\n"
            "- **m_domain** — domains associated with the leak site and victim\n"
            "- **m_hash** — internal hash used for deduplication and correlation\n"
            "- **m_update_date** — last update timestamp\n"
            "- **m_creation_date** — ingestion timestamp\n"
            "- **content_type** — high-level classification tags (e.g. `ddos`, `darkweb`)\n"
        ) + IOC_DOC,
    },

    "news": {
        "description": (
            "Get a specific breach-related news intelligence report generated from external news feeds by its report ID.\n\n"
            "The request is an HTTP GET and accepts:\n"
            "- **doc_id** (path) — string identifier of the news report document\n"
            "- **lang** (query, optional) — language code to localize narrative sections when supported.\n\n"
            "No request body is required."
        ),
        "response_description": (
            "News intelligence report document describing breach- or threat-related events from external news sources, "
            "returned as a single JSON object.\n\n"
            "Core response fields typically include:\n"
            "- **m_title** — title of the article or report\n"
            "- **m_url** — direct URL of the article\n"
            "- **m_base_url** — base URL of the source site\n"
            "- **m_content** — normalized article text, including extracted narrative content\n"
            "- **m_important_content** — summary or extracted key snippet\n"
            "- **m_network** — usually `clearnet`\n"
            "- **m_content_type** — internal classification labels such as `news`\n"
            "- **m_team** — publishing organization or referenced entity\n"
            "- **m_weblink** — list of related article URLs\n"
            "- **m_dumplink** — list of referenced dump or external resources\n"
            "- **m_organization** — organizations mentioned or discussed in the article\n"
            "- **m_language** — detected language(s)\n"
            "- **m_domain** — domains associated with the source\n"
            "- **m_hash** — internal hash for deduplication\n"
            "- **m_update_date** — last update timestamp\n"
            "- **m_creation_date** — ingestion timestamp\n"
            "- **content_type** — high-level classification tags used by other modules\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"m_title\": \"Turning Intelligence Into Action with Threat-Informed Defense\",\n"
            "  \"m_url\": \"https://thehackernews.com/expert-insights/2025/09/turning-intelligence-into-action-with.html\",\n"
            "  \"m_base_url\": \"https://thehackernews.com/\",\n"
            "  \"m_content\": \"Jean-Philippe Salles — Head of Product at Filigran Sept 22, 2025  Cybersecurity is undergoing a necessary transformation from reacting to threats as they arise to proactively anticipating and addressing them through Threat-Informed Defense (TID). This shift emphasizes operational discipline over accumulating more tools. It involves using threat intelligence to streamline existing technologies, enhance the quality of security signals, and focus efforts on the threats most relevant to each organization. The goal is to continuously identify and close security gaps by combining insights from external threat data with internal defense capabilities.  How do you put TID into practice? The team at Filigran has broken down the TID framework into a six-stage pipeline to develop actionable chunks for cybersecurity leaders. In this article, we share the details so that your security teams can leverage it too to support TID.  What is Threat-Informed Defense?#  First advocated by MITRE, Threat-Informed Defense (TID) leverages MITRE ATT&CK framework to map how real threat actors operate and align defenses accordingly. It rests on three pillars:  Cyber threat intelligence: First gather, ingest and process all of your threat intelligence to make it contextual and relevant for you. Go beyond IOCs to understand adversary behaviors and intent, which are more durable and more costly for attackers to change. Defensive measures: Translate prioritized threat intelligence into detections, hardening, response playbooks, and configurations; utilize it properly and make it do the work for you. Adapt controls to the threats most likely to target you. Testing and evaluation: Plan adversary emulation and run continuous breach-and-attack simulations to verify coverage and avoid regressions. Gain granular level visibility into the effectiveness of your security programs. Automate and scale for continuous security posture validation and improvement.  Security teams today are facing tighter budgets and limited resources. As a result, many CISOs are shifting their focus from constantly adopting new tools to making the most of the technologies they already have. This change in mindset is driving a more proactive approach to cybersecurity. Instead of waiting for threats to happen, leaders are asking critical questions like 'Who might target us?', 'How do they operate?', 'Are our defenses strong enough?' and 'What's our plan if something fails?'. Implementing a Threat-Informed Defense (TID) strategy requires breaking down silos between teams, encouraging collaboration and information sharing across security operations, threat intelligence, and testing groups.  From Idea to Execution: Threat-Informed Defense Pipeline#  Similar to Continuous Threat Exposure Management (CTEM), TID is a concept, a cybersecurity strategy. Organizations can adopt and implement TID through various approaches, whether using commercial solutions, open-source tools, or hybrid implementations. For example, one approach could involve leveraging Filigran's open-source extended threat management (XTM) suite that combines threat intelligence platform with adversary emulation capabilities. These integrated solutions help security teams operationalize TID through six actionable stages:  Stage 01: Strategic threat landscape assessment#  Goal: Identify which adversaries, malware, and campaigns are most relevant to your business model, stack, and region.  How: Threat assessment in threat-informed defense involves systematically evaluating and prioritizing the specific threat actors, their capabilities, tactics, techniques, and procedures (TTPs) that are most likely to target your organization's critical assets. A threat intelligence platform (TIP) allows you to gather, analyze, refine and share prioritized threat intelligence is a useful component for this step.  Outcome: A prioritized watchlist with clear inclusion criteria and analyst annotations.  Stage 02: Actor and malware tracking#  Goal: Keep pace with evolving TTPs and indicators while filtering noise.  How: Maintain adaptive watchlists; triage incoming reports; tag IOCs and TTPs and distribute them to SIEM/EDR/SOAR. Modern TIPs like open-source based OpenCTI use knowledge graph models to provide powerful visualizations to link campaigns, malware, techniques, and exploited vulnerabilities.  Outcome: Continuously updated views of active threats and automated, stakeholder-ready reporting to show program progress.  Stage 03: TTP and report mapping#  Goal: See where attacker behaviors outpace your defenses.  How: Advanced Persistent Threats (APTs) and opportunistic attackers increasingly target the expanded attack surface created by cloud-native architectures, leveraging misconfigurations in multi-cloud environments, exploiting container escape vulnerabilities, poisoning CI/CD pipelines with malicious code, and conducting identity-based attacks through stolen credentials and API keys. OpenCTI can serve as a critical enabler for this assessment by centralizing and correlating threat intelligence specific to your technology stack, automatically ingesting indicators and TTPs from multiple sources—including cloud provider threat feeds, container security advisories, and identity-focused threat research. The platform maps these threats to the MITRE ATT&CK framework, allowing security teams to visualize adversary groups.  Outcome: A prioritized TTP list ready for adversary emulation and detection engineering.  Stage 04: Breach & attack simulation#  Goal: Prove whether you security controls detect and respond as designed.  How: Testing security controls in TID moves beyond generic vulnerability scanning and compliance checks to validate whether your defenses actually stop the specific adversary behaviors targeting your organization. Adversary Exposure Validation (AEV) tools makes threat intelligence actionable by emulating the exact techniques your most likely threat actors employ. Filigran's open-source OpenBAS provides scalability to design and execute purple team exercises, breach and attack simulations, and atomic red team tests. It also feed outcomes back into OpenCTI to maintain context with the threats that matter.  Outcome: A continuous feedback loop that catches regressions, validates detections, and informs engineering fixes.  Stage 05: Control validation and investment#  Goal: Translate intel and testing into targeted remediation and budget decisions.  How: Use time-series and historical snapshots to show coverage trends and risk reduction. Apply remediation guidance from OpenBAS to tune configs, update rules, and plan upgrades or replacements. The continuous validation using the combination of OpenCTI and OpenBAS creates a feedback loop that informs strategic investments and architectural decisions with unprecedented precision. The quantifiable nature of these insights enables CISOs to justify budget requests with specific risk reduction metrics, prioritize engineering efforts based on actual adversary impact  Outcome: Evidence-based prioritization that improves day-to-day resilience and informs quarterly planning.  Stage 06: Quarterly review#  Goal: Recalibrate strategy and maintain executive alignment.  How: Consolidate threat insights, control coverage, and simulation results into executive-ready reporting. Our recommendation is to make this as a quarterly exercise to share with your key stakeholders. This creates a closed-loop system where threat intelligence directly drives security validation priorities. Revisit tracked threats, business priorities, and risk appetite as part of a broader Continuous Threat Exposure Management (CTEM) rhythm.  Outcome: A living program that stays aligned to business risk and adversary reality.  Ready to make the shift to Threat-Informed Defense?#  Utilize TID to shift the conversation from traditional security life cycle (protection/detection/response) to proactive finding the gaps in your security controls and reducing cyber risks. The empirical approach of TID provides metrics that matter, from 'we blocked 10 million attacks' to 'we can detect and stop 85% of the techniques used by the ransomware groups actively targeting our sector and here is what we are going to do to fill our gaps for the rest 15%'.  If you'd like to learn more about TID, Filigran's open-source product suite, and its alignment with the framework you can download our latest white paper, A Practical Guide to Threat-Informed Defense, or contact us to speak directly with our team.    SHARE      Tweet  Share  Share  Share\",\n"
            "  \"m_important_content\": \"Jean-Philippe Salles — Head of Product at Filigran Sept 22, 2025  Cybersecurity is undergoing a necessary transformation from reacting to threats as they arise to proactively anticipating and addressing them through Threat-Informed Defense (TID). This shift emphasizes operational discipline over accumulating more tools.\",\n"
            "  \"m_network\": \"clearnet\",\n"
            "  \"m_content_type\": [\"news\"],\n"
            "  \"m_weblink\": [\n"
            "    \"https://thehackernews.com/expert-insights/2025/09/turning-intelligence-into-action-with.html\"\n"
            "  ],\n"
            "  \"m_dumplink\": [\n"
            "    \"https://thehackernews.com/expert-insights/2025/09/turning-intelligence-into-action-with.html\"\n"
            "  ],\n"
            "  \"m_team\": \"hackernews live\",\n"
            "  \"m_scrap_file\": \"_thehackernews\",\n"
            "  \"m_organization\": [\"Filigran\", \"MITRE\", \"Cybersecurity\"],\n"
            "  \"m_language\": [\"en\"],\n"
            "  \"m_domain\": [\"thehackernews.com\"],\n"
            "  \"m_hash\": \"7cd89edea323f8127203c984df5df7d7cbb0b564cae4b5ef770f7050f11cba34\",\n"
            "  \"m_update_date\": \"2025-10-10T08:21:46.160580+00:00\",\n"
            "  \"m_creation_date\": \"2025-10-10T08:21:46.186711+00:00\"\n"
            "}\n"
            "```\n"
        ) + IOC_DOC,
    },
    "exploit": {
        "description": (
            "Get a specific exploit intelligence report (CVE, exploit kit, zero-day activity, etc.) by its report ID.\n\n"
            "The request is an HTTP GET and accepts:\n"
            "- **doc_id** (path) — string identifier of the exploit report document\n"
            "- **lang** (query, optional) — language code for localized narrative fields when available.\n\n"
            "No request body is required."
        ),
        "response_description": (
           "Exploit intelligence report document containing exploit details, returned as a single JSON object.\n\n"
           "Core response fields typically include:\n"
           "- **m_title** — exploit or module title\n"
           "- **m_url** — direct URL for the exploit/module page\n"
           "- **m_base_url** — base URL of the publishing site or contact page\n"
           "- **m_content** — normalized exploit description or short text body\n"
           "- **m_important_content** — key snippet or short summary emphasizing the exploit name or purpose\n"
           "- **m_network** — network type of the source, typically `clearnet`\n"
           "- **m_content_type** — internal labels such as `cve`, `exploit`, `poc`\n"
           "- **m_weblink** — list of additional URLs related to the exploit (e.g. source code or commits)\n"
           "- **content_type** — high-level classification tags used by other modules\n"
           "- **m_name** — author or contributor information\n"
           "- **m_code_snippet** — list of code or command snippets showing usage of the exploit\n"
           "- **m_platform** — list of affected or supported platforms\n"
           "- **m_scrap_file** — internal scraper identifier or file prefix\n"
           "- **m_domain** — domains related to the exploit content and references\n"
           "- **m_hash** — internal hash for this document, used for deduplication and correlation\n"
           "- **m_update_date** — last time the document was updated in the system\n"
           "- **m_creation_date** — first time the document was created/ingested into the system\n\n"
           "Depending on the source and context, additional enrichment fields may be present, such as CVE identifiers, "
           "threat actor information or extended narrative text.\n\n"
           "Example response:\n"
           "```json\n"
           "{\n"
           "  \"m_title\": \"Windows Registry Only Persistence\",\n"
           "  \"m_url\": \"https://www.rapid7.com/db/modules/exploit/windows/persistence/registry/\",\n"
           "  \"m_base_url\": \"https://www.rapid7.com/contact/\",\n"
           "  \"m_content\": \"Windows Registry Only Persistence\",\n"
           "  \"m_important_content\": \"Windows Registry Only Persistence\",\n"
           "  \"m_network\": \"clearnet\",\n"
           "  \"m_content_type\": [\"cve\"],\n"
           "  \"m_weblink\": [\n"
           "    \"https://github.com/rapid7/metasploit-framework/blob/master//modules/exploits/windows/persistence/registry.rb\",\n"
           "    \"https://github.com/rapid7/metasploit-framework/commits/master//modules/exploits/windows/persistence/registry.rb\"\n"
           "  ],\n"
           "  \"content_type\": [\"persistence\"],\n"
           "  \"m_name\": \"Donny Maasland donny.maasland@fox-it.com,h00die\",\n"
           "  \"m_code_snippet\": [\n"
           "    \"msf > use exploit/windows/persistence/registry\\n\\n    msf exploit(registry) > show targets\\n\\n        ...targets...\\n\\n    msf exploit(registry) > set TARGET < target-id >\\n\\n    msf exploit(registry) > show options\\n\\n        ...show and set options...\\n\\n    msf exploit(registry) > exploit\"\n"
           "  ],\n"
           "  \"m_platform\": [\"Windows\"],\n"
           "  \"m_scrap_file\": \"_rapid7\",\n"
           "  \"m_domain\": [\n"
           "    \"github.com\",\n"
           "    \"rapid7.com\",\n"
           "    \"rapid7.com/contact\"\n"
           "  ],\n"
           "  \"m_hash\": \"6c88d95f4d98b5c95f65a79da548fd5c3b33d6ac319790c33630dc2f2d869019\",\n"
           "  \"m_update_date\": \"2025-10-28T18:09:14.512739+00:00\",\n"
           "  \"m_creation_date\": \"2025-10-28T18:09:14.516589+00:00\"\n"
           "}\n"
           "```\n"
        ) + IOC_DOC,
    },

    "strategic": {
        "description": (
            "Get a specific strategic intelligence report aggregating crawled content from onion, I2P, and similar "
            "hidden-service pages by its report ID.\n\n"
            "The request is an HTTP GET and accepts:\n"
            "- **doc_id** (path) — string identifier of the strategic (generic) report document\n"
            "- **lang** (query, optional) — language code for localized narrative content.\n\n"
            "No request body is required."
        ),
        "response_description": (
            "Strategic darkweb intelligence document representing a single crawled page (such as a marketplace listing, "
            "forum thread or generic page), returned as a JSON object.\n\n"
            "Core response fields typically include:\n"
            "- **m_base_url** — base URL of the hidden service or site\n"
            "- **m_url** — specific page URL\n"
            "- **m_network** — network type (e.g. `onion`)\n"
            "- **m_title** — page title as seen in the source\n"
            "- **m_meta_description** — meta description extracted from the HTML, if available\n"
            "- **m_content** — normalized text content extracted from the page\n"
            "- **m_important_content** — key snippet or condensed portion of the most relevant text\n"
            "- **m_images** — list of image URLs extracted from the page\n"
            "- **m_sub_url** — list of internal navigation or related links\n"
            "- **m_validity_score** — internal confidence/validity score for the crawled document\n"
            "- **m_meta_keywords** — keyword string summarizing tags, topics and SEO-style keywords (when available)\n"
            "- **m_content_type** — internal classification labels such as `marketplaces`, `general`, `forums`\n"
            "- **m_country** — list of associated countries inferred from the content or targeting\n"
            "- **m_location** — list of locations or regions mentioned or targeted\n"
            "- **m_organization** — extracted organizations or platforms mentioned\n"
            "- **m_language** — detected language(s) of the content\n"
            "- **m_currencies** — list of currencies mentioned or used on the page\n"
            "- **m_domain** — list of domains associated with the page and its references\n"
            "- **m_hash_content** — hash of the normalized page content\n"
            "- **m_hash_url** — hash of the page URL\n"
            "- **m_hash** — internal document hash identifier used for deduplication and correlation\n"
            "- **m_update_date** — last time the document was updated in the system\n"
            "- **m_creation_date** — first time the document was created/ingested into the system\n\n"
            "Depending on the source, additional enrichment fields may be present, such as forum-specific metadata, "
            "structured attributes describing the section or category, or clearnet reference links.\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"m_base_url\": \"http://cards3wmb7atxhczo33trz5lhzcmfjftreyap2povmftd7g22u4holyd.onion\",\n"
            "  \"m_url\": \"http://cards3wmb7atxhczo33trz5lhzcmfjftreyap2povmftd7g22u4holyd.onion/popular/442\",\n"
            "  \"m_network\": \"onion\",\n"
            "  \"m_title\": \"giftcardxpress - buy cheap gift cards\",\n"
            "  \"m_meta_description\": \"save up to 70% on all your favorite gift cards\",\n"
            "  \"m_content\": \"save up to 70 on all your favorite gift cards\\nsave up to 70% on all your favorite gift cards\\nSave up to 70% on all your favorite gift cards\",\n"
            "  \"m_important_content\": \"no description found but contains some urls. this website is most probably a search engine or only contain references of other websites giftcardxpress - buy cheap gift cards save up to 70% on all your favorite\",\n"
            "  \"m_images\": [\n"
            "    \"http://cards3wmb7atxhczo33trz5lhzcmfjftreyap2povmftd7g22u4holyd.onion/static/assets/amazon.png\",\n"
            "    \"http://cards3wmb7atxhczo33trz5lhzcmfjftreyap2povmftd7g22u4holyd.onion/static/assets/amazon.png\",\n"
            "  ],\n"
            "  \"m_sub_url\": [\n"
            "    \"http://cards3wmb7atxhczo33trz5lhzcmfjftreyap2povmftd7g22u4holyd.onion/popular/823\",\n"
            "    \"http://cards3wmb7atxhczo33trz5lhzcmfjftreyap2povmftd7g22u4holyd.onion/new_arraival/823\",\n"
            "  ],\n"
            "  \"m_validity_score\": 0,\n"
            "  \"m_content_type\": [\"marketplaces\"],\n"
            "  \"m_domain\": [\n"
            "    \"amazon.de\",\n"
            "    \"cards3wmb7atxhczo33trz5lhzcmfjftreyap2povmftd7g22u4holyd.onion\"\n"
            "  ],\n"
            "  \"m_country\": [\"Spain\", \"Netherlands\", \"Germany\", \"France\"],\n"
            "  \"m_organization\": [\"Amazon\", \"Fortnite\", \"iTunes\", \"GiftCardXpress\", \"Google\", \"Steam\", \"Netflix\"],\n"
            "  \"m_location\": [\"Spain\", \"Germany\", \"France\"],\n"
            "  \"m_language\": [\"en\"],\n"
            "  \"m_currencies\": [\"USD\", \"EUR\", \"GBP\"],\n"
            "  \"m_update_date\": \"2025-12-02T13:13:55.970184+00:00\",\n"
            "  \"m_hash_content\": \"7c2739bc52efab970134f87542ac382daf25a1fa429aa0a15cbacbe30740b896\",\n"
            "  \"m_hash_url\": \"3fa64feadef7ea1a7765ee0849e6797838a468b3496759042ca7f33c22b9d6f9\",\n"
            "  \"m_hash\": \"c8790e0132c7fdfbbf6420cc9a73f478fbfc884202a5dab6f6ad3f1195882bbd\",\n"
            "  \"m_creation_date\": \"2025-12-02T13:13:55.970231+00:00\"\n"
            "}\n"
            "```\n"
        ) + IOC_DOC,
    },
    "chat": {
        "description": (
            "Get a specific chat intelligence report focused on messaging platforms such as Telegram by its report ID.\n\n"
            "The request is an HTTP GET and accepts:\n"
            "- **doc_id** (path) — string identifier of the chat report document\n"
            "- **lang** (query, optional) — language code used to localize analytical summaries when available.\n\n"
            "No request body is required."
        ),
        "response_description": (
            "Chat intelligence report consolidating one chat message or a small thread (for example from Telegram), "
            "returned as a single JSON object.\n\n"
            "Core response fields typically include:\n"
            "- **m_content** — normalized text content of the message (main body text)\n"
            "- **m_caption** — original caption text, often mirroring **m_content** for media posts\n"
            "- **m_message_date** — message date in `YYYY-MM-DD` format\n"
            "- **m_message_id** — platform-specific message identifier (e.g. Telegram message id)\n"
            "- **m_message_sharable_link** — deep link to the message (e.g. `https://t.me/...`)\n"
            "- **m_channel_id** — internal or platform channel identifier\n"
            "- **m_views** — number of views or impressions for the message\n"
            "- **m_sender_name** — human-readable sender name (may include additional text)\n"
            "- **m_sender_username** — sender username/handle (e.g. Telegram `@` handle)\n"
            "- **m_message_type** — list of message types (e.g. `[\"photo\"]`, `[\"text\"]`)\n"
            "- **m_media_url** — URL pointing to the media or message (for example a Telegram web link)\n"
            "- **m_media_caption** — caption/description related to the attached media\n"
            "- **m_reply_to_message_id** — message id of the parent message when this is a reply\n"
            "- **m_message_status** — message processing status in the system (e.g. `success`)\n"
            "- **m_channel_name** — human-readable channel name (e.g. `Mash`)\n"
            "- **m_weblink** — list of additional links associated with the channel or message (e.g. invite links)\n"
            "- **m_users** — list of user identifiers or usernames referenced in the message (e.g. `[\"Tiarkasir\"]`)\n"
            "- **m_content_type** — high-level internal labels for the content (e.g. `[\"text\"]`)\n"
            "- **m_sender_id** — numeric sender id on the platform\n"
            "- **m_sender_is_bot** — boolean indicating whether the sender is a bot\n"
            "- **m_is_forwarded** — boolean indicating whether the message is a forwarded message\n"
            "- **m_forwarded_date** — original forward date when **m_is_forwarded** is true\n"
            "- **m_is_reply** — boolean indicating whether the message is a reply\n"
            "- **m_pinned** — boolean indicating whether the message is pinned in the channel\n"
            "- **m_location** — list of location strings extracted from the content (e.g. city or area names)\n"
            "- **m_social_media_profiles** — list of social profile URLs mentioned in the message content\n"
            "- **m_domain** — list of domains extracted from links in the message\n"
            "- **m_platforms** — list of platforms referenced or linked (e.g. `[\"instagram\"]`)\n"
            "- **m_cluster_id** — internal logical cluster/group identifier for related chat items (e.g. `chat`)\n"
            "- **m_document_id** — internal document id used by the system for this chat record\n"
            "- **m_hash** — internal content hash used for deduplication and correlation\n"
            "- **m_creation_date** — timestamp when the message document was created/ingested\n"
            "- **m_edit_date** — last edit timestamp for the message (if it was edited)\n"
            "- **m_organization** — list of organizations or entities mentioned (e.g. `Boeing`)\n"
            "- **m_language** — detected language(s) of the message content (e.g. `[\"ru\"]`)\n\n"
            "Depending on the platform and message type, additional enrichment fields may be present, such as media "
            "metadata, reaction counts or extended thread context.\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"m_content\": \"Причина сигнала бедствия Boeing 777-200 — возгорание одного из двигателей. На данный момент пожар потушен. Сейчас самолёт вырабатывает топливо, готовясь к возвращению в Домодедово в 22:40. Экипаж работает штатно, паники на борту нет. UPD. На судне находятся 412 пассажиров и 13 членов бортовой команды. Подписывайся на Mash\",\n"
            "  \"m_caption\": \"Причина сигнала бедствия Boeing 777-200 — возгорание одного из двигателей. На данный момент пожар потушен. Сейчас самолёт вырабатывает топливо, готовясь к возвращению в Домодедово в 22:40. Экипаж работает штатно, паники на борту нет. UPD. На судне находятся 412 пассажиров и 13 членов бортовой команды. Подписывайся на Mash\",\n"
            "  \"m_message_date\": \"2025-12-03\",\n"
            "  \"m_message_id\": \"69893\",\n"
            "  \"m_message_sharable_link\": \"https://t.me/mash/69893\",\n"
            "  \"m_channel_id\": \"1117628569\",\n"
            "  \"m_views\": \"401445\",\n"
            "  \"m_sender_name\": \"TIAR None\",\n"
            "  \"m_sender_username\": \"Tiarkasir\",\n"
            "  \"m_message_type\": [\"photo\"],\n"
            "  \"m_media_url\": \"https://t.me/mash/69893\",\n"
            "  \"m_media_caption\": \"9 9 1 0 0 0 2 3 0 0 RUKO SENTRA NIAGA KALIMALANG BLOK B-1 NO.24 JALAN AHMAD YANI, KAYURINGIN BELAKANG MALL BCP •QEYSA •LENKA •MEMEY •SANSAN •KHANZA •ALEXA •ANITA •SENA •ESSA •NAOMI •MPIE •VITTA •CATRIN •MUTIA •FELISHA •ARRA •LALA •KIKI •EVA ID INSTAGRAM https://www.instagram.com/new_king_spa_bekasi_selatan?igsh=Znk4cWY3OG1udzZ3 BOKING DISINI @Tiarkasir LOKASI https://maps.app.goo.gl/sNzBhjnHhk7bgF2WA WA https://wa.me/qr/YGHM5GCX7SBFG1 SAYA TUNGGU KEHADIRANNYA SELALU BOS KU\",\n"
            "  \"m_reply_to_message_id\": \"69892\",\n"
            "  \"m_message_status\": \"success\",\n"
            "  \"m_channel_name\": \"Mash\",\n"
            "  \"m_weblink\": [\"https://t.me/+mBgDVq0QTftmY2Ji\"],\n"
            "  \"m_users\": [\"Tiarkasir\"],\n"
            "  \"m_content_type\": [\"text\"],\n"
            "  \"m_sender_id\": \"1117628569\",\n"
            "  \"m_sender_is_bot\": false,\n"
            "  \"m_is_forwarded\": false,\n"
            "  \"m_forwarded_date\": \"2025-11-05 08:29:26\",\n"
            "  \"m_is_reply\": true,\n"
            "  \"m_pinned\": false,\n"
            "  \"m_location\": [\"KAYURINGIN\"],\n"
            "  \"m_social_media_profiles\": [\"https://www.instagram.com/new_king_spa_bekasi_\"],\n"
            "  \"m_domain\": [\"instagram.com\"],\n"
            "  \"m_platforms\": [\"instagram\"],\n"
            "  \"m_cluster_id\": \"chat\",\n"
            "  \"m_document_id\": \"e233d6042cec2a3239a701d0eebebe3430f72543c0fd0e20de00f228808cafa5\",\n"
            "  \"m_hash\": \"e233d6042cec2a3239a701d0eebebe3430f72543c0fd0e20de00f228808cafa5\",\n"
            "  \"m_creation_date\": \"2025-12-03T21:36:59.858292+00:00\",\n"
            "  \"m_edit_date\": \"2025-12-03 19:40:44\",\n"
            "  \"m_organization\": [\"Boeing\"],\n"
            "  \"m_language\": [\"ru\"]\n"
            "}\n"
            "```\n"
        ) + IOC_DOC,
    },
    "social": {
        "description": (
            "Get a specific social media intelligence report (for example posts by ransomware groups or other threat "
            "actors) by its report ID.\n\n"
            "The request is an HTTP GET and accepts:\n"
            "- **doc_id** (path) — string identifier of the social media report document\n"
            "- **lang** (query, optional) — language code for localized narrative content.\n\n"
            "No request body is required."
        ),
        "response_description": (
           "Social media intelligence report containing posts and activity from monitored social platforms, returned "
           "as a single JSON object.\n\n"
           "Core response fields typically include:\n"
           "- **m_sender_name** — display name or handle of the account that posted the content (e.g. `@lu3ky13`)\n"
           "- **m_message_sharable_link** — full platform URL or deep link to the post\n"
           "- **m_content** — normalized text content of the post, including hashtags, mentions and links\n"
           "- **m_content_type** — internal labels describing the social collector/source type "
           "(e.g. `[\"social_collector\"]`)\n"
           "- **m_message_date** — date the post was created, in `YYYY-MM-DD` format\n"
           "- **m_channel_url** — URL of the profile, channel or account page\n"
           "- **m_message_id** — platform-specific unique identifier for the post\n"
           "- **m_platform** — social platform name (e.g. `twitter`)\n"
           "- **m_network** — network type for the source (typically `clearnet`)\n"
           "- **m_views** — approximate view/impression count when available\n"
           "- **m_comment_count** — number of comments or replies when available\n"
           "- **m_likes** — number of likes or favorites when available\n"
           "- **m_retweets** — number of reshares/retweets/boosts when available\n"
           "- **content_type** — high-level classification tags used by other modules "
           "(e.g. `[\"ddos\", \"exploit\", \"rce\"]`)\n"
           "- **m_name** — profile display name (e.g. `lu3ky13`)\n"
           "- **m_scrap_file** — internal scraper identifier or file prefix (e.g. `_twitter`)\n"
           "- **m_language** — detected language(s) of the post content (e.g. `[\"en\"]`)\n"
           "- **m_hashtag** — list of hashtags extracted from the content\n"
           "- **m_mention** — list of mentioned accounts/handles in the post\n"
           "- **m_currencies** — list of currencies referenced in the post\n"
           "- **m_domain** — list of domains referenced in links within the post\n"
           "- **m_hash** — internal content hash used for deduplication and correlation\n"
           "- **m_creation_date** — timestamp when the social post document was created/ingested by the system\n\n"
           "Depending on the platform and event type, additional enrichment fields may be present, such as reaction "
           "breakdowns, attached media details or thread/conversation context.\n\n"
           "Example response:\n"
           "```json\n"
           "{\n"
           "  \"m_sender_name\": \"@lu3ky13\",\n"
           "  \"m_message_sharable_link\": \"https://x.com/lu3ky13/status/1852382887246541180\",\n"
           "  \"m_content\": \"Remote Code Execution (RCE) thank you \\n@nahamsec\\n \\n\\nYay, I was awarded a $7,800 bounty on \\n@Hacker0x01\\n! \\nhttps://\\nhackerone.com/lu3ky-13 #TogetherWeHitHarder #bugbounty\",\n"
           "  \"m_content_type\": [\"social_collector\"],\n"
           "  \"m_message_date\": \"2024-11-01\",\n"
           "  \"m_channel_url\": \"https://x.com/lu3ky13\",\n"
           "  \"m_message_id\": \"1852382887246541180\",\n"
           "  \"m_platform\": \"twitter\",\n"
           "  \"m_network\": \"clearnet\",\n"
           "  \"m_views\": \"23000\",\n"
           "  \"m_comment_count\": \"15\",\n"
           "  \"m_likes\": \"357\",\n"
           "  \"m_retweets\": \"13\",\n"
           "  \"m_name\": \"lu3ky13\",\n"
           "  \"m_scrap_file\": \"_twitter\",\n"
           "  \"m_domain\": [\n"
           "    \"x.com\",\n"
           "    \"hackerone.com\"\n"
           "  ],\n"
           "  \"m_language\": [\"en\"],\n"
           "  \"m_hashtag\": [\"#bugbounty\", \"#togetherwehitharder\"],\n"
           "  \"m_currencies\": [\"USD\"],\n"
           "  \"m_mention\": [\"@hacker0x01\", \"@lu3ky13remote\", \"@nahamsec\"],\n"
           "  \"m_hash\": \"07b76a8a449633b73d38cc4f7c55ae970e01e942ea525a5dc9f39225de347c2d\",\n"
           "  \"m_creation_date\": \"2025-12-02T11:24:10.131332+00:00\",\n"
           "  \"content_type\": [\"ddos\", \"exploit\", \"rce\"]\n"
           "}\n"
           "```\n"
        ) + IOC_DOC,
    },

    "breach_screenshot": {
        "description": (
            "Retrieve the screenshot image associated with a specific breach report, stored in WebP format.\n\n"
            "The request is an HTTP GET and accepts:\n"
            "- **filename** (path) — base filename of the screenshot without extension.\n\n"
            "No request body is required."
        ),
        "response_description": (
            "WebP screenshot image that visually represents the breached website or resource described in the "
            "associated breach report. The service automatically appends the `.webp` extension, and the response "
            "payload is the raw image bytes."
            "\n\nExample:\n"
            "- Request: `GET /api/search/breach/screenshot/69993154316451142028569605097804`\n"
            "- Effective file retrieved: `69993154316451142028569605097804.webp`\n"
            "- Response headers: `Content-Type: image/webp` with the binary image data in the body."
        ),
    },
}

DYNAMIC_DOCS = {
    "dynamic_user_email": {
        "description": (
            "Perform a dynamic search for user email addresses discovered in monitored breach and defacement data, "
            "returning exposed account metadata for further investigation and remediation.\n\n"
            "This operation also fetches **real-time results from external dark-web intelligence APIs**, which may take "
            "additional time to process. During this period the API may return a pending response indicating that the "
            "upstream data collection is still running.\n\n"
            "A typical in-progress response looks like:\n\n"
            "```json\n"
            "{\n"
            "  \"status\": \"pending\",\n"
            "  \"progress\": 10,\n"
            "  \"step\": \"running\"\n"
            "}\n"
            "```\n\n"
            "The request is an HTTP POST and expects a JSON body with a **text** object containing the lookup fields. "
            "Typical request payload:\n\n"
            "```json\n"
            "{\n"
            "  \"text\": {\n"
            "    \"username\": \"\",\n"
            "    \"email\": \"msmannan00@gmail.com\"\n"
            "  }\n"
            "}\n"
            "```\n\n"
            "The **username** field is optional and can be left empty when only the email address should be used "
            "for the exposure search."
        ),
        "response_description": (
            "Dynamic search results listing exposed user email addresses and associated intelligence metadata.\n\n"
            "The response is a JSON object containing a **result** array. Each element summarizes where the supplied "
            "identifier appears in known breaches or leak collections.\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"result\": [\n"
            "    {\n"
            "      \"m_title\": \"Records for provided queries\",\n"
            "      \"m_url\": \"http://breachdbsztfykg2fdaq2gnqnxfsbj5d35byz3yzj73hazydk4vq72qd.onion\",\n"
            "      \"m_base_url\": \"http://breachdbsztfykg2fdaq2gnqnxfsbj5d35byz3yzj73hazydk4vq72qd.onion\",\n"
            "      \"m_content\": \"\",\n"
            "      \"m_important_content\": \"Records were found in a data breach.\",\n"
            "      \"m_network\": \"onion\",\n"
            "      \"m_section\": [],\n"
            "      \"m_content_type\": [\"stolen\"],\n"
            "      \"m_screenshot\": \"\",\n"
            "      \"m_weblink\": [],\n"
            "      \"m_dumplink\": [\n"
            "        \"Canva\",\n"
            "        \"000WebHost.com\",\n"
            "        \"Breach Compilation\",\n"
            "        \"Exploit.In\",\n"
            "        \"Collection #2\",\n"
            "        \"Mathway (v2)\",\n"
            "        \"Collection #5\",\n"
            "        \"Slideteam.net\",\n"
            "        \"Mathway (v1)\"\n"
            "      ],\n"
            "      \"m_websites\": [],\n"
            "      \"m_logo_or_images\": [],\n"
            "      \"m_leak_date\": null,\n"
            "      \"m_data_size\": null,\n"
            "      \"m_revenue\": null\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "```\n\n"
            "Field semantics for each element under **result**:\n"
            "- **m_title** — high level summary of the match context for the provided email or username\n"
            "- **m_url** — primary reference URL where the aggregated breach information is hosted\n"
            "- **m_base_url** — base URL of the breach or aggregation site\n"
            "- **m_content** — optional textual details, which may be empty when only summary text is available\n"
            "- **m_important_content** — short human-readable description of the exposure\n"
            "- **m_network** — network type where the breach information is hosted (e.g. `onion`)\n"
            "- **m_section** — list of sections or categories on the breach site that this record belongs to\n"
            "- **m_content_type** — internal labels describing the nature of the data, such as `stolen`\n"
            "- **m_screenshot** — identifier for a related screenshot image when available, or empty string if none\n"
            "- **m_weblink** — list of clearnet URLs directly related to this breach record, if present\n"
            "- **m_dumplink** — list of named breach collections or dump sources where the email was found\n"
            "- **m_websites** — list of affected websites or services when this information is available\n"
            "- **m_logo_or_images** — list of URLs pointing to logos or images associated with the victim or breach\n"
            "- **m_leak_date** — date of the leak if known, otherwise null\n"
            "- **m_data_size** — approximate size of the exposed dataset when provided, otherwise null\n"
            "- **m_revenue** — optional revenue or financial impact metadata, when tracked by the source\n\n"
            "Multiple entries can be returned in **result** if the same email or username was observed in more than "
            "one breach collection or dataset."
        ),
    },
    "dynamic_cracked": {
        "description": (
            "Perform a dynamic search for cracked credentials or applications identified in breach and defacement "
            "datasets, highlighting high-risk compromised apps, accounts and password reuse exposure.\n\n"
            "The request is an HTTP POST and expects a JSON body with a **text** object. For APK/app lookups, the "
            "backend currently supports using a Play Store URL to identify cracked or repackaged versions:\n\n"
            "```json\n"
            "{\n"
            "  \"text\": {\n"
            "    \"playstore\": \"https://play.google.com/store/apps/details?id=com.jrzheng.supervpnfree&hl=en\"\n"
            "  }\n"
            "}\n"
            "```\n\n"
            "The **playstore** field should contain a valid Google Play application URL for which cracked or modified "
            "artifacts should be discovered."
        ),
        "response_description": (
            "Dynamic search results listing cracked or modified application artifacts with related context and "
            "metadata.\n\n"
            "The response is a JSON object containing a **result** array. Each element describes one discovered "
            "artifact, such as a cracked APK:\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"result\": [\n"
            "    {\n"
            "      \"m_app_name\": \"SuperVPN Fast VPN Client v3.0.3.apk\",\n"
            "      \"m_package_id\": \"com.jrzheng.supervpnfree\",\n"
            "      \"m_app_url\": \"https://filecr.com/android/supervpn-fast-vpn-client/\",\n"
            "      \"m_network\": \"clearnet\",\n"
            "      \"m_version\": \"3.0.3\",\n"
            "      \"m_content_type\": [\"apk\"],\n"
            "      \"m_download_link\": [],\n"
            "      \"m_apk_size\": null,\n"
            "      \"m_latest_date\": \"2025-10-30\",\n"
            "      \"m_mod_features\": \"\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "```\n\n"
            "Field semantics for each element under **result**:\n"
            "- **m_app_name** — name of the discovered app artifact (often includes version and `.apk` suffix)\n"
            "- **m_package_id** — application package identifier (e.g. `com.jrzheng.supervpnfree`)\n"
            "- **m_app_url** — URL of the site hosting the cracked or redistributed app (e.g. warez/file hosting site)\n"
            "- **m_network** — network type where the artifact is hosted (typically `clearnet`)\n"
            "- **m_version** — discovered application version string\n"
            "- **m_content_type** — internal labels describing artifact type (e.g. `apk`)\n"
            "- **m_download_link** — list of direct download URLs for the artifact when available (may be empty)\n"
            "- **m_apk_size** — APK file size when known, otherwise null\n"
            "- **m_latest_date** — most recent observation date for this artifact\n"
            "- **m_mod_features** — description of modifications, cracks or extra features, if provided by the source\n\n"
            "Multiple entries can be returned in **result** if the same Play Store app is found across different "
            "cracked repositories or mirrors. Duplicate-looking entries may indicate separate sources with the same "
            "version and metadata."
        ),
    },
    "dynamic_social": {
        "description": (
            "Perform a dynamic search for social media identifiers and related email addresses found in breach and "
            "defacement data, helping uncover exposed or impersonated social accounts.\n\n"
            "The request is an HTTP POST and expects a JSON body with a **text** object containing the social handle "
            "or username to look up.\n\n"
            "Example request payload:\n\n"
            "```json\n"
            "{\n"
            "  \"text\": {\n"
            "    \"username\": \"bitcoin\"\n"
            "  }\n"
            "}\n"
            "```\n\n"
            "The **username** field should contain the social identifier to be resolved across monitored platforms "
            "and breach-related datasets."
        ),
        "response_description": (
            "Dynamic search results listing exposed or observed social media identifiers and related contact details.\n\n"
            "The response is a JSON object containing a **result** array. Each element describes one occurrence of "
            "the provided username on a monitored platform.\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"result\": [\n"
            "    {\n"
            "      \"m_title\": \"User bitcoin found on https://twitter.com\",\n"
            "      \"m_url\": \"https://twitter.com/bitcoin\",\n"
            "      \"m_base_url\": \"https://twitter.com\",\n"
            "      \"m_content\": \"\",\n"
            "      \"m_important_content\": \"Found on: https://twitter.com/bitcoin\",\n"
            "      \"m_network\": \"clearnet\",\n"
            "      \"m_section\": [],\n"
            "      \"m_content_type\": [\"stolen\"],\n"
            "      \"m_screenshot\": \"\",\n"
            "      \"m_weblink\": [\"https://twitter.com/bitcoin\"],\n"
            "      \"m_dumplink\": [\"https://twitter.com/bitcoin\"],\n"
            "      \"m_websites\": [],\n"
            "      \"m_logo_or_images\": [],\n"
            "      \"m_leak_date\": null,\n"
            "      \"m_data_size\": null,\n"
            "      \"m_revenue\": null\n"
            "    },\n"
            "    {\n"
            "      \"m_title\": \"User bitcoin found on https://clubhouse.com\",\n"
            "      \"m_url\": \"https://clubhouse.com/@bitcoin\",\n"
            "      \"m_base_url\": \"https://clubhouse.com\",\n"
            "      \"m_content\": \"\",\n"
            "      \"m_important_content\": \"Found on: https://clubhouse.com/@bitcoin\",\n"
            "      \"m_network\": \"clearnet\",\n"
            "      \"m_section\": [],\n"
            "      \"m_content_type\": [\"stolen\"],\n"
            "      \"m_screenshot\": \"\",\n"
            "      \"m_weblink\": [\"https://clubhouse.com/@bitcoin\"],\n"
            "      \"m_dumplink\": [\"https://clubhouse.com/@bitcoin\"],\n"
            "      \"m_websites\": [],\n"
            "      \"m_logo_or_images\": [],\n"
            "      \"m_leak_date\": null,\n"
            "      \"m_data_size\": null,\n"
            "      \"m_revenue\": null\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "```\n\n"
            "Field semantics for each element under **result**:\n"
            "- **m_title** — summary line indicating the username and the platform where it was found\n"
            "- **m_url** — direct URL to the profile or page for the discovered account\n"
            "- **m_base_url** — base URL of the platform (e.g. `https://twitter.com`, `https://clubhouse.com`)\n"
            "- **m_content** — optional additional text content, which may be empty when only metadata is stored\n"
            "- **m_important_content** — short human-readable description of the finding "
            "(for example `Found on: https://twitter.com/bitcoin`)\n"
            "- **m_network** — network type where the account is hosted (typically `clearnet`)\n"
            "- **m_section** — optional list of sections/categories on the platform or in the underlying dataset\n"
            "- **m_content_type** — internal classification labels for the record (e.g. `stolen` to indicate possible "
            "compromise or risk)\n"
            "- **m_screenshot** — identifier for a screenshot of the profile or page, when available, or empty string\n"
            "- **m_weblink** — list of direct profile URLs for the discovered account on that platform\n"
            "- **m_dumplink** — list of links or references within breach/collection data pointing to this account\n"
            "- **m_websites** — list of associated websites when available\n"
            "- **m_logo_or_images** — list of URLs for logos, avatars or images tied to the account\n"
            "- **m_leak_date** — date of the leak or earliest observation if known, otherwise null\n"
            "- **m_data_size** — size of associated dataset when this information is available, otherwise null\n"
            "- **m_revenue** — optional revenue/financial impact metadata when tracked by the backend\n\n"
            "Multiple entries can be returned in **result** when the same username is observed on different social "
            "platforms or in various breach-related datasets."
        ),
    },
    "domain_scan": {
            "description": (
                "Scan a target domain using the configured scanning engine.\n\n"
                "The request is an HTTP POST and expects a JSON body matching the `DomainScanRequest` schema:\n\n"
                "```json\n"
                "{\n"
                "  \"domain\": \"www.bbc.com\",\n"
                "  \"scanType\": \"basic\"\n"
                "}\n"
                "```\n\n"
                "Fields:\n"
                "- **domain**   — target domain or host to scan (e.g. `www.bbc.com`)\n"
                "- **scanType** — scan mode selector. Supported values:\n"
                "  - `basic`    — infrastructure & HTTP intelligence (security headers, caching, CSP, CORS, etc.)\n"
                "  - `advanced` — same as `basic`, plus port scanning and service-level inspection\n"
                "  - `seo`      — SEO metadata, indexing and ranking-related signals\n"
                "  - `repo`     — linked repository scan (GitHub/GitLab, exposed files, commit metadata)"
                "\n\n"
                "Payload examples by **scanType** (all share the same schema; only `scanType` changes):\n\n"
                "```json\n"
                "{\n"
                "  \"domain\": \"www.bbc.com\",\n"
                "  \"scanType\": \"basic\"\n"
                "}\n"
                "```\n\n"
                "```json\n"
                "{\n"
                "  \"domain\": \"www.bbc.com\",\n"
                "  \"scanType\": \"advanced\"\n"
                "}\n"
                "```\n\n"
                "```json\n"
                "{\n"
                "  \"domain\": \"www.bbc.com\",\n"
                "  \"scanType\": \"seo\"\n"
                "}\n"
                "```\n\n"
                "```json\n"
                "{\n"
                "  \"domain\": \"https://github.com/globaleaks/globaleaks-whistleblowing-software\",\n"
                "  \"scanType\": \"repo\"\n"
                "}\n"
                "```\n"
            ),
            "response_description": (
                "Scan results for the selected `scanType`, returned as a JSON object with a top-level **result** field.\n\n"
                "For **basic / advanced / seo** scans, the structure of `result` is typically:\n\n"
                "- **meta** — scan metadata:\n"
                "  - **URL**              — fully qualified URL that was scanned (e.g. `https://www.bbc.com`)\n"
                "  - **Host**             — resolved host name (e.g. `www.bbc.com`)\n"
                "  - **Port**             — port and protocol (e.g. `443 SSL`)\n"
                "  - **Scanned_on_date**  — human-readable scan date (e.g. `December 07, 2025`)\n"
                "  - **Scanned_by**       — scanner identity (e.g. `Orion Intelligence`)\n\n"
                "- **summary** — map of category name → count of findings in that category, such as:\n"
                "  - `Headers`, `Caching Findings`, `Caching`, `CSP/Policy`, `CORS`, `General`, `Informational`\n\n"
                "- **threats** — map of category name → list of findings, each containing:\n"
                "  - **header**       — finding title or header (e.g. `Permissions-Policy`)\n"
                "  - **description**  — detailed explanation of the issue\n"
                "  - **confidence**   — confidence level (`High`, `Medium`, `Low`)\n"
                "  - **risk**         — risk level (`High`, `Medium`, `Low`, `Informational`)\n\n"
                "- **proofs** — map of category name → list of evidence items, each containing:\n"
                "  - **header**       — finding title or header\n"
                "  - **proof**        — HTML/response snippet or other raw evidence\n"
                "  - **confidence**   — confidence level\n"
                "  - **risk**         — risk level\n\n"
                "- **grade** — overall security/quality grade (e.g. `D`)\n"
                "- **grade_counts** — totals of findings by severity:\n"
                "  - **high**, **medium**, **low**, **informational**\n\n"
                "For **advanced** scans, the structure is the same as `basic` but may include additional port and service\n"
                "intelligence within **meta** and/or as extra categories in **summary**/**threats**.\n\n"
                "For **repo** scans, `result` has the same top-level structure but often with empty findings when no issues\n"
                "are detected. A typical `repo` scan looks like:\n\n"
                "```json\n"
                "{\n"
                "  \"result\": {\n"
                "    \"meta\": {\n"
                "      \"URL\": \"https://github.com/globaleaks/globaleaks-whistleblowing-software\",\n"
                "      \"Host\": \"github.com\",\n"
                "      \"Port\": \"443 SSL\",\n"
                "      \"Scanned_on_date\": \"December 07, 2025\",\n"
                "      \"Scanned_by\": \"Orion Intelligence\"\n"
                "    },\n"
                "    \"summary\": {},\n"
                "    \"threats\": {},\n"
                "    \"proofs\": {},\n"
                "    \"grade\": \"A\",\n"
                "    \"grade_counts\": {\n"
                "      \"high\": 0,\n"
                "      \"medium\": 0,\n"
                "      \"low\": 0,\n"
                "      \"informational\": 0\n"
                "    }\n"
                "  }\n"
                "}\n"
                "```\n\n"
                "The exact number of findings and the categories under **summary**, **threats**, and **proofs** depend on the\n"
                "target and the selected `scanType`."
            ),
    },
}

SEARCH_DOCS = {
    "defacement": {
        "description": (
            "Search defacement intelligence reports by keyword, threat group, or affected domain; returns metadata "
            "for matching defacement reports.\n\n"
            "This endpoint corresponds to `/api/search/defacement` and expects a JSON body matching the "
            "`search_defacement_param_model` schema.\n\n"
            "Supported request fields:\n"
            "- **q** — free-text search query over normalized titles, content and metadata (e.g. banner text, domains).\n"
            "- **category** — ML-based classifier label (e.g. `all`, `currency`, `forums`, `news`, `leaks`, etc.); "
            "can be safely left as `all` to avoid category filtering.\n"
            "- **page** — page number for paginated results (1-based integer).\n"
            "- **network** — network scope for the search: `all`, `clearnet`, `onion`, `i2p`, `freenet`.\n"
            "matching defacement documents.\n"
            "- **daterange** — optional date range in `YYYY-MM-DD,YYYY-MM-DD` format to restrict results based on "
            "creation or update time.\n"
            "- **attacker** — raw attacker string (actual attacker name as it appears in the source content).\n"
            "- **must** — if `true`, filtered values (attacker, team, IOC entities) must be present in the document; "
            "if `false`, they are treated as optional/boosting filters.\n"
            "- **matchtype** — logical operator for multi-valued filters: `and` (all values must match) or "
            "`or` (any value can match).\n"
            "- **team** — normalized defacer / hacker / threat actor name (e.g. `mthcht`).\n"
            "- **content** — high-level defacement content type such as `phishing`, `hacked`, or `databases`.\n"
            "- **entity_filter** — IOC-based filter object where keys are IOC/metadata fields and values are lists "
            "of allowed values (for example domains, IPs, countries, emails, etc.).\n\n"
            "Example request payload:\n"
            "```json\n"
            "{\n"
            "  \"q\": \"Hacked by\",\n"
            "  \"category\": \"all\",\n"
            "  \"page\": 1,\n"
            "  \"network\": \"onion\",\n"
            "  \"daterange\": \"2025-12-01,2025-12-07\",\n"
            "  \"attacker\": \"mthcht\",\n"
            "  \"must\": true,\n"
            "  \"matchtype\": \"and\",\n"
            "  \"team\": \"mthcht\",\n"
            "  \"content\": \"phishing\",\n"
            "  \"entity_filter\": {\n"
            "    \"m_domain\": [\"github.com\"],\n"
            "    \"m_country\": [\"US\"],\n"
            "    \"m_ip\": [\"192.0.2.10\"]\n"
            "  }\n"
            "}\n"
            "```\n"
        ),
        "response_description": (
            "Defacement intelligence search results with metadata for each matching defacement report.\n\n"
            "The response is a JSON object containing pagination metadata and a list of defacement documents:\n\n"
            "- **total** — total number of matching defacement reports.\n"
            "- **page** — current page number.\n"
            "- **page_size** — number of documents returned in this page.\n"
            "- **results** — list of defacement report summary objects.\n\n"
            "Each element in **results** typically includes:\n"
            "- **doc_id** — internal document identifier to be used with the defacement report detail API.\n"
            "- **m_title** — defacement/phishing page title or banner text (e.g. `Hacked by mthcht`).\n"
            "- **m_team** — normalized defacer / hacker / threat actor name.\n"
            "- **m_base_url** — base URL or service where the content originates (e.g. `https://github.com/`).\n"
            "- **m_url** — concrete URL of the defaced or phishing page.\n"
            "- **m_ioc_type** — high-level classification of the event (e.g. `phishing`, `defacement`).\n"
            "- **m_leak_date** — first observed date for the event.\n"
            "- **m_network** — network type (`clearnet`, `onion`, `i2p`, etc.).\n"
            "- **m_domain** — list of domains involved in the event.\n"
            "- **m_content_type** — classification labels (e.g. [`defacement`, `phishing`]).\n"
            "- **m_important_content** — key snippet summarizing the defacement.\n"
            "- **m_screenshot** — screenshot identifier for the defaced page.\n"
            "- **m_update_date** — last time this document was updated in the system.\n"
            "- **m_creation_date** — first time the document was created/ingested.\n"
            "- **m_hash** — internal document hash used for deduplication.\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"total\": 42,\n"
            "  \"page\": 1,\n"
            "  \"page_size\": 10,\n"
            "  \"results\": [\n"
            "    {\n"
            "      \"doc_id\": \"c4d0d2d2-3c0a-4e2d-a0f5-9a1c7f9e3c01\",\n"
            "      \"m_title\": \"Hacked by mthcht\",\n"
            "      \"m_team\": \"mthcht\",\n"
            "      \"m_base_url\": \"https://github.com/\",\n"
            "      \"m_url\": \"https://github.com/some-victim-repo\",\n"
            "      \"m_ioc_type\": \"phishing\",\n"
            "      \"m_leak_date\": \"2025-12-01T18:22:41.032Z\",\n"
            "      \"m_network\": \"clearnet\",\n"
            "      \"m_domain\": [\n"
            "        \"github.com\",\n"
            "        \"victim.org\"\n"
            "      ],\n"
            "      \"m_content_type\": [\n"
            "        \"defacement\",\n"
            "        \"phishing\"\n"
            "      ],\n"
            "      \"m_important_content\": \"Hacked by mthcht – database dumped and leaked.\",\n"
            "      \"m_screenshot\": \"69993154316451142028569605097804\",\n"
            "      \"m_update_date\": \"2025-12-02T10:05:12.910Z\",\n"
            "      \"m_creation_date\": \"2025-12-01T18:22:41.032Z\",\n"
            "      \"m_hash\": \"9b4b1f15f1f94a5fb3a4a0ea0dcbf9a0\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "```\n"
        ) + IOC_DOC,
    },
    "exploit": {
        "description": (
            "Search exploit and vulnerability intelligence reports using free-text query and structured filters such as "
            "CVE identifier, vendor, product, platform, or keyword.\n\n"
            "The request is an HTTP POST with a JSON body matching the `search_leak_param_model` schema:\n\n"
            "```json\n"
            "{\n"
            "  \"q\": \"CVE-2024-12345\",\n"
            "  \"category\": \"all\",\n"
            "  \"page\": 1,\n"
            "  \"safe\": false,\n"
            "  \"network\": \"all\",\n"
            "  \"matchtype\": \"or\",\n"
            "  \"daterange\": \"2025-11-01,2025-12-07\",\n"
            "  \"content\": \"all\",\n"
            "  \"entity\": \"cve\",\n"
            "  \"must\": false,\n"
            "  \"entity_filter\": {\n"
            "    \"m_cve\": [\"CVE-2024-12345\"],\n"
            "    \"m_vendor\": [\"ExampleCorp\"],\n"
            "    \"m_product\": [\"ExampleServer\"]\n"
            "  }\n"
            "}\n"
            "```\n\n"
            "Field semantics:\n"
            "- **q** — free-text query (CVE id, exploit name, vendor, product, function name, etc.). Empty string searches all.\n"
            "- **category** — ML-based content/category classifier (e.g., `cve`, `exploit`, `poc`, `advisory`); set to `all` to disable.\n"
            "- **page** — page number for paginated results (1-based).\n"
            "- **safe** — safety toggle; when true, UI can mask or downrank potentially dangerous payload details.\n"
            "- **network** — content network filter: `all`, `clearnet`, `onion`, `i2p`, etc.\n"
            "- **matchtype** — logical operator for combining query and filters: `or` (default) or `and`.\n"
            "- **daterange** — optional date range filter in `YYYY-MM-DD,YYYY-MM-DD` format (e.g., `2025-11-01,2025-12-07`).\n"
            "- **content** — exploit content-type filter, such as `all`, `cve`, `exploit`, `poc`, `advisory`.\n"
            "- **entity** — primary entity/IOC dimension for the query (e.g., `cve`, `vendor`, `product`, `ip`, `domain`).\n"
            "- **must** — when true, values under **entity_filter** must be present in the matched documents (hard filter).\n"
            "- **entity_filter** — IOC/entity filter map; keys are IOC fields (e.g., `m_cve`, `m_vendor`, `m_product`, `m_domain`) and\n"
            "  values are lists of required values for those fields.\n"
        ),
        "response_description": (
            "Exploit intelligence search results containing metadata for each matching exploit or vulnerability report.\n\n"
            "The response is a JSON object with pagination and a list of exploit documents. Typical fields:\n"
            "- **total** — total number of exploit documents matching the query and filters\n"
            "- **page** — current page number\n"
            "- **results** — list of exploit report summaries, where each entry may include:\n"
            "  - **m_title** — exploit or vulnerability title (often includes CVE id and short description)\n"
            "  - **m_url** — primary URL of the exploit or advisory page\n"
            "  - **m_base_url** — base URL/host of the source site (e.g. `https://www.rapid7.com`)\n"
            "  - **m_content** — normalized exploit/advisory description or body text\n"
            "  - **m_important_content** — key snippet summarizing the exploit or impact\n"
            "  - **m_network** — network classification (`clearnet`, `onion`, etc.)\n"
            "  - **m_content_type** — internal labels such as `cve`, `exploit`, `poc`, `advisory`\n"
            "  - **m_cve** — list of associated CVE identifiers\n"
            "  - **m_vendor** — list of affected vendors\n"
            "  - **m_product** — list of affected products or components\n"
            "  - **m_platform** — list of affected platforms/OS (e.g. `Windows`, `Linux`)\n"
            "  - **m_publication_date** — publication or first-seen date for the exploit/advisory\n"
            "  - **m_exploit_type** — exploit type or tactic (e.g. `remote_code_execution`, `privilege_escalation`)\n"
            "  - **m_source** — normalized name of the source (e.g. `rapid7`, `exploitdb`)\n"
            "  - **m_hash** — internal document hash identifier used for correlation\n"
            "  - optional IOC/enrichment fields (IP addresses, domains, URLs, file hashes, etc.) depending on the document\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"total\": 87,\n"
            "  \"page\": 1,\n"
            "  \"results\": [\n"
            "    {\n"
            "      \"m_title\": \"CVE-2024-12345 Remote Code Execution in ExampleServer\",\n"
            "      \"m_url\": \"https://www.rapid7.com/db/modules/exploit/example/cve_2024_12345/\",\n"
            "      \"m_base_url\": \"https://www.rapid7.com\",\n"
            "      \"m_content\": \"This module exploits a remote code execution vulnerability in ExampleServer...\",\n"
            "      \"m_important_content\": \"Unauthenticated RCE in ExampleServer via crafted HTTP request.\",\n"
            "      \"m_network\": \"clearnet\",\n"
            "      \"m_content_type\": [\"cve\", \"exploit\"],\n"
            "      \"m_cve\": [\"CVE-2024-12345\"],\n"
            "      \"m_vendor\": [\"ExampleCorp\"],\n"
            "      \"m_product\": [\"ExampleServer\"],\n"
            "      \"m_platform\": [\"Windows\"],\n"
            "      \"m_publication_date\": \"2025-11-30T14:33:00Z\",\n"
            "      \"m_exploit_type\": [\"remote_code_execution\"],\n"
            "      \"m_source\": \"rapid7\",\n"
            "      \"m_hash\": \"f9d8e7c6b5a4...\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "```\n"
        ),
    },
    "breach": {
        "description": (
            "Search breach / leak intelligence reports aggregated from ransomware blogs, extortion sites, leak forums, "
            "and darkweb data-dump portals; returns a paginated list of breach announcements and related metadata.\n\n"
            "Request body (`search_leak_param_model`):\n"
            "- **q** — free-text search term applied across title, content, location, industry, team name, domains, etc. "
            "(default: empty string)\n"
            "- **category** — logical content bucket. `\"all\"` searches across consolidated leak indices; other values "
            "may restrict the search to specific collections such as `\"leaks\"`, `\"tracking\"`, or `\"news\"` depending "
            "on deployment (default: `\"all\"`). When `\"all\"`, the backend runs a consolidated ranked search over the "
            "core leak index.\n"
            "- **page** — page number of the paginated result set (1-based; default: `1`).\n"
            "- **safe** — safe-search toggle. When `true`, sensitive or graphic content is filtered or down-ranked; "
            "when `false`, all matching breach items are returned (frontend maps `\"yes\"/\"no\"` to this boolean).\n"
            "- **network** — web layer filter; one of:\n"
            "  - `\"all\"` — no restriction\n"
            "  - `\"clearnet\"` — surface web sources\n"
            "  - `\"onion\"` — Tor hidden services\n"
            "  - `\"i2p\"` — I2P hidden services\n"
            "- **matchtype** — logical operator for combining the main query and filters; usually `\"or\"` (default) "
            "or `\"and\"`.\n"
            "- **daterange** — optional creation/ingestion date range for the leak document in "
            "`YYYY-MM-DD,YYYY-MM-DD` format; empty string means no date filter. This maps to `m_creation_date`.\n"
            "- **content** — content-type key such as: "
            "`all`, `breach`, `credential`, `ransomware`, `phishing`, `scam`, `malware`, `infostealer`, `c2`, "
            "`ddos`, `exploit`, `leak`, `logs`, `vpn`, `carding`, `rat`, `keylogger`, `spyware`, `sqlinjection`, "
            "`xss`, `supplychain`, `insider`, `fraud`, `obfuscation`, `crack`, `cheats`, `cve`, `zero_day`, "
            "`rootkit`, `apt`, `threat_intel`, `darkweb`, `rce`, `lpe`, `exfiltration`, `persistence`, "
            "`reconnaissance`, `hack`, `news`, `credentials_common`, `war`\n"
            "- **entity_filter** — IOC-style structured filter map of `field_name → [values]`. This allows precise "
            "filtering on specific leak attributes. Example valid payload:\n"
            "```json\n"
            "{\n"
            "  \"entity_filter\": {\n"
            "    \"m_country\": [\"Germany\"],\n"
            "    \"m_team\": [\"BROTHERHOOD\"],\n"
            "    \"m_industry\": [\"Electricity, Oil & Gas\"],\n"
            "    \"m_network\": [\"onion\"],\n"
            "    \"m_domain\": [\"ib-laudi.de\"]\n"
            "  }\n"
            "}\n"
            "```\n"
            "Commonly supported fields include (but are not limited to):\n"
            "- `m_country` — affected country or countries\n"
            "- `m_location` — free-text or structured location\n"
            "- `m_team` — ransomware / leak group name (for example `\"BROTHERHOOD\"`)\n"
            "- `m_industry` — victim industry vertical (for example `\"Agricultural Sector\"`, "
            "`\"Electricity, Oil & Gas\"`, `\"Jewelry & Watch Retail\"`)\n"
            "- `m_domain` — victim or leak domains\n"
            "- `m_network` — network type (`\"clearnet\"`, `\"onion\"`, `\"i2p\"`)\n"
            "- `m_content_type` or `content_type` — internal classification tags (for example "
            "`\"leaks\"`, `\"ransomware\"`, `\"darkweb\"`)\n"
            "- `m_language` — language codes (for example `\"en\"`)\n"
            "- `m_person` — people or organisation names extracted from the leak\n"
            "- `m_scrap_file` — scraper/source identifier\n"
            "- any other indexed IOC-style fields exposed by the underlying leak index.\n\n"
            "Minimal example request:\n"
            "```json\n"
            "{\n"
            "  \"q\": \"Germany energy sector\",\n"
            "  \"category\": \"all\",\n"
            "  \"page\": 1,\n"
            "  \"network\": \"onion\",\n"
            "  \"safe\": true,\n"
            "  \"daterange\": \"2025-11-20,2025-12-05\",\n"
            "  \"entity_filter\": {\n"
            "    \"m_country\": [\"Germany\"],\n"
            "    \"m_team\": [\"BROTHERHOOD\"]\n"
            "  },\n"
            "  \"matchtype\": \"or\"\n"
            "}\n"
            "```\n"
        ),
        "response_description": (
           "Breach/leak search results as a JSON object describing matching breach announcements and data-dump entries.\n\n"
           "Top-level response keys:\n"
           "- **Result** — list of breach/leak report objects\n"
           "- **Suggestions** — optional list of suggested queries or corrections (may be omitted or empty depending on "
           "backend implementation)\n"
           "- **Page_Count** — number of pages for the current query and filters (may be fractional depending on scoring "
           "and backend pagination strategy)\n\n"
           "Each entry in **Result** typically contains a subset of the following fields:\n"
           "- **m_title** — title of the leak/announcement (for example `\"Ingenieurbüro Laudi\"`, `\"Ninas Jewellery\"`)\n"
           "- **m_url** — primary URL of the leak page (often the group’s onion site landing page)\n"
           "- **m_base_url** — base/source URL of the leak site\n"
           "- **m_network** — network type such as `onion`, `clearnet`, or `i2p`\n"
           "- **m_content** — full leak description or structured summary including organisation, country, data size, "
           "and embedded links\n"
           "- **m_important_content** — condensed or highlighted version of `m_content` optimised for summarisation/search\n"
           "- **m_content_type** — high-level classification tags, commonly including `\"leaks\"` and potentially other "
           "internal tags\n"
           "- **m_industry** — victim’s industry vertical (for example `\"Agricultural Sector\"`, "
           "`\"Electricity, Oil & Gas\"`, `\"Jewelry & Watch Retail\"`)\n"
           "- **m_location** — list of locations/regions attached to the victim\n"
           "- **m_country** — list of affected countries (for example `[\"Germany\"]`, `[\"Australia\"]`)\n"
           "- **m_team** — ransomware / leak group name (for example `\"BROTHERHOOD\"`)\n"
           "- **m_websites** — list of victim websites (for example `\"https://www.ib-laudi.de/\"`)\n"
           "- **m_logo_or_images** — list of logo / screenshot URLs hosted on the leak site\n"
           "- **m_dumplink** — list of direct links to leaked files (documents, spreadsheets, images, etc.)\n"
           "- **m_person** — people or organisation names extracted from the dump, when available\n"
           "- **m_language** — language(s) of the leak content (for example `[\"en\"]`)\n"
           "- **m_domain** — list of domains associated with the leak (victim domain and/or leak portal domain)\n"
           "- **m_scrap_file** — internal scraper identifier for the leak source\n"
           "- **m_hash** — stable internal hash identifier for the leak record used for deduplication\n"
           "- **m_update_date** — last update timestamp of the leak record\n"
           "- **m_creation_date** — first time the leak record was ingested\n"
           "- **rank_index** — internal ranking/index identifier (for example `\"leak_model\"`)\n"
           "- **_score** — search-engine relevance score\n"
           "- **_rank** — rank position of the document in the current result set\n"
           "- **m_embedding** — optional internal embedding vector used for semantic search (large numeric array; "
           "primarily for internal use and usually not required by clients)\n\n"
           "Example response:\n"
           "```json\n"
           "{\n"
           "  \"Result\": [\n"
           "    {\n"
           "      \"m_title\": \"Announcement\",\n"
           "      \"m_url\": \"http://brohoodyaifh2ptccph5zfljyajjabwjjo4lg6gfp4xb6ynw5w7ml6id.onion/\",\n"
           "      \"m_screenshot\": \"45422919581257033639454756554585\",\n"
           "      \"m_base_url\": \"http://brohoodyaifh2ptccph5zfljyajjabwjjo4lg6gfp4xb6ynw5w7ml6id.onion/\",\n"
           "      \"m_content\": \"Title: Announcement\\nOrganization: Agricultural Sector\\nCountry: Germany\\n...\",\n"
           "      \"m_important_content\": \"Title: Announcement\\nOrganization: Agricultural Sector\\nCountry: Germany\\n...\",\n"
           "      \"m_network\": \"onion\",\n"
           "      \"m_content_type\": [\"leaks\"],\n"
           "      \"m_industry\": \"Agricultural Sector\",\n"
           "      \"m_logo_or_images\": [\"http://.../images/announcement/logo.png\"],\n"
           "      \"m_location\": [\"Germany\"],\n"
           "      \"m_team\": \"BROTHERHOOD\",\n"
           "      \"m_country\": [\"Germany\"],\n"
           "      \"m_domain\": [\"brohoodyaifh2ptccph5zfljyajjabwjjo4lg6gfp4xb6ynw5w7ml6id.onion\"],\n"
           "      \"m_scrap_file\": \"_brohoodyaifh2ptccph5zfljyajjabwjjo4lg6gfp4xb6ynw5w7ml6id\",\n"
           "      \"m_hash\": \"ca1c7476db86b66c05773f62b85ea5ab0042cd356744ad189f218d16b29db344\",\n"
           "      \"m_update_date\": \"2025-12-03T19:13:20.077156+00:00\",\n"
           "      \"m_creation_date\": \"2025-12-03T19:13:20.077203+00:00\",\n"
           "      \"rank_index\": \"leak_model\",\n"
           "      \"_score\": 0.2,\n"
           "      \"_rank\": 1\n"
           "    },\n"
           "    {\n"
           "      \"m_title\": \"Ingenieurbüro Laudi\",\n"
           "      \"m_url\": \"http://brohoodyaifh2ptccph5zfljyajjabwjjo4lg6gfp4xb6ynw5w7ml6id.onion/\",\n"
           "      \"m_network\": \"onion\",\n"
           "      \"m_content_type\": [\"leaks\"],\n"
           "      \"m_industry\": \"Electricity, Oil & Gas\",\n"
           "      \"m_websites\": [\"https://www.ib-laudi.de/\"],\n"
           "      \"m_location\": [\"Germany\"],\n"
           "      \"m_team\": \"BROTHERHOOD\",\n"
           "      \"m_country\": [\"Germany\"],\n"
           "      \"m_dumplink\": [\"http://.../files/230629 Berechnung Raumluftmengen LPH4.xlsx\", \"...\"]\n"
           "    }\n"
           "  ],\n"
           "  \"Page_Count\": 1\n"
           "}\n"
           "```\n"
        ) + IOC_DOC,
    },

    "social": {
        "description": (
            "Search social media intelligence reports using free-text queries and structured filters such as hashtag, "
            "platform, organization, domain, or country.\n\n"
            "The request is an HTTP POST with a JSON body matching the `search_social_param_model` schema:\n\n"
            "```json\n"
            "{\n"
            "  \"q\": \"#ransomware data leak\",\n"
            "  \"page\": 1,\n"
            "  \"content\": \"all\",\n"
            "  \"category\": \"all\",\n"
            "  \"network\": \"all\",\n"
            "  \"daterange\": \"2025-11-01,2025-12-07\",\n"
            "  \"matchtype\": \"or\",\n"
            "  \"platform\": \"mastodon\",\n"
            "  \"must\": false,\n"
            "  \"entity_filter\": {\n"
            "    \"m_hashtag\": [\"#ransomware\", \"#databreach\"],\n"
            "    \"m_organization\": [\"ThreatFox\"],\n"
            "    \"m_domain\": [\"ioc.exchange\"]\n"
            "  }\n"
            "}\n"
            "```\n\n"
            "Field semantics (request):\n"
            "- **q** — free-text query applied to normalized social post content (message text, hashtags, mentions, URLs).\n"
            "- **page** — page number for paginated search results (1-based).\n"
            "- **content** — content-type key such as "
            "`all`, `breach`, `credential`, `ransomware`, `phishing`, `scam`, `malware`, `infostealer`, `c2`, "
            "`ddos`, `exploit`, `leak`, `logs`, `vpn`, `carding`, `rat`, `keylogger`, `spyware`, `sqlinjection`, "
            "`xss`, `supplychain`, `insider`, `fraud`, `obfuscation`, `crack`, `cheats`, `cve`, `zero_day`, "
            "`rootkit`, `apt`, `threat_intel`, `darkweb`, `rce`, `lpe`, `exfiltration`, `persistence`, "
            "`reconnaissance`, `hack`, `news`, `credentials_common`, `war`; derived from internal `content_type` tags.\n"
            "- **category** — ML-based classifier for social content categories (campaign/theme); use `all` to disable.\n"
            "- **network** — network filter for the underlying source (`all`, `clearnet`, `onion`, `i2p`); social content "
            "is typically `clearnet`.\n"
            "- **daterange** — optional ingestion/date range in `YYYY-MM-DD,YYYY-MM-DD` format.\n"
            "- **matchtype** — logical operator (`or` or `and`) controlling how query and filters are combined.\n"
            "- **platform** — social platform filter (e.g. `twitter`, `mastodon`, `telegram`, `discord`), mapped to "
            "the underlying **m_platform** field.\n"
            "- **must** — when true, all values in **entity_filter** are treated as mandatory constraints.\n"
            "- **entity_filter** — IOC/enrichment filter map where keys are enrichment fields "
            "(for example `m_hashtag`, `m_mention`, `m_organization`, `m_domain`, `m_country`, `m_language`) and values "
            "are lists of values that documents must/may contain depending on **must**."
        ),
        "response_description": (
            "Social media intelligence search results containing metadata for each matching social report.\n\n"
            "The response is a JSON object with pagination info and a list of social post summaries:\n"
            "- **Result** — list of normalized social media entries\n"
            "- **Suggestions** — optional list of query suggestions (may be empty)\n"
            "- **Page_Count** — total number of result pages as a floating-point value\n\n"
            "Each result usually exposes a subset of the social report fields:\n"
            "- **m_sender_name** — display name or handle of the posting account (e.g. `@abuse_ch`)\n"
            "- **m_message_sharable_link** — platform-specific link/path to the post "
            "(e.g. `https://x.com/anyrun_app/status/1861024182210900357`)\n"
            "- **m_content** — normalized text content, including hashtags, mentions and links\n"
            "- **m_content_type** — internal labels describing the social collector/source type "
            "(e.g. `[\"social_collector\"]`)\n"
            "- **m_message_date** — date the post was created in `YYYY-MM-DD` format\n"
            "- **m_channel_url** — URL of the profile, channel or account page\n"
            "- **m_message_id** — platform-specific unique identifier\n"
            "- **m_platform** — social platform name (e.g. `twitter`, `mastodon`)\n"
            "- **m_network** — network type (typically `clearnet`)\n"
            "- **content_type** — high-level classification tags (e.g. `[\"malware\", \"ddos\", \"threat_intel\", \"news\"]`)\n"
            "- **m_username** — usernames/handles associated with the posting account\n"
            "- **m_scrap_file** — internal scraper identifier\n"
            "- **m_organization** — organizations or projects referenced\n"
            "- **m_language** — detected languages\n"
            "- **m_hashtag** — list of hashtags extracted from the content\n"
            "- **m_mention** — list of mentioned accounts\n"
            "- **m_domain** — list of referenced domains\n"
            "- **m_hash** — internal content hash\n"
            "- **m_creation_date** — ingestion timestamp\n"
            "- optionally, IOC/enrichment fields such as `m_ip`, `m_url`, `m_cve`, `m_crypto_address`, etc.\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"Result\": [\n"
            "    {\n"
            "      \"m_sender_name\": \"@anyrun_app\",\n"
            "      \"m_message_sharable_link\": \"https://x.com/anyrun_app/status/1861024182210900357\",\n"
            "      \"m_content\": \"ALERT: Potential ZERO-DAY, Attackers Use Corrupted Files to Evade Detection (1/3)...\",\n"
            "      \"m_content_type\": [\"social_collector\"],\n"
            "      \"m_message_date\": \"2024-11-25\",\n"
            "      \"m_channel_url\": \"https://x.com/anyrun_app\",\n"
            "      \"m_message_id\": \"1861024182210900357\",\n"
            "      \"m_platform\": \"twitter\",\n"
            "      \"m_network\": \"clearnet\",\n"
            "      \"content_type\": [\"credential\", \"ransomware\", \"phishing\", \"malware\", \"ddos\", \"exploit\", \"xss\"],\n"
            "      \"m_username\": [\"anyrun_app\"],\n"
            "      \"m_scrap_file\": \"_twitter\",\n"
            "      \"m_language\": [\"en\"],\n"
            "      \"m_hashtag\": [\"#ANYRUN\", \"#antivirus\"],\n"
            "      \"m_mention\": [\"@anyrun_appalert\"],\n"
            "      \"m_domain\": [\"x.com\"],\n"
            "      \"m_hash\": \"7872303ba1faefc7d645ecd551c7dfcf64f7d963413e66beda38dc9161e4c43a\",\n"
            "      \"m_creation_date\": \"2025-12-04T12:38:19.665394+00:00\"\n"
            "    }\n"
            "  ],\n"
            "  \"Suggestions\": [],\n"
            "  \"Page_Count\": 278.1\n"
            "}\n"
            "```\n"
        ),
    },
    "telegram": {
        "description": (
            "Search Telegram-based chat intelligence and return metadata for matching chat reports.\n\n"
            "This endpoint executes a keyword and IOC-aware search over Telegram chat collections (channels, groups, and "
            "supergroups) ingested by Orion.\n\n"
            "The request is an HTTP POST and expects a JSON body matching the `search_chat_param_model` schema.\n\n"
            "Typical request payload:\n\n"
            "```json\n"
            "{\n"
            "  \"q\": \"ransomware leak\",\n"
            "  \"page\": 1,\n"
            "  \"content\": \"all\",\n"
            "  \"category\": \"all\",\n"
            "  \"network\": \"all\",\n"
            "  \"daterange\": \"2025-12-01,2025-12-08\",\n"
            "  \"entity\": \"\",\n"
            "  \"matchtype\": \"or\",\n"
            "  \"platform\": \"telegram\",\n"
            "  \"must\": false,\n"
            "  \"messagedate\": \"\",\n"
            "  \"entity_filter\": {\n"
            "    \"m_team\": [\"example_team\"],\n"
            "    \"m_domain\": [\"example.com\"]\n"
            "  }\n"
            "}\n"
            "```\n\n"
            "Field semantics (request):\n"
            "- **q** — free-text query string matched against message text, caption and selected metadata.\n"
            "- **page** — result page number for pagination (1-based).\n"
            "- **content** — logical content category of chat documents (for example `all`, `text`, `media`).\n"
            "- **category** — high-level ML category (for example `all`, `leak`, `exploit`, `general`).\n"
            "- **network** — network selector, typically `all` or `clearnet` for Telegram web endpoints.\n"
            "- **daterange** — ingestion/update date range in `YYYY-MM-DD,YYYY-MM-DD` format.\n"
            "- **entity** — free-text IOC / entity string to match across enriched fields (domains, hashes, emails, etc.).\n"
            "- **matchtype** — logical operator used when combining query and filters (`or` or `and`).\n"
            "- **platform** — platform name; for this endpoint it is usually `telegram`.\n"
            "- **must** — when `true`, entities specified in **entity**/**entity_filter** must be present in results.\n"
            "- **messagedate** — explicit message date filter in `YYYY-MM-DD` format (platform message date).\n"
            "- **entity_filter** — structured IOC filter (e.g. `m_team`, `m_domain`, `m_hashtag`) where each key is an\n"
            "  enriched field and the value is a list of required values."
        ),
        "response_description": (
            "Telegram chat search results containing paginated metadata for matching chat intelligence reports.\n\n"
            "Typical response fields:\n"
            "- **total** — total number of chat records matching the query and filters.\n"
            "- **page** — current result page number.\n"
            "- **results** — list of chat message objects, each summarizing one Telegram message or small thread.\n\n"
            "Each element under **results** commonly includes:\n"
            "- **m_message_id** — platform-specific message identifier.\n"
            "- **m_channel_id** — internal or platform channel identifier.\n"
            "- **m_channel_name** — human-readable channel name.\n"
            "- **m_sender_name** — display name of the sender.\n"
            "- **m_sender_username** — sender username/handle.\n"
            "- **m_message_date** — message date in `YYYY-MM-DD` format.\n"
            "- **m_content** — normalized message text.\n"
            "- **m_caption** — media caption (if applicable).\n"
            "- **m_message_sharable_link** — deep link to the message (e.g. `https://t.me/...`).\n"
            "- **m_media_url** — URL of attached media (if present).\n"
            "- **m_message_type** — list of message types (e.g. `[\"text\"]`, `[\"photo\"]`).\n"
            "- **m_views** — view/impression count (if available).\n"
            "- **m_network** — network classification (typically `clearnet`).\n"
            "- **m_content_type** — internal classification labels for the chat item.\n"
            "- **m_language** — detected language(s) of the message.\n"
            "- **m_domain, m_hashtag, m_mention, m_team, m_location** — enriched IOCs/entities when present.\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"total\": 42,\n"
            "  \"page\": 1,\n"
            "  \"results\": [\n"
            "    {\n"
            "      \"m_message_id\": 123456,\n"
            "      \"m_channel_id\": 987654321,\n"
            "      \"m_channel_name\": \"Example Ransomware Channel\",\n"
            "      \"m_sender_name\": \"Example Threat Actor\",\n"
            "      \"m_sender_username\": \"example_actor\",\n"
            "      \"m_message_date\": \"2025-12-07\",\n"
            "      \"m_message_sharable_link\": \"https://t.me/example_channel/123456\",\n"
            "      \"m_content\": \"New victim announced: ExampleCorp. Data will be leaked in 7 days.\",\n"
            "      \"m_caption\": \"\",\n"
            "      \"m_media_url\": \"\",\n"
            "      \"m_message_type\": [\"text\"],\n"
            "      \"m_views\": 10543,\n"
            "      \"m_network\": \"clearnet\",\n"
            "      \"m_content_type\": [\"text\"],\n"
            "      \"m_language\": [\"en\"],\n"
            "      \"m_team\": [\"example_ransom_group\"],\n"
            "      \"m_domain\": [\"examplecorp.com\"],\n"
            "      \"m_location\": [\"US\"],\n"
            "      \"m_hashtag\": [\"#ransomware\"],\n"
            "      \"m_mention\": [],\n"
            "      \"m_social_media_profiles\": [],\n"
            "      \"m_hash\": \"abc123...\",\n"
            "      \"m_creation_date\": \"2025-12-07T09:15:00Z\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "```\n"
        ),
    },
    "consolidated": {
        "description": (
            "Search across all report types (breach/leak, exploit, generic/strategic, chat, social, etc.) and return a\n"
            "consolidated, section-grouped set of report metadata.\n\n"
            "The request is an HTTP POST and expects a JSON body matching the `search_consolidated_param_model` schema.\n"
            "A typical request payload might look like:\n\n"
            "```json\n"
            "{\n"
            '  "q": "okta",\n'
            '  "page": 1,\n'
            '  "network": "all",\n'
            '  "matchtype": "or",\n'
            '  "safe": false,\n'
            '  "daterange": "2025-11-01,2025-12-07",\n'
            '  "content": "all",\n'
            '  "entity": "",\n'
            '  "must": false,\n'
            '  "entity_filter": {\n'
            '    "m_company_name": ["Okta"],\n'
            '    "m_country": ["US"]\n'
            "  }\n"
            "}\n"
            "```\n\n"
            "Semantics:\n"
            "- **q** — free-text query across all supported indices\n"
            "- **page** — page number for paginated results\n"
            "- **network** — network filter (e.g. `all`, `clearnet`, `onion`, `i2p`)\n"
            "- **matchtype** — logical query mode, typically `or` or `and`\n"
            "- **safe** — when true, enables additional safety/content restrictions\n"
            "- **daterange** — optional date range filter in `YYYY-MM-DD,YYYY-MM-DD` format\n"
            "- **content** — high-level content type filter when supported (e.g. `all`, `leaks`, `news`)\n"
            "- **entity / entity_filter** — IOC/entity-based filters (e.g. `m_company_name`, `m_domain`, `m_country`)\n"
            "- **must** — when true, entity filters are treated as mandatory (must-match) conditions\n\n"
            "Unlike the ranked variant, this consolidated endpoint groups results by section/index. Each group contains its\n"
            "own total and list of matching documents and is suitable for driving dashboards and per-section drill-down."
        ),
        "response_description": (
            "Consolidated, section-grouped search results across all enabled indices.\n\n"
            "The response is a JSON object where each top-level key corresponds to a logical section or model\n"
            "(for example `breach`, `exploit`, `generic`, `chat`, `social`). Each section contains its own metadata and\n"
            "list of matching reports.\n\n"
            "Typical structure:\n"
            "- **breach / leak** — grouped breach/leak reports (ransomware notes, data leak posts, etc.)\n"
            "- **exploit** — exploit/CVE-related documents\n"
            "- **generic / strategic** — generic darkweb/clearnet documents (forums, marketplaces, generic pages)\n"
            "- **chat** — chat/Telegram-driven intelligence items\n"
            "- **social** — social media-based threat intel posts\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            '  "breach": {\n'
            '    "total": 2,\n'
            '    "page": 1,\n'
            '    "results": [\n'
            "      {\n"
            '        "doc_id": "breach-123",\n'
            '        "m_title": "Okta customer data leak announced",\n'
            '        "m_company_name": "Okta Inc.",\n'
            '        "m_domain": ["okta.com"],\n'
            '        "m_network": "onion",\n'
            '        "m_content_type": ["leaks"],\n'
            '        "m_hash": "abc123...",\n'
            '        "m_creation_date": "2025-12-06T09:10:00Z",\n'
            '        "m_update_date": "2025-12-07T08:45:00Z"\n'
            "      }\n"
            "    ]\n"
            "  },\n"
            '  "exploit": {\n'
            '    "total": 1,\n'
            '    "page": 1,\n'
            '    "results": [\n'
            "      {\n"
            '        "doc_id": "exploit-456",\n'
            '        "m_title": "PoC for Okta SSO misconfiguration abuse",\n'
            '        "m_url": "https://example.com/exploit/okta-poc",\n'
            '        "m_platform": ["Web"],\n'
            '        "m_content_type": ["exploit"],\n'
            '        "m_hash": "def456...",\n'
            '        "m_creation_date": "2025-12-05T14:20:00Z"\n'
            "      }\n"
            "    ]\n"
            "  },\n"
            '  "chat": {\n'
            '    "total": 0,\n'
            '    "page": 1,\n'
            '    "results": []\n'
            "  },\n"
            '  "social": {\n'
            '    "total": 1,\n'
            '    "page": 1,\n'
            '    "results": [\n'
            "      {\n"
            '        "doc_id": "social-789",\n'
            '        "m_sender_name": "@threatintelfeed",\n'
            '        "m_message_date": "2025-12-07",\n'
            '        "m_content": "New Okta-related access sale spotted on darkweb.",\n'
            '        "m_platform": "mastodon",\n'
            '        "m_network": "clearnet",\n'
            '        "content_type": ["threat_intel", "news"],\n'
            '        "m_hash": "ghi789..."\n'
            "      }\n"
            "    ]\n"
            "  }\n"
            "}\n"
            "```\n\n"
            "Exact sections and fields depend on enabled modules and query filters, but the grouped structure remains\n"
            "consistent: each top-level section exposes `total`, `page`, and a list of result objects containing common\n"
            "metadata fields like **doc_id**, **m_title**, **m_network**, **m_content_type**, and hash/timestamp fields."
        ),
    },
    "consolidated_ranked": {
        "description": (
            "Search the entire database across all report types and return a single, globally relevance-ranked list of\n"
            "report metadata without per-section grouping.\n\n"
            "The request is an HTTP POST and expects a JSON body matching the `search_consolidated_param_model` schema.\n"
            "It reuses the same fields as the grouped consolidated search endpoint (for example `q`, `page`, `network`,\n"
            "`matchtype`, `daterange`, `entity_filter`, `must`, etc.).\n\n"
            "Example request payload:\n\n"
            "```json\n"
            "{\n"
            '  "q": "okta",\n'
            '  "page": 1,\n'
            '  "network": "all",\n'
            '  "matchtype": "or",\n'
            '  "safe": false,\n'
            '  "daterange": "2025-11-01,2025-12-07",\n'
            '  "content": "all",\n'
            '  "entity_filter": {\n'
            '    "m_company_name": ["Okta"]\n'
            "  }\n"
            "}\n"
            "```\n\n"
            "Unlike the grouped consolidated endpoint, this variant merges hits from all indices (breach/leak, exploit,\n"
            "generic, chat, social, etc.) into a *single list* sorted by a global relevance score. Each result row\n"
            "includes metadata about the source index/section so that clients can still route to the appropriate\n"
            "underlying report API."
        ),
        "response_description": (
            "Globally ranked consolidated search results across all enabled indices.\n\n"
            "The response is a JSON object containing a single list of hits ordered by a global relevance score, along\n"
            "with pagination metadata.\n\n"
            "Typical fields:\n"
            "- **total** — total number of matched documents across all indices\n"
            "- **page** — current result page\n"
            "- **results** — ordered list of result objects, highest relevance first\n\n"
            "Each element in **results** usually contains:\n"
            "- **index** — logical source index/section (e.g. `leak_model`, `exploit_model`, `generic_model`,\n"
            "  `chat_model`, `social_model`)\n"
            "- **doc_id** — internal identifier of the document (to be used with the corresponding report API)\n"
            "- **score** — search/relevance score (when exposed)\n"
            "- Common metadata fields depending on the index, such as:\n"
            "  - For leak/breach: **m_title**, **m_company_name**, **m_domain**, **m_network**, **m_content_type**\n"
            "  - For exploit: **m_title**, **m_platform**, **m_content_type**, **m_url**\n"
            "  - For chat: **m_sender_name**, **m_message_date**, **m_content**, **m_channel_name**\n"
            "  - For social: **m_sender_name**, **m_message_date**, **m_content**, **m_platform**\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            '  "total": 25,\n'
            '  "page": 1,\n'
            '  "results": [\n'
            "    {\n"
            '      "index": "leak_model",\n'
            '      "doc_id": "breach-123",\n'
            '      "score": 12.34,\n'
            '      "m_title": "Okta customer data leak announced",\n'
            '      "m_company_name": "Okta Inc.",\n'
            '      "m_domain": ["okta.com"],\n'
            '      "m_network": "onion",\n'
            '      "m_content_type": ["leaks"],\n'
            '      "m_hash": "abc123...",\n'
            '      "m_creation_date": "2025-12-06T09:10:00Z"\n'
            "    },\n"
            "    {\n"
            '      "index": "exploit_model",\n'
            '      "doc_id": "exploit-456",\n'
            '      "score": 10.87,\n'
            '      "m_title": "PoC for Okta SSO misconfiguration abuse",\n'
            '      "m_platform": ["Web"],\n'
            '      "m_content_type": ["exploit"],\n'
            '      "m_url": "https://example.com/exploit/okta-poc",\n'
            '      "m_hash": "def456..."\n'
            "    },\n"
            "    {\n"
            '      "index": "social_model",\n'
            '      "doc_id": "social-789",\n'
            '      "score": 9.42,\n'
            '      "m_sender_name": "@threatintelfeed",\n'
            '      "m_message_date": "2025-12-07",\n'
            '      "m_content": "New Okta-related access sale spotted on darkweb.",\n'
            '      "m_platform": "mastodon",\n'
            '      "m_network": "clearnet",\n'
            '      "content_type": ["threat_intel", "news"]\n'
            "    }\n"
            "  ]\n"
            "}\n"
            "```\n\n"
            "This ranked view is optimized for global search experiences where the user wants \"the most relevant\n"
            "things first\" regardless of which underlying index they came from, while still preserving enough\n"
            "metadata to call the corresponding detailed report endpoints."
        ),
    },
    "strategic": {
        "description": (
            "Search strategic intelligence reports using filters such as free-text query, network, date range, "
            "MITRE/STIX object type or IOC entities; returns metadata for matching strategic reports that can be "
            "opened via the strategic report API.\n\n"
            "Request body (`search_general_param_model`):\n"
            "- **q** — free-text search over title, content and enrichment fields (default: empty string)\n"
            "- **page** — page number of the paginated result set (1-based)\n"
            "- **network** — one of: `all`, `clearnet`, `onion`, `i2p`\n"
            "- **content** — content-type key such as: "
            "`all`, `breach`, `credential`, `ransomware`, `phishing`, `scam`, `malware`, `infostealer`, `c2`, "
            "`ddos`, `exploit`, `leak`, `logs`, `vpn`, `carding`, `rat`, `keylogger`, `spyware`, `sqlinjection`, "
            "`xss`, `supplychain`, `insider`, `fraud`, `obfuscation`, `crack`, `cheats`, `cve`, `zero_day`, "
            "`rootkit`, `apt`, `threat_intel`, `darkweb`, `rce`, `lpe`, `exfiltration`, `persistence`, "
            "`reconnaissance`, `hack`, `news`, `credentials_common`, `war`\n"
            "- **safe** — boolean flag enabling safe filtering of sensitive/adult content\n"
            "- **daterange** — optional creation date range in `YYYY-MM-DD,YYYY-MM-DD` format applied to `m_creation_date`\n"
            "- **matchtype** — logical operator for combining query / entity / filter clauses (`and` or `or`)\n"
            "- **entity_filter** — IOC-style filter map of field → list of values. "
            "Example valid payload:\n"
            "```json\n"
            "{\n"
            "  \"entity_filter\": {\n"
            "    \"m_country\": [\"pakistan\"],\n"
            "    \"m_domain\": [\"example.com\"],\n"
            "    \"m_person\": [\"john doe\"]\n"
            "  }\n"
            "}\n"
            "```\n"
            "Supported fields include: `m_phone_number`, `m_email`, `m_domain`, `m_country`, `m_url`, `m_cve`, `m_ip`, "
            "`m_yara_rule`, `m_encoded_urls`, `m_file_paths`, `m_credit_card`, `m_org`, `m_company_name`, `m_person`, "
            "`m_location`, `m_language`, `m_user_agents`, `m_asns`, `m_team`, `m_hashtag`, `m_mention`, "
            "`m_social_media_profiles`, `m_currencies`, `m_crypto_address`, `m_xmpp_addresses`, "
            "`m_enterprise_attack_tactics`, `m_enterprise_attack_techniques`, `m_document_id`, `m_au_abn`, "
            "`m_us_passport`, `m_us_bank_number`, `m_platform`, `m_author`, `m_industry`, `m_scrap_file`.\n\n"
            "Minimal example request:\n"
            "```json\n"
            "{\n"
            "  \"q\": \"pakistan\",\n"
            "  \"page\": 1,\n"
            "  \"entity_filter\": { \"m_country\": [\"pakistan\"] },\n"
            "  \"matchtype\": \"or\"\n"
            "}\n"
            "```"
        ),
        "response_description": (
            "Strategic intelligence search results containing a paginated list of matching strategic documents.\n\n"
            "The response is a JSON object with:\n"
            "- **Result** — list of raw document records from the strategic index\n"
            "- **Page_Count** — total number of pages available for the given query and filters\n\n"
            "Each entry in **Result** is a metadata object that typically contains:\n"
            "- **m_base_url** — base URL of the hidden service or site\n"
            "- **m_url** — concrete crawled page URL\n"
            "- **m_network** — network type, e.g. `onion`, `i2p`, `clearnet`\n"
            "- **m_title** — normalized page or thread title\n"
            "- **m_meta_description** — HTML meta description where available\n"
            "- **m_content** — normalized full text content\n"
            "- **m_important_content** — densified or highlighted important content\n"
            "- **m_images** — list of image URLs extracted from the page\n"
            "- **m_sub_url** — list of related sub-URLs discovered on the page\n"
            "- **m_validity_score** — internal confidence/validity score (0–100)\n"
            "- **m_content_type** — list of high-level classification labels such as `news`, `adult`, etc.\n"
            "- **m_clearnet_links** — list of clearnet links referenced in the document\n"
            "- **m_country** — list of detected country entities\n"
            "- **m_location** — list of detected location/place entities\n"
            "- **m_person** — list of detected person entities\n"
            "- **m_organization** — list of detected organizations/platforms\n"
            "- **m_language** — detected language codes\n"
            "- **m_domain** — list of associated domains\n"
            "- **m_update_date** — last update timestamp\n"
            "- **m_creation_date** — first-seen/ingestion timestamp\n"
            "- **rank_index** — internal index/model used for ranking (for example `generic_model`)\n"
            "- **_score** — relevance score from the search engine\n"
            "- **_rank** — rank of the document in the current result page\n"
            "- Additional internal fields such as `m_hash_content`, `m_hash_url`, `m_hash` and `m_embedding` may also be present.\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"Result\": [\n"
            "    {\n"
            "      \"m_base_url\": \"http://bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion\",\n"
            "      \"m_url\": \"http://bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion/news/world/asia\",\n"
            "      \"m_network\": \"onion\",\n"
            "      \"m_title\": \"asia latest & updates | bbc news\",\n"
            "      \"m_meta_description\": \"get all the latest news, live updates and content about asia from across the bbc.\",\n"
            "      \"m_content\": \"you are now following asia at least 36 dead as fire engulfs hong kong tower blocks ...\",\n"
            "      \"m_important_content\": \"you are now following asia updates from your news topics will appear in firefighters are struggling ...\",\n"
            "      \"m_images\": [\n"
            "        \"https://ichef.bbcws2hcewhlhutm5qrjkekkg3eraphuc7ba7qh4jeinhibnx3ymxaqd.onion/ace/standard/480/cpsprodpb/726a/live/92a91ae0-cab6-11f0-8c06-f5d460985095.jpg\",\n"
            "        \"https://ichef.bbcws2hcewhlhutm5qrjkekkg3eraphuc7ba7qh4jeinhibnx3ymxaqd.onion/ace/standard/480/cpsprodpb/c5d3/live/28ebb110-cabd-11f0-a892-01d657345866.jpg\"\n"
            "      ],\n"
            "      \"m_sub_url\": [\n"
            "        \"http://bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion/news/topics/c2vdnvdg6xxt\",\n"
            "        \"http://bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion/news/world\"\n"
            "      ],\n"
            "      \"m_validity_score\": 65,\n"
            "      \"m_content_type\": [\"news\", \"adult\"],\n"
            "      \"m_clearnet_links\": [\n"
            "        \"instagram.com/bbcnews/\",\n"
            "        \"tiktok.com/@bbcnews?lang=en\",\n"
            "        \"facebook.com/bbcnews\",\n"
            "        \"twitter.com/BBCNews\"\n"
            "      ],\n"
            "      \"m_country\": [\n"
            "        \"India\", \"Japan\", \"China\", \"Hong Kong\", \"Pakistan\",\n"
            "        \"New Zealand\", \"Australia\", \"Ukraine\", \"Israel\"\n"
            "      ],\n"
            "      \"m_location\": [\n"
            "        \"India\", \"UK\", \"China\", \"South East Asia\", \"Hong Kong\",\n"
            "        \"New Zealand\", \"Australia\", \"Thai\", \"Ukraine\", \"Asia\"\n"
            "      ],\n"
            "      \"m_person\": [\"Trump\", \"Xi\", \"Robert Irwin\"],\n"
            "      \"m_organization\": [\"Bollywood\"],\n"
            "      \"m_language\": [\"en\"],\n"
            "      \"m_domain\": [\n"
            "        \"facebook.com\",\n"
            "        \"twitter.com\",\n"
            "        \"instagram.com\",\n"
            "        \"tiktok.com\",\n"
            "        \"bbcnewsd73hkzno2ini43t4gblxvycyac5aw4gnv7t2rccijh7745uqd.onion\"\n"
            "      ],\n"
            "      \"m_update_date\": \"2025-11-26T18:05:48.003165+00:00\",\n"
            "      \"m_hash_content\": \"8207ff33a9358d0aa0be3f9c00f0d7a29b9a1424055ad9d69c3a84d7f793f11d\",\n"
            "      \"m_hash_url\": \"b9b9ababd96907acb0666bf6791d93a74162de5dd96e68eceb76394e805c30ab\",\n"
            "      \"m_hash\": \"a7e0dd8c425614b37ab0acd5a793a786503779dce49b1b46dd93f5db014bbc11\",\n"
            "      \"m_creation_date\": \"2025-11-26T18:05:48.003504+00:00\",\n"
            "      \"rank_index\": \"generic_model\",\n"
            "      \"_score\": 0.44736758,\n"
            "      \"_rank\": 1\n"
            "    }\n"
            "  ],\n"
            "  \"Page_Count\": 1\n"
            "}\n"
            "```"
        ),
    },
    "stealerlogs": {
        "description": (
            "Search stealer log credentials and log files using filters such as free-text query, URL, username, "
            "type and date range; returns normalized credential or log records from the stealer logs index.\n\n"
            "Request body (`search_credential_param_model`):\n"
            "- **daterange** — optional creation date range in `YYYY-MM-DD,YYYY-MM-DD` format; empty string means no filter\n"
            "- **q** — free-text search across the raw line and extracted fields (email, domain, username, URL, etc.)\n"
            "- **url** — optional URL/domain filter (for example `accounts.epicgames.com`)\n"
            "- **user** — optional username or login identifier (for example `uzzalsen2530`)\n"
            "- **type** — record type; `\"c\"` returns credential-level stealer log entries (email/password, username, etc.); "
            "any other value returns log/file-style entries (for example leaked CSV or other files)\n"
            "- **page** — page number of the paginated result set (1-based)\n"
            "- **category** — optional category string (reserved for future use)\n"
            "- **fullsearch** — when `false`, uses an optimized/simple search (for example email domain lookups like `gmail.com`) "
            "for faster responses; when `true`, enables full wildcard/substring search over `raw` and extracted fields at the "
            "cost of performance.\n\n"
            "Minimal example request for a credential (stealer log) search:\n"
            "```json\n"
            "{\n"
            "  \"q\": \"gmail.com\",\n"
            "  \"url\": \"accounts.epicgames.com\",\n"
            "  \"user\": \"uzzalsen2530\",\n"
            "  \"type\": \"c\",\n"
            "  \"page\": 1,\n"
            "  \"fullsearch\": false,\n"
            "  \"daterange\": \"\"\n"
            "}\n"
            "```\n"
            "Example full wildcard search over a password value:\n"
            "```json\n"
            "{\n"
            "  \"q\": \"Zolkina23!\",\n"
            "  \"type\": \"c\",\n"
            "  \"page\": 1,\n"
            "  \"fullsearch\": true\n"
            "}\n"
            "```"
        ),
        "response_description": (
            "Stealer logs search results containing a paginated list of matching credential or log records.\n\n"
            "The response is a JSON object with:\n"
            "- **Result** — list of matching records from the stealer logs index\n"
            "- **Suggestions** — optional list of suggestion strings (for example corrected queries); may be empty\n"
            "- **Page_Count** — number of pages available for the given query and filters (may be fractional depending on "
            "the backend calculation)\n\n"
            "Each entry in **Result** for `type = \"c\"` (credential mode) typically contains:\n"
            "- **type** — record type (for example `\"c\"` for credential)\n"
            "- **raw** — original raw line as found in the source log\n"
            "- **channel** — high-level source channel (for example `\"Collection\"`)\n"
            "- **file** — optional file name or identifier when available, otherwise `null`\n"
            "- **domain** — list of extracted domains (for example `\"gmail.com\"` or `\"authenticate.riotgames.com\"`)\n"
            "- **email** — list of extracted email addresses when present\n"
            "- **password** — extracted password value when present\n"
            "- **username** — list of extracted usernames or logins\n"
            "- **_id** — internal unique identifier of the record\n"
            "- **m_index** — internal index/model used for search (for example `\"stealer_model\"`)\n"
            "- **m_sub_host** — extracted sub-host or path component (for example `\"/\"`)\n\n"
            "When `type` is not `\"c\"`, records may represent higher-level log or file objects (for example leaked CSV "
            "or other file-based dumps) and can include additional file-related metadata fields depending on the source.\n\n"
            "Example response:\n"
            "```json\n"
            "{\n"
            "  \"Result\": [\n"
            "    {\n"
            "      \"type\": \"c\",\n"
            "      \"raw\": \"https://accounts.epicgames.com/register/customized uzzalsen2530@gmail.com:Lazpro&Adi@2022!\",\n"
            "      \"channel\": \"Collection\",\n"
            "      \"file\": null,\n"
            "      \"domain\": [\n"
            "        \"gmail.com\"\n"
            "      ],\n"
            "      \"email\": [\n"
            "        \"uzzalsen2530@gmail.com\"\n"
            "      ],\n"
            "      \"password\": \"Lazpro&Adi@2022!\",\n"
            "      \"username\": [\n"
            "        \"uzzalsen2530\"\n"
            "      ],\n"
            "      \"_id\": \"2025_UTC_1d57898b680608fcb703a2bccede92d4b913bd810f84ef81fd95c8037493b4f6\",\n"
            "      \"m_index\": \"stealer_model\",\n"
            "      \"m_sub_host\": \"/\"\n"
            "    },\n"
            "    {\n"
            "      \"type\": \"c\",\n"
            "      \"raw\": \"https://authenticate.riotgames.com/ FaM1R:Zolkina23!\",\n"
            "      \"channel\": \"Collection\",\n"
            "      \"file\": null,\n"
            "      \"domain\": [\n"
            "        \"authenticate.riotgames.com\"\n"
            "      ],\n"
            "      \"password\": \"Zolkina23!\",\n"
            "      \"username\": [\n"
            "        \"FaM1R\"\n"
            "      ],\n"
            "      \"_id\": \"2025_UTC_ac9459ac22cc2fe21060f39980882d98aa0cf15f524e7f835a55c94c08631371\",\n"
            "      \"m_index\": \"stealer_model\",\n"
            "      \"m_sub_host\": \"/\"\n"
            "    }\n"
            "  ],\n"
            "  \"Suggestions\": [],\n"
            "  \"Page_Count\": 0.2\n"
            "}\n"
            "```"
        ),
    }
}

