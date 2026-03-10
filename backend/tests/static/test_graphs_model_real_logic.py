from __future__ import annotations

import asyncio
from contextlib import contextmanager
from datetime import UTC, datetime
from types import SimpleNamespace

from fastapi.responses import JSONResponse

import orion.api.interactive.graph_manager.graphs_model as graphs_module
from orion.api.interactive.graph_manager.graphs_model import graphs_model
from orion.services.mongo_manager.shared_model.db_graph_sessions_model import db_graph_sessions_model


@contextmanager
def _swap_attrs(*items):
    originals = []
    try:
        for owner, attr, value in items:
            originals.append((owner, attr, getattr(owner, attr)))
            setattr(owner, attr, value)
        yield
    finally:
        for owner, attr, value in reversed(originals):
            setattr(owner, attr, value)


class _GraphEngine:
    def __init__(self, existing=None, fail=False):
        self.existing = existing
        self.fail = fail
        self.saved = []

    async def find_one(self, *_args, **_kwargs):
        if self.fail:
            raise RuntimeError("graph lookup failed")
        return self.existing

    async def save(self, doc):
        if self.fail:
            raise RuntimeError("graph save failed")
        self.saved.append(doc)
        self.existing = doc
        return doc


class _Response:
    def __init__(self, status_code: int, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class _AsyncClientSuccess:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, **kwargs):
        return _Response(200, {"status": "ok", "url": url, "payload": kwargs})


class _AsyncClientFailure(_AsyncClientSuccess):
    async def post(self, url, **kwargs):
        return _Response(503, {"detail": "down"})


class _AsyncClientError(_AsyncClientSuccess):
    async def post(self, url, **kwargs):
        raise RuntimeError("boom")


def _graph_manager(engine) -> graphs_model:
    manager = object.__new__(graphs_model)
    manager._engine = engine
    return manager


def test_graphs_model_social_search_supports_json_and_file_payloads():
    manager = _graph_manager(_GraphEngine())
    model = SimpleNamespace(model_dump=lambda: {"username": "orion_demo_actor"})
    upload = {"filename": "avatar.png", "file_bytes": b"abc"}

    with _swap_attrs((graphs_module.httpx, "AsyncClient", _AsyncClientSuccess)):
        json_out = asyncio.run(manager.social_search(model, "followers"))
        file_out = asyncio.run(manager.social_search(upload, "entity"))

    assert json_out["status"] == "ok"
    assert file_out["status"] == "ok"


def test_graphs_model_social_search_returns_json_response_on_failure_or_exception():
    manager = _graph_manager(_GraphEngine())
    model = SimpleNamespace(model_dump=lambda: {"username": "orion_demo_actor"})

    with _swap_attrs((graphs_module.httpx, "AsyncClient", _AsyncClientFailure)):
        failed = asyncio.run(manager.social_search(model, "posts"))
    with _swap_attrs((graphs_module.httpx, "AsyncClient", _AsyncClientError)):
        errored = asyncio.run(manager.social_search(model, "posts"))

    assert isinstance(failed, JSONResponse)
    assert failed.status_code == 503
    assert isinstance(errored, JSONResponse)
    assert errored.status_code == 500


def test_graphs_model_tab_flows_cover_summary_add_and_upsert():
    manager = _graph_manager(_GraphEngine())

    summary = asyncio.run(manager.get_tabs_summary("user-1", "social"))
    assert summary["total_tabs"] == 0

    created = asyncio.run(manager.add_tab("user-1", "social", {"id": "tab-1", "label": "One"}))
    assert created["total_tabs"] == 1

    updated = asyncio.run(
        manager.upsert_data(
            "user-1",
            "social",
            {
                "active_tab_id": "tab-1",
                "tab_counter": 2,
                "tabs": [{"id": "tab-1"}, {"id": "tab-2"}],
                "extra": {"view": "map"},
                "schema_version": 3,
                "_id": "ignore",
                "graph_type": "ignored",
            },
        )
    )
    assert isinstance(updated, db_graph_sessions_model)
    assert updated.active_tab_id == "tab-1"
    assert len(updated.tabs) == 2

    after_summary = asyncio.run(manager.get_tabs_summary("user-1", "social"))
    assert after_summary["total_tabs"] == 2


def test_graphs_model_rejects_more_than_five_tabs_and_handles_engine_errors():
    crowded = db_graph_sessions_model(
        user_id="user-1",
        graph_type="social",
        tabs=[{"id": f"tab-{i}"} for i in range(5)],
        tab_counter=5,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    crowded_manager = _graph_manager(_GraphEngine(existing=crowded))
    crowded_add = asyncio.run(crowded_manager.add_tab("user-1", "social", {"id": "tab-6"}))
    crowded_upsert = asyncio.run(
        crowded_manager.upsert_data("user-1", "social", {"tabs": [{"id": f"tab-{i}"} for i in range(6)]})
    )
    broken_manager = _graph_manager(_GraphEngine(fail=True))
    broken_summary = asyncio.run(broken_manager.get_tabs_summary("user-1", "social"))

    assert isinstance(crowded_add, JSONResponse)
    assert crowded_add.status_code == 400
    assert isinstance(crowded_upsert, JSONResponse)
    assert crowded_upsert.status_code == 400
    assert isinstance(broken_summary, JSONResponse)
    assert broken_summary.status_code == 500
