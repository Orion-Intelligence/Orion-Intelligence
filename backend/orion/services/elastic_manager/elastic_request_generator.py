import hashlib
import re
from datetime import timedelta, timezone
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import search_credential_param_model
from orion.constants.constant import CONSTANTS, allowed_keys
from orion.constants.enum import ChannelTypeEnum
from orion.helper_manager.env_handler import env_handler
from orion.helper_manager.helper_controller import helper_controller
from orion.services.bloom_manager.bloom_controller import bloom_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS, ELASTIC_INDEX, ELASTIC_SEMANTIC
from datetime import datetime
from orion.services.elastic_manager.elastic_semantic_controller import elastic_semantic_controller

class elastic_request_generator:

    @staticmethod
    def _build_query_block(
            p_query_model,
            pfilter,
            raw_query,
            quoted_value,
            exact_phrases,
            loose_terms,
            phrase_fields,
            must_clauses,
            must_not_clause,
            m_page_number,
            date_field
    ):
        content_query = {"bool": {"should": [], "minimum_should_match": 1}}

        if exact_phrases:
            fields = [f"{field}^{boost}" for field, boost in phrase_fields]
            for phrase in exact_phrases:
                must_clauses.append({
                    "multi_match": {
                        "query": phrase,
                        "type": "phrase",
                        "fields": fields
                    }
                })

        base_bool_query = {
            "must": [content_query] if isinstance(content_query, dict) else [],
            "filter": must_clauses,
            "must_not": must_not_clause,
        }

        query_statement = {
            "query": {"bool": base_bool_query},
            "from": max(0, (m_page_number - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC),
            "size": CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE,
            "_source": {
                "includes": ["m_title", "m_url", "m_update_date", "m_content_type", "m_network"]
            },
        }

        return query_statement

    @staticmethod
    def on_bulk_domain_lookup(p_query_model, pFilter=None):

        domain_aggs = {}
        must_clauses = []
        domains = helper_controller.extract_domains_from_text(p_query_model.q)

        if pFilter:
            if "m_url" in pFilter:
                domains.extend(pFilter["m_url"])
            if "m_domain" in pFilter:
                domains.extend(pFilter["m_domain"])
            if "m_ip" in pFilter:
                domains.extend(pFilter["m_ip"])
            if "m_search_all" in pFilter:
                domains.extend([v for v in pFilter["m_search_all"] if re.search(r'(https?://|[a-z0-9.-]+\.[a-z]{2,})', str(v), re.I)])

        for idx, domain in enumerate(domains):
            domain = domain.lower()
            parts = domain.split('/')
            valid_parts = [p for p in parts if '.' in p]

            if not valid_parts:
                continue
            domain_part = valid_parts[-1]
            agg_name = f"domain_{idx}"

            domain_aggs[agg_name] = {
                "filter": {
                    "bool": {
                        "should": [
                            {
                                "wildcard": {
                                    "m_url.raw": {
                                        "value": f"*{domain_part}*",
                                        "case_insensitive": True
                                    }
                                }
                            },
                            {
                                "wildcard": {
                                    "m_domain.raw": {
                                        "value": f"*{domain_part}*",
                                        "case_insensitive": True
                                    }
                                }
                            },
                            {
                                "wildcard": {
                                    "m_ip.raw": {
                                        "value": f"*{domain_part}*",
                                        "case_insensitive": True
                                    }
                                }
                            }
                        ]
                    }
                },
                "aggs": {
                    "by_ioc_type": {
                        "terms": {
                            "field": "m_ioc_type",
                            "size": 10
                        },
                        "aggs": {
                            "top_hits_per_type": {
                                "top_hits": {
                                    "size": 4,
                                    "sort": [
                                        {"m_leak_date": {"order": "desc"}}
                                    ]
                                }
                            }
                        }
                    }
                }
            }

        if p_query_model.daterange:
            parts = p_query_model.daterange.split(',')
            if len(parts) == 2:
                try:
                    from_date_obj = datetime.strptime(parts[0].strip(), "%Y-%m-%d")
                    to_date_obj = datetime.strptime(parts[1].strip(), "%Y-%m-%d")

                    must_clauses.append({
                        "range": {
                            "m_leak_date": {
                                "gte": from_date_obj.strftime("%Y-%m-%d"),
                                "lte": to_date_obj.strftime("%Y-%m-%d")
                            }
                        }
                    })
                except ValueError:
                    pass

        query_statement = {
            "size": 0,
            "query": {
                "bool": {
                    "must": must_clauses if must_clauses else [{"match_all": {}}]
                }
            },
            "aggs": domain_aggs,
            "track_total_hits": False
        }

        return ELASTIC_INDEX.S_DEFACEMENT_INDEX, query_statement

    def on_search_defacement_data(self, p_query_model: search_defacement_param_model, pfilter=None):
        raw_query = p_query_model.q.lower()
        if not raw_query or raw_query == "":
            raw_query = "*"

        must_clauses = []
        must_not_clause = []

        m_network = p_query_model.network
        m_date_range = p_query_model.daterange

        if m_date_range:
            parts = m_date_range.split(',')
            if len(parts) == 2:
                try:
                    from_date_obj = datetime.strptime(parts[0].strip(), "%Y-%m-%d")
                    from_date = from_date_obj.strftime("%Y-%m-%d")
                    to_date_obj = datetime.strptime(parts[1].strip(), "%Y-%m-%d")
                    to_date = to_date_obj.strftime("%Y-%m-%d")
                    must_clauses.append({
                        "range": {"m_leak_date": {"gte": from_date, "lte": to_date}}
                    })
                except ValueError:
                    pass

        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        m_content_type = p_query_model.content
        if p_query_model.attacker:
            must_clauses.append({"terms": {"m_attacker": [p_query_model.attacker]}})
        if p_query_model.team:
            must_clauses.append({"terms": {"m_team": [p_query_model.team]}})

        if m_content_type == "phishing":
            must_clauses.append({"terms": {"m_ioc_type": ["phishing"]}})
        elif m_content_type == "hacked":
            must_clauses.append({"terms": {"m_ioc_type": ["hacked"]}})
        elif m_content_type == "databases":
            must_not_clause.append({"terms": {"m_ioc_type": ["phishing", "hacked"]}})
        elif m_content_type != "":
            must_clauses.append({"terms": {"m_ioc_type": ['none']}})

        quoted_value_match = re.fullmatch(r'"([^"]+)"', raw_query.strip())
        quoted_value = quoted_value_match.group(1) if quoted_value_match else None
        m_page_number = getattr(p_query_model, "page", 1)

        exact_phrases = re.findall(r'"([^"]+)"', raw_query)
        loose_terms = re.sub(r'"[^"]+"', '', raw_query).strip().split()

        phrase_fields = [
            ("m_location", 3),
            ("m_content", 5),
            ("m_web_url", 3),
            ("m_base_url", 3),
            ("m_url", 3),
            ("m_ip", 5),
            ("m_web_server", 3),
            ("m_attacker", 5),
            ("m_team", 5),
            ("m_network", 3),
            ("m_mirror_links", 3),
        ]

        query_statement = self._build_query_block(
            p_query_model=p_query_model,
            pfilter=pfilter,
            raw_query=raw_query,
            quoted_value=quoted_value,
            exact_phrases=exact_phrases,
            loose_terms=loose_terms,
            phrase_fields=phrase_fields,
            must_clauses=must_clauses,
            must_not_clause=must_not_clause,
            m_page_number=1,
            date_field="m_leak_date"
        )

        return ELASTIC_INDEX.S_DEFACEMENT_INDEX, query_statement

    def on_search_consolidated_ranked_data(self, p_query_model: search_consolidated_param_model, pfilter, base_index, blocked_categories, allowed_categories):
        if p_query_model.matchtype:
            p_query_model.q = helper_controller.transform_query_match(p_query_model.q, p_query_model.matchtype)

        channel_q = p_query_model.q if p_query_model.q and p_query_model.q != "*" else None
        raw_query = p_query_model.q if p_query_model.q and p_query_model.q != "*" else "*"
        raw_query = helper_controller.remove_stopwords_from_string(raw_query) if raw_query != "*" else "*"
        if raw_query == "":
            raw_query = "*"

        m_date_range = p_query_model.daterange
        m_network = p_query_model.network
        m_page_number = getattr(p_query_model, "page", 1)
        m_content_type = p_query_model.content
        m_safe_search = p_query_model.safe
        must_clauses = []
        must_not_clause = []

        if m_date_range:
            try:
                parts = m_date_range.split(",")
                if len(parts) == 2:
                    from_date = datetime.strptime(parts[0].strip(), "%Y-%m-%d").strftime("%Y-%m-%dT00:00:00+00:00")
                    to_date = datetime.strptime(parts[1].strip(), "%Y-%m-%d").strftime("%Y-%m-%dT23:59:59+00:00")
                    must_clauses.append({
                        "bool": {
                            "should": [
                                {"bool": {"filter": [
                                    {"exists": {"field": "m_message_date"}},
                                    {"range": {"m_message_date": {"gte": from_date, "lte": to_date}}}
                                ]}},
                                {"bool": {"filter": [
                                    {"exists": {"field": "m_leak_date"}},
                                    {"range": {"m_leak_date": {"gte": from_date, "lte": to_date}}}
                                ]}},
                                {"bool": {"filter": [
                                    {"exists": {"field": "m_creation_date"}},
                                    {"range": {"m_creation_date": {"gte": from_date, "lte": to_date}}}
                                ]}}
                            ],
                            "minimum_should_match": 1
                        }
                    })
            except ValueError:
                pass
        elif m_date_range!="":
            to_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT23:59:59+00:00")
            from_date = (datetime.now(timezone.utc) - timedelta(days=150)).strftime("%Y-%m-%dT00:00:00+00:00")
            must_clauses.append({
                "bool": {
                    "should": [
                        {"bool": {"filter": [
                            {"exists": {"field": "m_message_date"}},
                            {"range": {"m_message_date": {"gte": from_date, "lte": to_date}}}
                        ]}},
                        {"bool": {"filter": [
                            {"exists": {"field": "m_leak_date"}},
                            {"range": {"m_leak_date": {"gte": from_date, "lte": to_date}}}
                        ]}},
                        {"bool": {"filter": [
                            {"exists": {"field": "m_creation_date"}},
                            {"range": {"m_creation_date": {"gte": from_date, "lte": to_date}}}
                        ]}}
                    ],
                    "minimum_should_match": 1
                }
            })

        if p_query_model.category:
            m_ctype = p_query_model.category
        else:
            m_ctype = "all"

        if allowed_categories:
            if p_query_model.category not in allowed_categories:
                allowed_categories.append(p_query_model.category)

        if m_ctype != "all":
            allowed_categories = [m_ctype]
            must_clauses.append({
                "bool": {
                    "should": [
                        {"bool": {"must_not": {"exists": {"field": "m_content_type"}}}},
                        {"bool": {"filter": [
                            {"exists": {"field": "m_content_type"}},
                            {"terms": {"m_content_type": allowed_categories}}
                        ]}}
                    ],
                    "minimum_should_match": 1
                }
            })

        if blocked_categories:
            if allowed_categories:
                must_clauses.append({
                    "bool": {
                        "should": [
                            {"terms": {"m_content_type": allowed_categories}},
                            {"bool": {"must_not": {"terms": {"m_content_type": blocked_categories}}}}
                        ],
                        "minimum_should_match": 1
                    }
                })
            else:
                must_not_clause.append({"terms": {"m_content_type": blocked_categories}})

        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        if m_safe_search and m_safe_search == True:
            must_not_clause.append({"term": {"m_content_type": "adult"}})

        if hasattr(p_query_model, "platform") and p_query_model.platform:
            must_clauses.append({"term": {"m_platform": p_query_model.platform}})
        if hasattr(p_query_model, "attacker") and p_query_model.attacker:
            must_clauses.append({"terms": {"m_attacker": [p_query_model.attacker]}})
        if hasattr(p_query_model, "team") and p_query_model.team:
            must_clauses.append({"terms": {"m_team": [p_query_model.team]}})

        if m_content_type and m_content_type.lower() not in ("", "all"):
            must_clauses.append({
                "bool": {
                    "filter": [
                        {"exists": {"field": "content_type"}},
                        {"term": {"content_type": m_content_type.lower()}}
                    ]
                }
            })

        phrases = re.findall(r'"([^"]+)"', p_query_model.q or "")
        quoted_value = bool(phrases) and (p_query_model.q or "").strip().startswith('"') and (p_query_model.q or "").strip().endswith('"')
        exact_phrases = phrases
        loose_terms = [] if raw_query in ("*", "") else [t for t in re.findall(r'\w+', raw_query) if t and t.strip('"')]
        phrase_fields = [
            ("m_title", 5),
            ("m_content", 3),
            ("m_url", 2),
            ("m_sender_name", 2),
            ("m_base_url", 1),
            ("m_team", 1),
            ("m_attacker", 1),
            ("m_users", 1),
            ("m_network", 1),
            ("m_channel_name", 4)
        ]
        date_field = "m_creation_date"

        unified_query = self._build_query_block(
            p_query_model=p_query_model,
            pfilter=pfilter,
            raw_query=raw_query,
            quoted_value=quoted_value,
            exact_phrases=exact_phrases,
            loose_terms=loose_terms,
            phrase_fields=phrase_fields,
            must_clauses=must_clauses,
            must_not_clause=must_not_clause,
            m_page_number=m_page_number,
            date_field=date_field
        )

        unified_query["size"] = 15
        unified_query["from"] = max(0, (m_page_number - 1) * 15)

        if channel_q:
            qb = unified_query["query"]["function_score"]["query"]["bool"]
            qb.setdefault("should", []).extend([
                {"term": {"m_channel_name.keyword": {"value": channel_q, "boost": 7.0}}},
                {"match_phrase": {"m_channel_name": {"query": channel_q, "slop": 1, "boost": 7.0}}}
            ])

        query = base_index, unified_query, [b for b in [
            {ELASTIC_INDEX.S_LEAK_INDEX: 2},
            {ELASTIC_INDEX.S_GENERIC_INDEX: 0.5},
            {ELASTIC_INDEX.S_EXPLOIT_INDEX: 1.4},
            {ELASTIC_INDEX.S_CHATS_INDEX: 1.4},
            {ELASTIC_INDEX.S_SOCIAL_INDEX: 1.4},
            {ELASTIC_INDEX.S_DEFACEMENT_INDEX: 1.4}
        ] if next(iter(b)) in base_index]

        return query

    def on_search_consolidated_data(self, p_query_model, pFilter=None):
        queries = []
        indices = []
        labels = []

        m1 = helper_controller.clone_model(p_query_model)
        m1.category='databases'
        i1, q1 = self.on_search_leakdata(m1, pFilter)
        queries.append(helper_controller.strip_query(q1))
        indices.append(i1)
        labels.append("leak_model")

        m2 = helper_controller.clone_model(p_query_model)
        i2, q2 = self.on_search_general_data(m2, pFilter)
        queries.append(helper_controller.strip_query(q2))
        indices.append(i2)
        labels.append("generic_model")

        m3 = helper_controller.clone_model(p_query_model)
        i3, q3 = self.on_search_exploitdata(m3, pFilter)
        queries.append(helper_controller.strip_query(q3))
        indices.append(i3)
        labels.append("exploit_model")

        m4 = helper_controller.clone_model(p_query_model)
        i4, q4 = self.on_search_telegram_data(m4, pFilter)
        queries.append(helper_controller.strip_query(q4))
        indices.append(i4)
        labels.append("chat_model")

        m6 = helper_controller.clone_model(p_query_model)
        i6, q6 = self.on_search_social_data(m6, pFilter, ELASTIC_INDEX.S_SOCIAL_INDEX)
        queries.append(helper_controller.strip_query(q6))
        indices.append(i6)
        labels.append("social_model")

        domain_query_index, domain_query = self.on_bulk_domain_lookup(p_query_model, pFilter)
        queries.append(domain_query)
        indices.append(domain_query_index)
        labels.append("defacement_model")

        m1.category='tracking'
        i9, q9 = self.on_search_leakdata(m1, pFilter)
        queries.append(helper_controller.strip_query(q9))
        indices.append(i9)
        labels.append("tracking_model")

        m1.category='news'
        i10, q10 = self.on_search_leakdata(m1, pFilter)
        queries.append(helper_controller.strip_query(q10))
        indices.append(i10)
        labels.append("news_model")

        return indices, queries, labels

    def on_search_leakdata(self, p_query_model, pfilter=None):
        if p_query_model.matchtype:
            p_query_model.q = helper_controller.transform_query_match(p_query_model.q, p_query_model.matchtype)

        if p_query_model.q != "*":
            raw_query = p_query_model.q
            raw_query = helper_controller.remove_stopwords_from_string(raw_query)
        else:
            raw_query = "*"
        if raw_query == "":
            raw_query = "*"

        if not raw_query:
            return ELASTIC_INDEX.S_LEAK_INDEX, {"query": {"match_none": {}}, "size": 0}

        exact_phrases = re.findall(r'"([^"]+)"', raw_query)
        loose_terms = re.sub(r'"[^"]+"', '', raw_query).strip().split()
        quoted_value_match = re.fullmatch(r'"([^"]+)"', raw_query.strip())
        quoted_value = quoted_value_match.group(1) if quoted_value_match else None

        m_safe_search = p_query_model.safe
        m_page_number = p_query_model.page
        m_network = p_query_model.network
        m_search_type = p_query_model.category
        m_date_range = p_query_model.daterange
        m_content_type = p_query_model.content

        must_clauses = []
        must_not_clause = []

        if m_search_type == "all":
            pass
        elif m_search_type == "databases":
            must_clauses.append({"term": {"m_content_type": "leaks"}})
        else:
            must_clauses.append({"term": {"m_content_type": m_search_type}})

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

        if m_content_type and m_content_type.lower() not in ("", "all"):
            must_clauses.append({"term": {"content_type": m_content_type.lower()}})

        if m_search_type == "databases":
            m_search_type = "leaks"
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})
        if m_search_type and m_search_type != "all":
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})
        if m_safe_search == "True":
            must_not_clause.append({"term": {"m_content_type": "adult"}})
        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        phrase_fields = [
            ("m_title", 5),
            ("m_content", 3),
            ("m_important_content", 4),
            ("m_ref_html", 2),
        ]

        query_statement = self._build_query_block(
            p_query_model=p_query_model,
            pfilter=pfilter,
            raw_query=raw_query,
            quoted_value=quoted_value,
            exact_phrases=exact_phrases,
            loose_terms=loose_terms,
            phrase_fields=phrase_fields,
            must_clauses=must_clauses,
            must_not_clause=must_not_clause,
            m_page_number=m_page_number,
            date_field="m_leak_date"
        )

        return ELASTIC_INDEX.S_LEAK_INDEX, query_statement

    def on_search_exploitdata(self, p_query_model, pfilter=None):
        if p_query_model.matchtype:
            p_query_model.q = helper_controller.transform_query_match(p_query_model.q, p_query_model.matchtype)

        if p_query_model.q != "*":
            raw_query = helper_controller.remove_stopwords_from_string(p_query_model.q)
        else:
            raw_query = "*"
        if raw_query == "":
            raw_query = "*"

        if not raw_query:
            return ELASTIC_INDEX.S_EXPLOIT_INDEX, {"query": {"match_none": {}}, "size": 0}

        category = p_query_model.category

        m_page_number = p_query_model.page
        m_network = p_query_model.network
        m_search_type = p_query_model.content
        m_date_range = p_query_model.daterange
        m_content_type = p_query_model.content

        exact_phrases = re.findall(r'"([^"]+)"', raw_query)
        loose_terms = re.sub(r'"[^"]+"', '', raw_query).strip().split()
        quoted_value_match = re.fullmatch(r'"([^"]+)"', raw_query.strip())
        quoted_value = quoted_value_match.group(1) if quoted_value_match else None

        must_clauses = []
        must_not_clause = []

        if category and category != "all":
            category_list = category if isinstance(category, list) else [category]
            must_clauses.append({
                "terms": {
                    "m_content_type": category_list
                }
            })

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

        if m_content_type and m_content_type.lower() not in ("", "all"):
            must_clauses.append({"term": {"content_type": m_content_type.lower()}})

        if m_search_type == "databases":
            m_search_type = "leaks"
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})
        if m_search_type and m_search_type != "all":
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})
        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        phrase_fields = [
            ("m_title", 3),
            ("m_content", 5),
            ("m_important_content", 3),
            ("m_ref_html", 3),
        ]

        query_statement = self._build_query_block(
            p_query_model=p_query_model,
            pfilter=pfilter,
            raw_query=raw_query,
            quoted_value=quoted_value,
            exact_phrases=exact_phrases,
            loose_terms=loose_terms,
            phrase_fields=phrase_fields,
            must_clauses=must_clauses,
            must_not_clause=must_not_clause,
            m_page_number=m_page_number,
            date_field="m_leak_date"
        )

        return ELASTIC_INDEX.S_EXPLOIT_INDEX, query_statement

    def on_search_social_data(self, p_query_model, pfilter=None, p_index=None, must_clauses=None, must_not_clause=None):
        pmust = must_clauses or []
        pmustnot = must_not_clause or []

        if p_query_model.matchtype == "semantic" and p_query_model.platform == "pastebin":
            p_query_model.matchtype = "or"

        if p_query_model.matchtype:
            p_query_model.q = helper_controller.transform_query_match(p_query_model.q, p_query_model.matchtype)

        if p_query_model.q != "*":
            raw_query = p_query_model.q
            raw_query = helper_controller.remove_stopwords_from_string(raw_query)
        else:
            raw_query = "*"
        if raw_query == "":
            raw_query = "*"

        if p_query_model.q and p_query_model.q != "*" and (not raw_query or raw_query == "*"):
            return ELASTIC_INDEX.S_SOCIAL_INDEX, {"query": {"match_none": {}}, "size": 0}

        if not raw_query:
            return ELASTIC_INDEX.S_SOCIAL_INDEX, {"query": {"match_none": {}}, "size": 0}

        exact_phrases = re.findall(r'"([^"]+)"', raw_query)
        loose_terms = re.sub(r'"[^"]+"', '', raw_query).strip().split()

        quoted_value_match = re.findall(r'"([^"]+)"', raw_query.strip())
        quoted_value = quoted_value_match if quoted_value_match else None

        m_page_number = getattr(p_query_model, "page", 1)
        m_network = p_query_model.network
        m_platform = p_query_model.platform
        m_date_range = p_query_model.daterange

        must_clauses = []
        must_not_clause = []

        must_clauses.extend(pmust)
        must_not_clause.extend(pmustnot)

        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        if m_platform:
            must_clauses.append({"term": {"m_platform": m_platform}})

        m_content_type = p_query_model.content
        if m_content_type and m_content_type.lower() not in ("", "all"):
            must_clauses.append({"term": {"content_type": m_content_type.lower()}})

        if m_date_range:
            parts = m_date_range.split(",")
            if len(parts) == 2:
                try:
                    from_date_obj = datetime.strptime(parts[0].strip(), "%Y-%m-%d").replace(tzinfo=timezone.utc)
                    from_date = from_date_obj.strftime("%Y-%m-%dT00:00:00.000000+00:00")
                    to_date_obj = datetime.strptime(parts[1].strip(), "%Y-%m-%d").replace(tzinfo=timezone.utc)
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

        phrase_fields = [
            ("m_title", 8),
            ("m_content", 4),
            ("m_sender_name", 3)
        ]

        query_statement = self._build_query_block(
            p_query_model=p_query_model,
            pfilter=pfilter,
            raw_query=raw_query,
            quoted_value=quoted_value,
            exact_phrases=exact_phrases,
            loose_terms=loose_terms,
            phrase_fields=phrase_fields,
            must_clauses=must_clauses,
            must_not_clause=must_not_clause,
            m_page_number=m_page_number,
            date_field="m_creation_date"
        )

        return p_index, query_statement


    @staticmethod
    def on_search_telegram_data(p_query_model, pfilter=None):
        if p_query_model.matchtype:
            p_query_model.q = helper_controller.transform_query_match(p_query_model.q, p_query_model.matchtype)

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
            must_clauses.append({
                "terms": {
                    "m_channel_id": channel_ids
                }
            })

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
            "m_ref_html^0.8"
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
                    "lenient": True
                }
            }
        else:
            query_string_query = {
                "multi_match": {
                    "query": raw_query,
                    "fields": search_fields,
                    "type": "best_fields",
                    "operator": "OR"
                }
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
                                    must_clauses +
                                    must_filter_clauses +
                                    (
                                        [{
                                            "bool": {
                                                "should": should_filter_clauses.get("bool", {}).get("should", []),
                                                "minimum_should_match": 1
                                            }
                                        }] if not getattr(p_query_model, "must", False) and should_filter_clauses else []
                                    )
                            ),
                            "must_not": must_not_clause,
                            "should": [
                                query_string_query,
                                {
                                    "wildcard": {
                                        "m_content.keyword": {
                                            "value": f"*{raw_query}*",
                                            "boost": 1.5,
                                            "case_insensitive": True
                                        }
                                    }
                                },
                                {
                                    "wildcard": {
                                        "m_channel_name": {
                                            "value": f"*{raw_query}*",
                                            "boost": 2.0,
                                            "case_insensitive": True
                                        }
                                    }
                                },
                                {
                                    "term": {
                                        "m_channel_name": {
                                            "value": raw_query,
                                            "boost": 5.0
                                        }
                                    }
                                }
                            ],
                            "minimum_should_match": 0
                        }
                    },
                    "functions": [
                        {
                            "gauss": {
                                "m_message_date": {
                                    "origin": "now",
                                    "scale": "90d",
                                    "offset": "10d",
                                    "decay": 0.5
                                }
                            },
                            "weight": 1
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
            "track_total_hits": False,
        }

        if raw_query!="" and raw_query != "*" and p_query_model.matchtype == "semantic" and env_handler.get_instance().env("SEMANTIC_ENABLED") == "1":
            try:
                qvec = elastic_semantic_controller.get_instance().embed_query_sync(p_query_model.q)
                if qvec:
                    knn_clause = {
                        "knn": {
                            "field": ELASTIC_SEMANTIC.S_EMBED_FIELD,
                            "k": CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE,
                            "num_candidates": 1000,
                            "query_vector": qvec
                        }
                    }
                    query["query"]["function_score"]["query"]["bool"]["must"].append(knn_clause)
            except Exception as _:
                pass

        return ELASTIC_INDEX.S_CHATS_INDEX, query

    @staticmethod
    def on_search_credentials_data(p_query_model):
        raw_query = p_query_model.q if p_query_model.q and p_query_model.q != "*" else ""
        if raw_query:
            raw_query = helper_controller.remove_stopwords_from_string(raw_query)

        query = {
            "query": {
                "bool": {
                    "should": [
                        {
                            "match": {
                                "u": {
                                    "query": raw_query,
                                    "boost": 2.0
                                }
                            }
                        }
                    ],
                    "minimum_should_match": 1
                }
            },
            "from": max(
                0,
                (getattr(p_query_model, 'page', 1) - 1)
                * 1
            ),
            "size": 1,
            "track_total_hits": False
        }

        return ELASTIC_INDEX.S_CREDENTIAL_INDEX, query

    @staticmethod
    def on_search_stealerlogs_data(p_query_model: search_credential_param_model, pFilter, consolidated=False):
        url = helper_controller.extract_domains_from_text(p_query_model.q)
        if len(url) > 0:
            p_query_model.url = url[0]

        user = helper_controller.extract_first_email(p_query_model.q)

        if not p_query_model.user and user:
            p_query_model.user = user

        if not p_query_model.url and not p_query_model.user and consolidated:
            return None, None

        user_query = p_query_model.user.strip() if p_query_model.user and p_query_model.user != "*" else ""

        raw_url = p_query_model.url.strip() if p_query_model.url else ""
        url_query = ""
        if raw_url:
            u = re.sub(r'^(?:[a-zA-Z0-9+.-]+://)?(?:www\.)?', '', raw_url)
            url_query = re.split(r'[/:?#]', u)[0].lower()

        extra_user_terms = []
        extra_domains = []

        if pFilter:
            if pFilter.get('m_username'):
                extra_user_terms.extend([str(v).strip().lower() for v in pFilter['m_username'] if v and str(v).strip()])
            for key in ('m_url', 'm_domain', 'm_search_all'):
                vals = pFilter.get(key)
                if vals:
                    for v in vals:
                        s = str(v).strip()
                        if not s:
                            continue
                        u2 = re.sub(r'^(?:[a-zA-Z0-9+.-]+://)?(?:www\.)?', '', s)
                        d2 = re.split(r'[/:?#]', u2)[0].lower()
                        if re.match(r'^[a-z0-9.-]+\.[a-z]{2,}$', d2):
                            extra_domains.append(d2)

        category = (p_query_model.category or "").strip()
        if category and category.lower() in ("log", "logs"):
            must_should = [{"term": {"type.keyword": "logs"}}]
        else:
            must_should = [{"terms": {"type.keyword": ["c", "credential"]}}]

        date_range_filter = {}

        should_clauses = []

        if p_query_model.fullsearch:
            if user_query:
                user_query = re.sub(r'(\S+@\S+)', lambda m: m.group(1).replace('@', ' '), user_query).lower()
                terms = re.findall(r'"([^"]+)"|(\S+)', user_query)
                for quoted, unquoted in terms:
                    term = (quoted or unquoted).lower()
                    clause = {
                        "bool": {
                            "should": [
                                {"wildcard": {"raw.keyword": {"value": f"*{term}*", "case_insensitive": True}}}
                            ],
                            "minimum_should_match": 1
                        }
                    }
                    must_should.append(clause)
            for t in extra_user_terms:
                t = t.lower()
                clause = {
                    "bool": {
                        "should": [
                            {"wildcard": {"raw.keyword": {"value": f"*{t}*", "case_insensitive": True}}}
                        ],
                        "minimum_should_match": 1
                    }
                }
                must_should.append(clause)
            if url_query:
                should_clauses.append({"term": {"domain": url_query}})
            for d in extra_domains:
                should_clauses.append({"term": {"domain": d}})
        else:
            if user_query:
                terms = re.findall(r'"([^"]+)"|(\S+)', user_query.lower())
                for quoted, unquoted in terms:
                    term = (quoted or unquoted).lower()
                    if '@' in term:
                        clause = {"bool": {"should": [{"term": {"email.keyword": term}}], "minimum_should_match": 1}}
                    else:
                        clause = {"bool": {"should": [{"term": {"username.keyword": term}}], "minimum_should_match": 1}}
                    must_should.append(clause)

            for t in extra_user_terms:
                t = t.lower()
                clause = {
                    "bool": {
                        "should": [
                            {"term": {"email": t}},
                            {"term": {"username": t}},
                            {"term": {"domain": t}}
                        ],
                        "minimum_should_match": 1
                    }
                }
                must_should.append(clause)
            if url_query:
                should_clauses.append({"term": {"domain": url_query}})
            for d in extra_domains:
                should_clauses.append({"term": {"domain": d}})

        bool_query = {}
        if must_should:
            bool_query["must"] = must_should
        if should_clauses:
            bool_query["should"] = should_clauses
            bool_query["minimum_should_match"] = 1
        if date_range_filter:
            bool_query.setdefault("filter", []).append(date_range_filter)

        page = getattr(p_query_model, "page", 1) or 1
        size = getattr(p_query_model, "size", 100) or 100
        frm = (page - 1) * size
        if frm < 0:
            frm = 0

        query = {
            "query": {"bool": bool_query},
            "from": frm,
            "size": size,
            "track_total_hits": False,
            "collapse": {"field": "username.keyword"},
            "_source": ["url", "username", "domain", "email", "password", "ip", "channel", "type", "raw", "_id", "file"]
        }

        if not (user_query or url_query or extra_user_terms or extra_domains):
            query["sort"] = ["_doc"]

        return ELASTIC_INDEX.S_STEALERLOGS_INDEX, query

    def on_search_general_data(self, p_query_model, pfilter=None):
        if p_query_model.matchtype:
            p_query_model.q = helper_controller.transform_query_match(p_query_model.q, p_query_model.matchtype)

        if p_query_model.q != "*":
            raw_query = helper_controller.remove_stopwords_from_string(p_query_model.q)
        else:
            raw_query = "*"

        if p_query_model.q == "":
            raw_query = "*"
        if not raw_query or raw_query == "":
            raw_query = "*"
        if not raw_query:
            return ELASTIC_INDEX.S_GENERIC_INDEX, {"query": {"match_none": {}}, "size": 0}

        m_safe_search = p_query_model.safe
        m_page_number = p_query_model.page
        m_network = p_query_model.network
        m_date_range = p_query_model.daterange
        m_content_type = p_query_model.content

        exact_phrases = re.findall(r'"([^"]+)"', raw_query)
        loose_terms = re.sub(r'"[^"]+"', '', raw_query).strip().split()
        quoted_value_match = re.fullmatch(r'"([^"]+)"', raw_query.strip())
        quoted_value = quoted_value_match.group(1) if quoted_value_match else None

        if p_query_model.category != "general":
            m_search_type = p_query_model.category
        else:
            m_search_type = "all"

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
                            "m_update_date": {
                                "gte": from_date,
                                "lte": to_date
                            }
                        }
                    })
                except ValueError:
                    pass

        if m_content_type and m_content_type.lower() not in ("", "all"):
            must_clauses.append({"term": {"content_type": m_content_type.lower()}})

        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        if m_safe_search:
            must_not_clause.append({"term": {"m_content_type": "adult"}})

        if m_search_type != "all":
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})

        # --------- FAST URL FILTER (NO prefix, ONLY m_url.raw exact) ----------
        pfilter2 = pfilter
        if pfilter and isinstance(pfilter, dict) and pfilter.get("m_url"):
            # copy and remove m_url so _build_query_block won't add slow prefix queries
            pfilter2 = dict(pfilter)
            url_values = pfilter2.pop("m_url", None)

            if not isinstance(url_values, list):
                url_values = [url_values]

            url_terms = []
            for u in url_values:
                if not isinstance(u, str):
                    continue
                u = u.strip()
                if not u:
                    continue

                has_scheme = bool(re.match(r"^(?:https?://)", u, flags=re.I))
                candidates = set()
                if has_scheme:
                    candidates.add(u)
                else:
                    candidates.add(f"https://{u}")
                    candidates.add(f"http://{u}")
                    candidates.add(u)

                expanded = set()
                for c in candidates:
                    expanded.add(c)
                    expanded.add(c.rstrip("/") + "/")

                for c in expanded:
                    url_terms.append({"term": {"m_url.raw": c}})

            if url_terms:
                must_clauses.append({
                    "bool": {
                        "should": url_terms,
                        "minimum_should_match": 1
                    }
                })
        # --------------------------------------------------------------------

        phrase_fields = [
            ("m_title", 5),
            ("m_content", 3),
            ("m_url", 2),
            ("m_base_url", 1),
        ]

        query_statement = self._build_query_block(
            p_query_model=p_query_model,
            pfilter=pfilter2,
            raw_query=raw_query,
            quoted_value=quoted_value,
            exact_phrases=exact_phrases,
            loose_terms=loose_terms,
            phrase_fields=phrase_fields,
            must_clauses=must_clauses,
            must_not_clause=must_not_clause,
            m_page_number=1,
            date_field="m_creation_date"
        )
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
            if not p_index_data["m_important_content"] or not p_index_data["m_title"]:
                return index_entries

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
            if not chat.get("m_message_id"):
                continue

            chat["m_hash"] = helper_controller.generate_data_hash(chat.get("m_message_id"))
            index_entries.append({
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_CHATS_INDEX,
                ELASTIC_KEYS.S_VALUE: chat
            })

        return index_entries

    @staticmethod
    def index_query_social(p_index_data):
        index_entries = []
        for post in p_index_data.get("cards_data", []):
            m_hash = ""
            if post.get("m_message_id"):
                m_hash = post.get("m_message_id")
            if not m_hash:
                m_hash = post.get("m_title") + "_" + post.get("m_channel_url")
            if not m_hash:
                continue

            post["m_hash"] = helper_controller.generate_data_hash(m_hash)
            index_entries.append({
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_SOCIAL_INDEX,
                ELASTIC_KEYS.S_VALUE: post
            })
        return index_entries

    @staticmethod
    def index_query_credential(p_index_data):
        now = datetime.now(timezone.utc).isoformat()
        bulk_entries = []

        for credential in p_index_data.get("m_credential_data", []):
            if not credential.get("username") or not credential.get("file"):
                continue

            m_hash = helper_controller.generate_data_hash(
                credential.get("username") + "_" + str(credential.get("file")))
            doc = {
                "u": credential.get("username"),
                "l": credential.get("link"),
                "s": credential.get("source"),
                "g": credential.get("group"),
                "fn": credential.get("file"),
                "c": now
            }

            doc = {
                k: [i for i in v if i not in (None, "", "null")] if isinstance(v, list)
                else v
                for k, v in doc.items()
                if v not in (None, "", "null") and (
                        not isinstance(v, list) or [i for i in v if i not in (None, "", "null")]
                )
            }

            bulk_entries.append({
                "create": {
                    "_index": ELASTIC_INDEX.S_CREDENTIAL_INDEX,
                    "_id": m_hash
                }
            })
            bulk_entries.append(doc)

        return bulk_entries

    @staticmethod
    def index_query_stealerlog(p_index_data):
        bulk_entries = []
        bf = bloom_controller(dirpath="bloom_data", capacity=1_000_000_000, error_rate=0.01)

        for log in p_index_data["logs"]:
            email = log["email"][0] if "email" in log and log["email"] else None
            username = log["username"][0] if "username" in log and log["username"] else None
            domain = log["domain"][0] if "domain" in log and log["domain"] else None
            ip = log["ip"][0] if "ip" in log and log["ip"] else None
            channel = log["channel"] if "channel" in log else None

            if log["type"] == 'c' or log["type"] == 'credential':
                if not email and not username:
                    continue

                val = email or username
                seed = str(val) + "|" + str(channel or "")
            else:
                if not any([email, username, domain, ip, channel]):
                    continue
                val = email or username or domain or ip or channel
                seed = str(val) + "|" + str(channel or "")

            m_hash = hashlib.sha256(seed.lower().encode("utf-8", "ignore")).hexdigest()
            _id = str(datetime.utcnow().year) + "_UTC_" + m_hash

            if bf.isduplicate(m_hash):
                continue

            doc = {}
            for k in log:
                if log[k] is not None:
                    doc[k] = log[k]

            bulk_entries.append({
                "create": {
                    "_index": ELASTIC_INDEX.S_STEALERLOGS_INDEX,
                    "_id": _id
                }
            })
            bulk_entries.append(doc)

        return bulk_entries

    @staticmethod
    def index_query_defacement(p_index_data):
        index_entries = []
        utc_now = datetime.now(timezone.utc)
        current_timestamp = utc_now.isoformat()

        for record in p_index_data.get("cards_data", []):
            if not record["m_url"]:
                continue

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
            if not card["m_url"] or not card["m_title"]:
                continue

            card["m_hash"] = helper_controller.generate_data_hash(card["m_base_url"] + "_" + card["m_title"])
            card["m_update_date"] = current_timestamp
            card["m_contact_link"] = contact_link

            cleaned_card = {k: v for k, v in card.items() if v is not None}

            index_entries.append({
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_VALUE: cleaned_card,
            })

        return index_entries

    @staticmethod
    def index_query_exploit(p_index_data):
        contact_link = p_index_data.get("contact_link", "")
        index_entries = []
        current_timestamp = datetime.now(timezone.utc).isoformat()

        for card in p_index_data.get("cards_data", []):
            if not card["m_url"] or not card["m_title"]:
                continue

            card["m_hash"] = helper_controller.generate_data_hash(card["m_url"] + "_" + card["m_title"])
            card["m_update_date"] = current_timestamp
            card["m_contact_link"] = contact_link

            cleaned_card = {k: v for k, v in card.items() if v is not None}

            index_entries.append({
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_EXPLOIT_INDEX,
                ELASTIC_KEYS.S_VALUE: cleaned_card,
            })

        return index_entries

    @staticmethod
    def generate_graph_queries():
        queries = [
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "query": {
                        "term": {
                            "m_content_type": "leaks"
                        }
                    },
                    "aggs": {
                        "Top Teams (Leak)": {
                            "terms": {
                                "field": "m_team",
                                "size": 4
                            }
                        }
                    }
                }
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Top Teams (Defacement)": {
                            "terms": {
                                "field": "m_team",
                                "size": 4
                            }
                        }
                    }
                }
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Top Locations (Defacement)": {
                            "terms": {
                                "field": "m_location",
                                "size": 4
                            }
                        }
                    }
                }
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_CHATS_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Top Hashtags (Social)": {
                            "terms": {
                                "field": "m_hashtags",
                                "size": 4
                            }
                        }
                    }
                }
            }
        ]

        return queries

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
                                "field": "m_hash"
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
                        "Updated 5 Days ago": {"value_count": {"field": "m_hash"}}
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "query": {"range": {"m_update_date": {"gte": "now-10d/d"}}},
                    "aggs": {
                        "Updated 9 Days ago": {"value_count": {"field": "m_hash"}}
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
                    "aggs": {"Email/Document": {"value_count": {"field": "m_email"}}},
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "aggs": {
                        "Phone/Document": {"value_count": {"field": "m_phone_number"}}
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
                                "field": "m_hash"
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
                        "Updated 5 Days ago": {"value_count": {"field": "m_hash"}}
                    },
                },
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "query": {"range": {"m_update_date": {"gte": "now-10d/d"}}},
                    "aggs": {
                        "Updated 9 Days ago": {"value_count": {"field": "m_hash"}}
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
                        "Document Count": {"value_count": {"field": "m_hash"}}
                    }
                }
            },
            {
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX,
                ELASTIC_KEYS.S_FILTER: {
                    "size": 0,
                    "query": {"range": {"m_leak_date": {"gte": "now-5d/d"}}},
                    "aggs": {
                        "Updated 5 Days ago": {"value_count": {"field": "m_hash"}}
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
