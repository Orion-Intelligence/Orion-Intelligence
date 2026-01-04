import re
from datetime import datetime, timedelta, timezone

from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import (
    search_consolidated_param_model,
)
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.elastic_manager.helper.elastic_helper import elastic_helper
from orion.helper_manager.helper_controller import helper_controller

from .base import ElasticBaseMixin
from .leak import ElasticLeakMixin
from .general import ElasticGeneralMixin
from .exploit import ElasticExploitMixin
from .chats import ElasticChatsMixin
from .social import ElasticSocialMixin
from .defacement import ElasticDefacementMixin


class ElasticConsolidatedMixin(ElasticBaseMixin):

    @staticmethod
    def on_search_consolidated_ranked_data(
        p_query_model: search_consolidated_param_model,
        pfilter,
        base_index,
        blocked_categories,
        allowed_categories,
    ):
        raw_query = elastic_helper.prepare_search_query(p_query_model)

        channel_q = p_query_model.q if p_query_model.q and p_query_model.q != "*" else None
        m_date_range = p_query_model.daterange
        m_network = p_query_model.network
        m_page_number = getattr(p_query_model, "page", 1)
        m_content_type = p_query_model.content
        m_safe_search = p_query_model.safe
        must_clauses = []
        must_not_clause = []

        if m_date_range:
            try:
                from_date, to_date = elastic_helper.daterange_to_strs(
                    m_date_range, start_suffix="T00:00:00+00:00", end_suffix="T23:59:59+00:00"
                )
                if from_date and to_date:
                    must_clauses.append(
                        {
                            "bool": {
                                "should": [
                                    {
                                        "bool": {
                                            "filter": [
                                                {"exists": {"field": "m_message_date"}},
                                                {"range": {"m_message_date": {"gte": from_date, "lte": to_date}}},
                                            ]
                                        }
                                    },
                                    {
                                        "bool": {
                                            "filter": [
                                                {"exists": {"field": "m_leak_date"}},
                                                {"range": {"m_leak_date": {"gte": from_date, "lte": to_date}}},
                                            ]
                                        }
                                    },
                                    {
                                        "bool": {
                                            "filter": [
                                                {"exists": {"field": "m_creation_date"}},
                                                {"range": {"m_creation_date": {"gte": from_date, "lte": to_date}}},
                                            ]
                                        }
                                    },
                                ],
                                "minimum_should_match": 1,
                            }
                        }
                    )
            except ValueError:
                pass
        elif m_date_range != "":
            to_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT23:59:59+00:00")
            from_date = (datetime.now(timezone.utc) - timedelta(days=150)).strftime("%Y-%m-%dT00:00:00+00:00")
            must_clauses.append(
                {
                    "bool": {
                        "should": [
                            {
                                "bool": {
                                    "filter": [
                                        {"exists": {"field": "m_message_date"}},
                                        {"range": {"m_message_date": {"gte": from_date, "lte": to_date}}},
                                    ]
                                }
                            },
                            {
                                "bool": {
                                    "filter": [
                                        {"exists": {"field": "m_leak_date"}},
                                        {"range": {"m_leak_date": {"gte": from_date, "lte": to_date}}},
                                    ]
                                }
                            },
                            {
                                "bool": {
                                    "filter": [
                                        {"exists": {"field": "m_creation_date"}},
                                        {"range": {"m_creation_date": {"gte": from_date, "lte": to_date}}},
                                    ]
                                }
                            },
                        ],
                        "minimum_should_match": 1,
                    }
                }
            )

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
                {
                    "bool": {
                        "should": [
                            {"bool": {"must_not": {"exists": {"field": "m_content_type"}}}},
                            {
                                "bool": {
                                    "filter": [
                                        {"exists": {"field": "m_content_type"}},
                                        {"terms": {"m_content_type": allowed_categories}},
                                    ]
                                }
                            },
                        ],
                        "minimum_should_match": 1,
                    }
                }
            )

        if blocked_categories:
            if allowed_categories:
                must_clauses.append(
                    {
                        "bool": {
                            "should": [
                                {"terms": {"m_content_type": allowed_categories}},
                                {"bool": {"must_not": {"terms": {"m_content_type": blocked_categories}}}},
                            ],
                            "minimum_should_match": 1,
                        }
                    }
                )
            else:
                must_not_clause.append({"terms": {"m_content_type": blocked_categories}})

        if m_network and m_network.lower() not in ("", "all"):
            must_clauses.append({"term": {"m_network": m_network.lower()}})

        if m_safe_search and m_safe_search is True:
            must_not_clause.append({"term": {"m_content_type": "adult"}})

        if hasattr(p_query_model, "platform") and p_query_model.platform:
            must_clauses.append({"term": {"m_platform": p_query_model.platform}})
        if hasattr(p_query_model, "attacker") and p_query_model.attacker:
            must_clauses.append({"terms": {"m_attacker": [p_query_model.attacker]}})
        if hasattr(p_query_model, "team") and p_query_model.team:
            must_clauses.append({"terms": {"m_team": [p_query_model.team]}})

        if m_content_type and m_content_type.lower() not in ("", "all"):
            must_clauses.append(
                {"bool": {"filter": [{"exists": {"field": "content_type"}}, {"term": {"content_type": m_content_type.lower()}}]}}
            )

        phrases = re.findall(r'"([^"]+)"', p_query_model.q or "")
        quoted_value = bool(phrases) and (p_query_model.q or "").strip().startswith('"') and (p_query_model.q or "").strip().endswith('"')
        exact_phrases = phrases
        loose_terms = [] if raw_query in ("*", "") else [t for t in re.findall(r"\w+", raw_query) if t and t.strip('"')]
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
            ("m_channel_name", 4),
        ]
        date_field = "m_creation_date"

        unified_query = ElasticBaseMixin._build_query_block(
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

        unified_query["size"] = 15
        unified_query["from"] = max(0, (m_page_number - 1) * 15)

        if channel_q:
            qb = unified_query["query"]["function_score"]["query"]["bool"]
            qb.setdefault("should", []).extend(
                [
                    {"term": {"m_channel_name.keyword": {"value": channel_q, "boost": 7.0}}},
                    {"match_phrase": {"m_channel_name": {"query": channel_q, "slop": 1, "boost": 7.0}}},
                ]
            )

        query = (
            base_index,
            unified_query,
            [
                b
                for b in [
                    {ELASTIC_INDEX.S_LEAK_INDEX: 2},
                    {ELASTIC_INDEX.S_GENERIC_INDEX: 0.5},
                    {ELASTIC_INDEX.S_EXPLOIT_INDEX: 1.4},
                    {ELASTIC_INDEX.S_CHATS_INDEX: 1.4},
                    {ELASTIC_INDEX.S_SOCIAL_INDEX: 1.4},
                    {ELASTIC_INDEX.S_DEFACEMENT_INDEX: 1.4},
                ]
                if next(iter(b)) in base_index
            ],
        )

        return query

    @staticmethod
    def on_search_consolidated_data(p_query_model, pFilter=None):
        queries = []
        indices = []
        labels = []

        m1 = helper_controller.clone_model(p_query_model)
        m1.category = "databases"
        i1, q1 = ElasticLeakMixin.on_search_leakdata(m1, pFilter)
        queries.append(helper_controller.strip_query(q1))
        indices.append(i1)
        labels.append("leak_model")

        m2 = helper_controller.clone_model(p_query_model)
        i2, q2 = ElasticGeneralMixin.on_search_general_data(m2, pFilter)
        queries.append(helper_controller.strip_query(q2))
        indices.append(i2)
        labels.append("generic_model")

        m3 = helper_controller.clone_model(p_query_model)
        i3, q3 = ElasticExploitMixin.on_search_exploitdata(m3, pFilter)
        queries.append(helper_controller.strip_query(q3))
        indices.append(i3)
        labels.append("exploit_model")

        m4 = helper_controller.clone_model(p_query_model)
        i4, q4 = ElasticChatsMixin.on_search_telegram_data(m4, pFilter)
        queries.append(helper_controller.strip_query(q4))
        indices.append(i4)
        labels.append("chat_model")

        m6 = helper_controller.clone_model(p_query_model)
        i6, q6 = ElasticSocialMixin.on_search_social_data(m6, pFilter, ELASTIC_INDEX.S_SOCIAL_INDEX)
        queries.append(helper_controller.strip_query(q6))
        indices.append(i6)
        labels.append("social_model")

        m1.category = "all"
        i7, q7 = ElasticDefacementMixin.on_search_defacement_data(m1, pFilter)
        queries.append(helper_controller.strip_query(q7))
        indices.append(i7)
        labels.append("defacement_model")

        m1.category = "tracking"
        i9, q9 = ElasticLeakMixin.on_search_leakdata(m1, pFilter)
        queries.append(helper_controller.strip_query(q9))
        indices.append(i9)
        labels.append("tracking_model")

        m1.category = "news"
        i10, q10 = ElasticLeakMixin.on_search_leakdata(m1, pFilter)
        queries.append(helper_controller.strip_query(q10))
        indices.append(i10)
        labels.append("news_model")

        return indices, queries, labels