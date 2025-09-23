from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from starlette import status
from orion.api.interactive.search_manager.search_callback_model import search_callback
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import \
    search_chat_callback_model as SearchChatCallbackModel, search_chat_callback_model
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_param_model import search_chat_param_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_callback_model import \
    grouped_consolidated_search_callback_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import \
    search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import \
    search_defacement_callback_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import \
    search_defacement_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import \
    search_credential_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_stealerlog_callback_model import \
    search_stealerlog_callback_model
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_callback_model import breach_data
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import \
    search_dynamic_param_model
from orion.api.interactive.search_manager.search_data_model.enums import general_listing, leak_listing, \
    exploit_listing
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import \
    search_exploit_callback_model
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_param_model import \
    search_exploit_param_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import \
    search_general_callback_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import \
    search_leak_callback_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from orion.api.interactive.search_manager.search_data_model.search_callback_model import result_item
from orion.api.interactive.search_manager.search_data_model.social.search_social_callback_model import \
    search_social_callback_model
from orion.api.interactive.search_manager.search_data_model.social.search_social_param_model import \
    search_social_param_model
from orion.api.server.external_request_manager.external_request_controller import external_request_controller
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator
from orion.api.interactive.search_manager.search_data_model.entity_filters.entity_filter_param_model import entity_filter_param_model


class search_model:
    # Private Variables
    __instance = None
    __search_callback = search_callback()

    # Initializations
    @staticmethod
    def getInstance():
        if search_model.__instance is None:
            search_model.__instance = search_model()
        return search_model.__instance

    def __init__(self):
        if search_model.__instance is not None:
            pass
        else:
            search_model.__instance = self

    @staticmethod
    async def dynamic_search_email(param: search_dynamic_param_model):
        result = await external_request_controller.getInstance().fetch_email_leak(param)

        if isinstance(result, list) and len(result) > 0:
            return breach_data(**(result[0]))
        else:
            return breach_data().model_dump()

    async def request_defacement_doc(self, doc_id) -> Optional[result_item]:
        result = await elastic_controller.get_instance().get_doc(ELASTIC_INDEX.S_DEFACEMENT_INDEX, doc_id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        return await self.__search_callback.get_doc(result)

    async def request_exploit_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        result = await elastic_controller.get_instance().get_doc(ELASTIC_INDEX.S_EXPLOIT_INDEX, doc_id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

        if lang:
            result[0]["m_content"] = helper_controller.detect_and_translate(result[0]["m_content"], target_lang=lang)
            result[0]["m_important_content"] = helper_controller.detect_and_translate(result[0]["m_important_content"],
                                                                                      target_lang=lang)

        return await self.__search_callback.get_doc(result)

    async def request_leak_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        result = await elastic_controller.get_instance().get_doc(ELASTIC_INDEX.S_LEAK_INDEX, doc_id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

        if lang:
            result[0]["m_content"] = helper_controller.detect_and_translate(result[0]["m_content"], target_lang=lang)
            result[0]["m_important_content"] = helper_controller.detect_and_translate(result[0]["m_important_content"],
                                                                                      target_lang=lang)

        return await self.__search_callback.get_doc(result)

    async def request_chat_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        result = await elastic_controller.get_instance().get_doc(ELASTIC_INDEX.S_CHATS_INDEX, doc_id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        if lang:
            result[0]["m_content"] = helper_controller.detect_and_translate(result[0]["m_content"], target_lang=lang)
        return await self.__search_callback.get_doc(result)

    async def request_social_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        result = await elastic_controller.get_instance().get_doc(ELASTIC_INDEX.S_SOCIAL_INDEX, doc_id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        if lang:
            result[0]["m_content"] = helper_controller.detect_and_translate(result[0]["m_content"], target_lang=lang)
        return await self.__search_callback.get_doc(result)

    async def request_general_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        result = await elastic_controller.get_instance().get_doc(ELASTIC_INDEX.S_GENERIC_INDEX, doc_id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        if lang:
            result[0]["m_content"] = helper_controller.detect_and_translate(result[0]["m_content"], target_lang=lang)
            result[0]["m_important_content"] = helper_controller.detect_and_translate(result[0]["m_important_content"],
                                                                                      target_lang=lang)
        return await self.__search_callback.get_doc(result)

    async def search_general_result(self, param):
        document, data_filter = elastic_request_generator().on_search_general_data(param, param.entity_filter)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)
        return await self.__search_callback.search_handler(
            m_status, m_documents,
            search_general_callback_model,
            general_listing
        )

    async def search_leak_result(self, param: search_leak_param_model):
        document, data_filter = elastic_request_generator().on_search_leakdata(param, param.entity_filter)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)
        return await self.__search_callback.search_handler(
            m_status, m_documents,
            search_leak_callback_model,
            leak_listing
        )

    @staticmethod
    async def search_consolidated_ranked_result(param: search_consolidated_param_model, base_index, blocked_categories, allowed_categories):
        if param.entity_filter:
            filter_dict = param.entity_filter
        else:
            filter_dict = {}

        indices, query, indices_boost = elastic_request_generator.on_search_consolidated_ranked_data(param, filter_dict, base_index, blocked_categories, allowed_categories)
        response = await elastic_controller.get_instance().search_consolidated_ranked_query(indices, query, indices_boost)

        ranked_results = []

        if response and "hits" in response and "hits" in response["hits"]:
            hits = response["hits"]["hits"]
            for rank, hit in enumerate(hits):
                source = hit.get("_source", {})
                source["rank_index"] = hit.get("_index")
                source["_score"] = hit.get("_score", 0)
                source["_rank"] = rank + 1
                ranked_results.append(source)

        return ranked_results

    @staticmethod
    async def search_consolidated_result(param: search_consolidated_param_model):

        if param.entity_filter:
            filter_dict = param.entity_filter
        else:
            filter_dict = {}

        indices, queries, labels = elastic_request_generator().on_search_consolidated_data(param, filter_dict)
        responses = await elastic_controller.get_instance().search_consolidated_queries(indices, queries)

        leak_data = {}
        general_data = {}
        exploit_data = {}
        chat_data = {}
        defacement_data = {}
        social_data = {}
        stealer_data = {}
        tracking_data={}
        news_data={}

        for index, res,label in zip(indices, responses,labels):
            data = {"Result": [], "Suggestions": [], "Page_Count": 0}

            if not res:
                continue

            if (index == "defacement_model") and "aggregations" in res:
                for domain_key, domain_value in res["aggregations"].items():
                    buckets = domain_value.get("by_ioc_type", {}).get("buckets", [])
                    for bucket in buckets:
                        hits = bucket.get("top_hits_per_type", {}).get("hits", {}).get("hits", [])
                        data["Result"].extend([hit["_source"] for hit in hits])
                data["Page_Count"] = len(data["Result"])

            else:
                hits = res.get("hits", {}).get("hits", [])
                data["Result"] = [hit["_source"] for hit in hits]
                data["Page_Count"] = len(hits)

            if label == "leak_model":
                leak_data = data
            elif label == "generic_model":
                general_data = data
            elif label == "exploit_model":
                exploit_data = data
            elif label == "chat_model":
                chat_data = data
            elif label == "social_model":
                social_data = data
            elif label == "stealer_model":
                stealer_data = data
            elif label == "defacement_model":
                defacement_data = data
            elif label == "tracking_model":
                tracking_data = data
            elif label == "news_model":
                news_data = data

        return grouped_consolidated_search_callback_model(
            leak_model=search_leak_callback_model(**leak_data),
            exploit_model=search_exploit_callback_model(**exploit_data),
            chat_model=search_chat_callback_model(**chat_data),
            generic_model=search_general_callback_model(**general_data),
            defacement_model=search_defacement_callback_model(**defacement_data),
            social_model=search_social_callback_model(**social_data),
            stealer_model = search_stealerlog_callback_model(**stealer_data),
            tracking_model=search_leak_callback_model(**tracking_data),
            news_model=search_leak_callback_model(**news_data)
        )

    async def search_exploit_result(self, param: search_exploit_param_model):
        document, data_filter = elastic_request_generator().on_search_exploitdata(param, param.entity_filter)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)
        return await self.__search_callback.search_handler(
            m_status, m_documents,
            search_exploit_callback_model,
            exploit_listing
        )

    async def search_telegram_result(self, param: search_chat_param_model):
        document, data_filter = elastic_request_generator().on_search_telegram_data(param, param.entity_filter)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        return await self.__search_callback.search_handler(
            m_status, m_documents,
            SearchChatCallbackModel,
            {}
        )

    async def search_social_result(self, param: search_social_param_model):
        document, data_filter = elastic_request_generator().on_search_social_data(param, param.entity_filter)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        return await self.__search_callback.search_handler(
            m_status, m_documents,
            search_social_callback_model,
            {}
        )

    async def search_credential_result(self, param: search_credential_param_model, search_credential_callback_model=None):
        document, data_filter = elastic_request_generator().on_search_credentials_data(param)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        return await self.__search_callback.search_handler(
            m_status, m_documents,
            search_credential_callback_model,
            {}
        )

    async def search_stealerlogs_result(self, param: search_credential_param_model):
        document, data_filter = elastic_request_generator().on_search_stealerlogs_data(param)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        return await self.__search_callback.search_handler(
            m_status, m_documents,
            search_stealerlog_callback_model,
            {}
        )

    async def search_defacement_result(self, param: search_defacement_param_model):
        document, data_filter = elastic_request_generator().on_search_defacement_data(param, param.entity_filter)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        return await self.__search_callback.search_handler(
            m_status, m_documents,
            search_defacement_callback_model,
            []
        )
    
    @staticmethod
    def _process_entity_filters_generic(
            filters: Optional[List[entity_filter_param_model]],
        field_mapping: Dict[str, str] 
    ) -> List[Dict[str, Any]]:
        es_clauses = []


        if not filters:
            return es_clauses


        for filter_category in filters:
            category_id = filter_category.categoryId
            tags = filter_category.tags

            if tags:
                es_field_name = field_mapping.get(category_id)

                if es_field_name:
                    if len(tags) == 1:
                        es_clauses.append({"term": {es_field_name: tags[0]}})
                    else:
                        es_clauses.append({"terms": {es_field_name: tags}})
        return es_clauses
    