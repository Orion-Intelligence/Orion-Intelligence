from typing import Any, Dict, List, Optional
import httpx
from fastapi import HTTPException
from starlette import status
from starlette.responses import JSONResponse
from orion.api.interactive.search_manager.search_callback_model import search_callback
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import search_chat_callback_model as SearchChatCallbackModel, search_chat_callback_model
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_param_model import search_chat_param_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_callback_model import grouped_consolidated_search_callback_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import search_defacement_callback_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import search_credential_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_stealerlog_callback_model import search_stealerlog_callback_model
from orion.api.interactive.search_manager.search_data_model.enums import general_listing, leak_listing, exploit_listing
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_callback_model import search_exploit_callback_model
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_param_model import search_exploit_param_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import search_general_callback_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import search_leak_callback_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from orion.api.interactive.search_manager.search_data_model.search_callback_model import result_item
from orion.api.interactive.search_manager.search_data_model.social.search_social_callback_model import search_social_callback_model
from orion.api.interactive.search_manager.search_data_model.social.search_social_param_model import search_social_param_model
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
    async def dynamic_search(model, api):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://trusted-micros-api:8010/runtime/parse/" + api, json=model.model_dump(), timeout=120)
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": "Something happened while calling parse/" + api})
                return response.json()
        except Exception:
            return JSONResponse(
                status_code=500, content={"detail": "Something happened while calling parse/" + api})

    @staticmethod
    async def social_search(model):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://trusted-social-api:8020/social/recon/", json=model.model_dump(), timeout=120)
                if response.status_code != 200:
                    print("::::::::::::::::::::::::::::::::::", flush=True)
                    print("::::::::::::::::::::::::::::::::::", flush=True)
                    print(response.text, flush=True)
                    print("::::::::::::::::::::::::::::::::::", flush=True)
                    print("::::::::::::::::::::::::::::::::::", flush=True)
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": "Something happened while calling parse/"})
                return response.json()
        except Exception as ex:
            return JSONResponse(
                status_code=500, content={"detail": "Something happened while calling parse/"})

    async def _request_doc(self, index, doc_id, lang: Optional[str] = None, translate_fields: Optional[List[str]] = None):
        if translate_fields is None:
            translate_fields = []
        result = await elastic_controller.get_instance().get_doc(index, doc_id)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        if lang:
            for field in translate_fields:
                result[0][field] = helper_controller.detect_and_translate(result[0][field], target_lang=lang)
        return await self.__search_callback.get_doc(result)

    async def request_defacement_doc(self, doc_id) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_DEFACEMENT_INDEX, doc_id)

    async def request_exploit_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_EXPLOIT_INDEX, doc_id, lang, ["m_content", "m_important_content"])

    async def request_leak_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_LEAK_INDEX, doc_id, lang, ["m_content", "m_important_content"])

    async def request_chat_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_CHATS_INDEX, doc_id, lang, ["m_content"])

    async def request_social_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_SOCIAL_INDEX, doc_id, lang, ["m_content"])

    async def request_general_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_GENERIC_INDEX, doc_id, lang, ["m_content", "m_important_content"])

    async def search_general_result(self, param):
        document, data_filter = elastic_request_generator().on_search_general_data(param, param.entity_filter)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        return await self.__search_callback.search_handler(
            m_status, m_documents, search_general_callback_model, general_listing)

    async def search_leak_result(self, param: search_leak_param_model):
        document, data_filter = elastic_request_generator().on_search_leakdata(param, param.entity_filter)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)
        return await self.__search_callback.search_handler(
            m_status, m_documents, search_leak_callback_model, leak_listing)

    @staticmethod
    async def search_consolidated_ranked_result(param: search_consolidated_param_model,
            base_index,
            blocked_categories,
            allowed_categories
    ):
        filter_dict = param.entity_filter if param.entity_filter else {}

        indices, query, indices_boost = elastic_request_generator().on_search_consolidated_ranked_data(
            param, filter_dict, base_index, blocked_categories, allowed_categories)

        response = await elastic_controller.get_instance().search_consolidated_ranked_query(
            indices, query, indices_boost)

        ranked_results = []

        if response and "hits" in response and "hits" in response["hits"]:
            for rank, hit in enumerate(response["hits"]["hits"]):
                source = hit.get("_source", {})
                source.pop("m_embedding", None)
                source["rank_index"] = hit.get("_index")
                source["_score"] = hit.get("_score", 0)
                source["_rank"] = rank + 1
                ranked_results.append(source)

        total = 0
        if response and "hits" in response:
            total_field = response["hits"].get("total", 0)
            total = total_field.get("value", 0) if isinstance(total_field, dict) else int(total or 0)

        size = int(query.get("size", 10))
        total_pages = (total + size - 1) // size if size > 0 else 0

        return {"Result": ranked_results, "Page_Count": total_pages, "Total_Hits": total}
    
    @staticmethod
    async def search_consolidated_iocs(
        param: search_consolidated_param_model,
        base_index,
        blocked_categories,
        allowed_categories,
    ):
        filter_dict = param.entity_filter if param.entity_filter else {}

        indices, query, indices_boost = (
            elastic_request_generator()
            .on_search_consolidated_iocs(
                param, filter_dict, base_index, blocked_categories, allowed_categories
            )
        )

        response = await elastic_controller.get_instance().search_consolidated_ranked_query(
            indices, query, indices_boost
        )

        ranked_results = []
        if response and "hits" in response and "hits" in response["hits"]:
            for rank, hit in enumerate(response["hits"]["hits"]):
                source = hit.get("_source", {})
                source.pop("m_embedding", None)
                source["rank_index"] = hit.get("_index")
                source["_score"] = hit.get("_score", 0)
                source["_rank"] = rank + 1
                ranked_results.append(source)

        total = 0
        if response and "hits" in response:
            total_field = response["hits"].get("total", 0)
            total = total_field.get("value", 0) if isinstance(total_field, dict) else int(total or 0)

        size = int(query.get("size", 15))
        total_pages = (total + size - 1) // size if size > 0 else 0

        return {
            "Result": ranked_results,
            "Page_Count": total_pages,
            "Total_Hits": total,
        }


    async def search_stealerlogs_persona_breach(self, param: search_credential_param_model):
        document, data_filter = elastic_request_generator().on_search_persona(param)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        body = m_documents.body if hasattr(m_documents, "body") else m_documents
        aggs = body.get("aggregations", {}) if isinstance(body, dict) else {}
        ch = aggs.get("channels", {}).get("buckets", [])
        ty = aggs.get("types", {}).get("buckets", [])

        total_exposures = sum(b.get("doc_count", 0) for b in ch)
        primary_channel = ch[0] if ch else {}
        primary_type = ty[0] if ty else {}

        risk_score = min(100, (total_exposures * 20) + (len(ch) * 10))
        severity = "NONE" if total_exposures == 0 else ("LOW" if risk_score < 30 else "MEDIUM" if risk_score < 70 else "HIGH")

        m_documents = {
            "breach_found": total_exposures > 0,
            "total_exposures": total_exposures,
            "unique_channels": len(ch),
            "unique_types": len(ty),
            "primary_channel": primary_channel.get("key"),
            "primary_channel_hits": primary_channel.get("doc_count", 0),
            "primary_type": primary_type.get("key"),
            "primary_type_hits": primary_type.get("doc_count", 0),
            "risk_score": risk_score,
            "severity": severity
        }

        return m_documents

    @staticmethod
    async def search_consolidated_result(param: search_consolidated_param_model):

        filter_dict = param.entity_filter if param.entity_filter else {}

        indices, queries, labels = elastic_request_generator().on_search_consolidated_data(param, filter_dict)
        responses = await elastic_controller.get_instance().search_consolidated_queries(indices, queries)

        leak_data = {}
        general_data = {}
        exploit_data = {}
        chat_data = {}
        defacement_data = {}
        social_data = {}
        tracking_data = {}
        news_data = {}

        for index, res, label in zip(indices, responses, labels):
            data = {"Result": [], "Suggestions": [], "Page_Count": 0}

            if not res:
                continue

            if (index == "defacement_model") and "aggregations" in res:
                for domain_key, domain_value in res["aggregations"].items():
                    buckets = domain_value.get("by_ioc_type", {}).get("buckets", [])
                    for bucket in buckets:
                        hits = bucket.get("top_hits_per_type", {}).get("hits", {}).get("hits", [])
                        for hit in hits:
                            src = hit["_source"]
                            src.pop("m_embedding", None)
                            data["Result"].append(src)
                data["Page_Count"] = len(data["Result"])
            else:
                hits = res.get("hits", {}).get("hits", [])
                cleaned = []
                for hit in hits:
                    src = hit["_source"]
                    src.pop("m_embedding", None)
                    cleaned.append(src)
                data["Result"] = cleaned
                data["Page_Count"] = len(cleaned)

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
            tracking_model=search_leak_callback_model(**tracking_data),
            news_model=search_leak_callback_model(**news_data))

    async def search_exploit_result(self, param: search_exploit_param_model):
        document, data_filter = elastic_request_generator().on_search_exploitdata(param, param.entity_filter)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)
        return await self.__search_callback.search_handler(
            m_status, m_documents, search_exploit_callback_model, exploit_listing)

    async def search_telegram_result(self, param: search_chat_param_model):
        document, data_filter = elastic_request_generator().on_search_telegram_data(param, param.entity_filter)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        return await self.__search_callback.search_handler(
            m_status, m_documents, SearchChatCallbackModel, {})

    async def search_social_result(self, param: search_social_param_model):
        document, data_filter = elastic_request_generator().on_search_social_data(param, param.entity_filter)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        for hit in m_documents.get("hits", {}).get("hits", []):
            hit.get("_source", {}).pop("m_embedding", None)

        return await self.__search_callback.search_handler(
            m_status, m_documents, search_social_callback_model, {})

    async def search_credential_result(self,
            param: search_credential_param_model,
            search_credential_callback_model=None
    ):
        document, data_filter = elastic_request_generator().on_search_credentials_data(param)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        return await self.__search_callback.search_handler(
            m_status, m_documents, search_credential_callback_model, {})

    async def search_stealerlogs_result(self, param: search_credential_param_model, alert=False):

        document, data_filter = elastic_request_generator().on_search_stealerlogs_data(param, param.entity_filter, alert=alert)

        if not data_filter:
            return False, []

        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        hits = m_documents.get("hits", {}).get("hits", [])
        for h in hits:
            src = h.get("_source", {})
            src["_id"] = h.get("_id")
            if param.category != "credential" and "mapping" in src:
                src["mapping"] = [s.rsplit(":", 1)[0].strip("{}").replace("_", " ").strip() for s in src["mapping"]]

        return await self.__search_callback.search_handler(
            m_status, m_documents, search_stealerlog_callback_model, {}, data_limit=False)

    async def search_stealer_iocs(self, param: search_credential_param_model, alert=False):

        document, data_filter = elastic_request_generator().on_search_stealer_iocs(param, alert=alert)

        if not data_filter:
            return False, []

        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        return await self.__search_callback.search_handler(
            m_status, m_documents, search_stealerlog_callback_model, {}, data_limit=False)

    async def search_stealerlogs_persona_breach(self, param: search_credential_param_model):
        document, data_filter = elastic_request_generator().on_search_persona(param)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

        body = m_documents.body if hasattr(m_documents, "body") else m_documents
        aggs = body.get("aggregations", {}) if isinstance(body, dict) else {}
        ch = aggs.get("channels", {}).get("buckets", [])
        ty = aggs.get("types", {}).get("buckets", [])

        total_exposures = sum(b.get("doc_count", 0) for b in ch)
        primary_channel = ch[0] if ch else {}
        primary_type = ty[0] if ty else {}

        risk_score = min(100, (total_exposures * 20) + (len(ch) * 10))
        severity = "NONE" if total_exposures == 0 else ("LOW" if risk_score < 30 else "MEDIUM" if risk_score < 70 else "HIGH")

        m_documents = {
            "breach_found": total_exposures > 0,
            "total_exposures": total_exposures,
            "unique_channels": len(ch),
            "unique_types": len(ty),
            "primary_channel": primary_channel.get("key"),
            "primary_channel_hits": primary_channel.get("doc_count", 0),
            "primary_type": primary_type.get("key"),
            "primary_type_hits": primary_type.get("doc_count", 0),
            "risk_score": risk_score,
            "severity": severity
        }

        return m_documents

    async def search_defacement_result(self, param: search_defacement_param_model):
        document, data_filter = elastic_request_generator().on_search_defacement_data(param, param.entity_filter)
        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)
        return await self.__search_callback.search_handler(
            m_status, m_documents, search_defacement_callback_model, [])

    @staticmethod
    def _process_entity_filters_generic(filters: Optional[List[entity_filter_param_model]],
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



    async def extract_ioc_from_file(self, file_content: bytes, filename: str):

        async with httpx.AsyncClient(timeout=120) as client:
            files = {
                "file": (filename, file_content)
            }

            response = await client.post(
                "http://trusted-micros-api:8010/ioc/extract",
                files=files
            )

        if response.status_code != status.HTTP_200_OK:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error from trusted-micros-api: {response.text}"
            )

        return response.json()
