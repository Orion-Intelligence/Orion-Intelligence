import asyncio
from typing import List, Optional
import json
import httpx
from fastapi import HTTPException
from starlette import status
from starlette.responses import JSONResponse
from orion.api.interactive.search_manager.search_callback_model import search_callback
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_callback_model import grouped_consolidated_search_callback_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import search_credential_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_stealerlog_callback_model import search_stealerlog_callback_model
from orion.api.interactive.search_manager.search_data_model.power_plants.search_power_plants_param_model import search_power_plants_param_model
from orion.api.interactive.search_manager.search_data_model.search_callback_model import result_item
from orion.helper_manager.env_handler import env_handler
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator
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

    async def request_leak_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_LEAK_INDEX, doc_id, lang, ["m_content", "m_important_content"])

    async def request_chat_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_CHATS_INDEX, doc_id, lang, ["m_content"])

    async def request_social_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_SOCIAL_INDEX, doc_id, lang, ["m_content"])

    async def request_general_doc(self, doc_id, lang: Optional[str]) -> Optional[result_item]:
        return await self._request_doc(ELASTIC_INDEX.S_GENERIC_INDEX, doc_id, lang, ["m_content", "m_important_content"])

    async def request_power_plants_by_ids(self, doc_ids: list[str]):
        if not doc_ids:
            return {"Result": [], "Count": 0}
        body = {
            "ids": doc_ids
        }

        res = await elastic_controller.get_instance().mget_docs(
            ELASTIC_INDEX.S_WRI_POWER_PLANTS_INDEX,
            body
        )

        if not res:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch documents"
            )

        docs = res.get("docs", [])

        results = []
        for d in docs:
            if not d.get("found"):
                continue

            src = d.get("_source", {}) or {}

            results.append({
                "id": d.get("_id"),
                "name": src.get("name"),
                "country": src.get("country"),
                "type": src.get("type"),
                "capacity": src.get("capacity_mw"),
                "source": src.get("source"),
                "location": src.get("location"),
                "location_point": src.get("location_point"),
            })

        return {
            "Result": results,
            "Count": len(results)
        }

    async def stream_power_plants_points(self, chunk_size: int = 1000):
        chunk_size = max(100, min(chunk_size, 5000))

        async def generator():

            search_after = None

            while True:

                query = {
                    "size": chunk_size,
                    "_source": [
                        "name",
                        "type",
                        "country",
                        "capacity_mw",
                        "source",
                        "aeroway",
                        "building",
                        "landuse",
                        "man_made",
                        "military",
                        "power",
                        "location.lat",
                        "location.lon",
                        "location_point.lat",
                        "location_point.lon",
                        "location",
                        "location_point"
                    ],
                    "sort": ["_shard_doc"],
                    "track_total_hits": False,
                    "query": {
                        "match_all": {}
                    }
                }

                if search_after:
                    query["search_after"] = search_after

                m_status, docs = await elastic_controller.get_instance().search_query(
                    ELASTIC_INDEX.S_WRI_POWER_PLANTS_INDEX,
                    query
                )

                if not m_status:
                    break

                body = docs.body if hasattr(docs, "body") else docs

                hits = body.get("hits", {}).get("hits", [])

                if not hits:
                    break

                result = []

                for hit in hits:
                    src = hit.get("_source", {}) or {}
                    loc = src.get("location", {}) or {}
                    loc_point = src.get("location_point", {}) or {}

                    lat = loc.get("lat") if isinstance(loc, dict) else None
                    lon = loc.get("lon") if isinstance(loc, dict) else None
                    if lat is None or lon is None:
                        lat = loc_point.get("lat") if isinstance(loc_point, dict) else lat
                        lon = loc_point.get("lon") if isinstance(loc_point, dict) else lon
                    result.append({
                        "id": hit.get("_id"),
                        "name": src.get("name"),
                        "type": src.get("type"),
                        "country": src.get("country"),
                        "capacity_mw": src.get("capacity_mw"),
                        "source": src.get("source"),
                        "aeroway": src.get("aeroway"),
                        "building": src.get("building"),
                        "landuse": src.get("landuse"),
                        "man_made": src.get("man_made"),
                        "military": src.get("military"),
                        "power": src.get("power"),
                        "location": src.get("location"),
                        "location_point": src.get("location_point"),
                        "lat": lat,
                        "lon": lon,
                    })
                yield (json.dumps(result) + "\n")
                await asyncio.sleep(0.01)
                last_sort = hits[-1].get("sort")
                if not last_sort:
                    break
                search_after = last_sort

        return generator()
    

    @staticmethod
    def _build_ranked_response(response, query, default_size: int, approximate_page_count: bool = False):
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
        indices, query, indices_boost = elastic_request_generator().on_search_consolidated_ranked_data(
            param, filter_dict, base_index, blocked_categories, allowed_categories,search_type)

        response = await elastic_controller.get_instance().search_consolidated_ranked_query(
            indices, query, indices_boost)

        return search_model._build_ranked_response(response, query, 10)

    @staticmethod
    async def search_consolidated_iocs(param: search_consolidated_param_model, base_index):
        filter_dict = {}

        indices, query, indices_boost = (
            elastic_request_generator()
            .on_search_consolidated_iocs(
                param, filter_dict, base_index
            )
        )

        response = await elastic_controller.get_instance().search_consolidated_ranked_query(
            indices, query, indices_boost
        )

        return search_model._build_ranked_response(response, query, 15, approximate_page_count=True)


    async def search_stealerlogs_persona_breach(self, param: search_credential_param_model):
        document, data_filter = elastic_request_generator().on_search_persona(param)
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
        param.matchtype="full"

        SEARCH_TYPES = [
            "leak_model",
            "generic_model",
            "exploit_model",
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
                elastic_request_generator().on_search_consolidated_ranked_data(
                    param,
                    filter_dict,
                    config["base_index"],
                    config["blocked_categories"],
                    config["allowed_categories"]
                )
            response = await elastic_controller.get_instance().search_consolidated_ranked_query(indices,query,indices_boost)
            results[label] = search_model._build_ranked_response(response, query, 10)

        return grouped_consolidated_search_callback_model(**results)

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

        response = await self.__search_callback.search_handler(
            m_status, m_documents, search_stealerlog_callback_model, {}, data_limit=False)
        page = getattr(param, "page", 1) or 1
        size = getattr(param, "size", 500) or 500
        result_count = len(response.Result or [])
        response.Page_Count = page + 1 if result_count >= size else (page if result_count > 0 else max(1, page - 1))
        return response

    async def search_stealer_iocs(self, param: search_credential_param_model):

        document, data_filter  = elastic_request_generator().on_search_stealer_iocs(param)

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
                f"http://trusted-micros-api:8010/ioc/extract/{user_id}",
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
