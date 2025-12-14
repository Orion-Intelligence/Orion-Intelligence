# System Info: insight

## Description

Retrieve system-wide analytics and high-level intelligence metrics across all monitored data sources.

This endpoint does not take any parameters and returns pre-aggregated insights computed by Orion.

Returned analytics include (per data type such as general, leak, defacement):
- Document volume and activity over time (`document_count`, `updated_5_days_ago`, `updated_9_days_ago`)
- Freshness indicators (`most_recent`, `oldest_update`)
- Enrichment density (`url_document_count`, `archive_document_count`, `email_document_count`, `phone_document_count`, `clearnet_document_count`)
- Common content characteristics (`common_types`, `top_team`, `common_server`, `unique_base_urls`, `dumps_document_count`, etc.)

Each metric is returned as an object containing:
- **key** — human-readable label
- **value** — current metric value
- **change_weekly** — weekly change percentage (string)
- **change_daily** — daily change percentage (string)

It also returns latest documents discovered across leak, generic and defacement sources, as well as graph-style aggregations such as top teams, locations, and hashtags.

## Response

System-wide insight payload with three main sections:

- **insights** — aggregated metrics grouped by data type (e.g. `general`, `leak`, `defacement`), each containing objects of the form:
  - **document_count** — { key, value, change_weekly, change_daily }
  - **most_recent / oldest_update** — { key, value, change_weekly, change_daily }
  - **updated_5_days_ago / updated_9_days_ago** — { key, value, change_weekly, change_daily }
  - **average_score** — { key, value, change_weekly, change_daily } (where applicable)
  - **url_document_count, archive_document_count, email_document_count, phone_document_count, clearnet_document_count** — enrichment metrics
  - **common_types, dumps_document_count, unique_base_urls, top_team, common_server** — category-specific metrics

- **latestDocument** — latest crawled documents by model type:
  - **leak_model, exploit_model, chat_model, generic_model, defacement_model** — each is a list of documents with:
    - **title** — document title or caption
    - **date** — human-readable discovery or publish date
    - **location** — optional geo/location field
    - **phoneNumber** — extracted phone numbers (if any)
    - **url** — list of associated URLs
    - **source** — origin (e.g. onion, XYZ)
    - **hash** — internal document hash identifier

- **graph_insight** — graph and aggregation-oriented insights represented as a 2-element array:
  - index 0 — boolean flag indicating graph availability
  - index 1 — list of aggregation objects, each including:
    - **aggregation_name** — e.g. 'Top Teams (Leak)', 'Top Teams (Defacement)', 'Top Locations (Defacement)', 'Top Hashtags (Social)'
    - **index** — underlying model/index (e.g. `leak_model`, `defacement_model`, `chat_model`)
    - **buckets** — list of key/count pairs representing the top entities (teams, locations, hashtags, etc.)

Example response:
```json
{
  "insights": {
    "general": {
      "document_count": {
        "key": "Document Count",
        "value": 57,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "most_recent": {
        "key": "Most Recent",
        "value": "26 Nov",
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "oldest_update": {
        "key": "Oldest Update",
        "value": "26 Nov",
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "updated_5_days_ago": {
        "key": "Updated 5 Days ago",
        "value": 0,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "updated_9_days_ago": {
        "key": "Updated 9 Days ago",
        "value": 0,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "average_score": {
        "key": "Average Score",
        "value": 50.75,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "url_document_count": {
        "key": "URL/Document",
        "value": 451,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "archive_document_count": {
        "key": "Archive/Document",
        "value": 5,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "email_document_count": {
        "key": "Email/Document",
        "value": 3,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "phone_document_count": {
        "key": "Phone/Document",
        "value": 0,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "clearnet_document_count": {
        "key": "Clearnet/Document",
        "value": 68,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "common_types": {
        "key": "Common Type",
        "value": "Adult",
        "change_weekly": "0%",
        "change_daily": "0%"
      }
    },
    "leak": {
      "document_count": {
        "key": "Document Count",
        "value": 3,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "url_document_count": {
        "key": "URL/Documents",
        "value": 0,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "dumps_document_count": {
        "key": "Dumps/Document",
        "value": 8,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "updated_5_days_ago": {
        "key": "Updated 5 Days ago",
        "value": 3,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "updated_9_days_ago": {
        "key": "Updated 9 Days ago",
        "value": 3,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "most_recent": {
        "key": "Most Recent",
        "value": "03 Dec",
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "oldest_update": {
        "key": "Oldest Update",
        "value": "03 Dec",
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "unique_base_urls": {
        "key": "Unique Base URLs",
        "value": 3,
        "change_weekly": "0%",
        "change_daily": "0%"
      }
    },
    "defacement": {
      "document_count": {
        "key": "Document Count",
        "value": 12,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "updated_5_days_ago": {
        "key": "Updated 5 Days ago",
        "value": 6,
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "top_team": {
        "key": "Top Team",
        "value": "Alpha Wolf",
        "change_weekly": "0%",
        "change_daily": "0%"
      },
      "common_server": {
        "key": "Common Server",
        "value": "Litespeed",
        "change_weekly": "0%",
        "change_daily": "0%"
      }
    }
  },
  "latestDocument": {
    "leak_model": [
      {
        "title": "Announcement",
        "date": "December 03, 2025",
        "location": "",
        "phoneNumber": [],
        "url": [
          "http://brohoodyaifh2ptccph5zfljyajjabwjjo4lg6gfp4xb6ynw5w7ml6id.onion/"
        ],
        "source": "onion",
        "hash": "ca1c7476db86b66c05773f62b85ea5ab0042cd356744ad189f218d16b29db344"
      }
    ],
    "exploit_model": [],
    "chat_model": [],
    "generic_model": [
      {
        "title": "shop pirated content - best hacked accounts, stolen credit cards and other hacker stuff.",
        "date": "November 26, 2025",
        "location": "",
        "phoneNumber": [],
        "url": [
          "http://2222222dk552uwysu3xjaotjmf7basqqrhxrjundlmnzhp6yauj6puqd.onion/shop/cards/mastercard"
        ],
        "source": "onion",
        "hash": "2e3fbb01cb946b9afc5c67e249ffe5431985a05e3b79c5359f2b420231257a71"
      },
      {
        "title": "coin swap",
        "date": "November 26, 2025",
        "location": "",
        "phoneNumber": [],
        "url": [
          "http://2222222m7dzmk7wffagz7cduawmrciml67s3brw2pmvjihhhuf3hukid.onion/convert/?amount_from=0.01012&from_coin=BTC&to_coin=XMR"
        ],
        "source": "onion",
        "hash": "ed72d568d19e1fc76e6d6102b465fd27f244771e97927766b40bf284d3700ca7"
      },
      {
        "title": "shop pirated content - best hacked accounts, stolen credit cards and other hacker stuff.",
        "date": "November 26, 2025",
        "location": "",
        "phoneNumber": [],
        "url": [
          "http://2222222dk552uwysu3xjaotjmf7basqqrhxrjundlmnzhp6yauj6puqd.onion/shop/cards/visa"
        ],
        "source": "onion",
        "hash": "ed2f9550a258229c7c7f4db6df457a34c98392c8a7178bca41dda9413c721ab9"
      },
      {
        "title": "coin swap",
        "date": "November 26, 2025",
        "location": "",
        "phoneNumber": [],
        "url": [
          "http://2222222m7dzmk7wffagz7cduawmrciml67s3brw2pmvjihhhuf3hukid.onion/convert/?amount_from=0.00164&from_coin=BTC&to_coin=DOGE"
        ],
        "source": "onion",
        "hash": "649845a2c6c8d0bc13a88582ff822caf5e9fc745f47d162c3185ffac1e5b4849"
      }
    ],
    "defacement_model": [
      {
        "title": "http://phaoboi.vn/",
        "date": "December 03, 2025",
        "location": "",
        "phoneNumber": [],
        "url": [
          "http://phaoboi.vn/"
        ],
        "source": "XYZ",
        "hash": "31d109a231bfdaa36fc757a7c749253021f04fad0c54d08455c516007c7feabb"
      },
      {
        "title": "https://www.phdfpakistan.com/index.html",
        "date": "December 03, 2025",
        "location": "",
        "phoneNumber": [],
        "url": [
          "https://www.phdfpakistan.com/index.html"
        ],
        "source": "XYZ",
        "hash": "599e8416b67e070178ccbfd0b727abe01150f17a3c50dc20446c72825bf8c523"
      },
      {
        "title": "https://monsite-wp.net/index.html",
        "date": "December 03, 2025",
        "location": "",
        "phoneNumber": [],
        "url": [
          "https://monsite-wp.net/index.html"
        ],
        "source": "XYZ",
        "hash": "50440bc0e8994252e3fac7299bd110afc3086bb54f171468a55e246778b8c170"
      },
      {
        "title": "https://www.arc9.us/",
        "date": "December 03, 2025",
        "location": "",
        "phoneNumber": [],
        "url": [
          "https://www.arc9.us/"
        ],
        "source": "XYZ",
        "hash": "fbee8ab2e997183dc9bc2580a99f8ac6a70744fc8f51ff5ea69d7d600ca367e9"
      }
    ]
  },
  "graph_insight": [
    true,
    [
      {
        "aggregation_name": "Top Teams (Leak)",
        "index": "leak_model",
        "buckets": [
          {
            "key": "BROTHERHOOD",
            "count": 3
          }
        ]
      },
      {
        "aggregation_name": "Top Teams (Defacement)",
        "index": "defacement_model",
        "buckets": [
          {
            "key": "Alpha Wolf",
            "count": 6
          },
          {
            "key": "BONDOWOSO BLACK HAT",
            "count": 4
          },
          {
            "key": "Death Networks",
            "count": 1
          }
        ]
      },
      {
        "aggregation_name": "Top Locations (Defacement)",
        "index": "defacement_model",
        "buckets": []
      },
      {
        "aggregation_name": "Top Hashtags (Social)",
        "index": "chat_model",
        "buckets": []
      }
    ]
  ]
}
```
