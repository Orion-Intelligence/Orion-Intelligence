import hashlib
import re

from datetime import datetime, timedelta, timezone
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.constants.constant import CONSTANTS
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS, ELASTIC_INDEX
from urllib.parse import urlparse


class elastic_request_generator:

    @staticmethod
    def on_search_defacementdata(p_query_model: search_defacement_param_model):
        raw_query = p_query_model.q.strip().lower()
        if not raw_query or raw_query == "":
            raw_query = "*"

        m_page_number = getattr(p_query_model, 'mSearchParamPage', 1)
        m_network = getattr(p_query_model, 'mNetwork', None)

        must_clauses = []
        must_not_clause = []
        should_clauses = []

        m_attacker = p_query_model.mAttacker
        m_team = p_query_model.mTeam
        m_date_range = p_query_model.mDateRange

        if m_date_range:
            parts = m_date_range.split(',')
            if len(parts) == 2:
                try:
                    from_date_obj = datetime.strptime(parts[0].strip(), "%Y-%m-%d")
                    from_date = from_date_obj.strftime("%Y-%m-%dT00:00:00.000000+00:00")

                    to_date_obj = datetime.strptime(parts[1].strip(), "%Y-%m-%d")
                    to_date = to_date_obj.strftime("%Y-%m-%dT23:59:59.999999+00:00")

                    must_clauses.append({
                        "range": {
                            "m_date_of_leak": {
                                "gte": from_date,
                                "lte": to_date
                            }
                        }
                    })
                except ValueError:
                    pass

        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        if m_attacker:
            must_clauses.append({"term": {"m_attacker": m_attacker}})

        if m_team:
            must_clauses.append({"term": {"m_team": m_team}})

        import ipaddress

        try:
            ipaddress.ip_address(raw_query)
            is_ip = True
        except ValueError:
            is_ip = False

        if raw_query == "*":
            main_query = {
                "bool": {
                    "must": [{"match_all": {}}],
                    "filter": must_clauses,
                    "must_not": must_not_clause
                }
            }
        else:
            if is_ip:
                should_clauses.append({"term": {"m_ip": raw_query}})
            else:
                should_clauses.extend([
                    {"match": {"m_location": {"query": raw_query, "boost": 50}}},
                    {"match": {"m_web_url": {"query": raw_query, "boost": 50}}},
                    {"match": {"m_mirror_links": {"query": raw_query, "boost": 50}}},
                    {"match": {"m_attacker": {"query": raw_query, "boost": 50}}},
                    {
                        "multi_match": {
                            "query": raw_query,
                            "fields": [
                                "m_location^5",
                                "m_web_url^5",
                                "m_base_url^5",
                                "m_web_server^3",
                                "m_attacker^5",
                                "m_team^5",
                                "m_network^3",
                                "m_mirror_links^5"
                            ],
                            "type": "best_fields",
                            "boost": 5
                        }
                    },
                    {
                        "bool": {
                            "should": [
                                {"wildcard": {
                                    "m_location": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 2}}},
                                {"wildcard": {
                                    "m_web_url": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 2}}},
                                {"wildcard": {
                                    "m_base_url": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 2}}},
                                {"wildcard": {
                                    "m_web_server": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 1}}},
                                {"wildcard": {
                                    "m_attacker": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 2}}},
                                {"wildcard": {
                                    "m_team": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 2}}},
                                {"wildcard": {
                                    "m_network": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 1}}},
                                {"wildcard": {"m_mirror_links": {"value": f"*{raw_query}*", "case_insensitive": True,
                                                                 "boost": 2}}}
                            ],
                            "minimum_should_match": 1
                        }
                    }
                ])

            main_query = {
                "bool": {
                    "should": should_clauses,
                    "minimum_should_match": 1,
                    "filter": must_clauses,
                    "must_not": must_not_clause
                }
            }

        query_statement = {
            "min_score": 0,
            "query": {
                "function_score": {
                    "query": main_query,
                    "functions": [
                        {
                            "gauss": {
                                "m_update_date": {
                                    "origin": "now",
                                    "scale": "30d",
                                    "offset": "10d",
                                    "decay": 0.5
                                }
                            },
                            "weight": 0.5
                        }
                    ],
                    "score_mode": "sum",
                    "boost_mode": "multiply"
                }
            },
            "suggest": {
                "attacker_suggestion": {
                    "text": raw_query,
                    "term": {
                        "field": "m_attacker",
                        "min_word_length": 3,
                        "max_term_freq": 0.05,
                        "sort": "score",
                        "string_distance": "levenshtein"
                    }
                },
                "web_url_suggestion": {
                    "text": raw_query,
                    "term": {
                        "field": "m_web_url",
                        "min_word_length": 3,
                        "max_term_freq": 0.05,
                        "sort": "score",
                        "string_distance": "levenshtein"
                    }
                }
            },
            "from": max(0, (m_page_number - 1) * 100),
            "size": 100,
            "track_total_hits": True,
            "sort": [
                {"m_date_of_leak": {"order": "desc"}}
            ]
        }

        return ELASTIC_INDEX.S_DEFACEMENT_INDEX, query_statement

    @staticmethod
    def on_search_leakdata(p_query_model):
        if p_query_model.q != "*":
            raw_query = p_query_model.q.strip()
            raw_query = helper_controller.remove_stopwords_from_string(raw_query)
        else:
            raw_query = "*"
        if raw_query == "":
            raw_query = "*"

        if not raw_query:
            return ELASTIC_INDEX.S_LEAK_INDEX, {"query": {"match_none": {}}, "size": 0}

        exact_phrases = re.findall(r'"([^"]+)"', raw_query)
        loose_terms = re.sub(r'"[^"]+"', '', raw_query).strip().split()

        m_url_query = raw_query
        m_safe_search = p_query_model.mSearchParamSafeSearch
        m_page_number = p_query_model.mSearchParamPage
        m_network = p_query_model.mNetwork
        m_search_type = p_query_model.mSearchParamType
        m_date_range = p_query_model.mDateRange
        m_content_type = p_query_model.mContentType
        m_entity = p_query_model.mEntity

        parsed_url = urlparse(raw_query)
        domain = parsed_url.netloc or (raw_query.split("/")[0] if "/" in raw_query else raw_query)
        path = parsed_url.path.lstrip("/") or ("/".join(raw_query.split("/")[1:]) if "/" in raw_query else "")

        must_clauses = []
        must_not_clause = []

        if m_date_range:
            parts = m_date_range.split(',')
            if len(parts) == 2:
                try:
                    from_date_obj = datetime.strptime(parts[0].strip(), "%Y-%m-%d")
                    from_date = from_date_obj.strftime("%Y-%m-%dT00:00:00.000000+00:00")

                    to_date_obj = datetime.strptime(parts[1].strip(), "%Y-%m-%d")
                    to_date = to_date_obj.strftime("%Y-%m-%dT23:59:59.999999+00:00")

                    must_clauses.append({
                        "range": {
                            "m_leak_date": {
                                "gte": from_date,
                                "lte": to_date
                            }
                        }
                    })
                except ValueError:
                    pass

        if m_entity:
            entity_list = [
                e if e.startswith("m_") else f"m_{e}"
                for e in [
                    i.strip().lower().replace(" ", "_") for i in m_entity.split(",") if i.strip()
                ]
            ]

            if entity_list:
                must_clauses.append({
                    "bool": {
                        "should": [
                            {"exists": {"field": entity}} for entity in entity_list
                        ],
                        "minimum_should_match": 1
                    }
                })

        if m_content_type and m_content_type.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_mitre_ttp_type": m_content_type.lower()}})

        if m_search_type == "databases":
            m_search_type = "leaks"
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})
        if m_search_type:
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})
        if m_safe_search == "True":
            must_not_clause.append({"term": {"m_content_type": "adult"}})
        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        url_priority_query = {
            "bool": {
                "should": [
                    {"term": {"m_url.keyword": {"value": m_url_query, "boost": 100, "case_insensitive": True}}},
                    {"wildcard": {"m_url.keyword": {"value": "*" + m_url_query + "*", "boost": 80}}},
                    {"wildcard": {"m_url.keyword": {"value": domain + "/*" + path, "boost": 70}}},
                    {"wildcard": {"m_url.keyword": {"value": "*" + path, "boost": 60}}},
                    {"match": {"m_url": {"query": raw_query, "boost": 40}}}
                ],
                "minimum_should_match": 1,
                "boost": 10
            }
        }

        base_url_query = {
            "bool": {
                "should": [
                    {"term": {
                        "m_base_url.keyword": {"value": "https://" + domain, "boost": 50, "case_insensitive": True}}},
                    {"term": {
                        "m_base_url.keyword": {"value": "http://" + domain, "boost": 50, "case_insensitive": True}}},
                    {"wildcard": {"m_base_url.keyword": {"value": "*" + domain + "*", "boost": 30}}}
                ],
                "minimum_should_match": 1,
                "boost": 5
            }
        }

        if raw_query == "*":
            content_query = {"match_all": {}}
        else:
            content_query = {"bool": {"should": [], "minimum_should_match": 1}}

            for phrase in exact_phrases:
                phrase_query = {
                    "bool": {
                        "should": [
                            {"match_phrase": {"m_title": {"query": phrase, "boost": 6}}},
                            {"match_phrase": {"m_content": {"query": phrase, "boost": 1.5}}},
                            {"match_phrase": {"m_important_content": {"query": phrase, "boost": 1.5}}},
                            {"match_phrase": {"m_company_name": {"query": phrase, "boost": 2.5}}},
                            {"match_phrase": {"m_ref_html": {"query": phrase, "boost": 2.0}}}
                        ],
                        "minimum_should_match": 1
                    }
                }
                content_query["bool"]["should"].append(phrase_query)

            for term in loose_terms:
                term_query = {
                    "query_string": {
                        "query": term.lower() + "*",
                        "fields": ["*"],
                        "default_operator": "OR",
                        "lenient": True,
                        "analyze_wildcard": True,
                        "boost": 2
                    }
                }
                content_query["bool"]["should"].append(term_query)

            if not exact_phrases and not loose_terms:
                content_query = {
                    "query_string": {
                        "query": raw_query.lower().rstrip("/") + "*",
                        "fields": ["*"],
                        "default_operator": "OR",
                        "lenient": True,
                        "analyze_wildcard": True,
                        "boost": 2
                    }
                }

        query_statement = {
            "min_score": 0,
            "query": {
                "function_score": {
                    "query": {
                        "bool": {
                            "filter": must_clauses,
                            "should": [
                                url_priority_query,
                                base_url_query,
                                content_query
                            ],
                            "minimum_should_match": 1,
                            "must_not": must_not_clause
                        }
                    },
                    "functions": [
                        {
                            "gauss": {
                                "m_update_date": {
                                    "origin": "now",
                                    "scale": "30d",
                                    "offset": "10d",
                                    "decay": 0.5
                                }
                            },
                            "weight": 2
                        },
                        {
                            "field_value_factor": {
                                "field": "m_update_date",
                                "factor": 1.1,
                                "modifier": "log1p",
                                "missing": 0
                            }
                        }
                    ],
                    "score_mode": "sum",
                    "boost_mode": "multiply"
                }
            },
            "highlight": {} if raw_query == "*" else {
                "fields": {
                    "m_important_content": {
                        "fragment_size": 500,
                        "number_of_fragments": 3,
                        "pre_tags": ["<em>"],
                        "post_tags": ["</em>"]
                    },
                    "m_content": {
                        "fragment_size": 250,
                        "number_of_fragments": 3,
                        "pre_tags": ["<em>"],
                        "post_tags": ["</em>"]
                    },
                    "m_ref_html": {
                        "fragment_size": 250,
                        "number_of_fragments": 3,
                        "pre_tags": ["<em>"],
                        "post_tags": ["</em>"]
                    }
                }
            },
            "suggest": {
                "important_content_suggestion": {
                    "text": raw_query,
                    "term": {
                        "field": "m_important_content",
                        "min_word_length": 3,
                        "max_term_freq": 0.05,
                        "sort": "score",
                        "string_distance": "levenshtein"
                    }
                },
                "content_suggestion": {
                    "text": raw_query,
                    "term": {
                        "field": "m_content",
                        "min_word_length": 3,
                        "max_term_freq": 0.05,
                        "sort": "score",
                        "string_distance": "levenshtein"
                    }
                }
            },
            "from": max(0, (m_page_number - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC),
            "size": CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE,
            "track_total_hits": True,
            "explain": True
        }

        return ELASTIC_INDEX.S_LEAK_INDEX, query_statement

    @staticmethod
    def on_search_telegram_data(p_query_model):
        raw_query = ""
        if p_query_model.q == "":
            raw_query = "*"

        if p_query_model.q != "*":
            raw_query = p_query_model.q.strip()
            raw_query = helper_controller.remove_stopwords_from_string(raw_query)

        m_page_number = getattr(p_query_model, 'mSearchParamPage', 1)
        m_search_type = p_query_model.mContentType
        m_message_date = p_query_model.mDateRange
        m_entity = p_query_model.mEntity
        m_mitryTtp = p_query_model.mMitreTtp

        must_clauses = []
        must_not_clause = []
        if m_search_type != "all":
            must_clauses.append({"term": {"m_content_type": [m_search_type]}})

        if m_message_date:
            parts = m_message_date.split(',')
            if len(parts) == 2:
                try:
                    from_date_obj = datetime.strptime(parts[0].strip(), "%Y-%m-%d")
                    from_date = from_date_obj.strftime("%Y-%m-%dT00:00:00.000000+00:00")

                    to_date_obj = datetime.strptime(parts[1].strip(), "%Y-%m-%d")
                    to_date = to_date_obj.strftime("%Y-%m-%dT23:59:59.999999+00:00")

                    must_clauses.append({
                        "range": {
                            "m_message_date": {
                                "gte": from_date,
                                "lte": to_date
                            }
                        }
                    })
                except ValueError:
                    pass

        if m_entity:
            must_clauses.append({
                "bool": {
                    "should": [
                        {"exists": {"field": entity}} for entity in m_entity
                    ],
                    "minimum_should_match": 1
                }
            })

        if m_mitryTtp and m_mitryTtp.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_mitre_ttp_type": m_mitryTtp.lower()}})

        search_fields = [
            "m_content^3",
            "m_caption^2.5",
            "m_channel_name^2",
            "m_file_name^2",
            "m_media_caption^2",
            "m_forwarded_from^1.2",
            "m_hashtags^1.2",
            "m_users^1.1"
        ]

        query = {
            "min_score": 0,
            "query": {
                "function_score": {
                    "query": {
                        "bool": {
                            "filter": must_clauses,
                            "must_not": must_not_clause,
                            "should": [
                                {
                                    "query_string": {
                                        "query": raw_query + "*",
                                        "fields": search_fields,
                                        "default_operator": "OR",
                                        "analyze_wildcard": True,
                                        "lenient": True
                                    }
                                },
                                {
                                    "wildcard": {
                                        "m_content.keyword": {
                                            "value": f"*{raw_query}*",
                                            "boost": 1.5,
                                            "case_insensitive": True
                                        }
                                    }
                                }
                            ],
                            "minimum_should_match": 1
                        }
                    },
                    "functions": [
                        {
                            "gauss": {
                                "m_message_date": {
                                    "origin": "now",
                                    "scale": "30d",
                                    "offset": "10d",
                                    "decay": 0.5
                                }
                            },
                            "weight": 1.5
                        }
                    ],
                    "score_mode": "sum",
                    "boost_mode": "multiply"
                }
            },
            "highlight": {} if raw_query == "*" else {
                "fields": {
                    "m_content": {
                        "fragment_size": 250,
                        "number_of_fragments": 3,
                        "pre_tags": ["<em>"],
                        "post_tags": ["</em>"]
                    },
                    "m_caption": {
                        "fragment_size": 250,
                        "number_of_fragments": 3,
                        "pre_tags": ["<em>"],
                        "post_tags": ["</em>"]
                    },
                    "m_ref_html": {
                        "fragment_size": 250,
                        "number_of_fragments": 3,
                        "pre_tags": ["<em>"],
                        "post_tags": ["</em>"]
                    }
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
                        "string_distance": "levenshtein"
                    }
                }
            },
            "from": max(0, (m_page_number - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC),
            "size": CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE,
            "track_total_hits": True,
            "explain": True
        }

        return ELASTIC_INDEX.S_CHATS_INDEX, query

    @staticmethod
    def on_search_general_data(p_query_model):
        if p_query_model.q != "*":
            raw_query = p_query_model.q.strip()
            raw_query = helper_controller.remove_stopwords_from_string(raw_query)
        else:
            raw_query = "*"
        if raw_query == "":
            raw_query = "*"

        if not raw_query or raw_query == "":
            raw_query = "*"

        if not raw_query:
            return ELASTIC_INDEX.S_GENERIC_INDEX, {"query": {"match_none": {}}, "size": 0}

        m_user_query = raw_query.lower().rstrip("/") + "*"
        m_url_query = raw_query
        m_safe_search = p_query_model.mSearchParamSafeSearch
        m_search_type = p_query_model.mSearchParamType
        m_page_number = p_query_model.mSearchParamPage
        m_network = p_query_model.mNetwork
        m_date_range = p_query_model.mDateRange
        m_content_type = p_query_model.mContentType
        m_entity = p_query_model.mEntity

        parsed_url = urlparse(raw_query)
        domain = parsed_url.netloc or (raw_query.split("/")[0] if "/" in raw_query else raw_query)
        path = parsed_url.path.lstrip("/") or ("/".join(raw_query.split("/")[1:]) if "/" in raw_query else "")

        must_clauses = []
        must_not_clause = []
        if p_query_model.q != "*":
            pass

        if m_date_range:
            parts = m_date_range.split(',')
            if len(parts) == 2:
                try:
                    from_date_obj = datetime.strptime(parts[0].strip(), "%Y-%m-%d")
                    from_date = from_date_obj.strftime("%Y-%m-%dT00:00:00.000000+00:00")

                    to_date_obj = datetime.strptime(parts[1].strip(), "%Y-%m-%d")
                    to_date = to_date_obj.strftime("%Y-%m-%dT23:59:59.999999+00:00")

                    must_clauses.append({
                        "range": {
                            "m_update_date": {
                                "gte": from_date,
                                "lte": to_date
                            }
                        }
                    })
                except ValueError:
                    pass

        if m_entity:
            must_clauses.append({
                "bool": {
                    "should": [
                        {"exists": {"field": entity}} for entity in m_entity
                    ],
                    "minimum_should_match": 1
                }
            })

        if m_content_type and m_content_type.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_mitre_ttp_type": m_content_type.lower()}})

        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        if m_safe_search == "True":
            must_not_clause.append({"term": {"m_content_type": "adult"}})

        if m_search_type != "all":
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})

        url_priority_query = {
            "bool": {
                "should": [
                    {"term": {"m_url.keyword": {"value": m_url_query, "boost": 100, "case_insensitive": True}}},
                    {"wildcard": {"m_url.keyword": {"value": "*" + m_url_query + "*", "boost": 80}}},
                    {"wildcard": {"m_url.keyword": {"value": domain + "/*" + path, "boost": 70}}},
                    {"wildcard": {"m_url.keyword": {"value": "*" + path, "boost": 60}}},
                    {"match": {"m_url": {"query": raw_query, "boost": 40}}}
                ],
                "minimum_should_match": 1,
                "boost": 10
            }
        }

        base_url_query = {
            "bool": {
                "should": [
                    {"term": {
                        "m_base_url.keyword": {"value": "https://" + domain, "boost": 50, "case_insensitive": True}}},
                    {"term": {
                        "m_base_url.keyword": {"value": "http://" + domain, "boost": 50, "case_insensitive": True}}},
                    {"wildcard": {"m_base_url.keyword": {"value": "*" + domain + "*", "boost": 30}}}
                ],
                "minimum_should_match": 1,
                "boost": 5
            }
        }

        content_query = {
            "query_string": {
                "query": m_user_query,
                "fields": [
                    "m_title^6",
                    "m_meta_description^2",
                    "m_content^1.5",
                    "m_important_content^1.5",
                    "m_meta_keywords^1.8"
                ],
                "default_operator": "OR",
                "lenient": True,
                "analyze_wildcard": True,
                "boost": 2
            }
        }

        query_statement = {
            "min_score": 0,
            "query": {
                "function_score": {
                    "query": {
                        "bool": {
                            "filter": must_clauses,
                            "should": [
                                url_priority_query,
                                base_url_query,
                                content_query
                            ],
                            "minimum_should_match": 1,
                            "must_not": must_not_clause,
                        }
                    },
                    "functions": [
                        {
                            "gauss": {
                                "m_update_date": {
                                    "origin": "now",
                                    "scale": "30d",
                                    "offset": "10d",
                                    "decay": 0.5,
                                }
                            },
                            "weight": 2,
                        }
                    ],
                    "boost_mode": "sum",
                }
            },
            "highlight": {} if raw_query == "*" else {
                "fields": {
                    "m_content": {
                        "fragment_size": 200,
                        "number_of_fragments": 3,
                        "pre_tags": ["<em>"],
                        "post_tags": ["</em>"]
                    }
                }
            },
            "suggest": {
                "important_content_suggestion": {
                    "text": raw_query,
                    "term": {
                        "field": "m_important_content",
                        "min_word_length": 4,
                        "max_term_freq": 0.01,
                        "sort": "score",
                        "string_distance": "internal",
                    }
                },
                "content_suggestion": {
                    "text": raw_query,
                    "term": {
                        "field": "m_content",
                        "min_word_length": 4,
                        "max_term_freq": 0.01,
                        "sort": "score",
                        "string_distance": "internal",
                    }
                }
            },
            "from": max(0, (m_page_number - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC),
            "size": 50 if raw_query == "*" else CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE,
            "track_total_hits": True,
            "explain": True
        }
        return ELASTIC_INDEX.S_GENERIC_INDEX, query_statement

    @staticmethod
    def clear_expire_index():
        utc_now = datetime.now(timezone.utc)
        threshold_time = utc_now - timedelta(seconds=CONSTANTS.S_SETTINGS_INDEX_EXPIRY)
        return {
            "query": {"range": {"m_update_date": {"lt": threshold_time.isoformat()}}}
        }

    @staticmethod
    def index_query_general(p_index_data):
        index_entries = []
        utc_now = datetime.now(timezone.utc)
        current_timestamp = utc_now.isoformat()

        if isinstance(p_index_data, list):
            pass
        else:
            p_index_data["m_update_date"] = current_timestamp
            p_index_data["m_hash_content"] = hashlib.sha256(
                (p_index_data["m_important_content"] + p_index_data["m_title"]).encode()
            ).hexdigest()
            p_index_data["m_hash_url"] = hashlib.sha256(
                (p_index_data["m_url"] + p_index_data["m_title"]).encode()
            ).hexdigest()
            data_hash = helper_controller.generate_data_hash(p_index_data["m_url"])
            p_index_data["m_hash"] = data_hash

            index_entries.append(
                {
                    ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                    ELASTIC_KEYS.S_VALUE: p_index_data,
                }
            )

        return index_entries

    @staticmethod
    def index_query_chat(p_index_data):
        index_entries = []
        for chat in p_index_data.get("m_chat_data", []):
            chat["m_hash"] = helper_controller.generate_data_hash(chat.get("m_message_id"))
            index_entries.append({
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_CHATS_INDEX,
                ELASTIC_KEYS.S_VALUE: chat
            })

        return index_entries

    @staticmethod
    def index_query_defacement(p_index_data):
        index_entries = []
        utc_now = datetime.now(timezone.utc)
        current_timestamp = utc_now.isoformat()

        for record in p_index_data.get("cards_data", []):
            data_hash = helper_controller.generate_data_hash(record["m_url"])
            record["m_hash"] = data_hash
            record["m_update_date"] = current_timestamp
            index_entries.append(
                {
                    ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX,
                    ELASTIC_KEYS.S_VALUE: record,
                }
            )
        return index_entries

    @staticmethod
    def index_query_leak(p_index_data):
        contact_link = p_index_data.get("contact_link", "")
        index_entries = []
        current_timestamp = datetime.now(timezone.utc).isoformat()

        for card in p_index_data.get("cards_data", []):
            card["m_hash"] = helper_controller.generate_data_hash(card["m_url"] + "_" + card["m_important_content"])
            card["m_update_date"] = current_timestamp
            card["m_contact_link"] = contact_link

            cleaned_card = {k: v for k, v in card.items() if v is not None}

            index_entries.append({
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_VALUE: cleaned_card,
            })

        return index_entries

    @staticmethod
    def generate_insight_queries():
        queries = [
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Document Count": {
                            "value_count": {
                                "field": "_id"
                            }
                        }
                    }
                }
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {"Most Recent": {"max": {"field": "m_update_date"}}},
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {"Oldest Update": {"min": {"field": "m_update_date"}}},
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "query": {"range": {"m_update_date": {"gte": "now-5d/d"}}},
                    "aggs": {
                        "Updated 5 Days ago": {"value_count": {"field": "_id"}}
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "query": {"range": {"m_update_date": {"gte": "now-10d/d"}}},
                    "aggs": {
                        "Updated 9 Days ago": {"value_count": {"field": "_id"}}
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {"Average Score": {"avg": {"field": "m_validity_score"}}},
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {"URL/Document": {"value_count": {"field": "m_sub_url"}}},
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Archive/Document": {"value_count": {"field": "m_archive_url"}}
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {"Email/Document": {"value_count": {"field": "m_emails"}}},
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Phone/Document": {"value_count": {"field": "m_phone_numbers"}}
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Clearnet/Document": {
                            "value_count": {"field": "m_clearnet_links"}
                        }
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Common Type": {
                            "terms": {"field": "m_content_type", "size": 1}
                        }
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Document Count": {
                            "value_count": {
                                "field": "_id"
                            }
                        }
                    }
                }
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Unique Base URLs": {"value_count": {"field": "m_base_url"}}
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {"URL/Documents": {"value_count": {"field": "m_weblink"}}},
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Dumps/Document": {"value_count": {"field": "m_dumplink"}}
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "query": {"range": {"m_update_date": {"gte": "now-5d/d"}}},
                    "aggs": {
                        "Updated 5 Days ago": {"value_count": {"field": "_id"}}
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "query": {"range": {"m_update_date": {"gte": "now-10d/d"}}},
                    "aggs": {
                        "Updated 9 Days ago": {"value_count": {"field": "_id"}}
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {"Most Recent": {"max": {"field": "m_update_date"}}},
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {"Oldest Update": {"min": {"field": "m_update_date"}}},
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Document Count": {"value_count": {"field": "_id"}}
                    }
                }
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "query": {"range": {"m_date_of_leak": {"gte": "now-5d/d"}}},
                    "aggs": {
                        "Updated 5 Days ago": {"value_count": {"field": "_id"}}
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Top Team": {"terms": {"field": "m_team", "size": 1}}
                    }
                }
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Common Server": {"terms": {"field": "m_web_server", "size": 1}}
                    }
                }
            }
        ]

        return queries
