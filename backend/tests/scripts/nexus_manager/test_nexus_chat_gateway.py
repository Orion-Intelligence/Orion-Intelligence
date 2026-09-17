from __future__ import annotations

import json
from types import SimpleNamespace

import pytest

from orion.api.server.nexus_manager.nexus_chat_gateway import (
    SHARED_SESSION_TITLE,
    nexus_chat_gateway,
)
from tests.scripts.nexus_manager.fakes import FakeGatewayResponse
from tests.scripts.nexus_manager.helpers import (
    _install_gateway_client,
    _install_gateway_env,
    _make_gateway,
)


def _user(user_id="user-1"):
    return SimpleNamespace(id=user_id)


def _body(response):
    return json.loads(response.body)


def test_base_url_uses_env_value(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "http://custom-nexus:9999/")
    assert gateway._base_url() == "http://custom-nexus:9999"


def test_base_url_falls_back_to_default(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    assert gateway._base_url() == "http://trusted-nexus-api:8030"


def test_headers_carries_user_id():
    gateway = _make_gateway()
    assert gateway._headers(_user("abc")) == {"X-User-Id": "abc"}


def test_is_temporary_session():
    assert nexus_chat_gateway.is_temporary_session("") is True
    assert nexus_chat_gateway.is_temporary_session("temp:123") is True
    assert nexus_chat_gateway.is_temporary_session("real-session") is False


@pytest.mark.anyio
async def test_request_success(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    _install_gateway_client(monkeypatch, [FakeGatewayResponse(status_code=200, json_data={"ok": True})])
    response = await gateway._request("GET", "/v1/chats", _user())
    assert response.status_code == 200
    assert _body(response) == {"ok": True}


@pytest.mark.anyio
async def test_request_error_status(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    _install_gateway_client(monkeypatch, [FakeGatewayResponse(status_code=404, json_data={"detail": "nope"})])
    response = await gateway._request("GET", "/v1/chats/x", _user())
    assert response.status_code == 404
    assert _body(response) == {"detail": "nope"}


@pytest.mark.anyio
async def test_request_json_parse_failure_uses_text(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    _install_gateway_client(
        monkeypatch,
        [FakeGatewayResponse(status_code=200, json_exc=ValueError("bad"), text="plain body")],
    )
    response = await gateway._request("GET", "/v1/chats", _user())
    assert _body(response) == {"detail": "plain body"}


@pytest.mark.anyio
async def test_request_transport_exception(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    _install_gateway_client(monkeypatch, [], exc=RuntimeError("network down"))
    response = await gateway._request("GET", "/v1/chats", _user())
    assert response.status_code == 500
    assert _body(response) == {"detail": "Something happened while calling Nexus chat service"}


@pytest.mark.anyio
async def test_raw_request_success_and_json_failure(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    _install_gateway_client(
        monkeypatch,
        [
            FakeGatewayResponse(status_code=201, json_data={"a": 1}),
            FakeGatewayResponse(status_code=500, json_exc=ValueError("bad")),
        ],
    )
    status_code, payload = await gateway._raw_request("GET", "/v1/chats", "user-1")
    assert status_code == 201
    assert payload == {"a": 1}

    status_code, payload = await gateway._raw_request("GET", "/v1/chats", "user-1")
    assert status_code == 500
    assert payload is None


@pytest.mark.anyio
async def test_ensure_shared_session_returns_valid_cache(monkeypatch):
    gateway = _make_gateway()
    gateway._shared_sessions = {"user-1": "cached-1"}
    _install_gateway_env(monkeypatch, "")
    _install_gateway_client(monkeypatch, [FakeGatewayResponse(status_code=200, json_data={})])
    assert await gateway.ensure_shared_session("user-1") == "cached-1"


@pytest.mark.anyio
async def test_ensure_shared_session_invalid_cache_then_listing(monkeypatch):
    gateway = _make_gateway()
    gateway._shared_sessions = {"user-1": "stale"}
    _install_gateway_env(monkeypatch, "")
    _install_gateway_client(
        monkeypatch,
        [
            FakeGatewayResponse(status_code=404, json_data={}),
            FakeGatewayResponse(
                status_code=200,
                json_data=[{"title": SHARED_SESSION_TITLE, "session_id": "s-9"}],
            ),
        ],
    )
    assert await gateway.ensure_shared_session("user-1") == "s-9"
    assert gateway._shared_sessions["user-1"] == "s-9"


@pytest.mark.anyio
async def test_ensure_shared_session_creates_when_missing(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    _install_gateway_client(
        monkeypatch,
        [
            FakeGatewayResponse(status_code=200, json_data=[{"title": "Other", "_id": "z"}]),
            FakeGatewayResponse(status_code=200, json_data={"_id": "new-1"}),
        ],
    )
    assert await gateway.ensure_shared_session("user-1") == "new-1"


@pytest.mark.anyio
async def test_ensure_shared_session_all_fail(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    _install_gateway_client(
        monkeypatch,
        [
            FakeGatewayResponse(status_code=500, json_data={}),
            FakeGatewayResponse(status_code=500, json_data={}),
        ],
    )
    assert await gateway.ensure_shared_session("user-1") == ""


@pytest.mark.anyio
async def test_list_chats_filters_shared_session(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    listing = [
        {"title": SHARED_SESSION_TITLE, "session_id": "hidden"},
        {"title": "Visible", "session_id": "shown"},
    ]
    _install_gateway_client(monkeypatch, [FakeGatewayResponse(status_code=200, json_data=listing)])
    response = await gateway.list_chats(_user())
    body = _body(response)
    assert [chat["title"] for chat in body] == ["Visible"]


@pytest.mark.anyio
async def test_list_chats_non_list_response(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    _install_gateway_client(monkeypatch, [FakeGatewayResponse(status_code=500, json_data=None)])
    response = await gateway.list_chats(_user())
    assert response.status_code == 500
    assert _body(response) == {"detail": "Empty response from Nexus"}


@pytest.mark.anyio
async def test_simple_delegating_endpoints(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    responses = [FakeGatewayResponse(status_code=200, json_data={"ok": True}) for _ in range(11)]
    _install_gateway_client(monkeypatch, responses)
    user = _user()

    assert (await gateway.create_chat({"title": "t"}, user)).status_code == 200
    assert (await gateway.delete_all_chats(user)).status_code == 200
    assert (await gateway.get_chat("s1", user)).status_code == 200
    assert (await gateway.get_chat_history({"a": 1}, user)).status_code == 200
    assert (await gateway.update_chat_history({"a": 1}, user)).status_code == 200
    assert (await gateway.send_message("s1", {"text": "hi"}, user)).status_code == 200
    assert (await gateway.rename_chat("s1", {"title": "n"}, user)).status_code == 200
    assert (await gateway.delete_chat("s1", user)).status_code == 200
    assert (await gateway.import_github_repo("s1", {"repo": "r"}, user)).status_code == 200
    assert (await gateway.get_workspace_status("s1", user)).status_code == 200
    assert (await gateway.get_workspace_tree("s1", user, folder_path="a/b")).status_code == 200


@pytest.mark.anyio
async def test_read_workspace_file_builds_path(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    factory = _install_gateway_client(monkeypatch, [FakeGatewayResponse(status_code=200, json_data={})])
    await gateway.read_workspace_file("s1", _user(), "src/app.py", start_line=5, line_count=20)
    called_url = factory.calls[0]["url"]
    assert "path=src%2Fapp.py" in called_url
    assert "start_line=5" in called_url
    assert "line_count=20" in called_url


@pytest.mark.anyio
async def test_download_user_file_success_with_bearer(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    headers = {
        "content-type": "text/plain",
        "content-disposition": "attachment; filename=x.txt",
        "cache-control": "no-cache",
        "x-content-type-options": "nosniff",
    }
    factory = _install_gateway_client(
        monkeypatch,
        [FakeGatewayResponse(status_code=200, content=b"file-bytes", headers=headers)],
    )
    response = await gateway.download_user_file("x.txt", _user(), auth_token="abc")
    assert response.body == b"file-bytes"
    assert response.media_type == "text/plain"
    assert factory.calls[0]["headers"]["Authorization"] == "Bearer abc"


@pytest.mark.anyio
async def test_download_user_file_keeps_existing_bearer(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    factory = _install_gateway_client(
        monkeypatch,
        [FakeGatewayResponse(status_code=200, content=b"data", headers={"content-type": "application/pdf"})],
    )
    await gateway.download_user_file("x.pdf", _user(), auth_token="Bearer token-1")
    assert factory.calls[0]["headers"]["Authorization"] == "Bearer token-1"


@pytest.mark.anyio
async def test_download_user_file_not_found(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    _install_gateway_client(monkeypatch, [FakeGatewayResponse(status_code=404, text="missing")])
    response = await gateway.download_user_file("x.txt", _user())
    assert response.status_code == 404
    assert _body(response) == {"detail": "missing"}


@pytest.mark.anyio
async def test_download_user_file_exception(monkeypatch):
    gateway = _make_gateway()
    _install_gateway_env(monkeypatch, "")
    _install_gateway_client(monkeypatch, [], exc=RuntimeError("boom"))
    response = await gateway.download_user_file("x.txt", _user())
    assert response.status_code == 500
    assert _body(response) == {"detail": "Something happened while downloading Nexus file"}


def test_get_instance_singleton(monkeypatch):
    monkeypatch.setattr(nexus_chat_gateway, "_nexus_chat_gateway__instance", None, raising=False)
    first = nexus_chat_gateway.getInstance()
    assert first is nexus_chat_gateway.getInstance()
    assert first._shared_sessions == {}
    nexus_chat_gateway()
    assert nexus_chat_gateway.getInstance() is first
