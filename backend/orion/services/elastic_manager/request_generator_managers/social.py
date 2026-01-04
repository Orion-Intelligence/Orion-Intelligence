import re

from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX, ELASTIC_KEYS
from orion.services.elastic_manager.helper.elastic_helper import elastic_helper
from orion.helper_manager.helper_controller import helper_controller

from .base import ElasticBaseMixin


class ElasticSocialMixin(ElasticBaseMixin):
    @staticmethod
    def on_search_social_data(p_query_model, pfilter=None, p_index=None, must_clauses=None, must_not_clause=None):
        pmust = must_clauses or []
        pmustnot = must_not_clause or []

        if p_query_model.matchtype == "semantic" and p_query_model.platform == "pastebin":
            p_query_model.matchtype = "or"

        raw_query = elastic_helper.prepare_search_query(p_query_model)

        if p_query_model.q and p_query_model.q != "*" and (not raw_query or raw_query == "*"):
            return ELASTIC_INDEX.S_SOCIAL_INDEX, {"query": {"match_none": {}}, "size": 0}

        if not raw_query:
            return ELASTIC_INDEX.S_SOCIAL_INDEX, {"query": {"match_none": {}}, "size": 0}

        exact_phrases, loose_terms = elastic_helper.extract_phrases_terms(raw_query)
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
            from_date, to_date = elastic_helper.daterange_to_strs(
                m_date_range, start_suffix="T00:00:00.000000+00:00", end_suffix="T23:59:59.999999+00:00"
            )
            if from_date and to_date:
                must_clauses.append({"range": {"m_message_date": {"gte": from_date, "lte": to_date}}})

        phrase_fields = [("m_title", 8), ("m_content", 4), ("m_sender_name", 3)]

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
            date_field="m_creation_date",
        )

        return p_index, query_statement

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