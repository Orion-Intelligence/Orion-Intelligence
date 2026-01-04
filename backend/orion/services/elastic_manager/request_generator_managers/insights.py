from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.elastic_manager.helper.elastic_helper import elastic_helper


class ElasticInsightsMixin:
    @staticmethod
    def generate_graph_queries():
        queries = [
            elastic_helper.graph_terms(
                ELASTIC_INDEX.S_LEAK_INDEX, "m_team", 4, "Top Teams (Leak)", query={"term": {"m_content_type": "leaks"}}
            ),
            elastic_helper.graph_terms(ELASTIC_INDEX.S_DEFACEMENT_INDEX, "m_team", 4, "Top Teams (Defacement)"),
            elastic_helper.graph_terms(ELASTIC_INDEX.S_DEFACEMENT_INDEX, "m_location", 4, "Top Locations (Defacement)"),
            elastic_helper.graph_terms(ELASTIC_INDEX.S_CHATS_INDEX, "m_hashtags", 4, "Top Hashtags (Social)"),
        ]

        return queries

    @staticmethod
    def generate_insight_queries():
        queries = [
            elastic_helper.insight_value_count(ELASTIC_INDEX.S_GENERIC_INDEX, "m_hash", "Document Count"),
            elastic_helper.insight_max(ELASTIC_INDEX.S_GENERIC_INDEX, "m_update_date", "Most Recent"),
            elastic_helper.insight_min(ELASTIC_INDEX.S_GENERIC_INDEX, "m_update_date", "Oldest Update"),
            elastic_helper.insight_range_gte_days(ELASTIC_INDEX.S_GENERIC_INDEX, "m_update_date", 5, "Updated 5 Days ago", "m_hash"),
            elastic_helper.insight_range_gte_days(ELASTIC_INDEX.S_GENERIC_INDEX, "m_update_date", 10, "Updated 9 Days ago", "m_hash"),
            elastic_helper.insight_avg(ELASTIC_INDEX.S_GENERIC_INDEX, "m_validity_score", "Average Score"),
            elastic_helper.insight_value_count(ELASTIC_INDEX.S_GENERIC_INDEX, "m_sub_url", "URL/Document"),
            elastic_helper.insight_value_count(ELASTIC_INDEX.S_GENERIC_INDEX, "m_archive_url", "Archive/Document"),
            elastic_helper.insight_value_count(ELASTIC_INDEX.S_GENERIC_INDEX, "m_email", "Email/Document"),
            elastic_helper.insight_value_count(ELASTIC_INDEX.S_GENERIC_INDEX, "m_phone_number", "Phone/Document"),
            elastic_helper.insight_value_count(ELASTIC_INDEX.S_GENERIC_INDEX, "m_clearnet_links", "Clearnet/Document"),
            elastic_helper.insight_terms(ELASTIC_INDEX.S_GENERIC_INDEX, "m_content_type", 1, "Common Type"),
            elastic_helper.insight_value_count(ELASTIC_INDEX.S_LEAK_INDEX, "m_hash", "Document Count"),
            elastic_helper.insight_value_count(ELASTIC_INDEX.S_LEAK_INDEX, "m_base_url", "Unique Base URLs"),
            elastic_helper.insight_value_count(ELASTIC_INDEX.S_LEAK_INDEX, "m_weblink", "URL/Documents"),
            elastic_helper.insight_value_count(ELASTIC_INDEX.S_LEAK_INDEX, "m_dumplink", "Dumps/Document"),
            elastic_helper.insight_range_gte_days(ELASTIC_INDEX.S_LEAK_INDEX, "m_update_date", 5, "Updated 5 Days ago", "m_hash"),
            elastic_helper.insight_range_gte_days(ELASTIC_INDEX.S_LEAK_INDEX, "m_update_date", 10, "Updated 9 Days ago", "m_hash"),
            elastic_helper.insight_max(ELASTIC_INDEX.S_LEAK_INDEX, "m_update_date", "Most Recent"),
            elastic_helper.insight_min(ELASTIC_INDEX.S_LEAK_INDEX, "m_update_date", "Oldest Update"),
            elastic_helper.insight_value_count(ELASTIC_INDEX.S_DEFACEMENT_INDEX, "m_hash", "Document Count"),
            elastic_helper.insight_range_gte_days(ELASTIC_INDEX.S_DEFACEMENT_INDEX, "m_leak_date", 5, "Updated 5 Days ago", "m_hash"),
            elastic_helper.insight_terms(ELASTIC_INDEX.S_DEFACEMENT_INDEX, "m_team", 1, "Top Team"),
            elastic_helper.insight_terms(ELASTIC_INDEX.S_DEFACEMENT_INDEX, "m_web_server", 1, "Common Server"),
        ]

        return queries
