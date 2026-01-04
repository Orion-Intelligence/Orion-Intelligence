from orion.constants.constant import CONSTANTS, allowed_keys
from orion.constants.enum import ChannelTypeEnum
from orion.helper_manager.env_handler import env_handler
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX, ELASTIC_KEYS, ELASTIC_SEMANTIC
from orion.services.elastic_manager.elastic_semantic_controller import elastic_semantic_controller
from orion.services.elastic_manager.helper.elastic_helper import elastic_helper


class ElasticChatsMixin:
    @staticmethod
    def on_search_telegram_data(p_query_model, pfilter=None):
        raw_query = ""
        if p_query_model.q == "":
            raw_query = "*"

        if p_query_model.q:
            if p_query_model.q != "*":
                raw_query = helper_controller.remove_stopwords_from_string(p_query_model.q)

        m_page_number = p_query_model.page
        m_search_type = p_query_model.content
        m_message_date = p_query_model.daterange
        m_content_type = p_query_model.content
        m_ctype = p_query_model.category

        must_clauses = []
        must_not_clause = []

        if m_search_type != "all":
            must_clauses.append({"term": {"m_content_type": [m_search_type]}})

        if m_ctype != "all":
            channel_enum = ChannelTypeEnum.__members__.get(m_ctype.upper())
            channel_ids = channel_enum.value if channel_enum else [""]
            must_clauses.append({"terms": {"m_channel_id": channel_ids}})

        if m_message_date:
            from_date, to_date = elastic_helper.daterange_to_strs(
                m_message_date, start_suffix="T00:00:00.000000+00:00", end_suffix="T23:59:59.999999+00:00"
            )
            if from_date and to_date:
                must_clauses.append({"range": {"m_message_date": {"gte": from_date, "lte": to_date}}})

        if m_content_type and m_content_type.lower() not in ("", "all"):
            must_clauses.append({"term": {"content_type": m_content_type.lower()}})

        search_fields = [
            "m_content^3",
            "m_caption^2.5",
            "m_channel_name^2",
            "m_media_caption^2",
            "m_forwarded_from^1.2",
            "m_sender_name^1.1",
            "m_file_name^1.0",
            "m_ref_html^0.8",
        ]

        if p_query_model.matchtype == "semantic":
            query_string_query = {"match_all": {}}
        elif raw_query == "*":
            query_string_query = {"match_all": {}}
        elif '"' in raw_query:
            query_string_query = {
                "query_string": {
                    "query": raw_query,
                    "fields": search_fields,
                    "default_operator": "OR",
                    "analyze_wildcard": False,
                    "auto_generate_synonyms_phrase_query": False,
                    "lenient": True,
                }
            }
        else:
            query_string_query = {
                "multi_match": {"query": raw_query, "fields": search_fields, "type": "best_fields", "operator": "OR"}
            }

        must_filter_clauses, should_filter_clauses = helper_controller.getFilterClause(pfilter, p_query_model, allowed_keys)

        query = {
            "min_score": 0,
            "query": {
                "function_score": {
                    "query": {
                        "bool": {
                            "must": [query_string_query] if isinstance(query_string_query, dict) else [],
                            "filter": (
                                must_clauses
                                + must_filter_clauses
                                + (
                                    [
                                        {
                                            "bool": {
                                                "should": should_filter_clauses.get("bool", {}).get("should", []),
                                                "minimum_should_match": 1,
                                            }
                                        }
                                    ]
                                    if not getattr(p_query_model, "must", False) and should_filter_clauses
                                    else []
                                )
                            ),
                            "must_not": must_not_clause,
                            "should": [
                                query_string_query,
                                {"wildcard": {"m_content.keyword": {"value": f"*{raw_query}*", "boost": 1.5, "case_insensitive": True}}},
                                {"wildcard": {"m_channel_name": {"value": f"*{raw_query}*", "boost": 2.0, "case_insensitive": True}}},
                                {"term": {"m_channel_name": {"value": raw_query, "boost": 5.0}}},
                            ],
                            "minimum_should_match": 0,
                        }
                    },
                    "functions": [
                        {
                            "gauss": {"m_message_date": {"origin": "now", "scale": "90d", "offset": "10d", "decay": 0.5}},
                            "weight": 1,
                        }
                    ],
                    "score_mode": "sum",
                    "boost_mode": "multiply",
                }
            },
            "highlight": {}
            if raw_query == "*"
            else {
                "fields": {
                    "m_content": {
                        "fragment_size": 250,
                        "number_of_fragments": 3,
                        "pre_tags": ["<em>"],
                        "post_tags": ["</em>"],
                    },
                    "m_caption": {
                        "fragment_size": 250,
                        "number_of_fragments": 3,
                        "pre_tags": ["<em>"],
                        "post_tags": ["</em>"],
                    },
                    "m_ref_html": {
                        "fragment_size": 250,
                        "number_of_fragments": 3,
                        "pre_tags": ["<em>"],
                        "post_tags": ["</em>"],
                    },
                }
            },
            "suggest": {
                "telegram_suggestion": {
                    "text": raw_query,
                    "term": {
                        "field": "m_content",
                        "min_word_length": 3,
                        "max_term_freq": 0.05,
                        "sort": "score",
                        "string_distance": "levenshtein",
                    },
                }
            },
            "from": max(0, (m_page_number - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC),
            "size": CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE,
            "track_total_hits": True,
            "explain": True,
        }

        if (
            raw_query != ""
            and raw_query != "*"
            and p_query_model.matchtype == "semantic"
            and env_handler.get_instance().env("SEMANTIC_ENABLED") == "1"
        ):
            try:
                qvec = elastic_semantic_controller.get_instance().embed_query_sync(p_query_model.q)
                if qvec:
                    knn_clause = {
                        "knn": {
                            "field": ELASTIC_SEMANTIC.S_EMBED_FIELD,
                            "k": CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE,
                            "num_candidates": 1000,
                            "query_vector": qvec,
                        }
                    }
                    query["query"]["function_score"]["query"]["bool"]["must"].append(knn_clause)
            except Exception as _:
                pass

        return ELASTIC_INDEX.S_CHATS_INDEX, query

    @staticmethod
    def index_query_chat(p_index_data):
        index_entries = []
        for chat in p_index_data.get("m_chat_data", []):
            if not chat.get("m_message_id"):
                continue

            chat["m_hash"] = helper_controller.generate_data_hash(chat.get("m_message_id"))
            index_entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_KEYS.S_VALUE: chat})

        return index_entries
