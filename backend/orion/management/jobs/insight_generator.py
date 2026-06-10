from orion.constants.constant import CONSTANTS
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX


class insight_generator:
    @staticmethod
    def _strip_query(query, size=4):
        query["size"] = size
        query.pop("highlight", None)
        query.pop("suggest", None)
        return query

    @staticmethod
    def on_insight_leakdata():
        from_ = 0
        size = CONSTANTS.S_SETTINGS_COUNTRY_DOCUMENT_SIZE
        query_statement = {
            "query": {
                "bool": {
                    "must": [
                        {"exists": {"field": "m_domain.keyword"}},
                        {"script": {"script": {"lang": "painless", "source": "doc['m_domain.keyword'].size()==1"}}},
                    ],
                    "must_not": [
                        {"terms": {"m_content_type": ["news", "tracking"]}}
                    ],
                }
            },
            "sort": [{"m_update_date": {"order": "desc"}}],
            "from": from_,
            "size": size,
            "track_total_hits": True,
            "collapse": {"field": "m_domain.keyword"},
        }
        return "leak_model", query_statement

    @staticmethod
    def on_insight_consolidated_country():
        size_ = 5000

        query_statement = {
            "size": size_,
            "_source": ["m_country", "m_hash"],
            "query": {
                "bool": {
                    "must": [
                        {"exists": {"field": "m_country"}}
                    ],
                    "must_not": [
                        {"terms": {"m_content_type": ["news", "tracking"]}}
                    ]
                }
            },
            "sort": [
                {"m_update_date": {"order": "desc"}}
            ],
            "track_total_hits": False
        }

        base_indices = [
            ELASTIC_INDEX.S_LEAK_INDEX,
            ELASTIC_INDEX.S_GENERIC_INDEX,
            ELASTIC_INDEX.S_EXPLOIT_INDEX,
            ELASTIC_INDEX.S_APT_INDEX,
            ELASTIC_INDEX.S_CHATS_INDEX,
            ELASTIC_INDEX.S_SOCIAL_INDEX,
            ELASTIC_INDEX.S_DEFACEMENT_INDEX,
        ]

        return base_indices, query_statement


    @staticmethod
    def on_shared_data_query():
        from_ = 0
        size = CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE

        query_statement = {"query": {"match_all": {}}, "sort": [
            {"m_update_date": {"order": "desc"}}], "from": from_, "size": size, "track_total_hits": True}
        return query_statement

    @staticmethod
    def on_insight_general_data():
        return ELASTIC_INDEX.S_GENERIC_INDEX, insight_generator.on_shared_data_query()

    @staticmethod
    def on_insight_exploitdata():
        return ELASTIC_INDEX.S_GENERIC_INDEX, insight_generator.on_shared_data_query()

    @staticmethod
    def on_insight_defacement_data():
        from_ = 0
        size = CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE

        query_statement = {"query": {"match_all": {}}, "sort": [
            {"m_leak_date": {"order": "desc"}}], "from": from_, "size": size, "track_total_hits": True}

        return ELASTIC_INDEX.S_DEFACEMENT_INDEX, query_statement

    @staticmethod
    def on_insight_telegram_data():
        from_ = 0
        size = CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE

        query_statement = {"query": {"match_all": {}}, "sort": [
            {"m_message_date": {"order": "desc"}}], "from": from_, "size": size, "track_total_hits": True}

        return ELASTIC_INDEX.S_CHATS_INDEX, query_statement

    def on_insight_consolidated_data(self):
        queries = []
        indices = []

        i1, q1 = insight_generator.on_insight_leakdata()
        queries.append(insight_generator._strip_query(q1))
        indices.append(i1)

        i2, q2 = insight_generator.on_insight_general_data()
        queries.append(insight_generator._strip_query(q2))
        indices.append(i2)

        i5, q5 = insight_generator.on_insight_defacement_data()
        queries.append(insight_generator._strip_query(q5))
        indices.append(i5)

        return indices, queries
