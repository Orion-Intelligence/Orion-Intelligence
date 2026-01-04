import re
from datetime import datetime, timedelta, timezone

from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import (
    search_defacement_param_model,
)
from orion.constants.constant import allowed_keys
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX, ELASTIC_KEYS
from orion.services.elastic_manager.helper.elastic_helper import elastic_helper

from .base import ElasticBaseMixin


class ElasticDefacementMixin(ElasticBaseMixin):
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
                    [
                        v
                        for v in pFilter["m_search_all"]
                        if v and re.search(r"(https?://|[a-z0-9.-]+\.[a-z]{2,})", str(v), re.I)
                    ]
                )

        for idx, domain in enumerate(domains):
            domain = domain.lower()
            parts = domain.split("/")
            valid_parts = [p for p in parts if "." in p]

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
                "aggs": {
                    "by_ioc_type": {
                        "terms": {"field": "m_ioc_type", "size": 10},
                        "aggs": {"top_hits_per_type": {"top_hits": {"size": 4, "sort": [{"m_leak_date": {"order": "desc"}}]}}},
                    }
                },
            }

        if p_query_model.daterange:
            from_date, to_date = elastic_helper.daterange_to_strs(p_query_model.daterange)
            if from_date and to_date:
                must_clauses.append({"range": {"m_leak_date": {"gte": from_date, "lte": to_date}}})

        query_statement = {
            "size": 0,
            "query": {"bool": {"must": must_clauses if must_clauses else [{"match_all": {}}]}},
            "aggs": domain_aggs,
            "track_total_hits": False,
        }

        return ELASTIC_INDEX.S_DEFACEMENT_INDEX, query_statement

    @staticmethod
    def on_search_defacement_data(p_query_model: search_defacement_param_model, pfilter=None):
        if not p_query_model.q and pfilter and pfilter.get("entity_filter", {}).get("m_domain"):
            p_query_model.q = pfilter.get("domain", [None])[0]

        if isinstance(pfilter, dict):
            pfilter = {k: v for k, v in pfilter.items() if v is not None}

        raw_query = (p_query_model.q or "").lower()
        if not raw_query or raw_query == "":
            raw_query = "*"

        must_clauses = []
        must_not_clause = []

        m_network = p_query_model.network
        m_date_range = p_query_model.daterange

        if m_date_range:
            from_date, to_date = elastic_helper.daterange_to_strs(m_date_range)
            if from_date and to_date:
                must_clauses.append({"range": {"m_leak_date": {"gte": from_date, "lte": to_date}}})

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

        exact_phrases, loose_terms, quoted_value = elastic_helper.extract_phrases_terms_quoted(raw_query)
        m_page_number = getattr(p_query_model, "page", 1)

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

        query_statement = ElasticBaseMixin._build_query_block(
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
            date_field="m_leak_date",
        )

        return ELASTIC_INDEX.S_DEFACEMENT_INDEX, query_statement

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
            index_entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_VALUE: record})
        return index_entries