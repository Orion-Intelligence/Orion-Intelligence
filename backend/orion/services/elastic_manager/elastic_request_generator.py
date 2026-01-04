from __future__ import annotations
from datetime import datetime, timezone, timedelta
import re
import hashlib

from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import search_credential_param_model
from orion.constants.constant import CONSTANTS, allowed_keys
from orion.constants.enum import ChannelTypeEnum
from orion.helper_manager.env_handler import env_handler
from orion.helper_manager.helper_controller import helper_controller
from orion.services.bloom_manager.bloom_controller import bloom_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS, ELASTIC_INDEX, ELASTIC_SEMANTIC
from orion.services.elastic_manager.elastic_semantic_controller import elastic_semantic_controller


class elastic_request_generator:

    @staticmethod
    def apply_matchtype(p_query_model):
        if getattr(p_query_model, "matchtype", None):
            p_query_model.q = helper_controller.transform_query_match(p_query_model.q, p_query_model.matchtype)

    @staticmethod
    def prepare_raw_query(q: str | None) -> str:
        if not q or q == "*" or q.strip() == "":
            return "*"
        return helper_controller.remove_stopwords_from_string(q)

    @staticmethod
    def extract_phrases_terms_quoted(raw_query: str):
        exact_phrases = re.findall(r'"([^"]+)"', raw_query)
        loose_terms = re.sub(r'"[^"]+"', '', raw_query).strip().split()
        quoted_match = re.fullmatch(r'"([^"]+)"', raw_query.strip())
        quoted_value = quoted_match.group(1) if quoted_match else None
        return exact_phrases, loose_terms, quoted_value

    @staticmethod
    def date_range_must(daterange: str | None, date_field: str, iso_format: bool = False) -> list:
        if not daterange:
            return []
        parts = daterange.split(",")
        if len(parts) != 2:
            return []
        try:
            from_obj = datetime.strptime(parts[0].strip(), "%Y-%m-%d")
            to_obj = datetime.strptime(parts[1].strip(), "%Y-%m-%d")
            fmt = "%Y-%m-%dT%H:%M:%S.%f+00:00" if iso_format else "%Y-%m-%d"
            return [{"range": {date_field: {"gte": from_obj.strftime(fmt), "lte": to_obj.strftime(fmt)}}}]
        except ValueError:
            return []

    @staticmethod
    def network_must(network: str | None) -> list:
        if network and network.lower() not in ("", "all"):
            return [{"term": {"m_network": network.lower()}}]
        return []

    @staticmethod
    def safe_search_must_not(safe: bool | None) -> list:
        if safe:
            return [{"term": {"m_content_type": "adult"}}]
        return []

    @staticmethod
    def common_keyword_search(
        p_query_model,
        pfilter,
        index: str,
        date_field: str,
        phrase_fields: list[tuple[str, int]],
        extra_must: list | None = None,
        extra_must_not: list | None = None,
        iso_date: bool = False,
    ):
        elastic_request_generator.apply_matchtype(p_query_model)
        raw_query = elastic_request_generator.prepare_raw_query(getattr(p_query_model, "q", None))
        exact_phrases, loose_terms, quoted_value = elastic_request_generator.extract_phrases_terms_quoted(raw_query)

        must_clauses = (extra_must or [])[:]
        must_not_clause = (extra_must_not or [])[:]

        must_clauses.extend(elastic_request_generator.network_must(getattr(p_query_model, "network", None)))
        must_clauses.extend(elastic_request_generator.date_range_must(getattr(p_query_model, "daterange", None), date_field, iso_date))

        m_page_number = getattr(p_query_model, "page", 1)

        return index, elastic_request_generator._build_query_block(
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
            date_field=date_field,
        )

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
                    content_query["bool"]["should"].append(
                        {"bool": {"should": [{"match_phrase": {field: {"query": phrase, "boost": boost}}} for field, boost in phrase_fields], "minimum_should_match": 1}})
            else:
                for phrase in exact_phrases:
                    must_clauses.append(
                        {"bool": {"should": [{"match_phrase": {field: {"query": phrase, "boost": boost}}} for field, boost in phrase_fields], "minimum_should_match": 1}})
                for term in loose_terms:
                    content_query["bool"]["should"].append(
                        {"multi_match": {"query": term.lower(), "fields": multi_fields, "type": "best_fields", "operator": "OR"}})
                    for kf in ["m_location", "m_attacker", "m_team", "m_web_server", "m_network", "m_ip"]:
                        content_query["bool"]["should"].append(
                            {"term": {kf: {"value": term, "case_insensitive": True, "boost": 3}}})
                if not exact_phrases and not loose_terms:
                    content_query = {"multi_match": {"query": raw_query.lower(), "fields": multi_fields, "type": "best_fields", "operator": "OR"}}

        must_filter_clauses, should_filter_clauses = helper_controller.getFilterClause(pfilter, p_query_model, allowed_keys)

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
                    candidates.add(f"https://{u}")
                    candidates.add(f"http://{u}")
                    candidates.add(u)
                expanded = set()
                for c in candidates:
                    expanded.add(c)
                    expanded.add(c.rstrip("/") + "/")
                for fld in url_fields:
                    for c in expanded:
                        url_shoulds.append({"term": {fld: c}})
                        url_shoulds.append({"prefix": {fld: {"value": c, "boost": 5}}})
            if url_shoulds:
                must_filter_clauses.append({"bool": {"should": url_shoulds, "minimum_should_match": 1}})

        base_bool_query = {"must": [content_query] if isinstance(content_query, dict) and content_query else [], "filter": must_clauses + must_filter_clauses, "must_not": must_not_clause}

        if not getattr(p_query_model, "must", False) and should_filter_clauses:
            base_bool_query.setdefault("should", []).extend([should_filter_clauses] if isinstance(should_filter_clauses, dict) else should_filter_clauses)

        functions_block = [{"gauss": {date_field: {"origin": "now", "scale": "45d", "offset": "7d", "decay": 0.7}}, "weight": 0.1}] if p_query_model.matchtype != "semantic" else []

        query_statement = {
            "min_score": 0,
            "query": {
                "function_score": {
                    "query": {"bool": base_bool_query},
                    **({"functions": functions_block} if functions_block else {}),
                    "score_mode": "sum",
                    "boost_mode": "multiply",
                }
            },
            "from": max(0, (m_page_number - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC),
            "size": CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE,
            "track_total_hits": True,
            "explain": True,
        }

        if raw_query != "*" and env_handler.get_instance().env("SEMANTIC_ENABLED") == "1" and p_query_model.matchtype == "semantic":
            try:
                qvec = elastic_semantic_controller.get_instance().embed_query_sync(p_query_model.q)
                if qvec:
                    knn_clause = {
                        "knn": {
                            "field": ELASTIC_SEMANTIC.S_EMBED_FIELD,
                            "k": CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE,
                            "num_candidates": 1000,
                            "query_vector": qvec,
                            "filter": {"bool": {"filter": must_filter_clauses}},
                        }
                    }
                    query_statement["query"]["function_score"]["query"] = knn_clause
                    query_statement["query"]["function_score"]["script_score"] = {
                        "script": {
                            "source": "double s=_score; double eps=1e-9; s=Math.max(eps, Math.min(1.0-eps, s)); double a=params.a; double t=params.t; double z=0.5*(1.0+Math.tanh(a*(s-t))); return z;",
                            "params": {"a": 10.0, "t": 0.8},
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
            for key in ("m_url", "m_domain", "m_ip", "m_search_all"):
                vals = pFilter.get(key, [])
                domains.extend([str(v) for v in (vals if isinstance(vals, list) else [vals]) if str(v)])

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
                            {"wildcard": {"m_url.raw": {"value": f"*{domain_part}*", "case_insensitive": True}}},
                            {"wildcard": {"m_domain.raw": {"value": f"*{domain_part}*", "case_insensitive": True}}},
                            {"wildcard": {"m_ip.raw": {"value": f"*{domain_part}*", "case_insensitive": True}}},
                        ]
                    }
                },
                "aggs": {"by_ioc_type": {"terms": {"field": "m_ioc_type", "size": 10}, "aggs": {"top_hits_per_type": {"top_hits": {"size": 4, "sort": [{"m_leak_date": {"order": "desc"}}]}}}}},
            }

        if p_query_model.daterange:
            must_clauses.extend(elastic_request_generator.date_range_must(p_query_model.daterange, "m_leak_date"))

        query_statement = {
            "size": 0,
            "query": {"bool": {"must": must_clauses or [{"match_all": {}}]}},
            "aggs": domain_aggs,
            "track_total_hits": False,
        }
        return ELASTIC_INDEX.S_DEFACEMENT_INDEX, query_statement

    def on_search_defacement_data(self, p_query_model: search_defacement_param_model, pfilter=None):
        extra_must = []
        extra_must_not = []

        if p_query_model.content == "phishing":
            extra_must.append({"terms": {"m_ioc_type": ["phishing"]}})
        elif p_query_model.content == "hacked":
            extra_must.append({"terms": {"m_ioc_type": ["hacked"]}})
        elif p_query_model.content == "databases":
            extra_must_not.append({"terms": {"m_ioc_type": ["phishing", "hacked"]}})
        elif p_query_model.content:
            extra_must.append({"terms": {"m_ioc_type": ["none"]}})

        if p_query_model.attacker:
            extra_must.append({"terms": {"m_attacker": [p_query_model.attacker]}})
        if p_query_model.team:
            extra_must.append({"terms": {"m_team": [p_query_model.team]}})

        phrase_fields = [
            ("m_location", 3), ("m_content", 5), ("m_web_url", 3), ("m_base_url", 3), ("m_url", 3),
            ("m_ip", 5), ("m_web_server", 3), ("m_attacker", 5), ("m_team", 5), ("m_network", 3), ("m_mirror_links", 3),
        ]

        return self.common_keyword_search(
            p_query_model, pfilter, ELASTIC_INDEX.S_DEFACEMENT_INDEX, "m_leak_date", phrase_fields, extra_must, extra_must_not
        )

    def on_search_consolidated_ranked_data(self, p_query_model: search_consolidated_param_model, pfilter, base_index, blocked_categories, allowed_categories):
        self.apply_matchtype(p_query_model)

        raw_query = self.prepare_raw_query(p_query_model.q)
        m_page_number = getattr(p_query_model, "page", 1)
        must_clauses = []
        must_not_clause = []

        # date range - multi-field
        if p_query_model.daterange:
            try:
                parts = p_query_model.daterange.split(",")
                if len(parts) == 2:
                    from_date = datetime.strptime(parts[0].strip(), "%Y-%m-%d").strftime("%Y-%m-%dT00:00:00+00:00")
                    to_date = datetime.strptime(parts[1].strip(), "%Y-%m-%d").strftime("%Y-%m-%dT23:59:59+00:00")
                    must_clauses.append(
                        {"bool": {"should": [
                            {"bool": {"filter": [{"exists": {"field": "m_message_date"}}, {"range": {"m_message_date": {"gte": from_date, "lte": to_date}}}]}},
                            {"bool": {"filter": [{"exists": {"field": "m_leak_date"}}, {"range": {"m_leak_date": {"gte": from_date, "lte": to_date}}}]}},
                            {"bool": {"filter": [{"exists": {"field": "m_creation_date"}}, {"range": {"m_creation_date": {"gte": from_date, "lte": to_date}}}]}},
                        ], "minimum_should_match": 1}})
            except ValueError:
                pass
        else:
            to_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT23:59:59+00:00")
            from_date = (datetime.now(timezone.utc) - timedelta(days=150)).strftime("%Y-%m-%dT00:00:00+00:00")
            must_clauses.append(
                {"bool": {"should": [
                    {"bool": {"filter": [{"exists": {"field": "m_message_date"}}, {"range": {"m_message_date": {"gte": from_date, "lte": to_date}}}]}},
                    {"bool": {"filter": [{"exists": {"field": "m_leak_date"}}, {"range": {"m_leak_date": {"gte": from_date, "lte": to_date}}}]}},
                    {"bool": {"filter": [{"exists": {"field": "m_creation_date"}}, {"range": {"m_creation_date": {"gte": from_date, "lte": to_date}}}]}},
                ], "minimum_should_match": 1}})

        # category handling
        m_ctype = p_query_model.category or "all"
        if m_ctype != "all":
            allowed_categories = [m_ctype]
            must_clauses.append(
                {"bool": {"should": [
                    {"bool": {"must_not": {"exists": {"field": "m_content_type"}}}},
                    {"bool": {"filter": [{"exists": {"field": "m_content_type"}}, {"terms": {"m_content_type": allowed_categories}}]}},
                ], "minimum_should_match": 1}})

        if blocked_categories:
            if allowed_categories:
                must_clauses.append(
                    {"bool": {"should": [{"terms": {"m_content_type": allowed_categories}},
                                         {"bool": {"must_not": {"terms": {"m_content_type": blocked_categories}}}}], "minimum_should_match": 1}})
            else:
                must_not_clause.append({"terms": {"m_content_type": blocked_categories}})

        must_clauses.extend(self.network_must(p_query_model.network))
        must_not_clause.extend(self.safe_search_must_not(p_query_model.safe))

        if hasattr(p_query_model, "platform") and p_query_model.platform:
            must_clauses.append({"term": {"m_platform": p_query_model.platform}})
        if hasattr(p_query_model, "attacker") and p_query_model.attacker:
            must_clauses.append({"terms": {"m_attacker": [p_query_model.attacker]}})
        if hasattr(p_query_model, "team") and p_query_model.team:
            must_clauses.append({"terms": {"m_team": [p_query_model.team]}})

        if getattr(p_query_model, "content", None) and p_query_model.content.lower() not in ("", "all"):
            must_clauses.append({"bool": {"filter": [{"exists": {"field": "content_type"}}, {"term": {"content_type": p_query_model.content.lower()}}]}})

        exact_phrases, loose_terms, quoted_value = self.extract_phrases_terms_quoted(raw_query)
        phrase_fields = [("m_title", 5), ("m_content", 3), ("m_url", 2), ("m_sender_name", 2), ("m_base_url", 1),
                         ("m_team", 1), ("m_attacker", 1), ("m_users", 1), ("m_network", 1), ("m_channel_name", 4)]

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
            date_field="m_creation_date",
        )

        unified_query["size"] = 15
        unified_query["from"] = max(0, (m_page_number - 1) * 15)

        if channel_q := (p_query_model.q if p_query_model.q and p_query_model.q != "*" else None):
            qb = unified_query["query"]["function_score"]["query"]["bool"]
            qb.setdefault("should", []).extend(
                [{"term": {"m_channel_name.keyword": {"value": channel_q, "boost": 7.0}}},
                 {"match_phrase": {"m_channel_name": {"query": channel_q, "slop": 1, "boost": 7.0}}}])

        boosts = [b for b in [
            {ELASTIC_INDEX.S_LEAK_INDEX: 2}, {ELASTIC_INDEX.S_GENERIC_INDEX: 0.5}, {ELASTIC_INDEX.S_EXPLOIT_INDEX: 1.4},
            {ELASTIC_INDEX.S_CHATS_INDEX: 1.4}, {ELASTIC_INDEX.S_SOCIAL_INDEX: 1.4},
            {ELASTIC_INDEX.S_DEFACEMENT_INDEX: 1.4}] if next(iter(b)) in base_index]

        return base_index, unified_query, boosts

    def on_search_consolidated_data(self, p_query_model, pFilter=None):
        queries = []
        indices = []
        labels = []

        for model, index, label in [
            ("databases", ELASTIC_INDEX.S_LEAK_INDEX, "leak_model"),
            (None, ELASTIC_INDEX.S_GENERIC_INDEX, "generic_model"),
            (None, ELASTIC_INDEX.S_EXPLOIT_INDEX, "exploit_model"),
            (None, ELASTIC_INDEX.S_CHATS_INDEX, "chat_model"),
            (None, ELASTIC_INDEX.S_SOCIAL_INDEX, "social_model"),
        ]:
            m = helper_controller.clone_model(p_query_model)
            if model is not None:
                m.category = model
            i, q = {
                ELASTIC_INDEX.S_LEAK_INDEX: self.on_search_leakdata,
                ELASTIC_INDEX.S_GENERIC_INDEX: self.on_search_general_data,
                ELASTIC_INDEX.S_EXPLOIT_INDEX: self.on_search_exploitdata,
                ELASTIC_INDEX.S_CHATS_INDEX: self.on_search_telegram_data,
                ELASTIC_INDEX.S_SOCIAL_INDEX: lambda m, f: self.on_search_social_data(m, f, ELASTIC_INDEX.S_SOCIAL_INDEX),
            }[index](m, pFilter)
            queries.append(helper_controller.strip_query(q))
            indices.append(i)
            labels.append(label)

        domain_query_index, domain_query = self.on_bulk_domain_lookup(p_query_model, pFilter)
        queries.append(domain_query)
        indices.append(domain_query_index)
        labels.append("defacement_model")

        for cat, lab in [("tracking", "tracking_model"), ("news", "news_model")]:
            m = helper_controller.clone_model(p_query_model)
            m.category = cat
            i, q = self.on_search_leakdata(m, pFilter)
            queries.append(helper_controller.strip_query(q))
            indices.append(i)
            labels.append(lab)

        return indices, queries, labels

    def on_search_leakdata(self, p_query_model, pfilter=None):
        extra_must = []
        extra_must_not = self.safe_search_must_not(getattr(p_query_model, "safe", None))

        m_search_type = getattr(p_query_model, "category", "all")
        if m_search_type == "databases":
            m_search_type = "leaks"
        if m_search_type != "all":
            extra_must.append({"terms": {"m_content_type": [m_search_type]}})

        if getattr(p_query_model, "content", None) and p_query_model.content.lower() not in ("", "all"):
            extra_must.append({"term": {"content_type": p_query_model.content.lower()}})

        phrase_fields = [("m_title", 5), ("m_content", 3), ("m_important_content", 4), ("m_ref_html", 2)]

        return self.common_keyword_search(
            p_query_model, pfilter, ELASTIC_INDEX.S_LEAK_INDEX, "m_leak_date", phrase_fields, extra_must, extra_must_not, iso_date=True
        )

    def on_search_exploitdata(self, p_query_model, pfilter=None):
        extra_must = []

        category = getattr(p_query_model, "category", None)
        if category and category != "all":
            category_list = category if isinstance(category, list) else [category]
            extra_must.append({"terms": {"m_content_type": category_list}})

        if getattr(p_query_model, "content", None) and p_query_model.content.lower() not in ("", "all"):
            extra_must.append({"term": {"content_type": p_query_model.content.lower()}})

        phrase_fields = [("m_title", 3), ("m_content", 5), ("m_important_content", 3), ("m_ref_html", 3)]

        return self.common_keyword_search(
            p_query_model, pfilter, ELASTIC_INDEX.S_EXPLOIT_INDEX, "m_leak_date", phrase_fields, extra_must, [], iso_date=True
        )

    def on_search_social_data(self, p_query_model, pfilter=None, p_index=None, must_clauses=None, must_not_clause=None):
        if p_query_model.matchtype == "semantic" and p_query_model.platform == "pastebin":
            p_query_model.matchtype = "or"

        extra_must = must_clauses or []
        extra_must_not = must_not_clause or []

        if getattr(p_query_model, "platform", None):
            extra_must.append({"term": {"m_platform": p_query_model.platform}})

        if getattr(p_query_model, "content", None) and p_query_model.content.lower() not in ("", "all"):
            extra_must.append({"term": {"content_type": p_query_model.content.lower()}})

        phrase_fields = [("m_title", 8), ("m_content", 4), ("m_sender_name", 3)]

        return self.common_keyword_search(
            p_query_model,
            pfilter,
            p_index or ELASTIC_INDEX.S_SOCIAL_INDEX,
            "m_message_date",
            phrase_fields,
            extra_must,
            extra_must_not,
            iso_date=True,
        )

    @staticmethod
    def on_search_telegram_data(p_query_model, pfilter=None):
        elastic_request_generator.apply_matchtype(p_query_model)
        raw_query = elastic_request_generator.prepare_raw_query(p_query_model.q)

        must_clauses = []
        must_not_clause = []

        if getattr(p_query_model, "content", None) != "all":
            must_clauses.append({"term": {"m_content_type": getattr(p_query_model, "content")}})

        ctype = getattr(p_query_model, "category", "all")
        if ctype != "all":
            channel_enum = ChannelTypeEnum.__members__.get(ctype.upper())
            channel_ids = channel_enum.value if channel_enum else [""]
            must_clauses.append({"terms": {"m_channel_id": channel_ids}})

        must_clauses.extend(elastic_request_generator.date_range_must(getattr(p_query_model, "daterange", None), "m_message_date", iso_date=True))

        if getattr(p_query_model, "content", None) and p_query_model.content.lower() not in ("", "all"):
            must_clauses.append({"term": {"content_type": p_query_model.content.lower()}})

        search_fields = ["m_content^3", "m_caption^2.5", "m_channel_name^2", "m_media_caption^2", "m_forwarded_from^1.2",
                         "m_sender_name^1.1", "m_file_name^1.0", "m_ref_html^0.8"]

        if p_query_model.matchtype == "semantic" or raw_query == "*":
            query_string_query = {"match_all": {}}
        elif '"' in raw_query:
            query_string_query = {"query_string": {"query": raw_query, "fields": search_fields, "default_operator": "OR", "analyze_wildcard": False, "auto_generate_synonyms_phrase_query": False, "lenient": True}}
        else:
            query_string_query = {"multi_match": {"query": raw_query, "fields": search_fields, "type": "best_fields", "operator": "OR"}}

        must_filter_clauses, should_filter_clauses = helper_controller.getFilterClause(pfilter, p_query_model, allowed_keys)

        m_page_number = getattr(p_query_model, "page", 1)

        query = {
            "min_score": 0,
            "query": {
                "function_score": {
                    "query": {
                        "bool": {
                            "must": [query_string_query] if query_string_query else [],
                            "filter": must_clauses + must_filter_clauses + (
                                [{"bool": {"should": should_filter_clauses.get("bool", {}).get("should", []), "minimum_should_match": 1}}]
                                if not getattr(p_query_model, "must", False) and should_filter_clauses else []
                            ),
                            "must_not": must_not_clause,
                            "should": [
                                {"wildcard": {"m_content.keyword": {"value": f"*{raw_query}*", "boost": 1.5, "case_insensitive": True}}},
                                {"wildcard": {"m_channel_name": {"value": f"*{raw_query}*", "boost": 2.0, "case_insensitive": True}}},
                                {"term": {"m_channel_name": {"value": raw_query, "boost": 5.0}}},
                            ],
                            "minimum_should_match": 0,
                        }
                    },
                    "functions": [{"gauss": {"m_message_date": {"origin": "now", "scale": "90d", "offset": "10d", "decay": 0.5}}, "weight": 1}],
                    "score_mode": "sum",
                    "boost_mode": "multiply",
                }
            },
            "highlight": {} if raw_query == "*" else {
                "fields": {
                    "m_content": {"fragment_size": 250, "number_of_fragments": 3, "pre_tags": ["<em>"], "post_tags": ["</em>"]},
                    "m_caption": {"fragment_size": 250, "number_of_fragments": 3, "pre_tags": ["<em>"], "post_tags": ["</em>"]},
                    "m_ref_html": {"fragment_size": 250, "number_of_fragments": 3, "pre_tags": ["<em>"], "post_tags": ["</em>"]},
                }
            },
            "from": max(0, (m_page_number - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC),
            "size": CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE,
            "track_total_hits": True,
            "explain": True,
        }

        if raw_query != "*" and p_query_model.matchtype == "semantic" and env_handler.get_instance().env("SEMANTIC_ENABLED") == "1":
            try:
                qvec = elastic_semantic_controller.get_instance().embed_query_sync(p_query_model.q)
                if qvec:
                    query["query"]["function_score"]["query"]["bool"]["must"].append({
                        "knn": {"field": ELASTIC_SEMANTIC.S_EMBED_FIELD, "k": CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE, "num_candidates": 1000, "query_vector": qvec}
                    })
            except Exception:
                pass

        return ELASTIC_INDEX.S_CHATS_INDEX, query

    @staticmethod
    def on_search_credentials_data(p_query_model):
        raw_query = p_query_model.q if p_query_model.q and p_query_model.q != "*" else ""
        if raw_query:
            raw_query = helper_controller.remove_stopwords_from_string(raw_query)

        return ELASTIC_INDEX.S_CREDENTIAL_INDEX, {
            "query": {"bool": {"should": [{"match": {"u": {"query": raw_query, "boost": 2.0}}}], "minimum_should_match": 1}},
            "from": max(0, (getattr(p_query_model, "page", 1) - 1) * 1),
            "size": 1,
            "track_total_hits": True,
        }

    @staticmethod
    def on_search_stealerlogs_data(p_query_model: search_credential_param_model, pFilter, consolidated=False):
        url = helper_controller.extract_domains_from_text(p_query_model.q)
        if url:
            p_query_model.url = url[0]

        user = helper_controller.extract_first_email(p_query_model.q)
        if not p_query_model.user and user:
            p_query_model.user = user

        if not p_query_model.url and not p_query_model.user and consolidated:
            return None, None

        user_query = p_query_model.user.strip() if p_query_model.user and p_query_model.user != "*" else ""
        raw_url = p_query_model.url.strip() if p_query_model.url else ""
        url_query = re.sub(r'^(?:[a-zA-Z0-9+.-]+://)?(?:www\.)?', '', raw_url)
        url_query = re.split(r'[/:?#]', url_query)[0].lower() if raw_url else ""

        extra_user_terms = []
        extra_domains = []
        if pFilter:
            if pFilter.get('m_username'):
                extra_user_terms.extend([str(v).strip().lower() for v in pFilter['m_username'] if v])
            for key in ('m_url', 'm_domain', 'm_search_all'):
                vals = pFilter.get(key)
                if vals:
                    for v in (vals if isinstance(vals, list) else [vals]):
                        s = str(v).strip()
                        if s:
                            u2 = re.sub(r'^(?:[a-zA-Z0-9+.-]+://)?(?:www\.)?', '', s)
                            d2 = re.split(r'[/:?#]', u2)[0].lower()
                            if re.match(r'^[a-z0-9.-]+\.[a-z]{2,}$', d2):
                                extra_domains.append(d2)

        must_should = [{"terms": {"type.keyword": ["c", "credential"]}}] if (p_query_model.category or "").strip().lower() not in ("log", "logs") else [{"term": {"type.keyword": "logs"}}]

        should_clauses = []

        if p_query_model.fullsearch:
            if user_query:
                user_query = re.sub(r'(\S+@\S+)', lambda m: m.group(1).replace('@', ' '), user_query).lower()
                for term in re.findall(r'"([^"]+)"|(\S+)', user_query):
                    term = (term[0] or term[1]).lower()
                    must_should.append({"bool": {"should": [{"wildcard": {"raw.keyword": {"value": f"*{term}*", "case_insensitive": True}}}]}})
            for t in extra_user_terms:
                must_should.append({"bool": {"should": [{"wildcard": {"raw.keyword": {"value": f"*{t}*", "case_insensitive": True}}}]}})
            if url_query:
                should_clauses.append({"term": {"domain": url_query}})
            should_clauses.extend({"term": {"domain": d}} for d in extra_domains)
        else:
            if user_query:
                for term in re.findall(r'"([^"]+)"|(\S+)', user_query.lower()):
                    term = (term[0] or term[1]).lower()
                    if '@' in term:
                        must_should.append({"bool": {"should": [{"term": {"email.keyword": term}}]}})
                    else:
                        must_should.append({"bool": {"should": [{"term": {"username.keyword": term}}]}})
            for t in extra_user_terms:
                must_should.append({"bool": {"should": [{"term": {"email": t}}, {"term": {"username": t}}, {"term": {"domain": t}}]}})
            if url_query:
                should_clauses.append({"term": {"domain": url_query}})
            should_clauses.extend({"term": {"domain": d}} for d in extra_domains)

        bool_query = {}
        if must_should:
            bool_query["must"] = must_should
        if should_clauses:
            bool_query["should"] = should_clauses
            bool_query["minimum_should_match"] = 1

        page = getattr(p_query_model, "page", 1) or 1
        size = getattr(p_query_model, "size", 100) or 100
        frm = max(0, (page - 1) * size)

        query = {
            "query": {"bool": bool_query},
            "from": frm,
            "size": size,
            "track_total_hits": True,
            "collapse": {"field": "username.keyword"},
            "_source": ["url", "username", "domain", "email", "password", "ip", "channel", "type", "raw", "_id", "file"],
        }

        if not (user_query or url_query or extra_user_terms or extra_domains):
            query["sort"] = ["_doc"]

        return ELASTIC_INDEX.S_STEALERLOGS_INDEX, query

    def on_search_general_data(self, p_query_model, pfilter=None):
        extra_must = []
        extra_must_not = self.safe_search_must_not(getattr(p_query_model, "safe", None))

        m_search_type = getattr(p_query_model, "category", "general")
        if m_search_type != "all" and m_search_type != "general":
            extra_must.append({"terms": {"m_content_type": [m_search_type]}})

        if getattr(p_query_model, "content", None) and p_query_model.content.lower() not in ("", "all"):
            extra_must.append({"term": {"content_type": p_query_model.content.lower()}})

        phrase_fields = [("m_title", 5), ("m_content", 3), ("m_url", 2), ("m_base_url", 1)]

        return self.common_keyword_search(
            p_query_model, pfilter, ELASTIC_INDEX.S_GENERIC_INDEX, "m_creation_date", phrase_fields, extra_must, extra_must_not
        )

    @staticmethod
    def clear_expire_index():
        threshold = (datetime.now(timezone.utc) - timedelta(seconds=CONSTANTS.S_SETTINGS_INDEX_EXPIRY)).isoformat()
        return {"query": {"range": {"m_update_date": {"lt": threshold}}}}

    @staticmethod
    def common_index_cards(p_index_data, index, hash_fields=("m_url",)):
        entries = []
        current_timestamp = datetime.now(timezone.utc).isoformat()
        contact_link = p_index_data.get("contact_link", "")

        for card in p_index_data.get("cards_data", []):
            if not card.get("m_url") or not card.get("m_title"):
                continue
            hash_str = "_".join(str(card.get(f, "")) for f in hash_fields)
            card["m_hash"] = helper_controller.generate_data_hash(hash_str)
            card["m_update_date"] = current_timestamp
            card["m_contact_link"] = contact_link
            cleaned = {k: v for k, v in card.items() if v is not None}
            entries.append({ELASTIC_KEYS.S_DOCUMENT: index, ELASTIC_KEYS.S_VALUE: cleaned})
        return entries

    @staticmethod
    def index_query_general(p_index_data):
        if isinstance(p_index_data, list):
            return []
        if not p_index_data.get("m_important_content") or not p_index_data.get("m_title"):
            return []
        current_timestamp = datetime.now(timezone.utc).isoformat()
        p_index_data["m_update_date"] = current_timestamp
        p_index_data["m_hash_content"] = hashlib.sha256((p_index_data["m_important_content"] + p_index_data["m_title"]).encode()).hexdigest()
        p_index_data["m_hash_url"] = hashlib.sha256((p_index_data["m_url"] + p_index_data["m_title"]).encode()).hexdigest()
        p_index_data["m_hash"] = helper_controller.generate_data_hash(p_index_data["m_url"])
        return [{ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_VALUE: p_index_data}]

    @staticmethod
    def index_query_chat(p_index_data):
        entries = []
        for chat in p_index_data.get("m_chat_data", []):
            if chat.get("m_message_id"):
                chat["m_hash"] = helper_controller.generate_data_hash(chat.get("m_message_id"))
                entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_KEYS.S_VALUE: chat})
        return entries

    @staticmethod
    def index_query_social(p_index_data):
        entries = []
        for post in p_index_data.get("cards_data", []):
            m_hash = post.get("m_message_id") or (post.get("m_title") + "_" + post.get("m_channel_url"))
            if m_hash:
                post["m_hash"] = helper_controller.generate_data_hash(m_hash)
                entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_SOCIAL_INDEX, ELASTIC_KEYS.S_VALUE: post})
        return entries

    @staticmethod
    def index_query_credential(p_index_data):
        now = datetime.now(timezone.utc).isoformat()
        bulk = []
        for cred in p_index_data.get("m_credential_data", []):
            if not cred.get("username") or not cred.get("file"):
                continue
            m_hash = helper_controller.generate_data_hash(cred.get("username") + "_" + str(cred.get("file")))
            doc = {"u": cred.get("username"), "l": cred.get("link"), "s": cred.get("source"), "g": cred.get("group"), "fn": cred.get("file"), "c": now}
            doc = {k: v for k, v in doc.items() if v not in (None, "", "null") and (not isinstance(v, list) or any(i not in (None, "", "null") for i in v))}
            bulk.extend([{"create": {"_index": ELASTIC_INDEX.S_CREDENTIAL_INDEX, "_id": m_hash}}, doc])
        return bulk

    @staticmethod
    def index_query_stealerlog(p_index_data):
        bulk = []
        bf = bloom_controller(dirpath="bloom_data", capacity=1_000_000_000, error_rate=0.01)
        for log in p_index_data["logs"]:
            email = log.get("email", [None])[0]
            username = log.get("username", [None])[0]
            domain = log.get("domain", [None])[0]
            ip = log.get("ip", [None])[0]
            channel = log.get("channel")
            val = email or username or domain or ip or channel
            if not val:
                continue
            seed = str(val) + "|" + str(channel or "")
            m_hash = hashlib.sha256(seed.lower().encode("utf-8", "ignore")).hexdigest()
            _id = f"{datetime.utcnow().year}_UTC_{m_hash}"
            if bf.isduplicate(m_hash):
                continue
            doc = {k: v for k, v in log.items() if v is not None}
            bulk.extend([{"create": {"_index": ELASTIC_INDEX.S_STEALERLOGS_INDEX, "_id": _id}}, doc])
        return bulk

    @staticmethod
    def index_query_defacement(p_index_data):
        return elastic_request_generator.common_index_cards(p_index_data, ELASTIC_INDEX.S_DEFACEMENT_INDEX)

    @staticmethod
    def index_query_leak(p_index_data):
        return elastic_request_generator.common_index_cards(p_index_data, ELASTIC_INDEX.S_LEAK_INDEX, ("m_base_url",))

    @staticmethod
    def index_query_exploit(p_index_data):
        return elastic_request_generator.common_index_cards(p_index_data, ELASTIC_INDEX.S_EXPLOIT_INDEX)

    @staticmethod
    def generate_graph_queries():
        return [
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"term": {"m_content_type": "leaks"}}, "aggs": {"Top Teams (Leak)": {"terms": {"field": "m_team", "size": 4}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Top Teams (Defacement)": {"terms": {"field": "m_team", "size": 4}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Top Locations (Defacement)": {"terms": {"field": "m_location", "size": 4}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Top Hashtags (Social)": {"terms": {"field": "m_hashtags", "size": 4}}}}},
        ]

    @staticmethod
    def generate_insight_queries():
        return [
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Document Count": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Most Recent": {"max": {"field": "m_update_date"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Oldest Update": {"min": {"field": "m_update_date"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_update_date": {"gte": "now-5d/d"}}}, "aggs": {"Updated 5 Days ago": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_update_date": {"gte": "now-10d/d"}}}, "aggs": {"Updated 9 Days ago": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Average Score": {"avg": {"field": "m_validity_score"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"URL/Document": {"value_count": {"field": "m_sub_url"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Archive/Document": {"value_count": {"field": "m_archive_url"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Email/Document": {"value_count": {"field": "m_email"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Phone/Document": {"value_count": {"field": "m_phone_number"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Clearnet/Document": {"value_count": {"field": "m_clearnet_links"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Common Type": {"terms": {"field": "m_content_type", "size": 1}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Document Count": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Unique Base URLs": {"value_count": {"field": "m_base_url"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"URL/Documents": {"value_count": {"field": "m_weblink"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Dumps/Document": {"value_count": {"field": "m_dumplink"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_update_date": {"gte": "now-5d/d"}}}, "aggs": {"Updated 5 Days ago": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_update_date": {"gte": "now-10d/d"}}}, "aggs": {"Updated 9 Days ago": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Most Recent": {"max": {"field": "m_update_date"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Oldest Update": {"min": {"field": "m_update_date"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Document Count": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "query": {"range": {"m_leak_date": {"gte": "now-5d/d"}}}, "aggs": {"Updated 5 Days ago": {"value_count": {"field": "m_hash"}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Top Team": {"terms": {"field": "m_team", "size": 1}}}}},
            {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_FILTER: {"size": 0, "aggs": {"Common Server": {"terms": {"field": "m_web_server", "size": 1}}}}},
        ]