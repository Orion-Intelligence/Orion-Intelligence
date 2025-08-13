import hashlib
import re
import ipaddress
from datetime import timedelta, timezone
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_param_model import search_chat_param_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import search_credential_param_model
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_param_model import search_exploit_param_model
from orion.api.interactive.search_manager.search_data_model.social.search_social_param_model import search_social_param_model
from orion.constants.constant import CONSTANTS, allowed_keys
from orion.constants.enum import ChannelTypeEnum
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS, ELASTIC_INDEX
from datetime import datetime


class elastic_request_generator:

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

    @staticmethod
    def on_bulk_stealer_lookup(p_query_model, pFilter=None):

        field_aggs = {}
        must_clauses = []
        search_terms = []

        search_terms.extend(helper_controller.extract_domains_from_text(p_query_model.q))

        if pFilter:
            if "url" in pFilter:
                search_terms.extend(pFilter["url"])
            if "username" in pFilter:
                search_terms.extend(pFilter["username"])

        for idx, term in enumerate(search_terms):
            term = term.lower()
            parts = term.split('/')
            valid_parts = [p for p in parts if '.' in p or len(p) > 2]

            if not valid_parts:
                continue
            term_part = valid_parts[-1]
            agg_name = f"term_{idx}"

            field_aggs[agg_name] = {
                "filter": {
                    "bool": {
                        "should": [
                            {
                                "wildcard": {
                                    "url.raw": {
                                        "value": f"*{term_part}*",
                                        "case_insensitive": True
                                    }
                                }
                            },
                            {
                                "wildcard": {
                                    "username": {
                                        "value": f"*{term_part}*",
                                        "case_insensitive": True
                                    }
                                }
                            }
                        ]
                    }
                },
                "aggs": {
                    "by_field_type": {
                        "terms": {
                            "field": "username",
                            "size": 10
                        },
                        "aggs": {
                            "top_hits_per_type": {
                                "top_hits": {
                                    "size": 4,
                                    "sort": [
                                        {"timestamp": {"order": "desc"}}
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
                            "timestamp": {
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
            "aggs": field_aggs,
            "track_total_hits": False
        }

        return ELASTIC_INDEX.S_STEALERLOGS_INDEX, query_statement

    @staticmethod
    def on_search_defacement_data(p_query_model: search_defacement_param_model, _=None, is_consolidated: bool = False):
        raw_query = p_query_model.q.lower()
        if not raw_query or raw_query == "":
            raw_query = "*"

        m_page_number = getattr(p_query_model, 'page', 1)

        must_clauses = []
        must_not_clause = []
        should_clauses = []

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
                        "range": {
                            "m_leak_date": {
                                "gte": from_date,
                                "lte": to_date
                            }
                        }
                    })
                except ValueError:
                    pass

        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        m_content_type = p_query_model.content

        if m_content_type == "phishing":
            must_clauses.append({"terms": {"m_ioc_type": ["phishing"]}})
        elif m_content_type == "hacked":
            must_clauses.append({"terms": {"m_ioc_type": ["hacked"]}})
        elif m_content_type == "databases":
            must_not_clause.append({"terms": {"m_ioc_type": ["phishing", "hacked"]}})

        quoted_value_match = re.fullmatch(r'"([^"]+)"', raw_query.strip())
        quoted_value = quoted_value_match.group(1) if quoted_value_match else None

        try:
            ipaddress.ip_address(raw_query)
            is_ip = True
        except ValueError:
            is_ip = False

        if raw_query == "*":
            if is_consolidated:
                main_query = {}
            else:
                main_query = {
                    "bool": {
                        "must": [{"match_all": {}}],
                        "filter": must_clauses,
                        "must_not": must_not_clause
                    }
                }
        else:
            if quoted_value:
                raw_query = quoted_value
                should_clauses.append({
                    "bool": {
                        "should": [{"terms": {field: [raw_query], "boost": 3}} for field in allowed_keys],
                        "minimum_should_match": 1,
                        "boost": 5
                    }
                })
            elif is_ip:
                should_clauses.append({"term": {"m_ip": raw_query}})
                should_clauses.append({
                    "wildcard": {
                        "m_ip": {
                            "value": f"*{raw_query}*",
                            "case_insensitive": True,
                            "boost": 2
                        }
                    }
                })
            else:
                should_clauses.extend([
                    {"match": {"m_location": {"query": raw_query, "boost": 50}}},
                    {"match": {"m_web_url": {"query": raw_query, "boost": 50}}},
                    {"match": {"m_mirror_links": {"query": raw_query, "boost": 50}}},
                    {"match": {"m_url": {"query": raw_query, "boost": 50}}},
                    {"match": {"m_base_url": {"query": raw_query, "boost": 50}}},
                    {"match": {"m_attacker": {"query": raw_query, "boost": 50}}},  # NEW
                    {
                        "multi_match": {
                            "query": raw_query,
                            "fields": [
                                "m_location^5",
                                "m_web_url^5",
                                "m_base_url^5",
                                "m_url^5",
                                "m_web_server^3",
                                "m_attacker^5",  # NEW
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
                                {"wildcard": {"m_location": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 2}}},
                                {"wildcard": {"m_web_url": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 2}}},
                                {"wildcard": {"m_base_url": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 2}}},
                                {"wildcard": {"m_url": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 2}}},
                                {"wildcard": {"m_web_server": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 1}}},
                                {"wildcard": {"m_attacker": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 2}}},  # NEW
                                {"wildcard": {"m_team": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 2}}},
                                {"wildcard": {"m_network": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 1}}},
                                {"wildcard": {"m_mirror_links": {"value": f"*{raw_query}*", "case_insensitive": True, "boost": 2}}}
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
                            "weight": 2
                        },
                        {
                            "field_value_factor": {
                                "field": "m_update_date",
                                "factor": 1.1,
                                "modifier": "log1p",
                                "missing": 0
                            }
                        },
                        {
                            "filter": {
                                "exists": {"field": "m_leak_date"}
                            },
                            "weight": 1
                        },
                        {
                            "gauss": {
                                "m_leak_date": {
                                    "origin": "now",
                                    "scale": "90d",
                                    "offset": "5d",
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
            "from": max(0, (m_page_number - 1) * 100),
            "size": 100,
            "track_total_hits": True,
            "sort": [{"m_leak_date": {"order": "desc"}}]
        }

        return ELASTIC_INDEX.S_DEFACEMENT_INDEX, query_statement

    @staticmethod
    def _strip_query(query, size=20):
        query["size"] = size
        query.pop("highlight", None)
        query.pop("suggest", None)
        return query

    @staticmethod
    def on_search_consolidated_ranked_data(p_query_model: search_consolidated_param_model, pfilter):
        if p_query_model.matchtype:
            p_query_model.q = helper_controller.transform_query_match(p_query_model.q, p_query_model.matchtype)

        raw_query = p_query_model.q if p_query_model.q and p_query_model.q != "*" else "*"
        raw_query = helper_controller.remove_stopwords_from_string(raw_query) if raw_query != "*" else "*"
        if raw_query == "":
            raw_query = "*"

        m_date_range = p_query_model.daterange
        m_network = p_query_model.network

        must_clauses = []

        if m_date_range:
            try:
                parts = m_date_range.split(",")
                if len(parts) == 2:
                    from_date = datetime.strptime(parts[0].strip(), "%Y-%m-%d").strftime("%Y-%m-%dT00:00:00+00:00")
                    to_date = datetime.strptime(parts[1].strip(), "%Y-%m-%d").strftime("%Y-%m-%dT23:59:59+00:00")
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
        else:
            to_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT23:59:59+00:00")
            from_date = (datetime.now(timezone.utc) - timedelta(days=150)).strftime("%Y-%m-%dT00:00:00+00:00")
            must_clauses.append({
                "range": {
                    "m_update_date": {
                        "gte": from_date,
                        "lte": to_date
                    }
                }
            })

        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        must_filter_clauses, should_filter_clauses = helper_controller.getFilterClause(pfilter, p_query_model, allowed_keys)

        fixed_must_filter = []
        for clause in must_filter_clauses:
            if "term" in clause:
                for k, v in clause["term"].items():
                    if isinstance(v, str) and k == "m_gpe":
                        v = v.title()
                    fixed_must_filter.append({"term": {k: v}})
            else:
                fixed_must_filter.append(clause)
        must_filter_clauses = fixed_must_filter

        if raw_query == "*":
            query_block = {"match_all": {}}
        else:
            query_block = {
                "bool": {
                    "should": [
                        {
                            "multi_match": {
                                "query": raw_query,
                                "type": "best_fields",
                                "fields": [
                                    "m_title^5",
                                    "m_content^3",
                                    "m_url^2",
                                    "m_sender_name^2",
                                    "m_base_url",
                                    "m_team",
                                    "m_attacker",
                                    "m_users",
                                    "m_network"
                                ],
                                "operator": "or",
                                "lenient": True
                            }
                        },
                        {
                            "multi_match": {
                                "query": raw_query,
                                "type": "phrase_prefix",
                                "fields": [
                                    "m_title^4",
                                    "m_url.keyword^3",
                                    "m_sender_name.keyword^2"
                                ],
                                "operator": "or",
                                "lenient": True
                            }
                        },
                        {
                            "query_string": {
                                "query": raw_query,
                                "fields": ["*"],
                                "default_operator": "OR",
                                "analyze_wildcard": True,
                                "lenient": True,
                                "boost": 0.5
                            }
                        }
                    ],
                    "minimum_should_match": 1
                }
            }

        combined_filter = must_clauses + must_filter_clauses

        if not getattr(p_query_model, "must", False) and should_filter_clauses:
            combined_filter.append({
                "bool": {
                    "should": should_filter_clauses["bool"]["should"],
                    "minimum_should_match": 1
                }
            })

        unified_query = {
            "min_score": 0,
            "query": {
                "function_score": {
                    "query": {
                        "bool": {
                            "filter": (
                                combined_filter
                            ),
                            "must": query_block
                        }
                    },
                    "score_mode": "sum",
                    "boost_mode": "multiply"
                }
            },
            "from": 0,
            "size": 10,
            "track_total_hits": True,
            "explain": True
        }

        query = [
            ELASTIC_INDEX.S_LEAK_INDEX,
            ELASTIC_INDEX.S_GENERIC_INDEX,
            ELASTIC_INDEX.S_EXPLOIT_INDEX,
            ELASTIC_INDEX.S_CHATS_INDEX,
            ELASTIC_INDEX.S_SOCIAL_INDEX
        ], unified_query, [
            {ELASTIC_INDEX.S_LEAK_INDEX: 2},
            {ELASTIC_INDEX.S_GENERIC_INDEX: 0.5},
            {ELASTIC_INDEX.S_EXPLOIT_INDEX: 1.4},
            {ELASTIC_INDEX.S_CHATS_INDEX: 1.4},
            {ELASTIC_INDEX.S_SOCIAL_INDEX: 1.4}
        ]

        return query

    def on_search_consolidated_data(self, p_query_model, pFilter=None):
        queries = []
        indices = []

        m1 = helper_controller.clone_model(p_query_model)
        i1, q1 = self.on_search_leakdata(m1, pFilter)
        queries.append(self._strip_query(q1))
        indices.append(i1)

        m2 = helper_controller.clone_model(p_query_model)
        i2, q2 = self.on_search_general_data(m2, pFilter)
        queries.append(self._strip_query(q2))
        indices.append(i2)

        m3 = helper_controller.clone_model(p_query_model)
        i3, q3 = self.on_search_exploitdata(m3, pFilter)
        queries.append(self._strip_query(q3))
        indices.append(i3)

        m4 = helper_controller.clone_model(p_query_model)
        i4, q4 = self.on_search_telegram_data(m4, pFilter)
        queries.append(self._strip_query(q4))
        indices.append(i4)

        m6 = helper_controller.clone_model(p_query_model)
        i6, q6 = self.on_search_social_data(m6, pFilter)
        queries.append(self._strip_query(q6))
        indices.append(i6)

        domain_query_index, domain_query = self.on_bulk_domain_lookup(p_query_model, pFilter)
        queries.append(domain_query)
        indices.append(domain_query_index)

        stealer_query_index, stealer_query = self.on_search_stealerlogs_data(p_query_model, pFilter)
        queries.append(stealer_query)
        indices.append(stealer_query_index)

        print("4:::::::::::::::::::::::::::::", flush=True)
        print(stealer_query, flush=True)
        print("4:::::::::::::::::::::::::::::", flush=True)
        return indices, queries

    @staticmethod
    def on_search_leakdata(p_query_model, pfilter=None):

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
        m_entity = p_query_model.entity

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
                        "should": [{"exists": {"field": entity}} for entity in entity_list],
                        "minimum_should_match": 1
                    }
                })

        if m_content_type and m_content_type.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_mitre_ttp_type": m_content_type.lower()}})

        if m_search_type == "databases":
            m_search_type = "leaks"
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})
        if m_search_type and m_search_type != "all":
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})
        if m_safe_search == "True":
            must_not_clause.append({"term": {"m_content_type": "adult"}})
        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        if raw_query == "*":
            content_query = {"match_all": {}}
        else:
            content_query = {"bool": {"should": [], "minimum_should_match": 1}}
            if quoted_value:
                raw_query = raw_query.strip('"')
                for phrase in exact_phrases:
                    content_query["bool"]["should"].append({
                        "bool": {
                            "should": [
                                {"match_phrase": {"m_title": {"query": phrase, "boost": 6}}},
                                {"match_phrase": {"m_content": {"query": phrase, "boost": 1.5}}},
                                {"match_phrase": {"m_important_content": {"query": phrase, "boost": 1.5}}},
                                {"match_phrase": {"m_ref_html": {"query": phrase, "boost": 2.0}}}
                            ],
                            "minimum_should_match": 1
                        }
                    })
            else:
                content_query = {"bool": {"should": [], "minimum_should_match": 1}}
                for phrase in exact_phrases:
                    must_clauses.append({
                        "bool": {
                            "should": [
                                {"match_phrase": {"m_title": {"query": phrase, "boost": 6}}},
                                {"match_phrase": {"m_content": {"query": phrase, "boost": 1.5}}},
                                {"match_phrase": {"m_important_content": {"query": phrase, "boost": 1.5}}},
                                {"match_phrase": {"m_ref_html": {"query": phrase, "boost": 2.0}}}
                            ],
                            "minimum_should_match": 1
                        }
                    })

                for term in loose_terms:
                    content_query["bool"]["should"].append({
                        "query_string": {
                            "query": term.lower() + "*",
                            "fields": ["*"],
                            "default_operator": "OR",
                            "lenient": True,
                            "analyze_wildcard": True,
                            "boost": 2
                        }
                    })

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

        must_filter_clauses, should_filter_clauses = helper_controller.getFilterClause(pfilter, p_query_model, allowed_keys)
        query_statement = {
            "min_score": 0,
            "query": {
                "function_score": {
                    "query": {
                        "bool": {
                            "must": [content_query] if isinstance(content_query, dict) else [],
                            "filter": must_clauses + must_filter_clauses,
                            "must_not": must_not_clause,
                            **({
                                   "should": should_filter_clauses,
                                   "minimum_should_match": 1
                               } if not p_query_model.must and should_filter_clauses else {})
                        }
                    },
                    "functions": [
                        {
                            "gauss": {
                                "m_update_date": {
                                    "origin": "now",
                                    "scale": "90d",
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
                        },
                        {
                            "filter": {"exists": {"field": "m_leak_date"}},
                            "weight": 1
                        },
                        {
                            "gauss": {
                                "m_leak_date": {
                                    "origin": "now",
                                    "scale": "90d",
                                    "offset": "5d",
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
    def on_search_exploitdata(p_query_model: search_exploit_param_model, pfilter=None):
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

        m_safe_search = p_query_model.safe
        m_page_number = p_query_model.page
        m_network = p_query_model.network
        m_search_type = p_query_model.content
        m_date_range = p_query_model.daterange
        m_content_type = p_query_model.content
        m_entity = p_query_model.entity

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
        if m_search_type and m_search_type != "all":
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})
        if m_safe_search == "True":
            must_not_clause.append({"term": {"m_content_type": "adult"}})
        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        if raw_query == "*":
            content_query = {"match_all": {}}
        else:
            content_query = {"bool": {"should": [], "minimum_should_match": 1}}
            if quoted_value:
                raw_query = raw_query.strip('"')
                for phrase in exact_phrases:
                    content_query["bool"]["should"].append({
                        "bool": {
                            "should": [
                                {"match_phrase": {"m_title": {"query": phrase, "boost": 6}}},
                                {"match_phrase": {"m_content": {"query": phrase, "boost": 1.5}}},
                                {"match_phrase": {"m_important_content": {"query": phrase, "boost": 1.5}}},
                                {"match_phrase": {"m_ref_html": {"query": phrase, "boost": 2.0}}}
                            ],
                            "minimum_should_match": 1
                        }
                    })
            else:
                content_query = {"bool": {"should": [], "minimum_should_match": 1}}
                for phrase in exact_phrases:
                    must_clauses.append({
                        "bool": {
                            "should": [
                                {"match_phrase": {"m_title": {"query": phrase, "boost": 6}}},
                                {"match_phrase": {"m_content": {"query": phrase, "boost": 1.5}}},
                                {"match_phrase": {"m_important_content": {"query": phrase, "boost": 1.5}}},
                                {"match_phrase": {"m_ref_html": {"query": phrase, "boost": 2.0}}}
                            ],
                            "minimum_should_match": 1
                        }
                    })

                for term in loose_terms:
                    content_query["bool"]["should"].append({
                        "query_string": {
                            "query": term.lower() + "*",
                            "fields": ["*"],
                            "default_operator": "OR",
                            "lenient": True,
                            "analyze_wildcard": True,
                            "boost": 2
                        }
                    })

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
        must_filter_clauses, should_filter_clauses = helper_controller.getFilterClause(pfilter, p_query_model, allowed_keys)
        query_statement = {
            "min_score": 0,
            "query": {
                "function_score": {
                    "query": {
                        "bool": {
                            "must": [content_query] if isinstance(content_query, dict) else [],
                            "filter": must_clauses + must_filter_clauses,
                            "must_not": must_not_clause,
                            **({
                                   "should": should_filter_clauses,
                                   "minimum_should_match": 1
                               } if not p_query_model.must and should_filter_clauses else {})
                        }
                    },
                    "functions": [
                        {
                            "gauss": {
                                "m_update_date": {
                                    "origin": "now",
                                    "scale": "90d",
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
                        },
                        {
                            "filter": {
                                "exists": {"field": "m_leak_date"}
                            },
                            "weight": 1
                        },
                        {
                            "gauss": {
                                "m_leak_date": {
                                    "origin": "now",
                                    "scale": "90d",
                                    "offset": "5d",
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

        return ELASTIC_INDEX.S_EXPLOIT_INDEX, query_statement

    @staticmethod
    def on_search_social_data(p_query_model: search_social_param_model, pfilter=None):
        if p_query_model.matchtype:
            p_query_model.q = helper_controller.transform_query_match(p_query_model.q, p_query_model.matchtype)

        if p_query_model.q != "*":
            raw_query = helper_controller.remove_stopwords_from_string(p_query_model.q)
        else:
            raw_query = "*"
        if raw_query == "":
            raw_query = "*"

        if p_query_model.q != "":
            raw_query = helper_controller.remove_stopwords_from_string(str(p_query_model.q))

        m_page_number = getattr(p_query_model, 'page', 1)
        m_network = p_query_model.network

        must_clauses = []
        must_not_clause = []

        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        if p_query_model.platform:
            must_clauses.append({"term": {"m_platform": p_query_model.platform}})

        if p_query_model.daterange:
            parts = p_query_model.daterange.split(',')
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

        search_fields = [
            "m_title^4",
            "m_content^3",
            "m_sender_name^2.5",
            "m_platform^2",
            "m_network^1.5"
        ]

        quoted_value_match = re.fullmatch(r'"([^"]+)"', raw_query.strip())
        quoted_value = quoted_value_match.group(1) if quoted_value_match else None

        if raw_query == "*":
            query_string_query = {"match_all": {}}
        elif quoted_value:
            quoted_value = quoted_value.strip('"').strip()
            raw_query = raw_query.strip('"').strip()

            query_string_query = {
                "bool": {
                    "should": [{"terms": {field: [quoted_value], "boost": 3}} for field in allowed_keys],
                    "minimum_should_match": 1,
                    "boost": 5
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
                                        "m_sender_name": {
                                            "value": f"*{raw_query.lower()}*",
                                            "boost": 1.0,
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
                                    "scale": "90d",
                                    "offset": "10d",
                                    "decay": 0.5,
                                }
                            },
                            "weight": 1,
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
                    }
                }
            },
            "suggest": {
                "social_suggestion": {
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

        return ELASTIC_INDEX.S_SOCIAL_INDEX, query

    @staticmethod
    def on_search_telegram_data(p_query_model: search_chat_param_model, pfilter=None):
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
        m_entity = p_query_model.entity
        m_mitryTtp = p_query_model.mitre
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
            "m_media_caption^2",
            "m_forwarded_from^1.2",
            "m_sender_name^1.1",
            "m_file_name^1.0",
            "m_ref_html^0.8"
        ]

        if raw_query == "*":
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
            "track_total_hits": True,
            "explain": True
        }

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
            "track_total_hits": True
        }

        return ELASTIC_INDEX.S_CREDENTIAL_INDEX, query

    @staticmethod
    def on_search_stealerlogs_data(p_query_model: search_credential_param_model, pFilter):

        print("xx :::::::::::::::::::::::::::::", flush=True)
        print("xx :::::::::::::::::::::::::::::", flush=True)
        print(p_query_model.user, flush=True)
        print(p_query_model.url, flush=True)
        print("xx :::::::::::::::::::::::::::::", flush=True)
        print("xx :::::::::::::::::::::::::::::", flush=True)

        user_query = p_query_model.user.strip() if p_query_model.user and p_query_model.user != "*" else ""
        url_query = p_query_model.url.strip() if p_query_model.url else ""
        url_query = re.sub(r'^(?:[a-zA-Z0-9+.-]+://)?(?:www\.)?', '', url_query)
        date_range_filter = {}

        if p_query_model.daterange:
            start_date, end_date = [d.strip() for d in p_query_model.daterange.split(",")]
            date_range_filter = {
                "range": {
                    "timestamp": {
                        "gte": start_date,
                        "lte": end_date
                    }
                }
            }

        must_should = []
        should_clauses = []

        if p_query_model.fullsearch:
            if user_query:
                user_query = re.sub(r'(\S+@\S+)', lambda m: m.group(1).replace('@', ' '), user_query)
                terms = re.findall(r'"([^"]+)"|(\S+)', user_query)

                for quoted, unquoted in terms:
                    term = quoted or unquoted
                    clause = {
                        "bool": {
                            "should": [
                                {"wildcard": {"username": f"*{term}*"}},
                                {"wildcard": {"domain": f"*{term}*"}},
                                {"wildcard": {"url.raw": f"*{term}*"}},
                                {"wildcard": {"url": f"*{term.lower()}*"}}
                            ],
                            "minimum_should_match": 1
                        }
                    }
                    must_should.append(clause)

            if url_query:
                url_clause = {
                    "bool": {
                        "should": [
                            {"wildcard": {"url.raw": f"*{url_query}*"}},
                            {"wildcard": {"url": f"*{url_query.lower()}*"}}
                        ],
                        "minimum_should_match": 1
                    }
                }
                should_clauses.append(url_clause)

        else:
            if user_query:
                user_query = re.sub(r'(\S+@\S+)', lambda m: m.group(1).replace('@', ' '), user_query)
                terms = re.findall(r'"([^"]+)"|(\S+)', user_query)

                for quoted, unquoted in terms:
                    term = quoted or unquoted
                    clause = {
                        "bool": {
                            "should": [
                                {"term": {"username": term}},
                                {"term": {"domain": term}},
                                {"term": {"url.raw": term}},
                                {"match_phrase": {"url": term.lower()}}
                            ],
                            "minimum_should_match": 1
                        }
                    }
                    must_should.append(clause)

            if url_query:
                url_clause = {
                    "bool": {
                        "should": [
                            {"term": {"url.raw": url_query}},
                            {"match_phrase": {"url": url_query.lower()}}
                        ],
                        "minimum_should_match": 1
                    }
                }
                should_clauses.append(url_clause)

        bool_query = {}
        if must_should:
            bool_query["must"] = must_should
        if should_clauses:
            bool_query["should"] = should_clauses
            bool_query["minimum_should_match"] = 1
        if date_range_filter:
            bool_query.setdefault("filter", []).append(date_range_filter)

        query = {
            "query": {"bool": bool_query},
            "from": 0,
            "size": 100,
            "track_total_hits": True,
            "sort": [{"timestamp": {"order": "desc"}}],
            "_source": ["url", "username", "domain", "password", "timestamp", "log_hash", "m_hash"]
        }

        return ELASTIC_INDEX.S_STEALERLOGS_INDEX, query

    @staticmethod
    def on_search_general_data(p_query_model, pfilter=None):
        if p_query_model.matchtype:
            p_query_model.q = helper_controller.transform_query_match(p_query_model.q, p_query_model.matchtype)

        if p_query_model.q != "*":
            raw_query = helper_controller.remove_stopwords_from_string(p_query_model.q)
        else:
            raw_query = "*"
        if raw_query == "":
            raw_query = "data"
        if not raw_query or raw_query == "":
            raw_query = "*"
        if not raw_query:
            return ELASTIC_INDEX.S_GENERIC_INDEX, {"query": {"match_none": {}}, "size": 0}

        m_safe_search = p_query_model.safe
        m_page_number = p_query_model.page
        m_network = p_query_model.network
        m_date_range = p_query_model.daterange
        m_content_type = p_query_model.content
        m_entity = p_query_model.entity

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

        if m_safe_search:
            must_not_clause.append({"term": {"m_content_type": "adult"}})

        if m_search_type != "all":
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})

        if raw_query == "*":
            content_query = {"match_all": {}}
        else:
            content_query = {"bool": {"should": [], "minimum_should_match": 1}}
            if quoted_value:
                raw_query = raw_query.strip('"')
                for phrase in exact_phrases:
                    content_query["bool"]["should"].append({
                        "bool": {
                            "should": [
                                {"match_phrase": {"m_title": {"query": phrase, "boost": 6}}},
                                {"match_phrase": {"m_content": {"query": phrase, "boost": 1.5}}},
                                {"match_phrase": {"m_meta_description": {"query": phrase, "boost": 1.5}}},
                            ],
                            "minimum_should_match": 1
                        }
                    })
            else:
                content_query = {"bool": {"should": [], "minimum_should_match": 1}}
                for phrase in exact_phrases:
                    must_clauses.append({
                        "bool": {
                            "should": [
                                {"match_phrase": {"m_title": {"query": phrase, "boost": 6}}},
                                {"match_phrase": {"m_content": {"query": phrase, "boost": 1.5}}},
                                {"match_phrase": {"m_meta_description": {"query": phrase, "boost": 1.5}}},
                            ],
                            "minimum_should_match": 1
                        }
                    })

                for term in loose_terms:
                    content_query["bool"]["should"].append({
                        "query_string": {
                            "query": term.lower() + "*",
                            "fields": ["*"],
                            "default_operator": "OR",
                            "lenient": True,
                            "analyze_wildcard": True,
                            "boost": 2
                        }
                    })

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

        must_filter_clauses, should_filter_clauses = helper_controller.getFilterClause(pfilter, p_query_model, allowed_keys)
        query_statement = {
            "min_score": 0,
            "query": {
                "function_score": {
                    "query": {
                        "bool": {
                            "must": [content_query] if isinstance(content_query, dict) else [],
                            "filter": must_clauses + must_filter_clauses,
                            "must_not": must_not_clause,
                            **({
                                   "should": should_filter_clauses,
                                   "minimum_should_match": 1
                               } if not p_query_model.must and should_filter_clauses else {})
                        }
                    },
                    "functions": [
                        {
                            "gauss": {
                                "m_update_date": {
                                    "origin": "now",
                                    "scale": "90d",
                                    "offset": "10d",
                                    "decay": 0.5,
                                }
                            },
                            "weight": 2,
                        }, {
                            "gauss": {
                                "m_update_date": {
                                    "origin": "now",
                                    "scale": "90d",
                                    "offset": "10d",
                                    "decay": 0.5
                                }
                            },
                            "weight": 2
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
                m_hash = post.get("m_title")
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
        now = datetime.now(timezone.utc).isoformat()
        bulk_entries = []

        for log in p_index_data.get("logs", []):
            if not log or not log.get("url"):
                continue

            raw_string = f'{log.get("url", "")} {log.get("username", "")} {log.get("domain", "")} {log.get("password", "")}'
            m_hash = hashlib.sha256(raw_string.encode()).hexdigest()

            doc = {
                "url": log.get("url", ""),
                "username": log.get("username", None),
                "domain": log.get("domain", None),
                "password": log.get("password", None),
                "log_hash": m_hash,
                "timestamp": now,
                "m_index": "stealer_model",
                "m_sub_host": "/",
                "m_hash": m_hash
            }

            bulk_entries.append({
                "create": {
                    "_index": ELASTIC_INDEX.S_STEALERLOGS_INDEX,
                    "_id": m_hash
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
                    "query": {"range": {"m_leak_date": {"gte": "now-5d/d"}}},
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
