from __future__ import annotations

import asyncio
from typing import Any

from orion.api.server.crawl_manager.class_model.entity_model import entity_model
from orion.api.server.entity_manager.entity_manager import entity_manager
from orion.api.server.entity_manager.modal.EntityQueryModel import (
    EntityGraphBatchQueryModel,
    EntityGraphQueryItem,
    EntityQueryModel,
)

from tests.scripts.entity_manager.fakes import _FakeArangoDB


def _run(coro):
    return asyncio.run(coro)


def _make_manager(db: Any = None) -> entity_manager:
    manager = object.__new__(entity_manager)
    manager._entity_manager__db = db if db is not None else _FakeArangoDB()
    manager._entity_manager__graph = object()
    return manager


def _make_entity(**fields: Any) -> entity_model:
    return entity_model(**fields)


def _make_query(**overrides: Any) -> EntityQueryModel:
    data = {
        "data_point_type": "document",
        "model_type": "",
        "query_value": "example",
        "edge": "25",
        "depth": "1",
        "scope_cluster": "",
    }
    data.update(overrides)
    return EntityQueryModel(**data)


def _make_graph_item(**overrides: Any) -> EntityGraphQueryItem:
    data = {
        "data_point_type": "property",
        "model_type": "m_ip",
        "query_value": "",
        "query_values": [],
        "operator": "||",
        "scope_cluster": "",
    }
    data.update(overrides)
    return EntityGraphQueryItem(**data)


def _make_batch_query(**overrides: Any) -> EntityGraphBatchQueryModel:
    data = {
        "requests": [],
        "data_point_type": "property",
        "model_type": "m_ip",
        "query_value": "1.2.3.4",
        "query_values": [],
        "edge": "25",
        "depth": "1",
        "scope_cluster": "",
    }
    data.update(overrides)
    return EntityGraphBatchQueryModel(**data)


def _make_norm_item(**overrides: Any) -> dict[str, Any]:
    data = {
        "data_point_type": "property",
        "model_type": "m_ip",
        "query_values": ["1.2.3.4"],
        "operator": "||",
        "scope_cluster": "",
    }
    data.update(overrides)
    return data


def _edge_item(edge_from: str, edge_to: str, edge_type: str, vertex: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "edge": {"_from": edge_from, "_to": edge_to, "type": edge_type, "_id": f"cti_edges/{edge_from}-{edge_to}"},
        "vertex": vertex or {},
        "path": None,
    }


def _vertex_item(vertex: dict[str, Any], edge: dict[str, Any] | None = None, path: Any = None) -> dict[str, Any]:
    return {"vertex": vertex, "edge": edge, "path": path}
