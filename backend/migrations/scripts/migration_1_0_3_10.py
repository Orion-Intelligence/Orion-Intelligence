import asyncio
import os
from typing import Any

from elastic_transport import ApiError
from elasticsearch import helpers as es_helpers

from orion.api.server.crawl_manager.class_model.entity_model import entity_model
from orion.api.server.entity_manager.entity_manager import entity_manager
from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model


class CtiGraphRebuilder:
    INDEX_CLUSTER_MAP = {
        ELASTIC_INDEX.S_GENERIC_INDEX: "general",
        ELASTIC_INDEX.S_LEAK_INDEX: "leak",
        ELASTIC_INDEX.S_DEFACEMENT_INDEX: "defacement",
        ELASTIC_INDEX.S_CHATS_INDEX: "chat",
        ELASTIC_INDEX.S_EXPLOIT_INDEX: "exploit",
        ELASTIC_INDEX.S_SOCIAL_INDEX: "social",
        ELASTIC_INDEX.S_APT_INDEX: "apt",
        ELASTIC_INDEX.S_MALWARE_INDEX: "malware",
    }
    LEAK_CONTENT_TYPE_CLUSTERS = ("tracking", "news", "leaks", "leak")
    SCROLL_SIZE = 500
    SCROLL_TIMEOUT = "5m"
    REQUEST_TIMEOUT = 220
    PROGRESS_INTERVAL = 1000
    DEFAULT_CONCURRENCY = 8

    @classmethod
    async def rebuild_from_elasticsearch(cls, dry_run: bool = False) -> dict[str, Any]:
        await cls._ensure_connections()

        es = elastic_controller.get_instance().get_connection()
        manager = entity_manager.get_instance()

        index_counts = await cls._count_indices(es)
        total_documents = sum(index_counts.values())

        summary: dict[str, Any] = {
            "dry_run": dry_run,
            "indices": index_counts,
            "total_documents": total_documents,
            "processed": 0,
            "indexed": 0,
            "skipped": 0,
            "failed": 0,
            "failures": [],
        }

        if dry_run:
            return summary

        await manager.clear_cti_graph()

        next_progress = cls.PROGRESS_INTERVAL
        concurrency = cls._concurrency()

        async def flush(batch: list[tuple[str, dict[str, Any]]]):
            nonlocal next_progress
            results = await asyncio.gather(
                *(cls._process_document(manager, index, document) for index, document in batch)
            )
            for status, failure in results:
                summary["processed"] += 1
                if status == "indexed":
                    summary["indexed"] += 1
                elif status == "skipped":
                    summary["skipped"] += 1
                else:
                    summary["failed"] += 1
                    if failure:
                        cls._append_failure(summary, failure["index"], failure["document"], failure["reason"])

            while summary["processed"] >= next_progress:
                log.g().i(
                    "CTI graph rebuild progress: "
                    f"{summary['processed']}/{total_documents} processed, "
                    f"{summary['indexed']} indexed, {summary['skipped']} skipped, "
                    f"{summary['failed']} failed"
                )
                next_progress += cls.PROGRESS_INTERVAL

        for index, cluster_id in cls.INDEX_CLUSTER_MAP.items():
            batch: list[tuple[str, dict[str, Any]]] = []
            async for document in cls._scan_index(es, index, cluster_id):
                batch.append((index, document))
                if len(batch) >= concurrency:
                    await flush(batch)
                    batch = []
            if batch:
                await flush(batch)

        log.g().i(
            "CTI graph rebuild completed: "
            f"{summary['indexed']} indexed, {summary['skipped']} skipped, {summary['failed']} failed, "
            f"{summary['processed']} processed"
        )
        return summary

    @classmethod
    async def _process_document(cls, manager: entity_manager, index: str, document: dict[str, Any]):
        try:
            result = await manager.create_or_update_entity_nodes(entity_model(**document))
            return ("indexed" if result.get("status") == "success" else "skipped"), None
        except Exception as ex:
            return "failed", {"index": index, "document": document, "reason": str(ex)}

    @classmethod
    def _concurrency(cls) -> int:
        try:
            value = int(os.getenv("CTI_GRAPH_REBUILD_CONCURRENCY", str(cls.DEFAULT_CONCURRENCY)))
        except ValueError:
            value = cls.DEFAULT_CONCURRENCY
        return max(1, min(value, 32))

    @classmethod
    async def _ensure_connections(cls):
        es_controller = elastic_controller.get_instance()
        if es_controller.get_connection() is None:
            await es_controller.initialize()

        arango = arango_controller.get_instance()
        if arango.get_db() is None:
            await arango.link_connection()
        if arango.get_graph() is None:
            await arango.initialize()

    @classmethod
    async def _count_indices(cls, es) -> dict[str, int]:
        counts: dict[str, int] = {}
        for index in cls.INDEX_CLUSTER_MAP:
            try:
                result = await es.count(
                    index=index,
                    body={"query": {"match_all": {}}},
                    allow_no_indices=True,
                    ignore_unavailable=True,
                    request_timeout=cls.REQUEST_TIMEOUT,
                )
                counts[index] = int(result.get("count", 0))
            except ApiError as ex:
                status_code = getattr(ex, "status_code", None) or getattr(getattr(ex, "meta", None), "status", None)
                if status_code not in {404, 503}:
                    raise
                log.g().w(f"Skipping unavailable Elasticsearch index {index}: {str(ex)}")
                counts[index] = 0
        return counts

    @classmethod
    async def _scan_index(cls, es, index: str, cluster_id: str):
        if not await es.indices.exists(
                index=index,
                allow_no_indices=True,
                ignore_unavailable=True,
                request_timeout=cls.REQUEST_TIMEOUT):
            return

        async for hit in es_helpers.async_scan(
                es,
                index=index,
                query={"query": {"match_all": {}}},
                size=cls.SCROLL_SIZE,
                scroll=cls.SCROLL_TIMEOUT,
                preserve_order=False,
                request_timeout=cls.REQUEST_TIMEOUT,
                raise_on_error=False):
            source = hit.get("_source")
            if not isinstance(source, dict):
                continue

            document = dict(source)
            document.pop("m_embedding", None)
            document["m_cluster_id"] = cls._cluster_for_document(index, document, cluster_id)
            if not document.get("m_document_id"):
                document["m_document_id"] = (
                    document.get("m_hash")
                    or document.get("m_message_id")
                    or document.get("m_url")
                    or document.get("m_title")
                    or hit.get("_id")
                )
            if not document.get("m_hash") and hit.get("_id"):
                document["m_hash"] = hit.get("_id")
            yield document

    @classmethod
    def _cluster_for_document(cls, index: str, document: dict[str, Any], default_cluster_id: str) -> str:
        explicit_cluster = str(document.get("m_cluster_id") or "").strip().lower()
        if explicit_cluster in {"leak", "tracking", "news"}:
            return explicit_cluster

        if index != ELASTIC_INDEX.S_LEAK_INDEX:
            return default_cluster_id

        raw_content_type = document.get("m_content_type") or document.get("content_type") or []
        content_types = raw_content_type if isinstance(raw_content_type, list) else [raw_content_type]
        normalized_types = {str(item).strip().lower() for item in content_types if item not in (None, "", [], {})}

        for content_type in cls.LEAK_CONTENT_TYPE_CLUSTERS:
            if content_type in normalized_types:
                return "leak" if content_type == "leaks" else content_type

        return default_cluster_id

    @staticmethod
    def _append_failure(summary: dict[str, Any], index: str, document: dict[str, Any], reason: str):
        if len(summary["failures"]) >= 20:
            return
        summary["failures"].append(
            {
                "index": index,
                "document_id": document.get("m_document_id") or document.get("m_hash"),
                "reason": reason,
            }
        )


class migration_1_0_3_10:
    @staticmethod
    async def migrate(version):
        engine = mongo_controller.get_instance().get_engine()

        if engine is None:
            raise Exception("MongoDB is not connected. Migration cannot proceed.")

        summary = await CtiGraphRebuilder.rebuild_from_elasticsearch(dry_run=False)
        if summary["total_documents"] > 0 and summary["indexed"] == 0:
            raise Exception(f"CTI graph rebuild produced no indexed graph documents: {summary}")
        if summary["failed"] > 0:
            log.g().w(f"CTI graph rebuild completed with skipped failures: {summary}")

        await migration_1_0_3_10.update_version(engine, version)

    @staticmethod
    async def update_version(engine, version):
        existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing_version_entry is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing_version_entry.value = str(version)
            await engine.save(existing_version_entry)
