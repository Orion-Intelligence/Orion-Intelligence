from orion.helper_manager.env_handler import env_handler


class ELASTIC_SEMANTIC_INDEX:
    S_GENERIC_INDEX = "generic_model"
    S_LEAK_INDEX = "leak_model"
    S_DEFACEMENT_INDEX = "defacement_model"
    S_CHATS_INDEX = "chat_model"
    S_EXPLOIT_INDEX = "exploit_model"
    S_SOCIAL_INDEX = "social_model"


class ELASTIC_INDEX:
    S_GENERIC_INDEX = "generic_model"
    S_LEAK_INDEX = "leak_model"
    S_DEFACEMENT_INDEX = "defacement_model"
    S_CHATS_INDEX = "chat_model"
    S_EXPLOIT_INDEX = "exploit_model"
    S_SIEM_INDEX = "siem_model"
    S_STEALERLOGS_INDEX = "stealer_model"
    S_SOCIAL_INDEX = "social_model"
    S_OPENSANCTIONS_INDEX = "sanction_model"
    S_WRI_POWER_PLANTS_INDEX = "wri_power_plants_geo"


class ELASTIC_SEMANTIC:
    S_INFERENCE_ID = "bge-small-en-v1.5"
    S_EMBED_FIELD = "m_embedding"
    S_EMBED_DIMS = 384


class ELASTIC_CONNECTIONS:
    S_DATABASE_NAME = 'orion-elastic-search'
    S_DATABASE_PORT = 9400
    S_DATABASE_IP = env_handler.get_instance().env('ELASTIC_ROOT_IP')
    S_STEALER_IP = env_handler.get_instance().env('ELASTIC_STEALER_IP', S_DATABASE_IP)
    S_ELASTIC_USERNAME = env_handler.get_instance().env('ELASTIC_ROOT_USERNAME')
    S_ELASTIC_PASSWORD = env_handler.get_instance().env('ELASTIC_ROOT_PASSWORD')
    S_ELASTIC_SANCTIONS = env_handler.get_instance().env('ELASTIC_SANCTIONS_IP')


class ELASTIC_KEYS:
    S_ID = 'm_id'
    S_DOCUMENT = 'm_document'
    S_FILTER = 'm_filter'
    S_VALUE = 'm_value'


class MANAGE_ELASTIC_MESSAGES:
    S_INSERT_FAILURE = "[1] Something unexpected happened while inserting"
    S_INSERT_SUCCESS = "[2] Document Created Successfully"
    S_UPDATE_FAILURE = "[3] Something unexpected happened while updating"
    S_UPDATE_SUCCESS = "[4] Data Updated Successfully"
    S_DELETE_FAILURE = "[5] Something unexpected happened while deleting"
    S_DELETE_SUCCESS = "[6] Data Deleted Successfully"
    S_READ_FAILURE = "[5] Something unexpected happened while reading"
    S_READ_SUCCESS = "[6] Data Read Successfully"
    S_COUNT_FAILURE = "[1] Something unexpected happened while counting"


class ELASTIC_ENUMS:
    mapping_leakdatamodel = {"settings": {"number_of_shards": 1, "number_of_replicas": 0, "max_result_window": 1000000}, "mappings": {"dynamic_templates": [
        {"strings_as_keywords": {"match_mapping_type": "string", "mapping": {"type": "keyword"}}}], "properties": {"m_hash": {"type": "keyword"}, "m_title": {"type": "text"}, "m_ref_html": {"type": "text"}, "m_url": {"type": "keyword"}, "m_base_url": {"type": "keyword"}, "m_content": {"type": "text"}, "m_important_content": {"type": "text"}, "m_network": {"type": "keyword"}, "m_content_type": {"type": "keyword"}, "m_weblink": {"type": "keyword"}, "m_dumplink": {"type": "keyword"}, "m_name": {"type": "text"}, "m_email": {"type": "keyword"}, "m_industry": {"type": "keyword"}, "m_phone_numbers": {"type": "keyword"}, "m_addresses": {"type": "keyword"}, "m_social_media_profiles": {"type": "keyword"}, "m_websites": {"type": "keyword"}, "m_company_name": {"type": "keyword"}, "m_logo_or_images": {"type": "keyword"}, "m_leak_date": {"type": "date"}, "m_data_size": {"type": "keyword"}, "m_country_name": {"type": "keyword"}, "m_revenue": {"type": "keyword"}, "m_update_date": {"type": "date"}, "m_creation_date": {"type": "date"},

        "m_embedding": {"type": "dense_vector", "dims": 384, "element_type": "float", "similarity": "cosine", "index": True}}}}

    mapping_generic_model = {"settings": {"number_of_shards": 1, "number_of_replicas": 0, "max_result_window": 1000000}, "mappings": {"dynamic_templates": [
        {"strings_as_keywords": {"match_mapping_type": "string", "mapping": {"type": "keyword"}}}], "properties": {"m_hash": {"type": "keyword"}, "m_network": {"type": "keyword"}, "m_hash_url": {"type": "keyword"}, "m_title": {"type": "text"}, "m_meta_description": {"type": "text"}, "m_content": {"type": "text"}, "m_update_date": {"type": "date"},

        "m_creation_date": {"type": "date"}, "m_content_type": {"type": "keyword"},

        "m_embedding": {"type": "dense_vector", "dims": 384, "element_type": "float", "similarity": "cosine", "index": True}}}}

    mapping_defacement_model = {"settings": {"number_of_shards": 1, "number_of_replicas": 0, "max_result_window": 1000000, "analysis": {"normalizer": {"lowercase_normalizer": {"type": "custom", "filter": [
        "lowercase"]}}, "tokenizer": {"dot_split_tokenizer": {"type": "pattern", "pattern": "[./:_?=&-]+"}}, "analyzer": {"custom_url_analyzer": {"type": "custom", "tokenizer": "uax_url_email", "filter": [
        "lowercase"]}, "dot_split_analyzer": {"type": "custom", "tokenizer": "dot_split_tokenizer", "filter": [
        "lowercase"]}}}}, "mappings": {"dynamic_templates": [
        {"strings_as_keywords": {"match_mapping_type": "string", "mapping": {"type": "keyword"}}}], "properties": {"m_location": {"type": "keyword"}, "m_attacker": {"type": "keyword"}, "m_team": {"type": "keyword"}, "m_web_server": {"type": "keyword"}, "m_network": {"type": "keyword"}, "m_base_url": {"type": "text", "fields": {"raw": {"type": "keyword"}, "analyzed": {"type": "text", "analyzer": "custom_url_analyzer"}, "split": {"type": "text", "analyzer": "dot_split_analyzer"}}}, "m_content": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}}, "m_url": {"type": "text", "fields": {"raw": {"type": "keyword"}, "analyzed": {"type": "text", "analyzer": "custom_url_analyzer"}, "split": {"type": "text", "analyzer": "dot_split_analyzer"}}}, "m_ip": {"type": "keyword"}, "m_ioc_type": {"type": "keyword"}, "m_leak_date": {"type": "date", "format": "yyyy-MM-dd"}, "m_web_url": {"type": "text", "fields": {"raw": {"type": "keyword"}, "analyzed": {"type": "text", "analyzer": "custom_url_analyzer"}, "split": {"type": "text", "analyzer": "dot_split_analyzer"}}}, "m_screenshot": {"type": "keyword"}, "m_mirror_links": {"type": "text", "fields": {"raw": {"type": "keyword"}, "analyzed": {"type": "text", "analyzer": "custom_url_analyzer"}, "split": {"type": "text", "analyzer": "dot_split_analyzer"}}}, "m_creation_date": {"type": "date"}, "m_update_date": {"type": "date"}, "m_hash": {"type": "keyword"}, "m_source_url": {"type": "keyword"}, "m_domain": {"type": "keyword"}, "m_embedding": {"type": "dense_vector", "dims": 384, "element_type": "float", "similarity": "cosine", "index": True}}}}

    mapping_exploit_model = {"settings": {"number_of_shards": 1, "number_of_replicas": 0, "max_result_window": 1000000}, "mappings": {"dynamic_templates": [
        {"strings_as_keywords": {"match_mapping_type": "string", "mapping": {"type": "keyword"}}}], "properties": {"m_attacker": {"type": "keyword"}, "m_base_url": {"type": "keyword"}, "m_confidence": {"type": "keyword"}, "m_content_type": {"type": "keyword"}, "m_creation_date": {"type": "date"}, "m_cve": {"type": "keyword"}, "m_cve_source": {"type": "keyword"}, "m_cvss": {"type": "keyword"}, "m_cwe": {"type": "keyword"}, "m_leak_date": {"type": "date", "format": "yyyy-MM-dd"}, "m_exploit_year": {"type": "keyword"}, "m_github_links": {"type": "keyword"}, "m_hash": {"type": "keyword"}, "m_ip": {"type": "keyword"}, "m_location": {"type": "keyword"}, "m_mirror_links": {"type": "keyword"}, "m_name": {"type": "keyword"}, "m_network": {"type": "keyword"}, "m_org": {"type": "keyword"}, "m_product": {"type": "keyword"}, "m_remote_type": {"type": "keyword"}, "m_risk": {"type": "keyword"}, "m_screenshot": {"type": "keyword"}, "m_severity": {"type": "keyword"}, "m_solution": {"type": "keyword"}, "m_team": {"type": "keyword"}, "m_version": {"type": "keyword"}, "m_vulnerability": {"type": "keyword"}, "m_web_server": {"type": "keyword"}, "m_web_url": {"type": "keyword"}, "m_weblink": {"type": "keyword"}, "m_websites": {"type": "keyword"}, "m_update_date": {"type": "date"}, "m_url": {"type": "keyword"}, "m_title": {"type": "text", "fields": {"keyword": {"type": "keyword"}}}, "m_code_snippet": {"type": "text", "fields": {"keyword": {"type": "keyword", "ignore_above": 600}}}, "m_content": {"type": "text", "fields": {"keyword": {"type": "keyword"}}}, "m_important_content": {"type": "text", "fields": {"keyword": {"type": "keyword"}}}, "m_mitre_ttp_type": {"type": "keyword"}, "m_embedding": {"type": "dense_vector", "dims": 384, "element_type": "float", "similarity": "cosine", "index": True}}}}

    mapping_siem_model = {"settings": {"number_of_shards": 1, "number_of_replicas": 0, "max_result_window": 1000000}, "mappings": {"dynamic": True, "dynamic_templates": [
        {"strings_as_keywords": {"match_mapping_type": "string", "mapping": {"type": "keyword"}}}], "properties": {"tenant_id": {"type": "keyword"}, "event_id": {"type": "keyword"}, "hash": {"type": "keyword"}, "raw": {"type": "text"}, "timestamp": {"type": "date"}, "ingested_at": {"type": "date"}, "source": {"type": "keyword"}, "event_type": {"type": "keyword"}, "severity": {"type": "keyword"}, "host": {"type": "keyword"}, "user": {"type": "keyword"}, "tags": {"type": "keyword"}, "m_domain": {"type": "keyword"}, "m_email": {"type": "keyword"}, "m_ip": {"type": "keyword"}, "m_username": {"type": "keyword"}, "m_language": {"type": "keyword"}}}}

    mapping_siem_iocs = {
        "all": ["raw", "event_type", "source", "severity", "host", "user", "tags", "event_id", "hash", "m_domain", "m_email", "m_ip", "m_username", "m_language"],
        "domain": ["m_domain"],
        "email": ["m_email"],
        "ip": ["m_ip"],
        "event_type": ["event_type"],
        "source": ["source"],
        "host": ["host"],
        "user": ["user"],
        "severity": ["severity"],
        "m_search_all": ["raw", "event_type", "source", "severity", "host", "user", "tags", "event_id", "hash", "m_domain", "m_email", "m_ip", "m_username", "m_language"],
    }

    mapping_chat_model = {"settings": {"number_of_shards": 1, "number_of_replicas": 0, "max_result_window": 1000000, "analysis": {"normalizer": {"lowercase_normalizer": {"type": "custom", "filter": [
        "lowercase"]}}}}, "mappings": {"dynamic_templates": [
        {"strings_as_keywords": {"match_mapping_type": "string", "mapping": {"type": "keyword", "normalizer": "lowercase_normalizer"}}}], "properties": {"m_content": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}}, "m_caption": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}}, "m_media_caption": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}}, "m_ref_html": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}}, "m_forwarded_from": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}}, "m_sender_name": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}}, "m_channel_name": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}},

        "m_message_date": {"type": "date"}, "m_time": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_message_id": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_message_sharable_link": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_channel_id": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_views": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_file_size": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_sender_username": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_channel_url": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_message_type": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_media_url": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_reply_to_message_id": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_message_status": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_file_saved_as": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_file_path": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_weblink": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_file_name": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_users": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_hashtags": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_content_type": {"type": "keyword", "normalizer": "lowercase_normalizer"}, "m_embedding": {"type": "dense_vector", "dims": 384, "element_type": "float", "similarity": "cosine", "index": True}}}}

    mapping_stealer_log_model = {"settings": {"number_of_shards": 150, "number_of_replicas": 0, "analysis": {"analyzer": {"url_path_analyzer": {"type": "custom", "tokenizer": "custom_url_tokenizer", "filter": [
        "lowercase"]}}, "tokenizer": {"custom_url_tokenizer": {"type": "pattern", "pattern": "/[^/]+", "group": 0}}}}, "mappings":{"dynamic": True, "properties": {"type": {"type": "keyword"}, "raw": {"type": "text"}, "channel": {"type": "keyword"}, "filename": {"type": "keyword"}}}}

    mapping_social_model = {"settings": {"number_of_shards": 1, "number_of_replicas": 0, "max_result_window": 1_000_000, "codec": "best_compression", "blocks": {"read_only_allow_delete": False}}, "mappings": {"dynamic": True, "dynamic_templates": [
        {"strings_as_keywords": {"match_mapping_type": "string", "mapping": {"type": "keyword"}}}], "properties": {"m_sender_name": {"type": "keyword"}, "m_message_sharable_link": {"type": "keyword"}, "m_weblink": {"type": "keyword"}, "m_code_snippet": {"type": "text", "fields": {"keyword": {"type": "keyword", "ignore_above": 600}}}, "m_title": {"type": "text"}, "m_content": {"type": "text"}, "m_content_type": {"type": "keyword"}, "m_message_date": {"type": "date"}, "m_network": {"type": "keyword"}, "m_message_id": {"type": "keyword"}, "m_platform": {"type": "keyword"}, "m_embedding": {"type": "dense_vector", "dims": 384, "element_type": "float", "similarity": "cosine", "index": True}}}}

    mapping_opensanctions_model = {
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 1,
            "index.mapping.total_fields.limit": 5000,
        },
        "mappings": {
            "dynamic": True,
            "properties": {
                "id": {"type": "keyword"},
                "first_seen": {"type": "date"},
                "last_seen": {"type": "date"},
                "last_change": {"type": "date"},
                "raw_record": {"type": "text", "index": False},
                "address_entity_raw": {"type": "text", "index": False},
            },
        },
    }

    mapping_power_plants_model = {
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "max_result_window": 1000000,
        },
        "mappings": {
            "dynamic": True,
            "properties": {
                "name": {"type": "text", "fields": {"keyword": {"type": "keyword", "ignore_above": 256}}},
                "country": {"type": "keyword"},
                "type": {"type": "keyword"},
                "capacity_mw": {"type": "float"},
                "source": {"type": "keyword"},
                "location": {
                    "properties": {
                        "lat": {"type": "float"},
                        "lon": {"type": "float"},
                    }
                },
                "location_point": {"type": "geo_point"},
                "aeroway": {"type": "keyword"},
                "military": {"type": "keyword"},
                "operator": {"type": "text", "fields": {"keyword": {"type": "keyword", "ignore_above": 256}}},
                "fuel": {"type": "keyword"},
                "primary_fuel": {"type": "keyword"},
            }
        },
    }

    mapping_stealer_log_field = {
        "m_domain": "domain.keyword",
        "m_url": "url.keyword",
        "m_username": "username.keyword",
        "m_email": "email.keyword",
        "m_ip": "ip.keyword",
        "m_creditcard": ["credit_card.keyword", "bin.keyword"],
        "m_search_all": ["domain.keyword", "username.keyword", "email.keyword", "bin.keyword"]
    }

    mapping_consolidated_iocs = {
        "m_domain": [
            "m_base_url",
            "m_websites",

            "m_domain",

            "m_base_url",
            "m_websites",

            "m_weblink",
            "m_channel_url",
        ],
        "m_email": [
            "m_email",

            "m_users",

            "m_content",
        ],

        "m_channel": [
            "m_channel_name.keyword",
            "m_channel_name",
            "channel",
            "m_channel",
            "source_channel",
            "m_source_channel",
            "source_channel",
            "m_source_channel",

            "m_sender_name",
        ],

        "m_ip": [
            "m_ip",

            "m_ip",
        ],

        "m_username": [
            "m_sender_username",
            "m_sender_name",
            "m_users",

            "m_sender_name",

            "m_username",
        ],
        "m_search_all": [
            "m_title",

            "m_content",
            "m_important_content",

            "m_url",
            "m_base_url",
            "m_web_url",
            "m_weblink",

            "m_caption",
            "m_media_caption",
            "m_ref_html",

            "m_sender_name",
            "m_channel_name",
            "m_attacker",
            "m_team",

            "m_email",
            "m_users",
            "m_ip",
            "m_domain",
        ],
    }

    ioc_field_mapping = {
        "m_phone_number": ["m_phone_number"],
        "m_email": ["m_email"],
        "m_domain": ["m_domain", "m_domain.raw"],
        "m_country": ["m_country", "m_country_name", "m_location", "country", "location"],
        "m_url": ["m_url", "m_url.raw"],
        "m_cve": ["m_cve", "m_cwe"],
        "m_ip": ["m_ip"],
        "m_yara_rule": ["m_yara_rule"],
        "m_encoded_urls": ["m_encoded_urls"],
        "m_file_paths": ["m_file_paths"],
        "m_credit_card": ["m_credit_card"],
        "m_org": ["m_org", "m_organization"],
        "m_company_name": ["m_company_name"],
        "m_person": ["m_person"],
        "m_location": ["m_location"],
        "m_language": ["m_language"],
        "m_user_agents": ["m_user_agents"],
        "m_asns": ["m_asns"],
        "m_team": ["m_team"],
        "m_hashtag": ["m_hashtag","m_hashtags"],
        "m_mention": ["m_mention"],
        "m_social_media_profiles": ["m_social_media_profiles"],
        "m_currencies": ["m_currencies"],
        "m_crypto_address": ["m_crypto_address"],
        "m_xmpp_addresses": ["m_xmpp_addresses"],
        "m_enterprise_attack_tactics": ["m_enterprise_attack_tactics"],
        "m_enterprise_attack_techniques": ["m_enterprise_attack_techniques"],
        "m_document_id": ["m_document_id"],
        "m_au_abn": ["m_au_abn"],
        "m_us_passport": ["m_us_passport"],
        "m_us_bank_number": ["m_us_bank_number"],
        "m_platform": ["m_platform","m_platforms"],
        "m_author": ["m_author"],
        "m_industry": ["m_industry"],
        "m_scrap_file": ["m_scrap_file"],
    }
