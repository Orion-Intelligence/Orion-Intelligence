import hashlib
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import \
    search_defacement_param_model
from orion.constants.constant import CONSTANTS
from orion.constants.enum import ChannelTypeEnum
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS, ELASTIC_INDEX


class elastic_latest_document:
    @staticmethod
    def _strip_query(query, size=4):
        query["size"] = size
        query.pop("highlight", None)
        query.pop("suggest", None)
        return query
    
    @staticmethod
    def on_insight_leakdata(p_query_model):
        from_ = max(0, (p_query_model.mSearchParamPage - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC)
        size = CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE

        query_statement = {
            "query": {
                "match_all": {}
            },
            "sort": [
                {
                    "m_update_date": {
                        "order": "desc"
                    }
                }
            ],
            "from": from_,
            "size": size,
            "track_total_hits": True
        }

        return ELASTIC_INDEX.S_LEAK_INDEX, query_statement

    @staticmethod
    def on_insight_general_data(p_query_model):
        from_ = max(0, (p_query_model.mSearchParamPage - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC)
        size = CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE

        query_statement = {
            "query": {
                "match_all": {}
            },
            "sort": [
                {
                    "m_update_date": {
                        "order": "desc"
                    }
                }
            ],
            "from": from_,
            "size": size,
            "track_total_hits": True
        }

        return ELASTIC_INDEX.S_GENERIC_INDEX, query_statement

    @staticmethod
    def on_insight_defacement_data(p_query_model: search_defacement_param_model):
        m_page_number = getattr(p_query_model, 'mSearchParamPage', 1)

        from_ = max(0, (m_page_number - 1) * 100)
        size = 100

        query_statement = {
            "query": {
                "match_all": {}
            },
            "sort": [
                {"m_date_of_leak": {"order": "desc"}}
            ],
            "from": from_,
            "size": size,
            "track_total_hits": True
        }

        return ELASTIC_INDEX.S_DEFACEMENT_INDEX, query_statement

    @staticmethod
    def on_insight_exploitdata(p_query_model):
        m_page_number = getattr(p_query_model, 'mSearchParamPage', 1)

        from_ = max(0, (m_page_number - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC)
        size = CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE

        query_statement = {
            "query": {
                "match_all": {}
            },
            "sort": [
                {
                    "m_update_date": {
                        "order": "desc"
                    }
                }
            ],
            "from": from_,
            "size": size,
            "track_total_hits": True
        }

        return ELASTIC_INDEX.S_EXPLOIT_INDEX, query_statement
    @staticmethod
    def on_insight_telegram_data(p_query_model):
        m_page_number = getattr(p_query_model, 'mSearchParamPage', 1)

        from_ = max(0, (m_page_number - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC)
        size = CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE

        query_statement = {
            "query": {
                "match_all": {}
            },
            "sort": [
                {
                    "m_message_date": {
                        "order": "desc"
                    }
                }
            ],
            "from": from_,
            "size": size,
            "track_total_hits": True
        }

        return ELASTIC_INDEX.S_CHATS_INDEX, query_statement

    @staticmethod
    def on_insight_consolidated_data(p_query_model):
        import copy
        def clone_model(model):
            return copy.deepcopy(model)

        queries = []
        indices = []

        m1 = clone_model(p_query_model)
        i1, q1 = elastic_latest_document.on_insight_leakdata(m1)
        queries.append(elastic_latest_document._strip_query(q1))
        indices.append(i1)

        m2 = clone_model(p_query_model)
        i2, q2 = elastic_latest_document.on_insight_general_data(m2)
        queries.append(elastic_latest_document._strip_query(q2))
        indices.append(i2)

        m3 = clone_model(p_query_model)
        i3, q3 = elastic_latest_document.on_insight_exploitdata(m3)
        queries.append(elastic_latest_document._strip_query(q3))
        indices.append(i3)

        m4 = clone_model(p_query_model)
        i4, q4 = elastic_latest_document.on_insight_telegram_data(m4)
        queries.append(elastic_latest_document._strip_query(q4))
        indices.append(i4)

        m5 = clone_model(p_query_model)
        i5, q5 = elastic_latest_document.on_insight_defacement_data(m5)
        queries.append(elastic_latest_document._strip_query(q5))
        indices.append(i5)

        return indices, queries
    