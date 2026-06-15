from typing import List, Optional
import httpx
from fastapi import HTTPException
from starlette import status
from starlette.responses import JSONResponse
from orion.api.interactive.search_manager.search_callback_model import search_callback
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_callback_model import grouped_consolidated_search_callback_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import search_credential_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_stealerlog_callback_model import search_stealerlog_callback_model
from orion.api.interactive.search_manager.search_data_model.search_callback_model import result_item
from orion.helper_manager.env_handler import env_handler
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.api.interactive.search_manager.search_query_generator import search_query_generator
from orion.api.interactive.search_manager.search_enums import SEARCH_CONFIG


class search_model:
    __instance = None
    __search_callback = search_callback()

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
    async def dynamic_search(model, api, user_id: str = "system"):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://trusted-micros-api:8010/runtime/parse/{api}/{user_id}", json=model.model_dump(), timeout=120)
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": "Something happened while calling parse/" + api})
                return response.json()
        except Exception:
            return JSONResponse(
                status_code=500, content={"detail": "Something happened while calling parse/" + api})

    @staticmethod
    async def search_wanted_list(model):
        text = getattr(model, "text", {}) or {}
        query = (
            text.get("query")
            or text.get("name")
            or text.get("username")
            or ""
        ).strip()

        if not query:
            return {"cards_data": [], "total": 0}

        data_filter = {
            "query": {
                "bool": {
                    "should": [
                        {"match": {"caption": {"query": query, "operator": "and"}}},
                        {"match": {"name": {"query": query, "operator": "and"}}},
                        {"match": {"alias": {"query": query, "operator": "and"}}},
                        {"match": {"referents": {"query": query, "operator": "and"}}},
                        {"match": {"keywords": {"query": query, "operator": "and"}}}
                    ],
                    "minimum_should_match": 1
                }
            },
            "size": 100,
            "sort": [
                {"_score": {"order": "desc"}},
                {"last_seen": {"order": "desc", "missing": "_last"}}
            ]
        }

        m_status, m_documents = await elastic_controller.get_instance().search_query(
            ELASTIC_INDEX.S_OPENSANCTIONS_INDEX, data_filter
        )
        if not m_status:
            return {"cards_data": [], "total": 0}

        hits = (m_documents or {}).get("hits", {}).get("hits", [])
        cards = []
        for hit in hits:
            source = hit.get("_source", {}) or {}
            cards.append(source)

        return {"cards_data": cards, "total": len(cards)}

    @staticmethod
    async def social_search(model, key):
        try:
            async with httpx.AsyncClient() as client:
                if isinstance(model, dict) and "file_bytes" in model:
                    response = await client.post(
                        "http://trusted-social-api:8020/social/" + key,
                        files={"file": (model["filename"], model["file_bytes"], "application/octet-stream")},
                        timeout=120)
                else:
                    payload = model.model_dump() if hasattr(model, "model_dump") else model
                    response = await client.post(
                        "http://trusted-social-api:8020/social/" + key,
                        json=payload,
                        timeout=120)

                if response.status_code != 200:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": "Social service request failed"})
                return response.json()
        except Exception:
            return JSONResponse(
                status_code=500, content={"detail": "Failed to process social search"})

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

    async def request_apt_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_APT_INDEX, doc_id, lang, ["m_content"])

    async def request_malware_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_MALWARE_INDEX, doc_id, lang, ["m_content"])

    async def request_leak_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_LEAK_INDEX, doc_id, lang, ["m_content", "m_important_content"])

    async def request_chat_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_CHATS_INDEX, doc_id, lang, ["m_content"])

    async def request_social_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_SOCIAL_INDEX, doc_id, lang, ["m_content"])

    async def request_general_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_GENERIC_INDEX, doc_id, lang, ["m_content", "m_important_content"])

    @staticmethod
    def _build_ranked_response(response, query, default_size: int, approximate_page_count: bool = False):
        ranked_results = []
        if response and "hits" in response and "hits" in response["hits"]:
            for rank, hit in enumerate(response["hits"]["hits"]):
                source = hit.get("_source", {})
                source["_id"] = hit.get("_id", "")
                source.pop("m_embedding", None)
                source["rank_index"] = hit.get("_index")
                source["_score"] = hit.get("_score", 0)
                source["_rank"] = rank + 1
                ranked_results.append(source)

        total = 0
        if response and "hits" in response:
            total_field = response["hits"].get("total", 0)
            total = total_field.get("value", 0) if isinstance(total_field, dict) else int(total or 0)

        size = int(query.get("size", default_size))
        from_ = int(query.get("from", 0) or 0)
        current_page = (from_ // size) + 1 if size > 0 else 1
        total_pages = (total + size - 1) // size if size > 0 else 0
        if not approximate_page_count:
            return {"Result": ranked_results, "Page_Count": total_pages, "Total_Hits": total}

        has_next = len(ranked_results) >= size if size > 0 else False
        page_count = current_page + 1 if has_next else (current_page if ranked_results else max(1, current_page - 1))
        return {"Result": ranked_results, "Page_Count": page_count if ranked_results or current_page > 1 else total_pages, "Total_Hits": total}

    @staticmethod
    async def search_consolidated_ranked_result(param: search_consolidated_param_model, base_index, blocked_categories, allowed_categories,search_type=""):
        filter_dict = param.entity_filter if param.entity_filter else {}
        indices, query, indices_boost = search_query_generator().on_search_consolidated_ranked_data(
            param, filter_dict, base_index, blocked_categories, allowed_categories,search_type)

        response = await elastic_controller.get_instance().search_consolidated_ranked_query(
            indices, query, indices_boost)

        return search_model._build_ranked_response(response, query, 10)

    @staticmethod
    async def search_consolidated_iocs(param: search_consolidated_param_model, base_index):
        filter_dict = {}

        indices, query, indices_boost = (
            search_query_generator()
            .on_search_consolidated_iocs(
                param, filter_dict, base_index
            )
        )

        response = await elastic_controller.get_instance().search_consolidated_ranked_query(
            indices, query, indices_boost
        )

        return search_model._build_ranked_response(response, query, 15, approximate_page_count=True)

    @staticmethod
    async def get_apt_filter_options():
        data_filter = {
            "size": 0,
            "aggs": {
                "families": {"terms": {"field": "m_family", "size": 10000, "order": {"_key": "asc"}}},
                "countries": {"terms": {"field": "m_country", "size": 10000, "order": {"_key": "asc"}}},
                "family_docs": {
                    "filter": {"term": {"m_entity_type": "family"}},
                    "aggs": {
                        "names": {"terms": {"field": "m_name", "size": 10000, "order": {"_key": "asc"}}},
                        "titles": {"terms": {"field": "m_title.keyword", "size": 10000, "order": {"_key": "asc"}}}
                    }
                }
            }
        }
        success, documents = await elastic_controller.get_instance().search_query(ELASTIC_INDEX.S_APT_INDEX, data_filter)
        if not success:
            return {"families": [], "countries": []}
        body = documents.body if hasattr(documents, "body") else documents
        aggregations = body.get("aggregations", {}) if isinstance(body, dict) else {}
        family_values = set()
        for bucket in aggregations.get("families", {}).get("buckets", []):
            value = str(bucket.get("key") or "").strip()
            if value:
                family_values.add(value)
        country_values = set()
        for bucket in aggregations.get("countries", {}).get("buckets", []):
            value = str(bucket.get("key") or "").strip()
            if value:
                country_values.add(value)
        family_docs = aggregations.get("family_docs", {})
        for agg_key in ("names", "titles"):
            for bucket in family_docs.get(agg_key, {}).get("buckets", []):
                value = str(bucket.get("key") or "").strip()
                if value:
                    family_values.add(value)
        return {"families": sorted(family_values, key=str.casefold), "countries": sorted(country_values, key=str.casefold)}

    @staticmethod
    async def get_malware_filter_options():
        data_filter = {
            "size": 0,
            "aggs": {
                "countries": {"terms": {"field": "m_country", "size": 10000, "order": {"_key": "asc"}}},
                "content_types": {"terms": {"field": "m_content_type", "size": 10000, "order": {"_key": "asc"}}},
                "reporters": {"terms": {"field": "m_reporter", "size": 10000, "order": {"_key": "asc"}}}
            }
        }
        success, documents = await elastic_controller.get_instance().search_query(ELASTIC_INDEX.S_MALWARE_INDEX, data_filter)
        if not success:
            return {"countries": [], "content_types": [], "reporters": []}
        body = documents.body if hasattr(documents, "body") else documents
        aggregations = body.get("aggregations", {}) if isinstance(body, dict) else {}
        values = {}
        for key in ("countries", "content_types", "reporters"):
            bucket_values = set()
            for bucket in aggregations.get(key, {}).get("buckets", []):
                value = str(bucket.get("key") or "").strip()
                if value:
                    bucket_values.add(value)
            values[key] = sorted(bucket_values, key=str.casefold)
        return values

    async def search_stealerlogs_persona_breach(self, param: search_credential_param_model):
        document, data_filter = search_query_generator().on_search_persona(param)
        _, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

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
        filter_dict = param.entity_filter or {}
        if param.matchtype != "semantic":
            param.matchtype="full"

        SEARCH_TYPES = [
            "leak_model",
            "generic_model",
            "exploit_model",
            "apt_model",
            "malware_model",
            "chat_model",
            "social_model",
            "defacement_model",
            "tracking_model",
            "news_model"
        ]
        if(param.platform):
            if(param.platform == 'leak_model'):
                SEARCH_TYPES = [
                    "leak_model",
                    "tracking_model",
                    "news_model"
                ]
            else:
                SEARCH_TYPES=[param.platform]

        results = {}

        for label in SEARCH_TYPES:

            config = SEARCH_CONFIG[label]

            indices, query, indices_boost = \
                search_query_generator().on_search_consolidated_ranked_data(
                    param,
                    filter_dict,
                    config["base_index"],
                    config["blocked_categories"],
                    config["allowed_categories"]
                )
            response = await elastic_controller.get_instance().search_consolidated_ranked_query(indices,query,indices_boost)
            ranked_response = search_model._build_ranked_response(response, query, 10)
            if getattr(param, "sort_latest", False):
                ranked_response = helper_controller.threat_lens_sort_latest_and_limit_response(ranked_response, 100)
            results[label] = ranked_response

        return grouped_consolidated_search_callback_model(**results)

    async def search_stealer_iocs(self, param: search_credential_param_model):

        document, data_filter  = search_query_generator().on_search_stealer_iocs(param)

        if not data_filter:
            return False, []

        m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)
        response = await self.__search_callback.search_handler( m_status, m_documents,search_stealerlog_callback_model, {}, data_limit=False)
        raw_result_count = len(response.Result or [])


        password_filter = getattr(param, "password_schema", None)
        if password_filter and response and hasattr(response, "Result"):
            filtered_results = [
            item for item in response.Result
            if getattr(item, "password", None) and
               helper_controller.password_matches_schema(item.password, password_filter)
            ]
            response.Result = filtered_results

        page = getattr(param, "page", 1) or 1
        size = getattr(param, "size", None) or (100 if not param.ioc else 500)
        response.Page_Count = page + 1 if raw_result_count >= size else (page if raw_result_count > 0 else max(1, page - 1))

        return response

    async def extract_ioc_from_file(self, file_content: bytes, filename: str, user_id: str = "system"):

        async with httpx.AsyncClient(timeout=120) as client:
            files = {
                "file": (filename, file_content)
            }

            response = await client.post(
                f"http://trusted-micros-api:8010/file/scan/{user_id}",
                files=files
            )

        if response.status_code != status.HTTP_200_OK:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error from trusted-micros-api: {response.text}"
            )

        return response.json()

    async def scan_apk(self, file_content: bytes, filename: str, user_id: str = "system"):

        async with httpx.AsyncClient(timeout=120) as client:
            files = {
                "file": (filename, file_content)
            }

            response = await client.post(
                f"http://trusted-micros-api:8010/apk/scan/{user_id}",
                files=files
            )

        if response.status_code != status.HTTP_200_OK:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error from trusted-micros-api: {response.text}"
            )

        return response.json()

    async def onion_search(self, query, user_id: str = "system"):
        if hasattr(query, "model_dump"):
            payload = query.model_dump()
        elif hasattr(query, "__dict__"):
            payload = query.__dict__
        elif isinstance(query, str):
            payload = {"query": query}
        else:
            payload = {"query": str(query)}

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"http://trusted-micros-api:8010/onion/search/{user_id}",
                json=payload
            )

        if response.status_code != status.HTTP_200_OK:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error from trusted-micros-api: {response.text}"
            )
        return response.json()

    async def network_intel(self, payload, route_name: str, user_id: str = "system"):
        base_url = env_handler.get_instance().env("NETWORK_API_BASE")

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{base_url.rstrip('/')}/netintel/{route_name}/{user_id}",
                json=payload.model_dump()
            )

        if response.status_code != status.HTTP_200_OK:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error from trusted-micros-api: {response.text}"
            )

        return response.json()
