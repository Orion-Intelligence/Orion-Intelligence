import asyncio

import httpx
from bson import ObjectId
from fastapi import HTTPException

from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX, ELASTIC_KEYS
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model


class SiemLogManager:
    __instance = None
    _NLP_PARSE_URL = "http://trusted-micros-api:8010/nlp/parse"
    _IOC_ENRICH_CONCURRENCY = 10

    @staticmethod
    def get_instance():
        if SiemLogManager.__instance is None:
            SiemLogManager.__instance = SiemLogManager()
        return SiemLogManager.__instance

    def __init__(self):
        from orion.services.mongo_manager.mongo_controller import mongo_controller
        self._engine = mongo_controller.get_instance().get_engine()
        if SiemLogManager.__instance is not None:
            raise Exception("This class is a singleton!")
        SiemLogManager.__instance = self

    async def inject_logs(self, payload, current_user):
        await self._ensure_event_management_enabled(current_user)
        logs = payload.logs
        tenant_id = str(current_user.tenant_uuid)
        enriched_logs = await self._enrich_logs_with_iocs([item.model_dump(exclude_none=True) for item in logs])
        if not enriched_logs:
            return {
                "indexed": 0,
                "index": ELASTIC_INDEX.S_SIEM_INDEX,
                "ids": [],
            }

        index_entries = elastic_request_generator.index_query_siem_logs(
            enriched_logs,
            tenant_id,
        )

        conn = elastic_controller.get_instance().get_connection()
        indexed_ids = []

        for entry in index_entries:
            await conn.update(
                index=entry[ELASTIC_KEYS.S_DOCUMENT],
                id=entry["doc_id"],
                body={"doc": entry[ELASTIC_KEYS.S_VALUE], "doc_as_upsert": True},
                request_timeout=220,
            )
            indexed_ids.append(entry["doc_id"])

        return {
            "indexed": len(indexed_ids),
            "index": index_entries[0][ELASTIC_KEYS.S_DOCUMENT],
            "ids": indexed_ids,
        }

    async def _enrich_logs_with_iocs(self, logs: list[dict]) -> list[dict]:
        semaphore = asyncio.Semaphore(self._IOC_ENRICH_CONCURRENCY)

        async with httpx.AsyncClient(timeout=120) as client:
            enriched_results = await asyncio.gather(
                *(self._enrich_single_log(item, client, semaphore) for item in logs)
            )
        return [item for item in enriched_results if item is not None]

    async def _enrich_single_log(self, item: dict, client: httpx.AsyncClient, semaphore: asyncio.Semaphore) -> dict | None:
        raw_value = self._get_raw_log_value(item)
        if not raw_value:
            return None

        async with semaphore:
            grouped_iocs = await self._fetch_grouped_iocs(client, raw_value)
            if not grouped_iocs:
                return None

        enriched = dict(item)
        enriched.update(grouped_iocs)
        return enriched

    @staticmethod
    def _get_raw_log_value(item: dict) -> str:
        return str(item.get("raw") or "").strip()

    async def _fetch_grouped_iocs(self, client: httpx.AsyncClient, raw_value: str) -> dict | None:
        try:
            extracted_iocs = await self._request_iocs(client, raw_value)
        except Exception:
            return None

        if extracted_iocs is None:
            return None

        grouped_iocs = self._group_extracted_iocs(extracted_iocs)
        return grouped_iocs or None

    async def _request_iocs(self, client: httpx.AsyncClient, raw_value: str) -> list[dict] | None:
        response = await client.post(
            self._NLP_PARSE_URL,
            json={"data": [raw_value]},
        )
        response.raise_for_status()
        return self._extract_iocs_from_response(response.json())

    @staticmethod
    def _group_extracted_iocs(iocs: list[dict]) -> dict:
        grouped: dict[str, list[str]] = {}

        for ioc in iocs or []:
            if not isinstance(ioc, dict):
                continue
            for key, value in ioc.items():
                normalized_key = str(key or "").strip()
                if not normalized_key:
                    continue
                values = value if isinstance(value, list) else [value]
                for entry in values:
                    text = str(entry or "").strip()
                    if not text:
                        continue
                    grouped.setdefault(normalized_key, [])
                    if text not in grouped[normalized_key]:
                        grouped[normalized_key].append(text)

        return grouped

    @staticmethod
    def _extract_iocs_from_response(payload: dict) -> list[dict] | None:
        if not isinstance(payload, dict):
            return None

        result = payload.get("result")
        if isinstance(result, list):
            flattened: list[dict] = []
            for item in result:
                if isinstance(item, dict):
                    flattened.append(item)
                elif isinstance(item, list):
                    flattened.extend(entry for entry in item if isinstance(entry, dict))
            return flattened

        return None

    async def search_logs(self, payload, current_user):
        await self._ensure_event_management_enabled(current_user)
        tenant_id = str(current_user.tenant_uuid)
        document, data_filter = elastic_request_generator.search_query_siem_logs(
            payload.q,
            tenant_id,
            payload.from_,
            payload.size,
            payload.date_range,
        )
        success, response = await elastic_controller.get_instance().search_query(document, data_filter)
        if not success:
            raise RuntimeError(f"SIEM search failed: {response}")

        body = response.body if hasattr(response, "body") else response
        hits = body.get("hits", {}).get("hits", []) if isinstance(body, dict) else []
        total_field = body.get("hits", {}).get("total", 0) if isinstance(body, dict) else 0
        total_hits = total_field.get("value", 0) if isinstance(total_field, dict) else int(total_field or 0)
        batch_size = data_filter["size"]
        page_count = (total_hits + batch_size - 1) // batch_size if batch_size > 0 else 0

        return {
            "cards_data": [hit.get("_source", {}) for hit in hits],
            "total_hits": total_hits,
            "page_count": page_count,
            "batch_size": batch_size,
        }

    async def _ensure_event_management_enabled(self, current_user) -> None:
        tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(str(current_user.tenant_uuid)))
        if not tenant or not getattr(tenant, "event_management_enabled", False):
            raise HTTPException(status_code=403, detail="Event management is disabled for this tenant")
