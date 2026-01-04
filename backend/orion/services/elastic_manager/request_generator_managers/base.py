import re
from datetime import datetime, timedelta, timezone

from orion.constants.constant import CONSTANTS, allowed_keys
from orion.helper_manager.env_handler import env_handler
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_SEMANTIC
from orion.services.elastic_manager.elastic_semantic_controller import elastic_semantic_controller
from orion.services.elastic_manager.helper.elastic_helper import elastic_helper


class ElasticBaseMixin:
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
        date_field,
    ):
        multi_fields = [f"{field}^{boost}" for field, boost in phrase_fields]

        if raw_query == "*":
            content_query = {"match_all": {}}
        else:
            content_query = {"bool": {"should": [], "minimum_should_match": 1}}
            if quoted_value:
                raw_query = raw_query.strip('"')
                for phrase in exact_phrases:
                    content_query["bool"]["should"].append(
                        {
                            "bool": {
                                "should": [
                                    {"match_phrase": {field: {"query": phrase, "boost": boost}}}
                                    for field, boost in phrase_fields
                                ],
                                "minimum_should_match": 1,
                            }
                        }
                    )
            else:
                for phrase in exact_phrases:
                    must_clauses.append(
                        {
                            "bool": {
                                "should": [
                                    {"match_phrase": {field: {"query": phrase, "boost": boost}}}
                                    for field, boost in phrase_fields
                                ],
                                "minimum_should_match": 1,
                            }
                        }
                    )
                for term in loose_terms:
                    content_query["bool"]["should"].append(
                        {
                            "multi_match": {
                                "query": term.lower(),
                                "fields": multi_fields,
                                "type": "best_fields",
                                "operator": "OR",
                            }
                        }
                    )
                    for kf in ["m_location", "m_attacker", "m_team", "m_web_server", "m_network", "m_ip"]:
                        content_query["bool"]["should"].append(
                            {"term": {kf: {"value": term, "case_insensitive": True, "boost": 3}}}
                        )
                if not exact_phrases and not loose_terms:
                    content_query = {
                        "multi_match": {
                            "query": raw_query.lower(),
                            "fields": multi_fields,
                            "type": "best_fields",
                            "operator": "OR",
                        }
                    }

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

        base_bool_query = {
            "must": [content_query] if isinstance(content_query, dict) else [],
            "filter": must_clauses + must_filter_clauses,
            "must_not": must_not_clause,
        }

        if not p_query_model.must and should_filter_clauses:
            items = [should_filter_clauses] if isinstance(should_filter_clauses, dict) else list(should_filter_clauses)
            base_bool_query.setdefault("should", []).extend(items)

        boost_shoulds = []
        if boost_shoulds:
            base_bool_query.setdefault("should", []).extend(boost_shoulds)

        functions_block = []
        if p_query_model.matchtype != "semantic":
            functions_block = [
                {
                    "gauss": {date_field: {"origin": "now", "scale": "45d", "offset": "7d", "decay": 0.7}},
                    "weight": 0.1,
                }
            ]

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
                            "filter": {"bool": {"filter": must_filter_clauses}},
                        }
                    }
                    a_val = 10.0
                    t_val = 0.8
                    query_statement["query"]["function_score"]["query"] = knn_clause
                    query_statement["query"]["function_score"]["script_score"] = {
                        "script": {
                            "source": "double s=_score; double eps=1e-9; s=Math.max(eps, Math.min(1.0-eps, s)); double a=params.a; double t=params.t; double z=0.5*(1.0+Math.tanh(a*(s-t))); return z;",
                            "params": {"a": a_val, "t": t_val},
                        }
                    }
                    query_statement["query"]["function_score"]["score_mode"] = "sum"
                    query_statement["query"]["function_score"]["boost_mode"] = "replace"
                    query_statement["min_score"] = 0.4
            except Exception as _:
                pass

        return query_statement

    @staticmethod
    def clear_expire_index():
        utc_now = datetime.now(timezone.utc)
        threshold_time = utc_now - timedelta(seconds=CONSTANTS.S_SETTINGS_INDEX_EXPIRY)
        return {"query": {"range": {"m_update_date": {"lt": threshold_time.isoformat()}}}}
