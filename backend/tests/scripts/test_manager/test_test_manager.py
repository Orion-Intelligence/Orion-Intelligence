from __future__ import annotations

import json
from datetime import datetime

import motor.motor_asyncio
from types import SimpleNamespace

import orion.management.managers.test_manager as tm_module
from orion.management.managers.test_manager import test_manager
from orion.services.mongo_manager.mongo_enums import MONGO_CONNECTIONS
from orion.services.elastic_manager.elastic_enums import ELASTIC_CONNECTIONS
from orion.services.arango_manager.arango_enums import ARANGO_CONNECTIONS
from orion.services.session_manager.session_enums import admin_mock, admin_user, crawler_mock, crawler_user
from tests.scripts.test_manager.helpers import (
    FakeArangoClient,
    FakeArangoDB,
    FakeElasticClient,
    FakeMotorClient,
    env_handler_stub,
    null_log,
    patch_path,
    _run,
)


def _make_manager():
    manager = object.__new__(test_manager)
    return manager


def _guard_overrides(monkeypatch):
    monkeypatch.setattr(MONGO_CONNECTIONS, "S_MONGO_DATABASE_NAME", MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME, raising=False)
    monkeypatch.setattr(ELASTIC_CONNECTIONS, "S_DATABASE_NAME", ELASTIC_CONNECTIONS.S_DATABASE_NAME, raising=False)
    monkeypatch.setattr(ARANGO_CONNECTIONS, "ARANGO_DATABASE_NAME", ARANGO_CONNECTIONS.ARANGO_DATABASE_NAME, raising=False)
    monkeypatch.setitem(admin_mock, "username", admin_mock.get("username"))
    monkeypatch.setitem(admin_user, "password", admin_user.get("password"))
    monkeypatch.setitem(crawler_mock, "username", crawler_mock.get("username"))
    monkeypatch.setitem(crawler_user, "password", crawler_user.get("password"))


def test_apply_test_overrides_disabled(monkeypatch):
    monkeypatch.setattr(tm_module, "env_handler", env_handler_stub(False))
    manager = _make_manager()
    _run(manager.apply_test_overrides())


def test_apply_test_overrides_enabled(monkeypatch):
    _guard_overrides(monkeypatch)
    monkeypatch.setattr(tm_module, "env_handler", env_handler_stub(True))
    manager = _make_manager()
    _run(manager.apply_test_overrides())
    assert MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME == "orion-web_test"
    assert ELASTIC_CONNECTIONS.S_DATABASE_NAME == "orion-elastic-search_test"
    assert admin_mock["username"] == "admin_test_username"
    assert crawler_mock["username"] == "crawler_test_username"


def test_fix_converts_oid_and_dates_and_nested():
    manager = _make_manager()
    oid = manager._fix({"$oid": "507f1f77bcf86cd799439011"})
    assert str(oid) == "507f1f77bcf86cd799439011"

    epoch = manager._fix({"$date": 1700000000000})
    assert isinstance(epoch, datetime)

    iso = manager._fix({"$date": "2026-01-01T00:00:00Z"})
    assert iso.year == 2026

    nested = manager._fix({"a": [{"b": {"$oid": "507f1f77bcf86cd799439011"}}], "c": 5})
    assert str(nested["a"][0]["b"]) == "507f1f77bcf86cd799439011"
    assert nested["c"] == 5

    assert manager._fix("plain") == "plain"


def test_reset_mongo_disabled(monkeypatch):
    monkeypatch.setattr(tm_module, "env_handler", env_handler_stub(False))
    manager = _make_manager()
    _run(manager.reset_test_mongo_and_import_mocks())


def _seed_mongo_fixtures(root):
    mocks_dir = root / "tests" / "mock" / "mongo"
    mocks_dir.mkdir(parents=True, exist_ok=True)
    (mocks_dir / "orion-web.db_tenant_model.json").write_text(
        json.dumps([{"is_default": True, "name": "t1"}, {"is_default": False, "name": "t2"}]), encoding="utf-8"
    )
    (mocks_dir / "orion-web.db_user_account.json").write_text(
        json.dumps([{"username": "u1", "role": "analyst"}]), encoding="utf-8"
    )
    (mocks_dir / "orion-web.db_system_model.json").write_text(
        json.dumps({"data": [{"key": "v"}]}), encoding="utf-8"
    )
    (mocks_dir / "orion-web.db_alert_model.json").write_text(
        json.dumps({"single": True}), encoding="utf-8"
    )
    (mocks_dir / "orion-web.db_empty_model.json").write_text(json.dumps([]), encoding="utf-8")
    (mocks_dir / "short.json").write_text(json.dumps([{"x": 1}]), encoding="utf-8")


def test_reset_mongo_enabled(monkeypatch, tmp_path):
    monkeypatch.setattr(tm_module, "env_handler", env_handler_stub(True))
    monkeypatch.setattr(tm_module, "log", null_log())
    monkeypatch.setattr(motor.motor_asyncio, "AsyncIOMotorClient", FakeMotorClient)

    demo_calls = []

    async def ensure_demo_user():
        demo_calls.append(True)

    monkeypatch.setattr(
        tm_module, "mongo_controller",
        SimpleNamespace(get_instance=staticmethod(lambda: SimpleNamespace(ensure_demo_user=ensure_demo_user))),
    )
    _seed_mongo_fixtures(tmp_path)
    patch_path(monkeypatch, tm_module, tmp_path)

    manager = _make_manager()
    _run(manager.reset_test_mongo_and_import_mocks())
    assert demo_calls == [True]


def test_reset_elastic_disabled(monkeypatch):
    monkeypatch.setattr(tm_module, "env_handler", env_handler_stub(False))
    manager = _make_manager()
    _run(manager.reset_test_elastic_and_import_mocks())


def _seed_elastic_fixtures(root):
    mocks_dir = root / "tests" / "mock" / "elastic"
    mocks_dir.mkdir(parents=True, exist_ok=True)
    lines = [
        json.dumps({"_id": "1", "_index": "leak_model", "_source": {"a": 1}}),
        json.dumps({"b": 2}),
        "",
    ]
    (mocks_dir / "leak_model.data.ndjson").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (mocks_dir / "leak_model.mapping.json").write_text(
        json.dumps({"leak_model": {"mappings": {"properties": {"a": {"type": "long"}}}}}), encoding="utf-8"
    )
    (mocks_dir / "leak_model.settings.json").write_text(
        json.dumps({"leak_model": {"settings": {"index": {"number_of_shards": "1", "analysis": {"x": 1}}}}}),
        encoding="utf-8",
    )
    (mocks_dir / "empty_model.data.ndjson").write_text("", encoding="utf-8")
    (mocks_dir / "blank_model.data.ndjson").write_text("   \n\n", encoding="utf-8")
    (mocks_dir / "bare_model.data.ndjson").write_text(
        json.dumps({"_id": "9", "_source": {"z": 1}}) + "\n", encoding="utf-8"
    )


def _run_elastic(monkeypatch, tmp_path):
    monkeypatch.setattr(tm_module, "env_handler", env_handler_stub(True))
    monkeypatch.setattr(tm_module, "log", null_log())
    monkeypatch.setattr(tm_module, "AsyncElasticsearch", FakeElasticClient)

    async def fake_async_bulk(client, actions, **kwargs):
        collected = [action async for action in actions]
        return len(collected), []

    monkeypatch.setattr(tm_module.es_helpers, "async_bulk", fake_async_bulk)
    _seed_elastic_fixtures(tmp_path)
    patch_path(monkeypatch, tm_module, tmp_path)
    manager = _make_manager()
    _run(manager.reset_test_elastic_and_import_mocks())


def test_reset_elastic_with_credentials(monkeypatch, tmp_path):
    monkeypatch.setattr(ELASTIC_CONNECTIONS, "S_ELASTIC_USERNAME", "elastic", raising=False)
    monkeypatch.setattr(ELASTIC_CONNECTIONS, "S_ELASTIC_PASSWORD", "secret", raising=False)
    _run_elastic(monkeypatch, tmp_path)
    assert FakeElasticClient.instances[-1].closed is True


def test_reset_elastic_without_credentials(monkeypatch, tmp_path):
    monkeypatch.setattr(ELASTIC_CONNECTIONS, "S_ELASTIC_USERNAME", "", raising=False)
    monkeypatch.setattr(ELASTIC_CONNECTIONS, "S_ELASTIC_PASSWORD", "", raising=False)
    _run_elastic(monkeypatch, tmp_path)
    assert FakeElasticClient.instances[-1].closed is True


def test_reset_elastic_no_mocks_dir(monkeypatch, tmp_path):
    monkeypatch.setattr(tm_module, "env_handler", env_handler_stub(True))
    monkeypatch.setattr(tm_module, "log", null_log())
    monkeypatch.setattr(tm_module, "AsyncElasticsearch", FakeElasticClient)
    patch_path(monkeypatch, tm_module, tmp_path)
    manager = _make_manager()
    _run(manager.reset_test_elastic_and_import_mocks())
    assert FakeElasticClient.instances[-1].closed is True


def test_reset_arango_disabled(monkeypatch):
    monkeypatch.setattr(tm_module, "env_handler", env_handler_stub(False))
    manager = _make_manager()
    _run(manager.reset_test_arango_and_import_mocks())


def test_reset_arango_no_dumps_dir(monkeypatch, tmp_path):
    monkeypatch.setattr(tm_module, "env_handler", env_handler_stub(True))
    patch_path(monkeypatch, tm_module, tmp_path)
    manager = _make_manager()
    _run(manager.reset_test_arango_and_import_mocks())


def _seed_arango_fixtures(root):
    dumps_root = root / "tests" / "mock" / "arango"
    dumps_root.mkdir(parents=True, exist_ok=True)
    v_lines = [
        json.dumps({"_rev": "r", "_id": "cti_vertices/1", "_key": "1", "name": "n"}),
        "",
        json.dumps([]),
    ]
    (dumps_root / "cti_vertices_1.data.json").write_text("\n".join(v_lines) + "\n", encoding="utf-8")
    (dumps_root / "cti_edges_1.data.json").write_text(
        json.dumps({"_key": "e", "_from": "cti_vertices/1", "_to": "cti_vertices/1"}) + "\n", encoding="utf-8"
    )


def test_reset_arango_enabled(monkeypatch, tmp_path):
    monkeypatch.setattr(tm_module, "env_handler", env_handler_stub(True))
    monkeypatch.setattr(tm_module, "log", null_log())
    monkeypatch.setattr(tm_module, "ARANGO_CONNECTIONS", ARANGO_CONNECTIONS)
    FakeArangoClient.current_db = FakeArangoDB(has_collections=False, truncate_error=True)
    monkeypatch.setattr(tm_module, "ArangoClient", FakeArangoClient)
    _seed_arango_fixtures(tmp_path)
    patch_path(monkeypatch, tm_module, tmp_path)
    manager = _make_manager()
    _run(manager.reset_test_arango_and_import_mocks())
    db = FakeArangoClient.current_db
    assert ("cti_vertices", False) in db.created
    assert ("cti_edges", True) in db.created
    assert db.collections["cti_vertices"].imported


def test_reset_arango_existing_collections(monkeypatch, tmp_path):
    monkeypatch.setattr(tm_module, "env_handler", env_handler_stub(True))
    monkeypatch.setattr(tm_module, "log", null_log())
    FakeArangoClient.current_db = FakeArangoDB(has_collections=True, truncate_error=False)
    monkeypatch.setattr(tm_module, "ArangoClient", FakeArangoClient)
    _seed_arango_fixtures(tmp_path)
    patch_path(monkeypatch, tm_module, tmp_path)
    manager = _make_manager()
    _run(manager.reset_test_arango_and_import_mocks())
    assert FakeArangoClient.current_db.created == []


def test_get_instance_returns_singleton():
    first = test_manager.get_instance()
    second = test_manager.get_instance()
    assert first is second


def test_init_is_noop_when_instance_exists():
    test_manager.get_instance()
    again = test_manager()
    assert again is not None
