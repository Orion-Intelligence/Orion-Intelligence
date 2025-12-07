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
            "\n\nExample response:\n"
            "```json\n"
            "{\n"
            '  "insights": {\n'
            '    "general": {\n'
            '      "document_count": 254321,\n'
            '      "most_recent": "2025-12-07T09:30:00Z",\n'
            '      "oldest_update": "2025-10-01T00:00:00Z",\n'
            '      "updated_5_days_ago": 3210,\n'
            '      "updated_9_days_ago": 5821,\n'
            '      "url_document_count": 210000,\n'
            '      "archive_document_count": 12000,\n'
            '      "email_document_count": 3400,\n'
            '      "phone_document_count": 950,\n'
            '      "clearnet_document_count": 180000,\n'
            '      "common_types": ["news", "forums"],\n'
            '      "top_team": "example_team",\n'
            '      "common_server": "nginx"\n'
            "    },\n"
            '    "leak": {\n'
            '      "document_count": 12450,\n'
            '      "most_recent": "2025-12-07T08:10:00Z",\n'
            '      "oldest_update": "2025-09-15T00:00:00Z"\n'
            "    }\n"
            "  },\n"
            '  "latestDocument": {\n'
            '    "leak_model": [\n'
            "      {\n"
            '        "title": "Example Ransomware Leak #1",\n'
            '        "date": "2025-12-07 08:10:00",\n'
            '        "location": "US",\n'
            '        "phoneNumber": [],\n'
            '        "url": ["http://exampleleakabcdef.onion/"],\n'
            '        "source": "onion",\n'
            '        "hash": "abc123..."\n'
            "      }\n"
            "    ],\n"
            '    "exploit_model": [],\n'
            '    "chat_model": [],\n'
            '    "generic_model": [],\n'
            '    "defacement_model": []\n'
            "  },\n"
            '  "graph_insight": {\n'
            '    "enabled": true,\n'
            '    "aggregations": [\n'
            "      {\n"
            '        "aggregation_name": "Top Teams (Leak)",\n'
            '        "index": "leak_model",\n'
            '        "buckets": [\n'
            "          { \"key\": \"example_team\", \"count\": 120 },\n"
            "          { \"key\": \"another_team\", \"count\": 95 }\n"
            "        ]\n"
            "      },\n"
            "      {\n"
            '        "aggregation_name": "Top Hashtags (Social)",\n'
            '        "index": "chat_model",\n'
            '        "buckets": [\n'
            "          { \"key\": \"#ransomware\", \"count\": 430 },\n"
            "          { \"key\": \"#databreach\", \"count\": 280 }\n"
            "        ]\n"
            "      }\n"
            "    ]\n"
            "  }\n"
            "}\n"
            "```\n"
        ),
    },
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
            "Get a specific defacement intelligence report targeting phishing or hacked websites by its report ID.\n\n"
            "The request is a simple HTTP GET that takes a single path parameter:\n"
            "- **doc_id** — string identifier of the defacement report document.\n\n"
            "No request body is required."
        ),
        "response_description": (
          "Single defacement intelligence report document, returned as a JSON object describing a defaced or "
          "phishing-style page and its metadata.\n\n"
          "Core response fields typically include:\n"
          "- **m_team** — threat actor, group or campaign name responsible for the defacement/phishing (e.g. `mthcht`)\n"
          "- **m_base_url** — base URL or service where the content or campaign originates (e.g. `https://github.com/`)\n"
          "- **m_url** — concrete URL of the defaced or phishing page\n"
          "- **m_ioc_type** — high-level classification of the event or page type (e.g. `phishing`)\n"
          "- **m_leak_date** — date when the defacement/phishing item was first reported or observed\n"
          "- **m_network** — network type, usually `clearnet` or `onion`\n"
          "- **m_scrap_file** — internal scraper identifier or file prefix (e.g. `_github_mthcht_awesome_lists`)\n"
          "- **m_domain** — list of domains involved in the event (infrastructure and target domains)\n"
          "- **m_hash** — internal hash for this document, used for deduplication and correlation\n"
          "- **m_update_date** — last time the document was updated in the system\n"
          "- **m_creation_date** — first time the document was created/ingested into the system\n\n"
          "Depending on the source, additional fields may also be present, such as:\n"
          "- **m_title** — page or banner title of the defaced site\n"
          "- **m_content** — full textual content extracted from the page\n"
          "- **m_important_content** — key snippet extracted from the page\n"
          "- **m_content_type** — classification labels (e.g. `defacement`, `phishing`)\n"
          "- **m_sub_url** — list of related or child URLs\n"
          "- **m_validity_score** — internal confidence/validity score\n"
          "- **m_screenshot** — screenshot identifier pointing to a stored image of the page\n"
          "- **m_language** — detected language(s) of the content\n"
          "- **m_currencies** — currencies mentioned in the content\n"
          "- **m_organization** — extracted organizations or brands related to the event"
          "\n\nExample response:\n"
          "```json\n"
          "{\n"
          '  "m_team": "mthcht",\n'
          '  "m_base_url": "https://github.com/",\n'
          '  "m_url": "http://me-itay-mask_logjjin.godaddysites.com/",\n'
          '  "m_ioc_type": ["phishing"],\n'
          '  "m_leak_date": "2025-12-01",\n'
          '  "m_network": "clearnet",\n'
          '  "m_scrap_file": "_github_mthcht_awesome_lists",\n'
          '  "m_domain": [\n'
          '    "github.com",\n'
          '    "me-itay-mask_logjjin.godaddysites.com"\n'
          "  ],\n"
          '  "m_hash": "e386dad88518aaa3072f8aefda4f1f5fe89b0df31248af77a09270903410c57c",\n'
          '  "m_update_date": "2025-12-01T01:33:51.873016+00:00",\n'
          '  "m_creation_date": "2025-12-01T01:33:51.878252+00:00",\n'
          '  "m_title": "Example phishing landing page",\n'
          '  "m_content": "Login to your account to resolve a security issue...",\n'
          '  "m_important_content": "Phishing kit targeting example users.",\n'
          '  "m_content_type": ["defacement", "phishing"],\n'
          '  "m_sub_url": [],\n'
          '  "m_validity_score": 92,\n'
          '  "m_screenshot": "1234567890abcdef",\n'
          '  "m_language": ["en"],\n'
          '  "m_currencies": [],\n'
          '  "m_organization": ["Example Corp"]\n'
          "}\n"
          "```\n"
      ) + IOC_DOC,
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
          "A typical response looks like:\n"
          "```json\n"
          "{\n"
          '  "m_title": "Columbus Regional Healthcare System",\n'
          '  "m_url": "http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion/",\n'
          '  "m_screenshot": "69993154316451142028569605097804",\n'
          '  "m_base_url": "http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion",\n'
          '  "m_content": "Columbus Regional Healthcare System has one of the highest volume and most experienced '
          'robotic surgical programs in Southeastern North Carolina. ...",\n'
          '  "m_important_content": "Columbus Regional Healthcare System has one of the highest volume and most '
          'experienced robotic surgical programs in Southeastern North Carolina.",\n'
          '  "m_network": "onion",\n'
          '  "m_content_type": ["leaks"],\n'
          '  "m_weblink": ["https://crhealthcare.org/"],\n'
          '  "m_dumplink": ["https://crhealthcare.org/"],\n'
          '  "m_company_name": "Columbus Regional Healthcare System",\n'
          '  "m_location": ["US"],\n'
          '  "m_team": "diaxin",\n'
          '  "m_scrap_file": "_7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd",\n'
          '  "m_language": ["en"],\n'
          '  "m_domain": [\n'
          '    "7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion",\n'
          '    "crhealthcare.org"\n'
          "  ],\n"
          '  "m_hash": "1a17b87ad12262b38a81419c3d1cc8c57868ce62b9e32e042ff1b20a9aefacc0",\n'
          '  "m_update_date": "2025-12-03T20:46:34.909368+00:00",\n'
          '  "m_creation_date": "2025-12-03T20:46:34.909391+00:00",\n'
          '  "content_type": ["ddos", "darkweb"]\n'
          "}\n"
          "```\n\n"
          "Common fields and their meaning:\n"
          "- **m_title** — human-readable title of the victim or breached asset\n"
          "- **m_url** — specific leak or post URL on the darkweb/dump source\n"
          "- **m_screenshot** — screenshot identifier (use `/api/search/breach/screenshot/{m_screenshot}` to fetch it)\n"
          "- **m_base_url** — base onion/clearnet URL of the leak site or listing\n"
          "- **m_content** — full textual content of the breach note/announcement\n"
          "- **m_important_content** — condensed or highlighted summary of the breach content\n"
          "- **m_network** — network type (e.g. `onion`)\n"
          "- **m_content_type** — internal category labels, e.g. `leaks`\n"
          "- **m_weblink** — list of URLs pointing to the victim’s official/clearnet web presence\n"
          "- **m_dumplink** — list of URLs where the attacker claims to host or reference leaked data\n"
          "- **m_company_name** — normalized company or organization name of the victim\n"
          "- **m_location** — list of country/region codes associated with the victim (e.g. `US`)\n"
          "- **m_team** — threat group, ransomware gang or actor name (e.g. `diaxin`)\n"
          "- **m_scrap_file** — internal scrape identifier or file prefix\n"
          "- **m_language** — detected language(s) of the content (e.g. `en`)\n"
          "- **m_domain** — domains associated with the leak site and the victim (onion + clearnet)\n"
          "- **m_hash** — internal hash for the document used for deduplication and correlation\n"
          "- **m_update_date** — last time the document was updated in the system\n"
          "- **m_creation_date** — first time the document was created/ingested\n"
          "- **content_type** — high-level classification tags used by other modules (e.g. `ddos`, `darkweb`)\n"
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
          "- **m_title** — article or post title (e.g. `Dangerous websites Warning List`)\n"
          "- **m_url** — direct URL of the article/post (e.g. a specific blog or advisory page)\n"
          "- **m_base_url** — base URL of the publishing site (e.g. `https://cert.pl`)\n"
          "- **m_content** — normalized content body, including title, description, publication info and extracted text\n"
          "- **m_important_content** — short summary or key snippet (falls back to placeholders like `No description found` when necessary)\n"
          "- **m_network** — network classification of the resource, typically `clearnet`\n"
          "- **m_content_type** — internal labels describing the article, such as `news`, `tracking`, etc.\n"
          "- **m_team** — name of the publishing or responsible team (e.g. `CERT Polska Team`)\n"
          "- **m_country** — list of associated countries or regions (e.g. `[\"Poland\"]`)\n"
          "- **m_author** — list of author names for the article (e.g. `[\"CERT Author\"]`)\n"
          "- **m_scrap_file** — internal scraper identifier or file prefix (e.g. `_cert_pl`)\n"
          "- **m_language** — detected language(s) of the article content (e.g. `[\"en\"]`)\n"
          "- **m_domain** — list of domains associated with the news source (e.g. `[\"cert.pl\"]`)\n"
          "- **m_hash** — internal hash for this document, used for deduplication and correlation\n"
          "- **m_update_date** — last time the document was updated in the system\n"
          "- **m_creation_date** — first time the document was created/ingested into the system\n"
          "- **content_type** — high-level classification tags used by other modules (e.g. `[\"darkweb\"]`)\n"
          "\nExample response:\n"
          "```json\n"
          "{\n"
          '  "m_title": "Dangerous websites Warning List",\n'
          '  "m_url": "https://cert.pl/en/posts/2019/02/dangerous-websites-warning-list/",\n'
          '  "m_base_url": "https://cert.pl",\n'
          '  "m_content": "Title: Dangerous websites Warning List\\nNo description found\\n\\nPublished on: 2019-02-02\\nResources: []\\nImages: []",\n'
          '  "m_important_content": "No description found",\n'
          '  "m_network": "clearnet",\n'
          '  "m_content_type": ["news", "tracking"],\n'
          '  "m_team": "CERT Polska Team",\n'
          '  "m_country": ["Poland"],\n'
          '  "m_author": ["CERT Author"],\n'
          '  "m_scrap_file": "_cert_pl",\n'
          '  "m_language": ["en"],\n'
          '  "m_domain": ["cert.pl"],\n'
          '  "m_hash": "d2b1cc17284f0d286d5454b294b8c9c0ab44593f8072fe4f4ad8fc9d5353f993",\n'
          '  "m_update_date": "2025-10-13T16:10:29.381614+00:00",\n'
          '  "m_creation_date": "2025-10-13T16:10:29.388117+00:00",\n'
          '  "content_type": ["darkweb"]\n'
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
          "- **m_title** — exploit or module title (e.g. `Windows Registry Only Persistence`)\n"
          "- **m_url** — direct URL for the exploit/module page "
          "(e.g. a Metasploit module page or technical write-up)\n"
          "- **m_base_url** — base URL of the publishing site or contact page "
          "(e.g. `https://www.rapid7.com/contact/`)\n"
          "- **m_content** — normalized exploit description or short text body\n"
          "- **m_important_content** — key snippet or short summary emphasizing the exploit name or purpose\n"
          "- **m_network** — network type of the source, typically `clearnet`\n"
          "- **m_content_type** — internal labels such as `cve`, `exploit`, `poc`, etc.\n"
          "- **m_weblink** — list of additional URLs related to the exploit, such as source code repositories or commits "
          "(for example Metasploit module paths on GitHub)\n"
          "- **content_type** — high-level classification tags used by other modules "
          "(e.g. `[\"persistence\"]` for a persistence-focused module)\n"
          "- **m_name** — author or contributor information, often including names and email addresses\n"
          "- **m_code_snippet** — list of code or command snippets showing how to use or trigger the exploit "
          "(for example an `msf > use exploit/windows/persistence/registry` Metasploit usage example)\n"
          "- **m_platform** — list of affected or supported platforms (e.g. `[\"Windows\"]`)\n"
          "- **m_scrap_file** — internal scraper identifier or file prefix (e.g. `_rapid7`)\n"
          "- **m_domain** — list of domains related to the exploit content and references "
          "(e.g. `github.com`, `rapid7.com`)\n"
          "- **m_hash** — internal hash for this document, used for deduplication and correlation\n"
          "- **m_update_date** — last time the document was updated in the system\n"
          "- **m_creation_date** — first time the document was created/ingested into the system\n\n"
          "Depending on the source and context, additional enrichment fields may be present, such as CVE identifiers, "
          "threat actor information or extended narrative text."
          "\n\nExample response:\n"
          "```json\n"
          "{\n"
          '  "m_title": "Windows Registry Only Persistence",\n'
          '  "m_url": "https://www.rapid7.com/db/modules/exploit/windows/persistence/registry/",\n'
          '  "m_base_url": "https://www.rapid7.com/contact/",\n'
          '  "m_content": "Windows Registry Only Persistence",\n'
          '  "m_important_content": "Windows Registry Only Persistence",\n'
          '  "m_network": "clearnet",\n'
          '  "m_content_type": ["cve"],\n'
          '  "m_weblink": [\n'
          '    "https://github.com/rapid7/metasploit-framework/blob/master/modules/exploits/windows/persistence/registry.rb",\n'
          '    "https://github.com/rapid7/metasploit-framework/commits/master/modules/exploits/windows/persistence/registry.rb"\n'
          "  ],\n"
          '  "content_type": ["persistence"],\n'
          '  "m_name": "Donny Maasland donny.maasland@fox-it.com,h00die",\n'
          '  "m_code_snippet": [\n'
          '    "msf > use exploit/windows/persistence/registry\\n\\nmsf exploit(registry) > show targets\\n\\n...targets...\\n\\nmsf exploit(registry) > set TARGET < target-id >\\n\\nmsf exploit(registry) > show options\\n\\n...show and set options...\\n\\nmsf exploit(registry) > exploit"\n'
          "  ],\n"
          '  "m_platform": ["Windows"],\n'
          '  "m_scrap_file": "_rapid7",\n'
          '  "m_domain": [\n'
          '    "github.com",\n'
          '    "rapid7.com",\n'
          '    "rapid7.com/contact"\n'
          "  ],\n"
          '  "m_hash": "6c88d95f4d98b5c95f65a79da548fd5c3b33d6ac319790c33630dc2f2d869019",\n'
          '  "m_update_date": "2025-10-28T18:09:14.512739+00:00",\n'
          '  "m_creation_date": "2025-10-28T18:09:14.516589+00:00"\n'
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
          "Strategic darkweb intelligence document representing a single crawled page (such as a forum thread, "
          "marketplace listing or generic page), returned as a JSON object.\n\n"
          "Core response fields typically include:\n"
          "- **m_base_url** — base URL of the hidden service or site (e.g. the main forum onion address)\n"
          "- **m_url** — specific page URL, such as a thread URL with pagination\n"
          "- **m_network** — network type (e.g. `onion`)\n"
          "- **m_title** — page title as seen in the source (for example a thread title in the forum)\n"
          "- **m_meta_description** — meta description extracted from the HTML, if available\n"
          "- **m_content** — normalized text content extracted from the page (including posts, notices and boilerplate)\n"
          "- **m_important_content** — key snippet or condensed portion of the most relevant text on the page\n"
          "- **m_images** — list of image URLs extracted from the page (logos, avatars, icons, etc.)\n"
          "- **m_sub_url** — list of internal navigation or related links (search, login, rules, other threads, sections)\n"
          "- **m_validity_score** — internal confidence/validity score for the crawled document\n"
          "- **m_meta_keywords** — keyword string summarizing tags, topics and SEO-style keywords for the page\n"
          "- **m_content_type** — internal classification labels such as `general`, `forums`, `adult`, etc.\n"
          "- **m_clearnet_links** — list of clearnet links referenced from the page (e.g. external sites, Telegram, etc.)\n"
          "- **m_organization** — extracted organizations or platforms mentioned (e.g. `Forum`, `Telegram`)\n"
          "- **m_language** — detected language(s) of the content (e.g. `[\"en\"]`)\n"
          "- **m_domain** — list of domains associated with the page and its references (onion plus clearnet domains)\n"
          "- **m_hash_content** — hash of the normalized page content\n"
          "- **m_hash_url** — hash of the page URL\n"
          "- **m_hash** — internal document hash identifier used for deduplication and correlation\n"
          "- **m_update_date** — last time the document was updated in the system\n"
          "- **m_creation_date** — first time the document was created/ingested into the system\n\n"
          "Depending on the source, additional enrichment fields may be present, such as forum-specific metadata or "
          "structured attributes describing the section, category or thread state."
          "\n\nExample response:\n"
          "```json\n"
          "{\n"
          '  "m_base_url": "http://darknet3osr75sgyqgaed54w6pjh2tkh67tcozvxmuzn426l4vkvjfad.onion",\n'
          '  "m_url": "http://darknet3osr75sgyqgaed54w6pjh2tkh67tcozvxmuzn426l4vkvjfad.onion/threads/free-site-for-onlyfans-porn-leaked.38796/page-26",\n'
          '  "m_network": "onion",\n'
          '  "m_title": "free site for onlyfans porn leaked page 26 | darknet army - forum ⭐",\n'
          '  "m_meta_description": ". free site for porn onlyfans streaming accounts leaked",\n'
          '  "m_content": "can i see it pls\\nso far there\\\'s no one here ...",\n'
          '  "m_important_content": "some forum functions may not work properly you are using an out of date browser...",\n'
          '  "m_images": [\n'
          '    "http://darknet3osr75sgyqgaed54w6pjh2tkh67tcozvxmuzn426l4vkvjfad.onion/data/assets/logo/DNA_banner_logo.png"\n'
          "  ],\n"
          '  "m_sub_url": [\n'
          '    "http://darknet3osr75sgyqgaed54w6pjh2tkh67tcozvxmuzn426l4vkvjfad.onion/search",\n'
          '    "http://darknet3osr75sgyqgaed54w6pjh2tkh67tcozvxmuzn426l4vkvjfad.onion/login"\n'
          "  ],\n"
          '  "m_validity_score": 79,\n'
          '  "m_meta_keywords": "carding forum hacking hack marketplace ...",\n'
          '  "m_content_type": ["general", "forums", "adult"],\n'
          '  "m_clearnet_links": [\n'
          '    "xenet.info/resources/",\n'
          '    "t.me/+DKNhCjWNY4A2NmQx",\n'
          '    "google.com/chrome/"\n'
          "  ],\n"
          '  "m_organization": ["Forum", "Telegram"],\n'
          '  "m_language": ["en"],\n'
          '  "m_domain": [\n'
          '    "xenet.info",\n'
          '    "joyfreak.com",\n'
          '    "darknet3osr75sgyqgaed54w6pjh2tkh67tcozvxmuzn426l4vkvjfad.onion"\n'
          "  ],\n"
          '  "m_hash_content": "b64eaf1521d5...",\n'
          '  "m_hash_url": "262f3475111c...",\n'
          '  "m_hash": "c5b8edaf230c...",\n'
          '  "m_update_date": "2025-11-30T23:59:42.631785+00:00",\n'
          '  "m_creation_date": "2025-11-30T23:59:42.631828+00:00"\n'
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
          "metadata, reaction counts or extended thread context."
          "\n\nExample response:\n"
          "```json\n"
          "{\n"
          '  "m_content": "Причина сигнала бедствия Boeing 777-200 — возгорание одного из двигателей...",\n'
          '  "m_caption": "Причина сигнала бедствия Boeing 777-200 — возгорание одного из двигателей...",\n'
          '  "m_message_date": "2025-12-03",\n'
          '  "m_message_id": "69893",\n'
          '  "m_message_sharable_link": "https://t.me/mash/69893",\n'
          '  "m_channel_id": "1117628569",\n'
          '  "m_views": "401445",\n'
          '  "m_sender_name": "TIAR None",\n'
          '  "m_sender_username": "Tiarkasir",\n'
          '  "m_message_type": ["photo"],\n'
          '  "m_media_url": "https://t.me/mash/69893",\n'
          '  "m_media_caption": "9 9 1 0 0 0 2 3 0 0 RUKO SENTRA NIAGA ...",\n'
          '  "m_reply_to_message_id": "69892",\n'
          '  "m_message_status": "success",\n'
          '  "m_channel_name": "Mash",\n'
          '  "m_weblink": ["https://t.me/+mBgDVq0QTftmY2Ji"],\n'
          '  "m_users": ["Tiarkasir"],\n'
          '  "m_content_type": ["text"],\n'
          '  "m_sender_id": "1117628569",\n'
          '  "m_sender_is_bot": false,\n'
          '  "m_is_forwarded": false,\n'
          '  "m_forwarded_date": "2025-11-05 08:29:26",\n'
          '  "m_is_reply": true,\n'
          '  "m_pinned": false,\n'
          '  "m_location": ["KAYURINGIN"],\n'
          '  "m_social_media_profiles": ["https://www.instagram.com/new_king_spa_bekasi_"],\n'
          '  "m_domain": ["instagram.com"],\n'
          '  "m_platforms": ["instagram"],\n'
          '  "m_cluster_id": "chat",\n'
          '  "m_document_id": "e233d6042cec2a3239a701d0eebebe3430f72543c0fd0e20de00f228808cafa5",\n'
          '  "m_hash": "e233d6042cec2a3239a701d0eebebe3430f72543c0fd0e20de00f228808cafa5",\n'
          '  "m_creation_date": "2025-12-03T21:36:59.858292+00:00",\n'
          '  "m_edit_date": "2025-12-03 19:40:44",\n'
          '  "m_organization": ["Boeing"],\n'
          '  "m_language": ["ru"]\n'
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
          "- **m_sender_name** — display name or handle of the account that posted the content (e.g. `@abuse_ch`)\n"
          "- **m_message_sharable_link** — platform-specific path or link to the post "
          "(e.g. `/@abuse_ch/115532056771887329`)\n"
          "- **m_content** — normalized text content of the post, including hashtags, mentions and links\n"
          "- **m_content_type** — internal labels describing the social collector/source type "
          "(e.g. `[\"social_collector\"]`)\n"
          "- **m_message_date** — date the post was created, in `YYYY-MM-DD` format\n"
          "- **m_channel_url** — URL of the profile, channel or account page "
          "(e.g. `https://ioc.exchange/@abuse_ch/`)\n"
          "- **m_message_id** — platform-specific unique identifier for the post\n"
          "- **m_platform** — social platform name (e.g. `mastodon`)\n"
          "- **m_network** — network type for the source (typically `clearnet`)\n"
          "- **content_type** — high-level classification tags used by other modules "
          "(e.g. `[\"malware\", \"ddos\", \"threat_intel\", \"news\"]`)\n"
          "- **m_username** — list of usernames or handles associated with the posting account\n"
          "- **m_scrap_file** — internal scraper identifier or file prefix (e.g. `_mastodon`)\n"
          "- **m_organization** — list of organizations or projects referenced (e.g. `ThreatFox`)\n"
          "- **m_language** — detected language(s) of the post content (e.g. `[\"en\"]`)\n"
          "- **m_hashtag** — list of hashtags extracted from the content (e.g. `[#IOCs]`)\n"
          "- **m_mention** — list of mentioned accounts/handles in the post (e.g. `@abuse_chover`)\n"
          "- **m_domain** — list of domains referenced in links within the post (e.g. `ioc.exchange`)\n"
          "- **m_hash** — internal content hash used for deduplication and correlation\n"
          "- **m_creation_date** — timestamp when the social post document was created/ingested by the system\n\n"
          "Depending on the platform and event type, additional enrichment fields may be present, such as reaction "
          "counts, boost/repost information, attached media details or thread/conversation context."
          "\n\nExample response:\n"
          "```json\n"
          "{\n"
          '  "m_sender_name": "@abuse_ch",\n'
          '  "m_message_sharable_link": "/@abuse_ch/115532056771887329",\n'
          '  "m_content": "Over the past 30 days, our community shared 27,165 new #IOCs on ThreatFox — an 18% increase from the previous month...",\n'
          '  "m_content_type": ["social_collector"],\n'
          '  "m_message_date": "2025-11-11",\n'
          '  "m_channel_url": "https://ioc.exchange/@abuse_ch/",\n'
          '  "m_message_id": "115532056771887329",\n'
          '  "m_platform": "mastodon",\n'
          '  "m_network": "clearnet",\n'
          '  "content_type": ["malware", "ddos", "threat_intel", "news"],\n'
          '  "m_username": ["@abuse_ch"],\n'
          '  "m_scrap_file": "_mastodon",\n'
          '  "m_organization": ["ThreatFox"],\n'
          '  "m_language": ["en"],\n'
          '  "m_hashtag": ["#IOCs"],\n'
          '  "m_mention": ["@abuse_chover"],\n'
          '  "m_domain": ["ioc.exchange"],\n'
          '  "m_hash": "d9a2dc2203d4398efb9fe6a28adb1cb87c18e0f64a4fdff16360df2ca95e4a02",\n'
          '  "m_creation_date": "2025-12-03T20:42:56.038022+00:00"\n'
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
