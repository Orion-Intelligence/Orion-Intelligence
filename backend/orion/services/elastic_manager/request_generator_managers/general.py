from datetime import datetime, timedelta, timezone

from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX, ELASTIC_KEYS
from orion.services.elastic_manager.helper.elastic_helper import elastic_helper
from orion.helper_manager.helper_controller import helper_controller

from .base import ElasticBaseMixin


class ElasticGeneralMixin(ElasticBaseMixin):
    @staticmethod
    def on_search_general_data(p_query_model, pfilter=None):
        raw_query = elastic_helper.prepare_search_query(p_query_model)

        if not raw_query or raw_query == "":
            raw_query = "*"

        if not raw_query:
            return ELASTIC_INDEX.S_GENERIC_INDEX, {"query": {"match_none": {}}, "size": 0}

        m_safe_search = p_query_model.safe
        m_page_number = p_query_model.page
        m_network = p_query_model.network
        m_date_range = p_query_model.daterange
        m_content_type = p_query_model.content

        exact_phrases, loose_terms, quoted_value = elastic_helper.extract_phrases_terms_quoted(raw_query)

        if p_query_model.category != "general":
            m_search_type = p_query_model.category
        else:
            m_search_type = "all"

        must_clauses = []
        must_not_clause = []

        if m_date_range:
            from_date, to_date = elastic_helper.daterange_to_strs(
                m_date_range, start_suffix="T00:00:00.000000+00:00", end_suffix="T23:59:59.999999+00:00"
            )
            if from_date and to_date:
                must_clauses.append({"range": {"m_update_date": {"gte": from_date, "lte": to_date}}})

        if m_content_type and m_content_type.lower() not in ("", "all"):
            must_clauses.append({"term": {"content_type": m_content_type.lower()}})

        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        if m_safe_search:
            must_not_clause.append({"term": {"m_content_type": "adult"}})

        if m_search_type != "all":
            must_clauses.append({"terms": {"m_content_type": [m_search_type]}})

        phrase_fields = [("m_title", 5), ("m_content", 3), ("m_url", 2), ("m_base_url", 1)]

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
        return ELASTIC_INDEX.S_GENERIC_INDEX, query_statement

    @staticmethod
    def index_query_general(p_index_data):
        import hashlib

        index_entries = []
        utc_now = datetime.now(timezone.utc)
        current_timestamp = utc_now.isoformat()

        if isinstance(p_index_data, list):
            pass
        else:
            if not p_index_data["m_important_content"] or not p_index_data["m_title"]:
                return index_entries

            p_index_data["m_update_date"] = current_timestamp
            p_index_data["m_hash_content"] = hashlib.sha256((p_index_data["m_important_content"] + p_index_data["m_title"]).encode()).hexdigest()
            p_index_data["m_hash_url"] = hashlib.sha256((p_index_data["m_url"] + p_index_data["m_title"]).encode()).hexdigest()
            data_hash = helper_controller.generate_data_hash(p_index_data["m_url"])
            p_index_data["m_hash"] = data_hash

            index_entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_VALUE: p_index_data})

        return index_entries