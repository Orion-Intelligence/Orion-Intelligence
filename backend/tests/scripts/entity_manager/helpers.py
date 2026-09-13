from __future__ import annotations

import asyncio
from typing import Any

from orion.api.server.entity_manager.constants import enums as graph_enums
from orion.api.server.entity_manager.entity_manager import entity_manager

from tests.scripts.entity_manager.fakes import FakeArangoDb

EM = entity_manager
DEFAULT_RELIABILITY = graph_enums.DEFAULT_SOURCE_RELIABILITY


def run(coro):
    return asyncio.run(coro)


def graph_item(doc_key: str, property_key: str, property_value: str) -> dict[str, Any]:
    doc_id = f"cti_vertices/{doc_key}"
    property_id = f"cti_vertices/{property_key}:{property_value.lower()}"
    return {
        "vertex": {"_id": doc_id, "_key": doc_key, "type": "document"},
        "edge": {
            "_id": f"cti_edges/{doc_key}-{property_key}-{property_value.lower()}",
            "_from": doc_id,
            "_to": property_id,
            "type": f"has_{property_key.replace('m_', '')}",
        },
        "path": {"vertices": [{"_id": doc_id, "_key": doc_key, "type": "document"}], "edges": []},
    }


def build_manager():
    manager = object.__new__(entity_manager)
    db = FakeArangoDb()
    db_attr = "_" + entity_manager.__name__ + "__db"
    setattr(manager, db_attr, db)

    upserts: list[dict[str, Any]] = []
    derived: list[dict[str, Any]] = []

    async def fake_run_with_lock(_lock_key, operation):
        return operation()

    async def fake_upsert_observation_vertex(document, aliases, source_module, source_fields, doc_id):
        upserts.append(
            {
                "document": document,
                "aliases": aliases,
                "source_module": source_module,
                "source_fields": source_fields,
                "doc_id": doc_id,
            }
        )

    async def fake_create_derived_intelligence(observation_records, doc_id, cluster_id, published, source, source_reliability):
        derived.append(
            {
                "observation_records": observation_records,
                "doc_id": doc_id,
                "cluster_id": cluster_id,
            }
        )

    manager._run_arango_with_distributed_lock = fake_run_with_lock
    manager._upsert_observation_vertex = fake_upsert_observation_vertex
    manager._create_derived_intelligence = fake_create_derived_intelligence

    return manager, db, upserts, derived
