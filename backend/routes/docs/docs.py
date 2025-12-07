# app/docs/docs.py

SYSTEM_INFO_DOCS = {
    "directory": {
        "description": (
            "Retrieve the complete list of monitored and crawled sources across Clearnet, Onion, and I2P.\n\n"
            "Supported filters:\n"
            "- **page:** page number of the result\n"
            "- **content_type:** all, general, forums, news, stolen, drugs, hacking, marketplaces, cryptocurrency,\n"
            "  leaks, adult, tracking, chat, social\n"
            "- **index:** all, general, leak, defacement, chat, exploit, twitter, reddit\n"
            "- **network:** all, clearnet, onion, i2p\n"
            "- **dateRange:** optional date range (e.g., `2025-12-03,2025-12-18` or an equivalent picker range)\n\n"
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
        ),
    },
    "dumps": {
        "description": (
            "Retrieve the complete catalog of breach dumps collected from Telegram channels and monitored websites.\n\n"
            "Supported filters:\n"
            "- **page:** page number of the result set\n"
            "- **source:** all, telegram, websites\n"
            "- **group:** leak group or channel name (string)\n"
            "- **status:** all, parsed, unparsed\n"
            "- **daterange:** optional date range string (e.g., `2025-01-01,2025-01-15`)\n"
            "- **q:** free-text search query (default: `*`)\n\n"
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
            "  - **group** — associated leak group or channel\n"
            "  - **link** — direct reference link to the dump message or file\n"
            "  - **parsed_status** — whether the dump has been parsed/processed\n"
            "  - **created_at** — first-seen timestamp of the dump"
        ),
    },
    "insight": {
        "description": (
            "Retrieve system-wide analytics and high-level intelligence metrics across all monitored data sources.\n\n"
            "This endpoint does not take any parameters and returns pre-aggregated insights computed by Orion.\n\n"
            "Returned analytics include (per data type such as general, leak, defacement):\n"
            "- Document volume over time (document_count, updated_5_days_ago, updated_9_days_ago)\n"
            "- Freshness indicators (most_recent, oldest_update)\n"
            "- Enrichment density (URL/Document, Archive/Document, Email/Document, Phone/Document)\n"
            "- Common content characteristics (Common Type, Common Server, Top Team)\n\n"
            "It also returns latest documents discovered across leak, exploit, chat, generic and defacement sources, "
            "as well as graph-style aggregations such as top teams, locations, and hashtags."
        ),
        "response_description": (
            "System-wide insight payload with three main sections:\n\n"
            "- **insights** — aggregated metrics grouped by data type (e.g. general, leak, defacement), each containing:\n"
            "  - **document_count** — total documents in that category\n"
            "  - **most_recent / oldest_update** — recency indicators\n"
            "  - **updated_5_days_ago / updated_9_days_ago** — activity in recent windows\n"
            "  - **url_document_count, archive_document_count, email_document_count, phone_document_count** — enrichment counts\n"
            "  - **clearnet_document_count, common_types, top_team, common_server**, etc., depending on category\n\n"
            "- **latestDocument** — latest crawled documents by model type:\n"
            "  - **leak_model, exploit_model, chat_model, generic_model, defacement_model** — each is a list of documents with:\n"
            "    - **title** — document title or caption\n"
            "    - **date** — human-readable discovery or publish date\n"
            "    - **location** — optional geo/location field\n"
            "    - **phoneNumber** — extracted phone numbers (if any)\n"
            "    - **url** — list of associated URLs\n"
            "    - **source** — origin (e.g. onion, XYZ)\n"
            "    - **hash** — internal document hash identifier\n\n"
            "- **graph_insight** — graph and aggregation-oriented insights represented as:\n"
            "  - a boolean flag indicating graph availability\n"
            "  - a list of aggregation objects, each including:\n"
            "    - **aggregation_name** — e.g. 'Top Teams (Leak)', 'Top Teams (Defacement)', "
            "'Top Locations (Defacement)', 'Top Hashtags (Social)'\n"
            "    - **index** — underlying model/index (e.g. leak_model, defacement_model, chat_model)\n"
            "    - **buckets** — list of key/count pairs representing the top entities (teams, locations, hashtags, etc.)"
        ),
    },
}
