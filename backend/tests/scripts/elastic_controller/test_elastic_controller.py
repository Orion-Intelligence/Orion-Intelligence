from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from orion.constants import constant
from orion.services.elastic_manager import elastic_controller as ec_module
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX, ELASTIC_KEYS
from tests.scripts.elastic_controller.fakes import (
    FakeApiError,
    FakeES,
    _core,
    _dump,
    _make_controller,
    _run,
)


def test_get_instance_and_get_connection():
    elastic_controller._elastic_controller__instance = None
    instance = elastic_controller.get_instance()
    assert isinstance(instance, elastic_controller)
    assert elastic_controller.get_instance() is instance

    controller = _make_controller()
    assert controller.get_connection() is _core(controller)


def test_conn_for_index(monkeypatch):
    controller = _make_controller()

    monkeypatch.setattr(
        ec_module.env_handler, "get_instance",
        staticmethod(lambda: SimpleNamespace(env=lambda *_a: "0")),
    )
    assert controller._elastic_controller__conn_for_index(ELASTIC_INDEX.S_STEALERLOGS_INDEX) is _core(controller)

    monkeypatch.setattr(
        ec_module.env_handler, "get_instance",
        staticmethod(lambda: SimpleNamespace(env=lambda *_a: "1")),
    )
    assert controller._elastic_controller__conn_for_index(ELASTIC_INDEX.S_STEALERLOGS_INDEX) is _dump(controller)
    assert controller._elastic_controller__conn_for_index(ELASTIC_INDEX.S_LEAK_INDEX) is _core(controller)


def test_clip_oversized_keyword_values():
    long_value = "a" * 40000
    result = elastic_controller._clip_oversized_keyword_values({
        "short": "hello",
        "long": long_value,
        "m_screenshot": long_value,
        "nested": {"deep": long_value},
        "listed": ["x", long_value],
        "number": 5,
    })
    assert result["short"] == "hello"
    assert len(result["long"].encode("utf-8")) <= 32766
    assert result["m_screenshot"] == long_value
    assert len(result["nested"]["deep"].encode("utf-8")) <= 32766
    assert result["number"] == 5


def test_read_index():
    assert elastic_controller._read_index(ELASTIC_INDEX.S_STEALERLOGS_INDEX) == "stealer_model,stealer_model-*"
    assert elastic_controller._read_index(ELASTIC_INDEX.S_LEAK_INDEX) == ELASTIC_INDEX.S_LEAK_INDEX


def test_prepare_map_entities_document():
    doc = elastic_controller.prepare_map_entities_document({"location": {"lat": "1.5", "lon": "2.5"}})
    assert doc["location_point"] == {"lat": 1.5, "lon": 2.5}

    bad = elastic_controller.prepare_map_entities_document({"location": {"lat": "x", "lon": "y"}})
    assert "location_point" not in bad

    none_loc = elastic_controller.prepare_map_entities_document({"name": "z"})
    assert "location_point" not in none_loc


def test_map_entities_document_id_is_deterministic():
    doc = {"name": "a", "country": "b", "type": "c", "location": {"lat": 1, "lon": 2}}
    assert elastic_controller.map_entities_document_id(doc) == elastic_controller.map_entities_document_id(dict(doc))
    assert elastic_controller.map_entities_document_id("not-a-dict")


def test_initialize_creates_indices(monkeypatch):
    created = []

    def factory(*_a, **_k):
        es = FakeES()
        created.append(es)
        return es

    monkeypatch.setattr(ec_module, "AsyncElasticsearch", factory)
    controller = object.__new__(elastic_controller)
    _run(controller.initialize())

    core, dump = created[0], created[1]
    assert ELASTIC_INDEX.S_LEAK_INDEX in core.indices.created
    assert ELASTIC_INDEX.S_OPENSANCTIONS_INDEX in core.indices.created
    assert ELASTIC_INDEX.S_STEALERLOGS_INDEX in dump.indices.created


def test_initialize_mappings_swallows_errors(monkeypatch):
    core = FakeES(exists_error=RuntimeError("boom"))
    controller = _make_controller(core=core, dump=FakeES())
    _run(controller._elastic_controller__initialize_mappings())


def test_put_mapping_safe(monkeypatch):
    conn = FakeES()
    _run(elastic_controller._elastic_controller__put_mapping_safe(conn, "leak_model", {"m_x": {"type": "keyword"}}))
    assert conn.indices.put_mappings

    conn2 = FakeES()

    async def _raise(index=None, body=None):
        raise FakeApiError("nope", 400)

    conn2.indices.put_mapping = _raise
    _run(elastic_controller._elastic_controller__put_mapping_safe(conn2, "leak_model", {}))


def test_ensure_field_safe_adds_and_updates(monkeypatch):
    mapping = {"leak_model": {"mappings": {"properties": {}}}}
    conn = FakeES(mapping_result=mapping)
    _run(elastic_controller._elastic_controller__ensure_field_safe(conn, "leak_model", "m_domain", add_type="keyword"))
    assert conn.indices.put_mappings

    text_mapping = {"generic_model": {"mappings": {"properties": {"m_content_type": {"type": "text"}}}}}
    conn2 = FakeES(mapping_result=text_mapping)
    _run(elastic_controller._elastic_controller__ensure_field_safe(conn2, "generic_model", "m_content_type", fielddata_if_text=True))
    assert conn2.indices.put_mappings

    conn3 = FakeES()

    async def _raise(index=None):
        raise RuntimeError("boom")

    conn3.indices.get_mapping = _raise
    _run(elastic_controller._elastic_controller__ensure_field_safe(conn3, "leak_model", "m_domain", add_type="keyword"))


def test_refresh_touched_indices():
    conn = FakeES()
    touched = {id(conn): (conn, {"leak_model", "generic_model"})}
    _run(elastic_controller._elastic_controller__refresh_touched_indices(touched))
    assert conn.indices.refreshed

    empty_conn = FakeES()
    _run(elastic_controller._elastic_controller__refresh_touched_indices({id(empty_conn): (empty_conn, set())}))
    assert empty_conn.indices.refreshed == []

    bad = FakeES()

    async def _raise(index=None, ignore_unavailable=None):
        raise RuntimeError("boom")

    bad.indices.refresh = _raise
    _run(elastic_controller._elastic_controller__refresh_touched_indices({id(bad): (bad, {"leak_model"})}))


def test_reindex_map_entities_data(monkeypatch):
    async def fake_bulk(client, actions, **_kwargs):
        list(actions)
        return 0, []

    monkeypatch.setattr(ec_module.es_helpers, "async_bulk", fake_bulk)
    monkeypatch.setattr(constant, "map_entities_data", [
        {"name": "a", "country": "b", "type": "c", "location": {"lat": 1, "lon": 2}},
        "not-a-dict",
    ])
    controller = _make_controller(core=FakeES(existing={ELASTIC_INDEX.S_MAP_ENTITIES_INDEX}))
    _run(controller.reindex_map_entities_data())


def test_reindex_map_entities_data_already_exists(monkeypatch):
    async def fake_bulk(client, actions, **_kwargs):
        list(actions)
        return 0, []

    monkeypatch.setattr(ec_module.es_helpers, "async_bulk", fake_bulk)
    monkeypatch.setattr(constant, "map_entities_data", '[{"name": "a", "location": {"lat": 1, "lon": 2}}]')
    core = FakeES(create_error=FakeApiError("resource_already_exists_exception", 400))
    controller = _make_controller(core=core)
    _run(controller.reindex_map_entities_data())


def test_reindex_map_entities_data_handles_exception(monkeypatch):
    monkeypatch.setattr(constant, "map_entities_data", [])
    core = FakeES(create_error=FakeApiError("other failure", 500))
    controller = _make_controller(core=core)
    _run(controller.reindex_map_entities_data())


def test_purge_old_records():
    core = FakeES()
    controller = _make_controller(core=core)
    _run(controller.purge_old_records())
    assert core.delete_by_query_calls

    class RaisingDBQ(FakeES):
        async def delete_by_query(self, index=None, body=None, conflicts=None):
            raise RuntimeError("boom")

    controller2 = _make_controller(core=RaisingDBQ())
    _run(controller2.purge_old_records())


def test_get_doc():
    controller = _make_controller(core=FakeES(get_result={"_source": {"a": 1}}))
    assert _run(controller.get_doc(ELASTIC_INDEX.S_LEAK_INDEX, "d1")) == [{"a": 1}]

    controller_empty = _make_controller(core=FakeES(get_result={"missing": True}))
    assert _run(controller_empty.get_doc(ELASTIC_INDEX.S_LEAK_INDEX, "d1")) == []

    err_conn = FakeES()

    async def _raise(index=None, id=None):
        raise RuntimeError("boom")

    err_conn.get = _raise
    controller_err = _make_controller(core=err_conn)
    assert _run(controller_err.get_doc(ELASTIC_INDEX.S_LEAK_INDEX, "d1")) == []


def test_search_query():
    controller = _make_controller(core=FakeES(search_result={"hits": {"hits": [1]}}))
    ok, data = _run(controller.search_query(ELASTIC_INDEX.S_LEAK_INDEX, {"query": {}}))
    assert ok is True and data == {"hits": {"hits": [1]}}

    controller_err = _make_controller(core=FakeES(search_error=RuntimeError("boom")))
    ok2, data2 = _run(controller_err.search_query(ELASTIC_INDEX.S_LEAK_INDEX, {"query": {}}))
    assert ok2 is False and data2 is None


def test_search_consolidated_ranked_query_only_stealer():
    dump = FakeES(search_result={"hits": {"hits": []}})
    controller = _make_controller(dump=dump)
    result = _run(controller.search_consolidated_ranked_query([ELASTIC_INDEX.S_STEALERLOGS_INDEX], {"query": {}}))
    assert result == {"hits": {"hits": []}}
    assert dump.search_calls


def test_search_consolidated_ranked_query_none_stealer_with_boost():
    core = FakeES(search_result={"hits": {"hits": []}})
    controller = _make_controller(core=core)
    query = {"query": {"bool": {"must": [{"term": {"m_domain": "x"}}, {"wildcard": {"m_url": {"value": "y"}}}, {"match": {"a": 1}}]}}}
    result = _run(controller.search_consolidated_ranked_query([ELASTIC_INDEX.S_LEAK_INDEX], query, indices_boost=[{"leak_model": 2}]))
    assert "hits" in result
    assert query["indices_boost"] == [{"leak_model": 2}]
    sent = core.search_calls[0][1]
    assert sent["query"]["bool"]["must"][0]["term"]["m_domain"]["case_insensitive"] is True


def test_search_consolidated_ranked_query_mixed_merge():
    core = FakeES(search_result={"hits": {"hits": [{"_score": 1}]}})
    dump = FakeES(search_result={"hits": {"hits": [{"_score": 2}]}})
    controller = _make_controller(core=core, dump=dump)
    result = _run(controller.search_consolidated_ranked_query(
        [ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_INDEX.S_STEALERLOGS_INDEX], {"query": {}}))
    scores = [hit["_score"] for hit in result["hits"]["hits"]]
    assert scores == [2, 1]


def test_search_consolidated_ranked_query_update_date_retry():
    core = FakeES(search_sequence=[RuntimeError("unknown field [m_update_date]"), {"hits": {"hits": []}}])
    controller = _make_controller(core=core)
    query = {"query": {"function_score": {"functions": [
        {"gauss": {"m_update_date": {"scale": "1d"}}},
        {"gauss": {"m_other": {"scale": "1d"}}},
    ]}}}
    result = _run(controller.search_consolidated_ranked_query([ELASTIC_INDEX.S_LEAK_INDEX], query))
    assert result == {"hits": {"hits": []}}
    assert query["query"]["function_score"]["functions"] == [{"gauss": {"m_other": {"scale": "1d"}}}]


def test_search_consolidated_ranked_query_generic_exception():
    core = FakeES(search_error=RuntimeError("boom"))
    controller = _make_controller(core=core)
    assert _run(controller.search_consolidated_ranked_query([ELASTIC_INDEX.S_LEAK_INDEX], {"query": {}})) is None


def test_search_consolidated_queries():
    core = FakeES(search_sequence=[{"hits": {"hits": [1]}}, RuntimeError("boom")])
    controller = _make_controller(core=core)
    results = _run(controller.search_consolidated_queries(
        [ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_INDEX.S_GENERIC_INDEX], [{"query": {}}, {"query": {}}]))
    assert results[0] == {"hits": {"hits": [1]}}
    assert results[1] is None


def test_index_data_list_path():
    core = FakeES()
    controller = _make_controller(core=core)
    payload = [
        {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_VALUE: {
            "m_hash": "h1", "m_embedding": [0.1], "junk": None,
            "list_field": ["a", "null"], "empty_list": [None], "m_creation_date": None,
        }},
        {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_KEYS.S_VALUE: {"m_hash": "h2"}},
        {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_VALUE: {"no_hash": True}},
    ]
    ok, err = _run(controller.index_data(payload))
    assert ok is True and err is None
    assert len(core.update_calls) == 2
    updated = dict(payload[0][ELASTIC_KEYS.S_VALUE])
    assert updated["list_field"] == ["a"]
    assert "empty_list" not in updated
    assert "junk" not in updated


def test_index_data_list_existing_doc_skips_embedding_check():
    core = FakeES(exists_docs={"h1"})
    controller = _make_controller(core=core)
    payload = [{ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_VALUE: {"m_hash": "h1"}}]
    ok, _ = _run(controller.index_data(payload))
    assert ok is True
    assert core.update_calls


def test_index_data_list_new_without_embedding_skipped():
    core = FakeES()
    controller = _make_controller(core=core)
    payload = [{ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_VALUE: {"m_hash": "h1"}}]
    ok, _ = _run(controller.index_data(payload))
    assert ok is True
    assert core.update_calls == []


def test_index_data_single_paths():
    controller = _make_controller(core=FakeES())
    ok, msg = _run(controller.index_data({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_VALUE: {"no_hash": 1}}))
    assert ok is False and "m_hash" in msg

    ok2, msg2 = _run(controller.index_data({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_VALUE: {"m_hash": "h1"}}))
    assert ok2 is False and "embedding" in msg2

    core = FakeES()
    controller_ok = _make_controller(core=core)
    ok3, err3 = _run(controller_ok.index_data({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_VALUE: {"m_hash": "h1", "m_embedding": [0.1]}}))
    assert ok3 is True and err3 is None
    assert core.update_calls


def test_index_data_single_bypass_and_chats():
    core = FakeES()
    controller = _make_controller(core=core)
    ok, _ = _run(controller.index_data({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_KEYS.S_VALUE: {"m_hash": "c1"}}))
    assert ok is True
    assert core.update_calls


def test_index_data_exception():
    controller = _make_controller(core=FakeES(exists_error=RuntimeError("boom")))
    with pytest.raises(HTTPException) as exc:
        _run(controller.index_data({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_VALUE: {"m_hash": "h1", "m_embedding": [0.1]}}))
    assert exc.value.status_code == 500


def test_index_dump_success_and_error():
    dump = FakeES(bulk_result={"errors": False})
    controller = _make_controller(dump=dump)
    payload = [{"index": {"_index": "stealer_model"}}, {"raw": "x"}]
    result = _run(controller.index_dump(payload))
    assert result == {"errors": False}
    assert dump.bulk_calls

    controller_err = _make_controller(dump=FakeES(bulk_error=RuntimeError("boom")))
    with pytest.raises(HTTPException):
        _run(controller_err.index_dump(payload))


def test_mget_docs():
    core = FakeES(mget_result={"docs": [{"_id": "1"}]})
    controller = _make_controller(core=core)
    result = _run(controller.mget_docs(ELASTIC_INDEX.S_STEALERLOGS_INDEX, {"ids": ["1"]}))
    assert result == {"docs": [{"_id": "1"}]}
    assert core.mget_calls[0][0] == "stealer_model,stealer_model-*"
