from orion.services.elastic_manager.request_generator_managers.base import ElasticBaseMixin
from orion.services.elastic_manager.request_generator_managers.chats import ElasticChatsMixin
from orion.services.elastic_manager.request_generator_managers.consolidated import ElasticConsolidatedMixin
from orion.services.elastic_manager.request_generator_managers.credentials import ElasticCredentialsMixin
from orion.services.elastic_manager.request_generator_managers.defacement import ElasticDefacementMixin
from orion.services.elastic_manager.request_generator_managers.exploit import ElasticExploitMixin
from orion.services.elastic_manager.request_generator_managers.general import ElasticGeneralMixin
from orion.services.elastic_manager.request_generator_managers.insights import ElasticInsightsMixin
from orion.services.elastic_manager.request_generator_managers.leak import ElasticLeakMixin
from orion.services.elastic_manager.request_generator_managers.social import ElasticSocialMixin
from orion.services.elastic_manager.request_generator_managers.stealerlogs import ElasticStealerlogsMixin


class elastic_request_generator:
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
        return ElasticBaseMixin._build_query_block(
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
    def clear_expire_index():
        return ElasticBaseMixin.clear_expire_index()

    @staticmethod
    def on_bulk_domain_lookup(p_query_model, pFilter=None):
        return ElasticDefacementMixin.on_bulk_domain_lookup(p_query_model, pFilter)

    @staticmethod
    def on_search_defacement_data(p_query_model, pfilter=None):
        return ElasticDefacementMixin.on_search_defacement_data(p_query_model, pfilter)

    @staticmethod
    def on_search_consolidated_ranked_data(p_query_model, pfilter, base_index, blocked_categories, allowed_categories):
        return ElasticConsolidatedMixin.on_search_consolidated_ranked_data( p_query_model, pfilter, base_index, blocked_categories, allowed_categories
        )

    @staticmethod
    def on_search_consolidated_data(p_query_model, pFilter=None):
        return ElasticConsolidatedMixin.on_search_consolidated_data(p_query_model, pFilter)

    @staticmethod
    def on_search_leakdata(p_query_model, pfilter=None):
        return ElasticLeakMixin.on_search_leakdata(p_query_model, pfilter)

    @staticmethod
    def on_search_exploitdata(p_query_model, pfilter=None):
        return ElasticExploitMixin.on_search_exploitdata(p_query_model, pfilter)

    @staticmethod
    def on_search_social_data(p_query_model, pfilter=None, p_index=None, must_clauses=None, must_not_clause=None):
        return ElasticSocialMixin.on_search_social_data(p_query_model, pfilter, p_index, must_clauses, must_not_clause)

    @staticmethod
    def on_search_telegram_data(p_query_model, pfilter=None):
        return ElasticChatsMixin.on_search_telegram_data(p_query_model, pfilter)

    @staticmethod
    def on_search_credentials_data(p_query_model):
        return ElasticCredentialsMixin.on_search_credentials_data(p_query_model)

    @staticmethod
    def on_search_stealerlogs_data(p_query_model, pFilter, consolidated=False, alert=False):
        return ElasticStealerlogsMixin.on_search_stealerlogs_data(p_query_model, pFilter, consolidated, alert)

    @staticmethod
    def on_search_general_data(p_query_model, pfilter=None):
        return ElasticGeneralMixin.on_search_general_data(p_query_model, pfilter)

    @staticmethod
    def index_query_general(p_index_data):
        return ElasticGeneralMixin.index_query_general(p_index_data)

    @staticmethod
    def index_query_chat(p_index_data):
        return ElasticChatsMixin.index_query_chat(p_index_data)

    @staticmethod
    def index_query_social(p_index_data):
        return ElasticSocialMixin.index_query_social(p_index_data)

    @staticmethod
    def index_query_credential(p_index_data):
        return ElasticCredentialsMixin.index_query_credential(p_index_data)

    @staticmethod
    def index_query_stealerlog(p_index_data):
        return ElasticStealerlogsMixin.index_query_stealerlog(p_index_data)

    @staticmethod
    def index_query_defacement(p_index_data):
        return ElasticDefacementMixin.index_query_defacement(p_index_data)

    @staticmethod
    def index_query_leak(p_index_data):
        return ElasticLeakMixin.index_query_leak(p_index_data)

    @staticmethod
    def index_query_exploit(p_index_data):
        return ElasticExploitMixin.index_query_exploit(p_index_data)

    @staticmethod
    def generate_graph_queries():
        return ElasticInsightsMixin.generate_graph_queries()

    @staticmethod
    def generate_insight_queries():
        return ElasticInsightsMixin.generate_insight_queries()