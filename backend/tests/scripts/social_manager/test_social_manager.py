from __future__ import annotations

from types import SimpleNamespace

import httpx
import jwt
import pytest
from fastapi import HTTPException
from fastapi.responses import JSONResponse

import orion.api.interactive.social_manager.social_manager as social_module
from orion.api.interactive.social_manager.social_manager import social_manager
from orion.constants.constant import CONSTANTS
from tests.model.fakes import FakeAsyncClient, FakeResponse
from tests.scripts.social_manager.helpers import (
    _FakeExtManager,
    _FakeSocialEngine,
    _make_manager,
    _patch_env,
    _patch_extension,
    _run,
)


def test_is_unstorable_int_detects_out_of_range():
    assert social_manager._is_unstorable_int(2 ** 63) is True
    assert social_manager._is_unstorable_int(-(2 ** 63) - 1) is True
    assert social_manager._is_unstorable_int(5) is False
    assert social_manager._is_unstorable_int(True) is False
    assert social_manager._is_unstorable_int("x") is False


def test_drop_unstorable_ints_recurses_dict_and_list():
    value = {"ok": 1, "bad": 2 ** 70, "nested": {"deep_bad": 2 ** 64, "keep": "v"}, "items": [1, 2 ** 65, "s"]}
    result = social_manager._drop_unstorable_ints(value)
    assert result == {"ok": 1, "nested": {"keep": "v"}, "items": [1, "s"]}


def test_drop_unstorable_ints_returns_scalar():
    assert social_manager._drop_unstorable_ints("plain") == "plain"


def test_default_profile_config_returns_empty_disallowed():
    config = social_manager.default_profile_config([])
    assert config["disallowed"] == []


def test_recon_profile_details_maps_and_stringifies():
    item = {"full_name": "Jane", "description": "bio text", "url": "http://x", "follower_count": 42, "post_count": 7, "like_count": 3, "location": "NYC"}
    details = social_manager._recon_profile_details(item)
    assert details["real_name"] == "Jane"
    assert details["bio"] == "bio text"
    assert details["total_followers"] == "42"
    assert details["total_posts"] == "7"
    assert details["location"] == "NYC"


def test_recon_meta_prefers_item_over_metadata():
    item = {"platform": "twitter", "username": "user1", "url": "http://t"}
    meta = social_manager._recon_meta(item, {"platform": "ignored"}, {}, "fallback")
    assert meta["platform"] == "twitter"
    assert meta["username"] == "user1"
    assert meta["status"] == "active"


def test_recon_meta_falls_back_to_metadata_and_profile_username():
    meta = social_manager._recon_meta({}, {"social_handle": "handle"}, {"bio": "from-ids"}, "fallback")
    assert meta["username"] == "handle"
    assert meta["description"] == "from-ids"


def test_flatten_recon_profile_non_dict_returns_input():
    assert social_manager.flatten_recon_profile("string", "u") == "string"


def test_flatten_recon_profile_already_has_meta_validates():
    item = {"meta": {"platform": "twitter", "username": "u1"}}
    result = social_manager.flatten_recon_profile(item, "u1")
    assert result["meta"]["platform"] == "twitter"


def test_flatten_recon_profile_meta_invalid_returns_item():
    item = {"meta": {"resources": "not-a-list"}, "resources": "bad"}
    result = social_manager.flatten_recon_profile(item, "u1")
    assert result is item


def test_flatten_recon_profile_no_platform_returns_item():
    item = {"data": {}, "metadata_missing": True}
    assert social_manager.flatten_recon_profile(item, "u1") is item


def test_flatten_recon_profile_builds_from_raw_recon():
    item = {
        "platform": "twitter",
        "username": "user1",
        "url": "http://x",
        "data": {"platform_profile": {"ids": {"full_name": "Jane", "follower_count": 10}}},
        "resources": [{"id": "posts", "resources": []}],
    }
    result = social_manager.flatten_recon_profile(item, "user1")
    assert result["meta"]["platform"] == "twitter"
    assert result["profile_details"]["real_name"] == "Jane"


def test_flatten_recon_profile_uses_explicit_profile_details():
    item = {"platform": "twitter", "profileDetails": {"real_name": "Bob"}, "metadata": {}}
    result = social_manager.flatten_recon_profile(item, "u")
    assert result["profile_details"]["real_name"] == "Bob"


def test_document_payload_shapes_record_with_profiles():
    record = {
        "user_id": "u1",
        "profile_username": "@Alice",
        "profiles": [{"meta": {"platform": "x", "username": "alice"}}],
        "config": {"disallowed": ["a"], "allowed": ["should-drop"]},
        "status": "done",
        "scan_progress": 50,
        "scan_step": "posts",
        "updated_at": "2026-01-01",
    }
    payload = social_manager._document_payload(record)
    assert payload["profile_username"] == "@Alice"
    assert payload["count"] == 1
    assert "allowed" not in payload["config"]


def test_document_payload_handles_legacy_profile_and_bad_config():
    record = {"user_id": "u1", "root_username": "bob", "profile": {"meta": {"platform": "x"}}, "config": "not-a-dict"}
    payload = social_manager._document_payload(record)
    assert payload["profile_username"] == "bob"
    assert payload["count"] == 1
    assert payload["config"]["disallowed"] == []


def test_social_hash_id_is_deterministic():
    first = social_manager._social_hash_id("twitter", "abc")
    second = social_manager._social_hash_id("twitter", "abc")
    assert first == second
    assert len(first) == 64


def test_social_api_base_urls_reads_env(monkeypatch):
    _patch_env(monkeypatch, {"ORION_SOCIAL_API_BASE_URL": "http://social/ "})
    assert social_manager._social_api_base_urls() == ["http://social"]

    _patch_env(monkeypatch, {})
    assert social_manager._social_api_base_urls() == []


def test_social_headers_includes_user_and_internal_token(monkeypatch):
    _patch_env(monkeypatch, {"ORION_SOCIAL_INTERNAL_TOKEN": "tok"})
    user = SimpleNamespace(username="alice", id="u1", tenant_uuid="t1")
    headers = social_manager._social_headers(user, request=None)
    assert headers["X-Orion-Internal-Token"] == "tok"
    assert headers["X-Orion-User"] == "alice"
    assert headers["X-Orion-Tenant-Id"] == "t1"


def test_social_headers_decodes_session_from_token(monkeypatch):
    _patch_env(monkeypatch, {})
    token = jwt.encode({"sid": "sess-1", "client": "extension"}, CONSTANTS.S_AUTH_SECRET_KEY, algorithm=CONSTANTS.S_AUTH_ALGORITHM)
    monkeypatch.setattr(social_module, "token_from_request", lambda request: token)
    headers = social_manager._social_headers(None, request=object())
    assert headers["X-Orion-Session-Id"] == "sess-1"
    assert headers["X-Orion-Session-Client"] == "extension"


def test_social_headers_ignores_invalid_token(monkeypatch):
    _patch_env(monkeypatch, {})
    monkeypatch.setattr(social_module, "token_from_request", lambda request: "garbage-token")
    headers = social_manager._social_headers(None, request=object())
    assert "X-Orion-Session-Id" not in headers


def test_normalize_social_cursor_only_for_paged_keys():
    payload = {"hash_id": "http://x/post/1", "platform": "Twitter"}
    assert social_manager._normalize_social_cursor(payload, "entity") is payload

    unchanged = {"hash_id": "a" * 64}
    assert social_manager._normalize_social_cursor(unchanged, "posts") is unchanged

    no_scheme = {"hash_id": "plainvalue"}
    assert social_manager._normalize_social_cursor(no_scheme, "posts") is no_scheme

    normalized = social_manager._normalize_social_cursor({"hash_id": "http://x/post/1", "platform": "Twitter"}, "posts")
    assert normalized["hash_id"] != "http://x/post/1"
    assert len(normalized["hash_id"]) == 64


def test_scan_status_defaults():
    assert social_manager._scan_status({}) == {"status": None, "progress": 0, "step": ""}
    assert social_manager._scan_status({"status": "done", "scan_progress": 5, "scan_step": "x"}) == {"status": "done", "progress": 5, "step": "x"}


def test_merge_profile_documents_merges_by_username():
    rows = [
        {"user_id": "u1", "profile_username": "@Alice", "profiles": [{"meta": {"platform": "x", "username": "a"}}], "config": {"disallowed": ["1"]}, "updated_at": "2026-01-01"},
        {"user_id": "u1", "profile_username": "alice", "profiles": [{"meta": {"platform": "y", "username": "a"}}], "config": {"disallowed": ["1", "2"]}, "updated_at": "2026-02-01"},
        {"user_id": "u1", "profile_username": "", "profiles": []},
    ]
    merged = social_manager._merge_profile_documents(rows)
    assert len(merged) == 1
    assert merged[0]["profile_username"] == "alice"
    assert merged[0]["count"] == 2
    assert sorted(merged[0]["config"]["disallowed"]) == ["1", "2"]
    assert merged[0]["updated_at"] == "2026-02-01"


def test_decode_image_payload_rejects_non_string():
    manager = _make_manager()
    with pytest.raises(HTTPException) as exc:
        manager.decode_image_payload(123)
    assert exc.value.status_code == 400


def test_decode_image_payload_strips_data_uri_prefix():
    manager = _make_manager()
    import base64

    raw = base64.b64encode(b"hello").decode()
    assert manager.decode_image_payload(f"data:image/png;base64,{raw}") == b"hello"


def test_decode_image_payload_rejects_too_long():
    manager = _make_manager()
    huge = "a" * (manager.SOCIAL_IMAGE_MAX_BASE64_LENGTH + 4)
    with pytest.raises(HTTPException) as exc:
        manager.decode_image_payload(huge)
    assert exc.value.status_code == 413


def test_decode_image_payload_rejects_invalid_base64():
    manager = _make_manager()
    with pytest.raises(HTTPException) as exc:
        manager.decode_image_payload("!!!not base64!!!")
    assert exc.value.status_code == 400


def test_graph_handle_variants():
    assert social_manager._graph_handle("") == ""
    assert social_manager._graph_handle("@Bob/") == "bob"
    assert social_manager._graph_handle("https://x.com/profile.php?id=123") == "123"
    assert social_manager._graph_handle("https://x.com/users/Carol") == "carol"


def test_graph_person_handle_prefers_handle_then_url():
    assert social_manager._graph_person_handle({"handle": "@Dave"}) == "dave"
    assert social_manager._graph_person_handle({"screen_name": "full name", "url": "http://x.com/eve"}) == "eve"
    assert social_manager._graph_person_handle("not-a-dict") == ""


def test_social_request_returns_body_on_success(monkeypatch):
    _patch_env(monkeypatch, {"ORION_SOCIAL_API_BASE_URL": "http://social"})
    manager = _make_manager()
    response = FakeResponse(status_code=200, json_data={"ok": True})
    monkeypatch.setattr(social_module.httpx, "AsyncClient", lambda *a, **k: FakeAsyncClient(response=response))

    status, body = _run(manager.social_request({"q": "x"}, "profile", {}))
    assert status == 200
    assert body == {"ok": True}


def test_social_request_file_upload_branch(monkeypatch):
    _patch_env(monkeypatch, {"ORION_SOCIAL_API_BASE_URL": "http://social"})
    manager = _make_manager()
    response = FakeResponse(status_code=200, json_data={"uploaded": True})
    monkeypatch.setattr(social_module.httpx, "AsyncClient", lambda *a, **k: FakeAsyncClient(response=response))

    status, body = _run(manager.social_request({"file_bytes": b"x", "filename": "f.png"}, "online/images", {}))
    assert status == 200
    assert body == {"uploaded": True}


def test_social_request_non_200_returns_status(monkeypatch):
    _patch_env(monkeypatch, {"ORION_SOCIAL_API_BASE_URL": "http://social"})
    manager = _make_manager()
    response = FakeResponse(status_code=404)
    monkeypatch.setattr(social_module.httpx, "AsyncClient", lambda *a, **k: FakeAsyncClient(response=response))

    status, body = _run(manager.social_request({}, "profile", {}))
    assert status == 404
    assert body is None


def test_social_request_request_error_returns_zero(monkeypatch):
    _patch_env(monkeypatch, {"ORION_SOCIAL_API_BASE_URL": "http://social"})
    manager = _make_manager()
    monkeypatch.setattr(social_module.httpx, "AsyncClient", lambda *a, **k: FakeAsyncClient(exc=httpx.RequestError("boom")))

    status, body = _run(manager.social_request({}, "profile", {}))
    assert status == 0
    assert "boom" in body


def test_social_search_success_returns_body(monkeypatch):
    manager = _make_manager()

    async def fake_request(payload, key, headers):
        return 200, {"result": "ok"}

    monkeypatch.setattr(social_module, "token_from_request", lambda request: "")
    _patch_env(monkeypatch, {})
    manager.social_request = fake_request

    result = _run(manager.social_search({"a": 1}, "profile"))
    assert result == {"result": "ok"}


def test_social_search_unreachable_returns_502(monkeypatch):
    manager = _make_manager()
    _patch_env(monkeypatch, {})

    async def fake_request(payload, key, headers):
        return 0, "conn refused"

    manager.social_request = fake_request
    result = _run(manager.social_search({"a": 1}, "profile"))
    assert isinstance(result, JSONResponse)
    assert result.status_code == 502


def test_social_search_other_status_returns_error(monkeypatch):
    manager = _make_manager()
    _patch_env(monkeypatch, {})

    async def fake_request(payload, key, headers):
        return 500, None

    manager.social_request = fake_request
    result = _run(manager.social_search({"a": 1}, "profile"))
    assert result.status_code == 500


def test_social_search_exception_returns_500(monkeypatch):
    manager = _make_manager()
    _patch_env(monkeypatch, {})

    async def fake_request(payload, key, headers):
        raise RuntimeError("kaboom")

    manager.social_request = fake_request
    result = _run(manager.social_search(SimpleNamespace(model_dump=lambda: {"a": 1}), "profile"))
    assert result.status_code == 500


def test_search_forum_profiles_empty_query_returns_empty():
    manager = _make_manager()
    result = _run(manager.search_forum_profiles(SimpleNamespace(query="  ")))
    assert result == {"Result": [], "Total_Hits": 0}


def test_search_forum_profiles_returns_ranked_hits(monkeypatch):
    manager = _make_manager()
    documents = {"hits": {"hits": [{"_id": "1", "_score": 2.5, "_source": {"m_title": "t", "m_embedding": [0.1]}}], "total": {"value": 1}}}

    monkeypatch.setattr(
        social_module.elastic_controller,
        "get_instance",
        staticmethod(lambda: SimpleNamespace(search_query=lambda index, data_filter: _async_result((True, documents)))),
    )

    result = _run(manager.search_forum_profiles(SimpleNamespace(query="@Bob", max_results=10)))
    assert result["Total_Hits"] == 1
    assert result["Result"][0]["_rank"] == 1
    assert "m_embedding" not in result["Result"][0]


def test_search_forum_profiles_failed_search_returns_empty(monkeypatch):
    manager = _make_manager()
    monkeypatch.setattr(
        social_module.elastic_controller,
        "get_instance",
        staticmethod(lambda: SimpleNamespace(search_query=lambda index, data_filter: _async_result((False, None)))),
    )
    result = _run(manager.search_forum_profiles(SimpleNamespace(query="bob")))
    assert result == {"Result": [], "Total_Hits": 0}


def _async_result(value):
    async def _coro():
        return value

    return _coro()


def test_search_phone_recon_delegates(monkeypatch):
    manager = _make_manager()
    captured = {}

    async def fake_search(param, key, current_user=None, request=None):
        captured["key"] = key
        return {"ok": True}

    manager.social_search = fake_search
    result = _run(manager.search_phone_recon({"a": 1}))
    assert captured["key"] == "phone"
    assert result == {"ok": True}


def test_search_profile_routes_to_extension_for_crawl(monkeypatch):
    manager = _make_manager()
    captured = {}

    async def fake_ext(payload, current_user=None):
        captured["payload"] = payload
        return {"status": "pending"}

    manager._fetch_profile_via_extension = fake_ext
    result = _run(manager.search_profile({"command": "crawl", "platform": "x"}))
    assert result == {"status": "pending"}


def test_search_profile_routes_to_social_search_otherwise(monkeypatch):
    manager = _make_manager()

    async def fake_search(param, key, current_user=None, request=None):
        return {"searched": key}

    manager.social_search = fake_search
    result = _run(manager.search_profile({"command": "list"}))
    assert result == {"searched": "profile"}


def test_search_wrappers_delegate_to_social_search(monkeypatch):
    manager = _make_manager()
    keys = []

    async def fake_search(param, key, current_user=None, request=None):
        keys.append(key)
        return key

    manager.social_search = fake_search
    _run(manager.search_online_images({}))
    _run(manager.search_followers({}))
    _run(manager.search_posts({}))
    _run(manager.search_videos({}))
    _run(manager.search_shorts({}))
    _run(manager.search_entity({}))
    _run(manager.search_metadata({}))
    assert keys == ["online/images", "followers", "posts", "videos", "shorts", "entity", "metadata"]


def test_fetch_profile_via_extension_no_user_is_pending():
    manager = _make_manager()
    result = _run(manager._fetch_profile_via_extension({"platform": "x"}, current_user=None))
    assert result == {"status": "pending"}


def test_fetch_profile_via_extension_cancel(monkeypatch):
    manager = _make_manager()
    fake = _FakeExtManager()
    _patch_extension(monkeypatch, fake)
    user = SimpleNamespace(id="u1")
    result = _run(manager._fetch_profile_via_extension({"command": "cancel", "platform": "x", "username": "bob", "cursor": "c1"}, user))
    assert result == {"status": "idle"}
    assert fake.cancelled


def test_fetch_profile_via_extension_poll_pending(monkeypatch):
    manager = _make_manager()
    fake = _FakeExtManager(reply=None, inflight=True)
    _patch_extension(monkeypatch, fake)
    result = _run(manager._fetch_profile_via_extension({"command": "poll", "platform": "x", "username": "bob"}, SimpleNamespace(id="u1")))
    assert result == {"status": "pending"}


def test_fetch_profile_via_extension_no_live_socket_idle(monkeypatch):
    manager = _make_manager()
    fake = _FakeExtManager(reply=None, live_socket=False)
    _patch_extension(monkeypatch, fake)
    result = _run(manager._fetch_profile_via_extension({"platform": "x", "username": "bob"}, SimpleNamespace(id="u1")))
    assert result == {"status": "idle"}


def test_fetch_profile_via_extension_fires_crawl(monkeypatch):
    manager = _make_manager()
    fake = _FakeExtManager(reply=None, live_socket=True)
    _patch_extension(monkeypatch, fake)
    result = _run(manager._fetch_profile_via_extension({"platform": "x", "username": "bob", "type": "posts"}, SimpleNamespace(id="u1")))
    assert result == {"status": "pending"}
    assert fake.fired


def test_fetch_profile_via_extension_reply_error(monkeypatch):
    manager = _make_manager()
    fake = _FakeExtManager(reply={"error": "denied", "login_url": "http://login"})
    _patch_extension(monkeypatch, fake)
    result = _run(manager._fetch_profile_via_extension({"platform": "x", "username": "bob"}, SimpleNamespace(id="u1")))
    assert result == {"error": "denied", "login_url": "http://login"}


def test_fetch_profile_via_extension_details_reply(monkeypatch):
    manager = _make_manager()
    fake = _FakeExtManager(reply={"implemented": True, "items": [{"name": "profile-data"}]})
    _patch_extension(monkeypatch, fake)
    result = _run(manager._fetch_profile_via_extension({"platform": "x", "username": "bob", "type": "details"}, SimpleNamespace(id="u1")))
    assert result == {"result": {"profile": {"name": "profile-data"}}}


def test_fetch_profile_via_extension_items_reply(monkeypatch):
    manager = _make_manager()
    fake = _FakeExtManager(reply={"implemented": True, "items": [{"a": 1}], "next_cursor": "c2", "has_more": True})
    _patch_extension(monkeypatch, fake)
    result = _run(manager._fetch_profile_via_extension({"platform": "x", "username": "bob", "type": "posts"}, SimpleNamespace(id="u1")))
    assert result["result"]["items"] == [{"a": 1}]
    assert result["result"]["next_cursor"] == "c2"
    assert result["result"]["has_more"] is True


def test_extension_version_reads_config(monkeypatch):
    manager = _make_manager()
    import orion.api.server.config_manager.config_controller as config_module

    monkeypatch.setattr(config_module.config_controller, "getInstance", staticmethod(lambda: SimpleNamespace(get=lambda key, default="": "9.9.9")))
    result = _run(manager.extension_version())
    assert result == {"chrome": "9.9.9", "firefox": "9.9.9"}


def test_append_social_profiles_rejects_empty_username():
    manager = _make_manager()
    result = _run(manager.append_social_profiles("u1", "  @  ", []))
    assert isinstance(result, JSONResponse)
    assert result.status_code == 400


def test_append_social_profiles_rejects_non_list_profiles():
    manager = _make_manager()
    result = _run(manager.append_social_profiles("u1", "alice", "not-a-list"))
    assert result.status_code == 400


def test_append_social_profiles_rejects_bad_config():
    manager = _make_manager()
    result = _run(manager.append_social_profiles("u1", "alice", [], config="not-a-dict"))
    assert result.status_code == 400


def test_append_social_profiles_pushes_new_profiles():
    engine = _FakeSocialEngine()
    manager = _make_manager(engine)
    profiles = [{"platform": "twitter", "username": "alice", "id": "p1"}]
    result = _run(manager.append_social_profiles("u1", "@Alice", profiles))
    assert result["saved"] == 1
    assert result["profile_username"] == "alice"
    assert engine.collection.update_calls
    update = engine.collection.update_calls[0][1]
    assert "$push" in update


def test_append_social_profiles_replace_sets_config():
    engine = _FakeSocialEngine()
    manager = _make_manager(engine)
    profiles = [{"platform": "twitter", "username": "alice", "id": "p1"}]
    result = _run(manager.append_social_profiles("u1", "alice", profiles, replace=True))
    assert result["saved"] == 1
    update = engine.collection.update_calls[0][1]
    assert "profiles" in update["$set"]
    assert "$unset" in update


def test_append_social_profiles_with_explicit_config():
    engine = _FakeSocialEngine()
    manager = _make_manager(engine)
    result = _run(manager.append_social_profiles("u1", "alice", [], config={"disallowed": ["x"]}))
    assert result["config"]["disallowed"] == ["x"]


def test_append_social_profiles_handles_engine_error():
    engine = _FakeSocialEngine()

    async def boom(*a, **k):
        raise RuntimeError("db")

    engine.collection.update_one = boom
    manager = _make_manager(engine)
    result = _run(manager.append_social_profiles("u1", "alice", [{"platform": "x", "id": "1"}]))
    assert result.status_code == 500


def test_get_social_profiles_all_returns_result_list():
    rows = [{"user_id": "u1", "profile_username": "alice", "profiles": [{"meta": {"platform": "x", "username": "a"}}], "updated_at": "2026-01-01"}]
    engine = _FakeSocialEngine(rows=rows)
    manager = _make_manager(engine)
    result = _run(manager.get_social_profiles("u1"))
    assert "result" in result
    assert result["result"][0]["profile_username"] == "alice"


def test_get_social_profiles_specific_username_found():
    rows = [{"user_id": "u1", "profile_username": "alice", "profiles": [{"meta": {"platform": "x", "username": "a"}}], "updated_at": "2026-01-01"}]
    engine = _FakeSocialEngine(rows=rows)
    manager = _make_manager(engine)
    result = _run(manager.get_social_profiles("u1", "@Alice"))
    assert result["profile_username"] == "alice"


def test_get_social_profiles_specific_username_missing():
    engine = _FakeSocialEngine(rows=[])
    manager = _make_manager(engine)
    result = _run(manager.get_social_profiles("u1", "ghost"))
    assert result["profiles"] == []
    assert result["profile_username"] == "ghost"


def test_get_social_profiles_handles_error():
    engine = _FakeSocialEngine(raise_on_find=True)
    manager = _make_manager(engine)
    result = _run(manager.get_social_profiles("u1"))
    assert result.status_code == 500


def test_get_graph_data_returns_response_when_not_list(monkeypatch):
    manager = _make_manager()

    async def fake_profiles(user_id, profile_username=None):
        return JSONResponse(status_code=500, content={})

    manager.get_social_profiles = fake_profiles
    result = _run(manager.get_graph_data("u1", ["alice"], []))
    assert isinstance(result, JSONResponse)


def test_get_graph_data_trims_large_people_collections(monkeypatch):
    followers = [{"handle": f"user{index}"} for index in range(10)]
    documents = [{
        "profile_username": "alice",
        "profiles": [{
            "meta": {"username": "alice"},
            "resources": [{"id": "followers", "resources": followers}],
        }],
    }]

    async def fake_profiles(user_id, profile_username=None):
        return {"result": documents}

    manager = _make_manager()
    manager.get_social_profiles = fake_profiles

    result = _run(manager.get_graph_data("u1", ["alice"], ["user0"], limit=3))
    collection = result["result"][0]["profiles"][0]["resources"][0]
    assert len(collection["resources"]) == 3
    assert collection["trimmed_from"] == 10


def test_search_connections_filters_by_query_and_platform():
    documents = [{
        "profile_username": "alice",
        "profiles": [{
            "meta": {"platform": "facebook", "username": "alice"},
            "resources": [{"id": "connections", "resources": [
                {"author": "Bob Jones", "parent_url": "http://p/1"},
                {"author": "Carol", "parent_url": "http://p/2"},
            ]}],
        }],
    }]

    async def fake_profiles(user_id, profile_username=None):
        return {"result": documents}

    manager = _make_manager()
    manager.get_social_profiles = fake_profiles

    result = _run(manager.search_connections("u1", "alice", platform="facebook", query="bob"))
    assert result["result"]["total"] == 1
    assert result["result"]["items"][0]["author"] == "Bob Jones"


def test_search_connections_filters_by_post_url():
    documents = [{
        "profile_username": "alice",
        "profiles": [{
            "meta": {"platform": "facebook", "username": "alice"},
            "resources": [{"id": "connections", "resources": [
                {"author": "Bob", "parent_url": "http://p/1"},
                {"author": "Carol", "parent_url": "http://p/2"},
            ]}],
        }],
    }]

    async def fake_profiles(user_id, profile_username=None):
        return {"result": documents}

    manager = _make_manager()
    manager.get_social_profiles = fake_profiles

    result = _run(manager.search_connections("u1", "alice", post_url="http://p/2/"))
    assert result["result"]["total"] == 1
    assert result["result"]["items"][0]["author"] == "Carol"


def test_search_connections_returns_empty_when_not_list():
    async def fake_profiles(user_id, profile_username=None):
        return JSONResponse(status_code=500, content={})

    manager = _make_manager()
    manager.get_social_profiles = fake_profiles
    result = _run(manager.search_connections("u1", "alice"))
    assert result == {"result": {"items": [], "total": 0}}


def test_delete_social_profiles_removes_and_filters_graph():
    engine = _FakeSocialEngine(deleted_count=2)
    manager = _make_manager(engine)
    result = _run(manager.delete_social_profiles("u1", "@Alice"))
    assert result == {"profile_username": "alice", "deleted": 2}
    assert engine.collection.delete_calls


def test_delete_social_profiles_handles_error():
    engine = _FakeSocialEngine()

    async def boom(query):
        raise RuntimeError("db")

    engine.collection.delete_many = boom
    manager = _make_manager(engine)
    result = _run(manager.delete_social_profiles("u1", "alice"))
    assert result.status_code == 500


def test_filter_graph_usernames_no_session_returns_zero():
    engine = _FakeSocialEngine(graph_session=None)
    manager = _make_manager(engine)
    removed = _run(manager._filter_graph_usernames("u1", lambda handle: True))
    assert removed == 0


def test_filter_graph_usernames_prunes_and_saves():
    session = SimpleNamespace(extra={"usernames": ["alice", "bob", "carol"]}, updated_at=None)
    engine = _FakeSocialEngine(graph_session=session)
    manager = _make_manager(engine)
    removed = _run(manager._filter_graph_usernames("u1", lambda handle: handle == "alice"))
    assert removed == 2
    assert session.extra["usernames"] == ["alice"]
    assert engine.saved


def test_filter_graph_usernames_no_change_skips_save():
    session = SimpleNamespace(extra={"usernames": ["alice"]}, updated_at=None)
    engine = _FakeSocialEngine(graph_session=session)
    manager = _make_manager(engine)
    removed = _run(manager._filter_graph_usernames("u1", lambda handle: True))
    assert removed == 0
    assert not engine.saved


def test_filter_graph_usernames_bad_usernames_returns_zero():
    session = SimpleNamespace(extra={"usernames": "not-a-list"}, updated_at=None)
    engine = _FakeSocialEngine(graph_session=session)
    manager = _make_manager(engine)
    assert _run(manager._filter_graph_usernames("u1", lambda handle: True)) == 0


def test_prune_dangling_graph_roots_keeps_valid(monkeypatch):
    documents = [{"profile_username": "alice", "root_username": "alice"}]

    async def fake_profiles(user_id, profile_username=None):
        return {"result": documents}

    session = SimpleNamespace(extra={"usernames": ["alice", "ghost"]}, updated_at=None)
    engine = _FakeSocialEngine(graph_session=session)
    manager = _make_manager(engine)
    manager.get_social_profiles = fake_profiles

    result = _run(manager.prune_dangling_graph_roots("u1"))
    assert result == {"removed": 1}
    assert session.extra["usernames"] == ["alice"]


def test_prune_dangling_graph_roots_handles_error(monkeypatch):
    async def boom(user_id, profile_username=None):
        raise RuntimeError("db")

    manager = _make_manager()
    manager.get_social_profiles = boom
    result = _run(manager.prune_dangling_graph_roots("u1"))
    assert result.status_code == 500
