import asyncio
import hashlib
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from bson import ObjectId
from fastapi import HTTPException

from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_ENUMS, ELASTIC_INDEX, ELASTIC_KEYS
from orion.api.interactive.search_manager.search_query_generator import search_query_generator
from orion.helper_manager.helper_controller import helper_controller
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

        index_entries = self.index_query_siem_logs(
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
        document, data_filter = self.search_query_siem_logs(
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

    @staticmethod
    def search_query_siem_logs(query_text: str, tenant_id: str, from_: int = 0, size: int = 500, date_range: str | None = None):
        must_clauses: list[dict[str, Any]] = [{"term": {"tenant_id": tenant_id}}]
        normalized_query = (query_text or "").strip()

        if not normalized_query:
            must_clauses.append({"match_all": {}})
        elif ":" in normalized_query and ("&&" in normalized_query or "||" in normalized_query or re.search(r"\b(?:all|domain|email|ip|event_type|source|host|user|severity):", normalized_query)) is not None:
            parsed = helper_controller.parse_tagged_logic_query_for_iocs(normalized_query)
            logic_query = search_query_generator.build_es_from_tagged(parsed, ELASTIC_ENUMS.mapping_siem_iocs)
            must_clauses.append(logic_query)
        else:
            should_clauses: list[dict[str, Any]] = [{
                "simple_query_string": {
                    "query": normalized_query,
                    "fields": [
                        "raw^5",
                        "event_type^4",
                        "source^3",
                        "severity^2",
                        "host^3",
                        "user^3",
                        "tags^2",
                        "hash^3",
                        "event_id^3",
                        "m_*^4",
                        "m_domain^4",
                        "m_email^4",
                        "m_ip^4",
                        "*"
                    ],
                    "default_operator": "and",
                    "lenient": True
                }
            }]

            exact_value = normalized_query
            if exact_value:
                escaped_exact_value = exact_value.replace("\\", "\\\\").replace('"', '\\"')
                should_clauses.extend([
                    {"term": {"m_ip": exact_value}},
                    {"term": {"m_domain": exact_value}},
                    {"term": {"m_email": exact_value}},
                    {
                        "query_string": {
                            "query": f"\"{escaped_exact_value}\"",
                            "fields": ["m_*"],
                            "lenient": True
                        }
                    }
                ])

            must_clauses.append({
                "bool": {
                    "should": should_clauses,
                    "minimum_should_match": 1
                }
            })

        if date_range:
            start_date, end_date = [part.strip() for part in date_range.split(",", 1)]
            must_clauses.append({
                "range": {
                    "timestamp": {
                        "gte": start_date,
                        "lte": end_date
                    }
                }
            })

        query_body: dict[str, Any] = {
            "query": {
                "bool": {
                    "must": must_clauses
                }
            },
            "from": from_,
            "size": size,
            "sort": [
                {"timestamp": {"order": "desc", "missing": "_last"}},
                {"ingested_at": {"order": "desc", "missing": "_last"}}
            ]
        }
        return ELASTIC_INDEX.S_SIEM_INDEX, query_body

    @staticmethod
    def index_query_siem_logs(logs, tenant_id: str):
        index_entries = []

        for index, item in enumerate(logs, start=1):
            now = datetime.now(timezone.utc).isoformat()
            raw = item["raw"].strip()
            timestamp = item.get("timestamp") or now
            ingested_at = item.get("ingested_at") or now
            doc_id = hashlib.sha256(f"{tenant_id}:{raw}".encode("utf-8")).hexdigest()

            document = dict(item)
            document["tenant_id"] = tenant_id
            document["raw"] = raw
            document["timestamp"] = timestamp
            document["ingested_at"] = ingested_at
            document["hash"] = document.get("hash") or doc_id
            document["event_id"] = document.get("event_id") or f"siem-event-{index:04d}"

            index_entries.append({
                "doc_id": doc_id,
                ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_SIEM_INDEX,
                ELASTIC_KEYS.S_VALUE: document,
            })

        return index_entries

    async def _ensure_event_management_enabled(self, current_user) -> None:
        tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(str(current_user.tenant_uuid)))
        if not tenant or not getattr(tenant, "event_management_enabled", False):
            raise HTTPException(status_code=403, detail="Event management is disabled for this tenant")
