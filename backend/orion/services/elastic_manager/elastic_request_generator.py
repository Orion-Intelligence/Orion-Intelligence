import hashlib
import re
from datetime import timedelta, timezone
from datetime import datetime
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import search_credential_param_model
from orion.constants.constant import CONSTANTS, allowed_keys
from orion.helper_manager.env_handler import env_handler
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS, ELASTIC_INDEX, ELASTIC_SEMANTIC, ELASTIC_ENUMS
from orion.services.elastic_manager.elastic_semantic_controller import elastic_semantic_controller


class elastic_request_generator:

    @staticmethod
    def build_es_from_tagged(parsed, mapping):
        if isinstance(parsed, dict):
            if "AND" in parsed:
                must_clauses = [elastic_request_generator.build_es_from_tagged(x, mapping)
                                for x in parsed["AND"]]
                if len(must_clauses) == 1:
                    return must_clauses[0]
                return {"bool": {"must": must_clauses}}

            if "OR" in parsed:
                should_clauses = [elastic_request_generator.build_es_from_tagged(x, mapping)
                                  for x in parsed["OR"]]
                if len(should_clauses) == 1:
                    return should_clauses[0]
                return {"bool": {"should": should_clauses, "minimum_should_match": 1}}

        if isinstance(parsed, list):
            should_clauses = [elastic_request_generator.build_es_from_tagged(x, mapping)
                              for x in parsed]
            if len(should_clauses) == 1:
                return should_clauses[0]
            return {"bool": {"should": should_clauses, "minimum_should_match": 1}}

        tag = parsed.get("tag")
        value = parsed.get("value")
        fields = mapping.get(tag)

        if tag in ("m_domain", "domain", "m_search_all"):
            def _as_list(x):
                if not x:
                    return []
                return x if isinstance(x, list) else [x]

            merged = _as_list(fields)
            merged += _as_list(mapping.get("source_domain"))
            merged += _as_list(mapping.get("m_source_domain"))
            merged += ["source_domain", "source_domain"]
            fields = list(dict.fromkeys([f for f in merged if f]))

            if tag == "m_search_all" and allowed_keys:
                fields = list(dict.fromkeys(fields + list(allowed_keys)))

        if not fields:
            return {"match_none": {}}

        if isinstance(fields, list):
            if len(fields) == 1:
                return {"term": {fields[0]: value}}
            return {"bool": {"should": [{"term": {f: value}} for f in fields], "minimum_should_match": 1}}

        return {"term": {fields: value}}

    @staticmethod
    def build_ioc_filter_clauses(pfilter):
        must_filters = []

        if not pfilter:
            return must_filters

        for ioc_key, values in pfilter.items():
            if not values:
                continue

            if not isinstance(values, list):
                values = [values]

            if ioc_key == "m_search_all":
                es_fields = []
                search_keys = allowed_keys or ELASTIC_ENUMS.ioc_field_mapping.keys()
                for key in search_keys:
                    mapped = ELASTIC_ENUMS.ioc_field_mapping.get(key)
                    if not mapped:
                        continue
                    if isinstance(mapped, list):
                        es_fields.extend(mapped)
                    else:
                        es_fields.append(mapped)
            else:
                if ioc_key not in ELASTIC_ENUMS.ioc_field_mapping:
                    continue
                es_fields = ELASTIC_ENUMS.ioc_field_mapping[ioc_key]
                if not isinstance(es_fields, list):
                    es_fields = [es_fields]

            shoulds = []

            for val in values:
                if not isinstance(val, str):
                    continue

                val = val.strip()
                if not val:
                    continue

                for field in es_fields:
                    term_field = field if str(field).endswith((".keyword", ".raw")) else f"{field}"

                    shoulds.append({
                        "term": {
                            term_field: {
                                "value": val,
                                "case_insensitive": True
                            }
                        }
                    })

                    if ioc_key == "m_search_all":
                        shoulds.append({"match_phrase": {field: val}})
                        shoulds.append({"match": {field: {"query": val, "operator": "AND"}}})

                    if len(val) >= 5111:
                        shoulds.append({
                            "prefix": {
                                term_field: {
                                    "value": val,
                                    "case_insensitive": True
                                }
                            }
                        })

            if shoulds:
                must_filters.append({
                    "bool": {
                        "should": shoulds,
                        "minimum_should_match": 1
                    }
                })

        return must_filters

    @staticmethod
    def _build_query_block(p_query_model, pfilter, raw_query, quoted_value, exact_phrases, loose_terms, phrase_fields, must_clauses, must_not_clause, m_page_number, date_field):
        multi_fields = [f"{field}^{boost}" for field, boost in phrase_fields]

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
                                {"match_phrase": {field: {"query": phrase, "boost": boost}}}
                                for field, boost in phrase_fields
                            ],
                            "minimum_should_match": 1
                        }
                    })
            else:
                for phrase in exact_phrases:
                    must_clauses.append({
                        "bool": {
                            "should": [
                                {"match_phrase": {field: {"query": phrase, "boost": boost}}}
                                for field, boost in phrase_fields
                            ],
                            "minimum_should_match": 1
                        }
                    })

                for term in loose_terms:
                    content_query["bool"]["should"].append({
                        "multi_match": {
                            "query": term.lower(),
                            "fields": multi_fields,
                            "type": "best_fields",
                            "operator": "OR"
                        }
                    })

                if not exact_phrases and not loose_terms:
                    content_query = {
                        "multi_match": {
                            "query": raw_query.lower(),
                            "fields": multi_fields,
                            "type": "best_fields",
                            "operator": "OR"
                        }
                    }

        must_filter_clauses = elastic_request_generator.build_ioc_filter_clauses(pfilter)
        should_filter_clauses = []

        if pfilter and "m_url" in pfilter and pfilter["m_url"]:
            url_values = pfilter["m_url"]
            if not isinstance(url_values, list):
                url_values = [url_values]

            url_shoulds = []
            url_fields = ["m_url.raw", "m_url"]

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
                    candidates.update([
                        u,
                        f"http://{u}",
                        f"https://{u}"
                    ])

                expanded = set()
                for c in candidates:
                    expanded.add(c)
                    expanded.add(c.rstrip("/") + "/")

                for fld in url_fields:
                    for c in expanded:
                        url_shoulds.append({"term": {fld: c}})
                        url_shoulds.append({"prefix": {fld: {"value": c, "boost": 5}}})

            if url_shoulds:
                must_filter_clauses.append({
                    "bool": {
                        "should": url_shoulds,
                        "minimum_should_match": 1
                    }
                })

        base_bool_query = {
            "must": [content_query] if content_query else [],
            "filter": must_clauses + must_filter_clauses,
            "must_not": must_not_clause
        }

        if not p_query_model.must and should_filter_clauses:
            base_bool_query.setdefault("should", []).extend(should_filter_clauses)

        functions_block = []
        if p_query_model.matchtype != "semantic":
            functions_block = [{
                "gauss": {
                    date_field: {
                        "origin": "now",
                        "scale": "45d",
                        "offset": "7d",
                        "decay": 0.7
                    }
                },
                "weight": 0.1
            }]

        query_statement = {
            "min_score": 0,
            "query": {
                "function_score": {
                    "query": {"bool": base_bool_query},
                    **({"functions": functions_block} if functions_block else {}),
                    "score_mode": "sum",
                    "boost_mode": "multiply"
                }
            },
            "from": max(0, (m_page_number - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC),
            "size": CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE,
            "track_total_hits": True,
            "explain": True
        }

        if (
            raw_query != "*"
            and env_handler.get_instance().env("SEMANTIC_ENABLED") == "1"
            and p_query_model.matchtype == "semantic"
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
                            "filter": {"bool": {"filter": must_filter_clauses}}
                        }
                    }

                    query_statement["query"]["function_score"]["query"] = knn_clause
                    query_statement["query"]["function_score"]["script_score"] = {
                        "script": {
                            "source": (
                                "double s=_score; double eps=1e-9;"
                                "s=Math.max(eps, Math.min(1.0-eps, s));"
                                "double a=params.a; double t=params.t;"
                                "double z=0.5*(1.0+Math.tanh(a*(s-t))); return z;"
                            ),
                            "params": {"a": 10.0, "t": 0.8}
                        }
                    }
                    query_statement["query"]["function_score"]["score_mode"] = "sum"
                    query_statement["query"]["function_score"]["boost_mode"] = "replace"
                    query_statement["min_score"] = 0.4
            except Exception:
                pass

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
                domains.extend(
                    [v for v in pFilter["m_search_all"] if
                        re.search(r'(https?://|[a-z0-9.-]+\.[a-z]{2,})', str(v), re.I)])

        for idx, domain in enumerate(domains):
            domain = domain.lower()
            parts = domain.split('/')
            valid_parts = [p for p in parts if '.' in p]

            if not valid_parts:
                continue
            domain_part = valid_parts[-1]
            agg_name = f"domain_{idx}"

            domain_aggs[agg_name] = {"filter": {"bool": {"should": [
                {"wildcard": {"m_url.raw": {"value": f"*{domain_part}*", "case_insensitive": True}}},
                {"wildcard": {"m_domain.raw": {"value": f"*{domain_part}*", "case_insensitive": True}}},
                {"wildcard": {"m_ip.raw": {"value": f"*{domain_part}*", "case_insensitive": True}}}]}}, "aggs": {"by_ioc_type": {"terms": {"field": "m_ioc_type", "size": 10}, "aggs": {"top_hits_per_type": {"top_hits": {"size": 4, "sort": [
                {"m_leak_date": {"order": "desc"}}]}}}}}}

        if p_query_model.daterange:
            parts = p_query_model.daterange.split(',')
            if len(parts) == 2:
                try:
                    from_date_obj = datetime.strptime(parts[0].strip(), "%Y-%m-%d")
                    to_date_obj = datetime.strptime(parts[1].strip(), "%Y-%m-%d")

                    must_clauses.append(
                        {"range": {"m_leak_date": {"gte": from_date_obj.strftime(
                            "%Y-%m-%d"), "lte": to_date_obj.strftime(
                            "%Y-%m-%d")}}})
                except ValueError:
                    pass

        query_statement = {"size": 0, "query": {"bool": {"must": must_clauses if must_clauses else [
            {"match_all": {}}]}}, "aggs": domain_aggs, "track_total_hits": False}

        return ELASTIC_INDEX.S_DEFACEMENT_INDEX, query_statement

    @staticmethod
    def on_search_persona(p_query_model):
        q = (p_query_model.q or "").strip()
        if not q: return None, None

        query = {
            "query": {
                "term": {
                    "email.keyword": q
                }
            },
            "size": 0,
            "track_total_hits": False,
            "terminate_after": 1000,
            "timeout": "200ms",
            "aggs": {
                "channels": {
                    "terms": {
                        "field": "channel.keyword",
                        "size": 3,
                        "order": {"_count": "desc"}
                    }
                },
                "types": {
                    "terms": {
                        "field": "type.keyword",
                        "size": 3,
                        "order": {"_count": "desc"}
                    }
                }
            },
            "_source": False,
            "stored_fields": []
        }

        return ELASTIC_INDEX.S_STEALERLOGS_INDEX, query

    @staticmethod
    def build_date_filter(from_date, to_date, date_fields):
        return {
            "bool": {
                "should": [
                    {
                        "bool": {
                            "filter": [
                                {"exists": {"field": field}},
                                {"range": {field: {"gte": from_date, "lte": to_date}}}
                            ]
                        }
                    }
                    for field in date_fields
                ],
                "minimum_should_match": 1
            }
        }

    def on_search_consolidated_ranked_data(self, p_query_model: search_consolidated_param_model, pfilter, base_index, blocked_categories, allowed_categories,search_type=""):
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
        m_platform = (p_query_model.platform or "").strip().lower()
        m_safe_search = p_query_model.safe
        must_clauses = []
        must_not_clause = []

        date_fields = ["m_message_date", "m_leak_date", "m_creation_date"]
        if base_index and any(idx in ["chat_model", "social_model"] for idx in base_index):
            date_fields = ["m_message_date"]

        if m_date_range:
            try:
                parts = m_date_range.split(",")
                if len(parts) == 2:
                    from_date = datetime.strptime(parts[0].strip(), "%Y-%m-%d").strftime("%Y-%m-%dT00:00:00+00:00")
                    to_date = datetime.strptime(parts[1].strip(), "%Y-%m-%d").strftime("%Y-%m-%dT23:59:59+00:00")
                    must_clauses.append(elastic_request_generator.build_date_filter(from_date, to_date, date_fields))
            except ValueError:
                pass
        elif m_date_range != "":
            to_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT23:59:59+00:00")
            from_date = (datetime.now(timezone.utc) - timedelta(days=150)).strftime("%Y-%m-%dT00:00:00+00:00")
            must_clauses.append(elastic_request_generator.build_date_filter(from_date, to_date, date_fields))

        if p_query_model.category:
            m_ctype = p_query_model.category
        else:
            m_ctype = "all"

        if allowed_categories:
            if p_query_model.category not in allowed_categories:
                allowed_categories.append(p_query_model.category)

        if m_ctype != "all":
            allowed_categories = [m_ctype]
            must_clauses.append(
                {"bool": {"should": [{"bool": {"must_not": {"exists": {"field": "m_content_type"}}}},
                    {"bool": {"filter": [{"exists": {"field": "m_content_type"}},
                        {"terms": {"m_content_type": allowed_categories}}]}}], "minimum_should_match": 1}})

        if blocked_categories:
            if allowed_categories:
                must_clauses.append(
                    {"bool": {"should": [{"terms": {"m_content_type": allowed_categories}},
                        {"bool": {"must_not": {"terms": {"m_content_type": blocked_categories}}}}], "minimum_should_match": 1}})
            else:
                must_not_clause.append({"terms": {"m_content_type": blocked_categories}})

        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        if m_platform and m_platform not in ("", "all"):
            must_clauses.append({"term": {"m_platform": {"value": m_platform}}})

        if m_safe_search and m_safe_search == True:
            must_not_clause.append({"term": {"m_content_type": "adult"}})

        if m_content_type == "phishing":
            must_clauses.append({"bool": {"filter": [{"exists": {"field": "m_ioc_type"}}, {"terms": {"m_ioc_type": ["phishing"]}}]}})
        elif m_content_type == "hacked":
            must_clauses.append({"bool": {"filter": [{"exists": {"field": "m_ioc_type"}}, {"terms": {"m_ioc_type": ["hacked"]}}]}})
        elif m_content_type == "databases":
            must_not_clause.append({"terms": {"m_ioc_type": ["phishing", "hacked"]}})

        if m_content_type and m_content_type.lower() not in ("", "all"):
            must_clauses.append(
                {"bool": {"should": [
                    {"bool": {"filter": [{"exists": {"field": "content_type"}}, {"term": {"content_type": m_content_type.lower()}}]}},
                    {"bool": {"filter": [{"exists": {"field": "m_ioc_type"}}, {"terms": {"m_ioc_type": [m_content_type.lower()]}}]}}
                ], "minimum_should_match": 1}})

        phrases = re.findall(r'"([^"]+)"', p_query_model.q or "")
        quoted_value = bool(phrases) and (p_query_model.q or "").strip().startswith('"') and (
                p_query_model.q or "").strip().endswith('"')
        exact_phrases = phrases
        if search_type=="defacement":
            loose_terms=[]
        else:
            loose_terms = [] if raw_query in ("*", "") else [t for t in re.findall(r'\w+', raw_query) if t and t.strip('"')]
        phrase_fields = [("m_title", 5), ("m_content", 3), ("m_url", 2), ("m_sender_name", 2), ("m_base_url", 1),
            ("m_team", 1), ("m_attacker", 1), ("m_users", 1), ("m_network", 1), ("m_channel_name", 4)]
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
            date_field=date_field)

        unified_query["size"] = 15
        unified_query["from"] = max(0, (m_page_number - 1) * 15)

        if channel_q:
            qb = unified_query["query"]["function_score"]["query"].setdefault("bool", {"must": []})
            qb.setdefault("should", []).extend(
                [{"term": {"m_channel_name.keyword": {"value": channel_q, "boost": 7.0}}},
                    {"match_phrase": {"m_channel_name": {"query": channel_q, "slop": 1, "boost": 7.0}}}])

        query = base_index, unified_query, [b for b in
            [{ELASTIC_INDEX.S_LEAK_INDEX: 2}, {ELASTIC_INDEX.S_GENERIC_INDEX: 0.5},
                {ELASTIC_INDEX.S_EXPLOIT_INDEX: 1.4}, {ELASTIC_INDEX.S_CHATS_INDEX: 1.4},
                {ELASTIC_INDEX.S_SOCIAL_INDEX: 1.4}, {ELASTIC_INDEX.S_DEFACEMENT_INDEX: 1.4}] if
            next(iter(b)) in base_index]

        return query

    def on_search_consolidated_iocs(self, p_query_model, pfilter, base_index):
        must_clauses = []
        must_not_clause = []

        if p_query_model.ioc and p_query_model.ioc != "*":
            parsed = helper_controller.parse_tagged_logic_query_for_iocs(p_query_model.ioc)
            logic_query = self.build_es_from_tagged(parsed, ELASTIC_ENUMS.mapping_consolidated_iocs)
            must_clauses.append(logic_query)

        if p_query_model.daterange:
            parts = p_query_model.daterange.split(",")
            if len(parts) == 2:
                from_date = datetime.strptime(parts[0].strip(), "%Y-%m-%d").strftime("%Y-%m-%dT00:00:00+00:00")
                to_date = datetime.strptime(parts[1].strip(), "%Y-%m-%d").strftime("%Y-%m-%dT23:59:59+00:00")

                must_clauses.append({
                    "bool": {
                        "should": [
                            {"range": {"m_message_date": {"gte": from_date, "lte": to_date}}},
                            {"range": {"m_leak_date": {"gte": from_date, "lte": to_date}}},
                            {"range": {"m_creation_date": {"gte": from_date, "lte": to_date}}},
                        ],
                        "minimum_should_match": 1,
                    }
                })

        unified_query = self._build_query_block(
            p_query_model=p_query_model,
            pfilter=pfilter,
            raw_query="*",
            quoted_value=False,
            exact_phrases=[],
            loose_terms=[],
            phrase_fields=[],
            must_clauses=must_clauses,
            must_not_clause=must_not_clause,
            m_page_number=getattr(p_query_model, "page", 1),
            date_field="m_creation_date",
        )

        unified_query["size"] = 15
        unified_query["from"] = max(0, (getattr(p_query_model, "page", 1) - 1) * 15)

        return (
            base_index,
            unified_query,
            [
                {ELASTIC_INDEX.S_LEAK_INDEX: 2},
                {ELASTIC_INDEX.S_GENERIC_INDEX: 0.5},
                {ELASTIC_INDEX.S_EXPLOIT_INDEX: 1.4},
                {ELASTIC_INDEX.S_CHATS_INDEX: 1.4},
                {ELASTIC_INDEX.S_SOCIAL_INDEX: 1.4},
                {ELASTIC_INDEX.S_DEFACEMENT_INDEX: 1.4},
            ],
        )

    @staticmethod
    def on_search_stealerlogs_data(p_query_model: search_credential_param_model, pFilter, consolidated=False, alert=False):

        extra_user_terms = []
        extra_domains = []
        if pFilter:
            if pFilter.get('m_username'):
                extra_user_terms.extend(
                    [str(v).strip().lower() for v in pFilter['m_username'] if v and str(v).strip()])

            for key in ('m_url', 'm_domain', 'm_search_all'):
                vals = pFilter.get(key)
                if vals:
                    for v in vals:
                        s = str(v).strip()
                        if not s:
                            continue
                        extra_domains.append(s.lower())

        if alert:
            if extra_domains.__len__() > 0:
                p_query_model.url = extra_domains[0]
            elif extra_user_terms.__len__() > 0:
                p_query_model.user = extra_user_terms[0]
            p_query_model.entity_filter = {}
            if not p_query_model.user and not p_query_model.url:
                return None, None


        url = helper_controller.extract_domains_from_text(p_query_model.q)
        if len(url) > 0:
            p_query_model.url = url[0]

        user = helper_controller.extract_first_email(p_query_model.q)
        if not user:
            user = p_query_model.q

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

        category = (p_query_model.category or "").strip()
        if category and category.lower().startswith("log"):
            must_should = [{"term": {"type.keyword": "logs"}}]
        else:
            must_should = []

        if not (user_query or url_query or extra_user_terms or extra_domains):
            page = getattr(p_query_model, "page", 1) or 1
            size = getattr(p_query_model, "size", 500) or 500
            frm = (page - 1) * size
            if frm < 0:
                frm = 0

            query = {"query": {"bool": {"must": must_should if must_should else [
                {"match_all": {}}]}}, "from": frm, "size": size, "track_total_hits": False, "track_scores": False, "terminate_after": 3000, "sort": [
                {"_shard_doc": "asc"}], "_source": ["url", "username", "domain", "email", "password", "ip", "channel",
                "type", "raw", "file"]}

            return ELASTIC_INDEX.S_STEALERLOGS_INDEX, query

        date_range_filter = {}

        should_clauses = []

        if user_query:
            terms = re.findall(r'"([^"]+)"|(\S+)', user_query.lower())
            for quoted, unquoted in terms:
                term = (quoted or unquoted).lower()
                if '@' in term:
                    must_should.append(
                        {"bool": {"should": [{"term": {"email.keyword": term}}], "minimum_should_match": 1}})
                else:
                    must_should.append(
                        {"bool": {"should": [
                            {"wildcard": {"username.keyword": {"value": term.lower(), "case_insensitive": True}}}], "minimum_should_match": 1}})

        for t in extra_user_terms:
            t = t.lower()
            must_should.append(
                {"bool": {"should": [{"term": {"email.keyword": t}},
                    {"wildcard": {"username.keyword": {"value": t.lower(), "case_insensitive": True}}},
                    {"term": {"domain.keyword": t}}], "minimum_should_match": 1}})
        if url_query:
            should_clauses.append({"term": {"domain.keyword": url_query}})
        for d in extra_domains:
            should_clauses.append({"term": {"domain.keyword": d}})

        bool_query = {}
        if must_should:
            bool_query["must"] = must_should
        if should_clauses:
            bool_query.setdefault("filter", []).append(
                {"bool": {"should": should_clauses, "minimum_should_match": 1}})
        if date_range_filter:
            bool_query.setdefault("filter", []).append(date_range_filter)

        page = getattr(p_query_model, "page", 1) or 1
        size = getattr(p_query_model, "size", 500) or 500
        frm = (page - 1) * size
        if frm < 0:
            frm = 0

        if not bool_query:
            return None, None

        query = {"query": {"bool": bool_query}, "from": frm, "size": size, "sort": [
            {"_shard_doc": "asc"}], "track_total_hits": False, "track_scores": False, "_source": ["url", "username",
            "domain", "email", "password", "ip", "channel", "type", "raw", "_id", "file"]}

        return ELASTIC_INDEX.S_STEALERLOGS_INDEX, query

    from datetime import datetime

    @staticmethod
    def on_search_stealer_iocs(p_query_model):
        is_match_all = not p_query_model.ioc

        if is_match_all:
            inner_query = {"match_all": {}}
        else:
            parsed = helper_controller.parse_tagged_logic_query_for_iocs(p_query_model.ioc)
            inner_query = elastic_request_generator.build_es_from_tagged(
                parsed, ELASTIC_ENUMS.mapping_stealer_log_field
            )

        es_query = {
            "bool": {
                "must": [inner_query],
                "filter": []
            }
        }

        date_field = "date"
        date_range = getattr(p_query_model, "daterange", None)

        if date_range:
            parts = date_range.split(',')
            if len(parts) == 2:
                try:
                    from_date = datetime.strptime(parts[0].strip(), "%Y-%m-%d").strftime("%Y-%m-%d")
                    to_date = datetime.strptime(parts[1].strip(), "%Y-%m-%d").strftime("%Y-%m-%d")
                    es_query["bool"]["filter"].append({
                        "range": {date_field: {"gte": from_date, "lte": to_date}}
                    })
                except ValueError:
                    pass

        page = getattr(p_query_model, "page", 1) or 1
        size = (getattr(p_query_model, "size", None) or (100 if is_match_all else 500))
        frm = max((page - 1) * size, 0)

        query_body = {
            "query": es_query,
            "from": frm,
            "size": size,
            "sort": ["_doc"],
            "track_total_hits": False,
        }

        return ELASTIC_INDEX.S_STEALERLOGS_INDEX, query_body


    @staticmethod
    def clear_expire_index():
        utc_now = datetime.now(timezone.utc)
        threshold_time = utc_now - timedelta(seconds=CONSTANTS.S_SETTINGS_INDEX_EXPIRY)
        return {"query": {"range": {"m_update_date": {"lt": threshold_time.isoformat()}}}}

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
                (p_index_data["m_important_content"] + p_index_data["m_title"]).encode()).hexdigest()
            p_index_data["m_hash_url"] = hashlib.sha256(
                (p_index_data["m_url"] + p_index_data["m_title"]).encode()).hexdigest()
            data_hash = helper_controller.generate_data_hash(p_index_data["m_url"])
            p_index_data["m_hash"] = data_hash

            index_entries.append(
                {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_VALUE: p_index_data, })

        return index_entries

    @staticmethod
    def index_query_chat(p_index_data):
        index_entries = []
        for chat in p_index_data.get("m_chat_data", []):
            if not chat.get("m_message_id"):
                continue

            chat["m_hash"] = helper_controller.generate_data_hash(chat.get("m_message_id"))
            index_entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_KEYS.S_VALUE: chat})

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
            index_entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_SOCIAL_INDEX, ELASTIC_KEYS.S_VALUE: post})
        return index_entries

    @staticmethod
    def index_query_sanctions(p_index_data):
        index_entries = []

        if isinstance(p_index_data, list):
            for item in p_index_data:
                if not isinstance(item, dict):
                    continue

                data = {k: v for k, v in item.items() if v is not None}
                schema_value = data.pop("schema_name", None)
                if schema_value:
                    data["schema"] = schema_value

                identifier = data.get("id")
                if not identifier:
                    continue

                data["m_hash"] = helper_controller.generate_data_hash(str(identifier))
                index_entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_OPENSANCTIONS_INDEX, ELASTIC_KEYS.S_VALUE: data})

            return index_entries

        if not isinstance(p_index_data, dict):
            return index_entries

        data = {k: v for k, v in p_index_data.items() if v is not None}
        schema_value = data.pop("schema_name", None)
        if schema_value:
            data["schema"] = schema_value

        identifier = data.get("id")
        if not identifier:
            return index_entries

        data["m_hash"] = helper_controller.generate_data_hash(str(identifier))
        index_entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_OPENSANCTIONS_INDEX, ELASTIC_KEYS.S_VALUE: data})
        return index_entries

    @staticmethod
    def index_query_stealerlog(p_index_data):
        bulk_entries = []
        # bf = bloom_controller(dirpath="bloom_data", capacity=1_000_000_000, error_rate=0.01)

        for log in p_index_data["logs"]:

            m_hash = log["m_hash"]
            _id = str(datetime.utcnow().year) + "_UTC_" + m_hash

            # if bf.isduplicate(m_hash):
            #     continue
            #
            doc = {}
            for k in log:
                if log[k] is not None:
                    doc[k] = log[k]

            bulk_entries.append({"create": {"_index": ELASTIC_INDEX.S_STEALERLOGS_INDEX, "_id": _id}})
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
                {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_VALUE: record, })
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

            index_entries.append(
                {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_VALUE: cleaned_card, })

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

            index_entries.append(
                {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_EXPLOIT_INDEX, ELASTIC_KEYS.S_VALUE: cleaned_card, })

        return index_entries

    @staticmethod
    def generate_graph_queries():
        queries = [
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"term": {"m_content_type": "leaks"}}, "aggs": {"Top Teams (Leak)": {"terms": {"field": "m_team", "size": 4}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Top Teams (Defacement)": {"terms": {"field": "m_team", "size": 4}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Top Locations (Defacement)": {"terms": {"field": "m_location", "size": 4}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Top Hashtags (Social)": {"terms": {"field": "m_hashtags", "size": 4}}}}}]

        return queries

    @staticmethod
    def generate_insight_queries():
        queries = [
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Document Count": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Most Recent": {"max": {"field": "m_update_date"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Oldest Update": {"min": {"field": "m_update_date"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_update_date": {"gte": "now-5d/d"}}}, "aggs": {"Updated 5 Days ago": {"value_count": {"field": "m_hash"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_update_date": {"gte": "now-10d/d"}}}, "aggs": {"Updated 9 Days ago": {"value_count": {"field": "m_hash"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Average Score": {"avg": {"field": "m_validity_score"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"URL/Document": {"value_count": {"field": "m_sub_url"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Archive/Document": {"value_count": {"field": "m_archive_url"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Email/Document": {"value_count": {"field": "m_email"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Phone/Document": {"value_count": {"field": "m_phone_number"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Clearnet/Document": {"value_count": {"field": "m_clearnet_links"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Common Type": {"terms": {"field": "m_content_type", "size": 1}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Document Count": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Unique Base URLs": {"value_count": {"field": "m_base_url"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"URL/Documents": {"value_count": {"field": "m_weblink"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Dumps/Document": {"value_count": {"field": "m_dumplink"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_update_date": {"gte": "now-5d/d"}}}, "aggs": {"Updated 5 Days ago": {"value_count": {"field": "m_hash"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_update_date": {"gte": "now-10d/d"}}}, "aggs": {"Updated 9 Days ago": {"value_count": {"field": "m_hash"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Most Recent": {"max": {"field": "m_update_date"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Oldest Update": {"min": {"field": "m_update_date"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Document Count": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_leak_date": {"gte": "now-5d/d"}}}, "aggs": {"Updated 5 Days ago": {"value_count": {"field": "m_hash"}}}, }, },
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Top Team": {"terms": {"field": "m_team", "size": 1}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Common Server": {"terms": {"field": "m_web_server", "size": 1}}}}}]

        return queries
