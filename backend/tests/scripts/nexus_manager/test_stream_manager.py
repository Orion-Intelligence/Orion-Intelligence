from __future__ import annotations

import asyncio
import json

import pytest

from orion.api.server.nexus_manager.stream_manager import ActiveNexusStream, NexusStreamManager
from orion.api.server.nexus_manager.model.nexus_chat_model import MAX_CHAT_MESSAGE_LENGTH
from orion.api.server.nexus_manager.model.rpc_payload_model import NexusRpcPayloadModel
from tests.scripts.nexus_manager.fakes import (
    FakeHTTPError,
    FakePostResponse,
    FakeStreamClient,
    FakeStreamResponse,
)
from tests.scripts.nexus_manager.helpers import (
    _FakeStreamGen,
    _collect,
    _install_run_client,
    _make_active_stream,
    _make_stream_manager,
)


def test_parse_stream_line_variants():
    assert NexusStreamManager._parse_stream_line("") is None
    assert NexusStreamManager._parse_stream_line("   ") is None
    assert NexusStreamManager._parse_stream_line(": keep-alive") is None
    assert NexusStreamManager._parse_stream_line("data: ") is None
    assert NexusStreamManager._parse_stream_line("data: not-json") is None
    assert NexusStreamManager._parse_stream_line('data: {"a": 1}') == {"a": 1}
    assert NexusStreamManager._parse_stream_line('{"b": 2}') == {"b": 2}


def test_stream_output_variants():
    assert NexusStreamManager._stream_output({"output": {"response": "x"}}) == {"response": "x"}
    assert NexusStreamManager._stream_output(
        {"result": {"structuredContent": {"response": "y"}}}
    ) == {"response": "y"}
    fallback = {"result": {"structuredContent": "not-a-dict"}}
    assert NexusStreamManager._stream_output(fallback) == fallback
    other = {"foo": "bar"}
    assert NexusStreamManager._stream_output(other) == other


@pytest.mark.anyio
async def test_mcp_headers_returns_session_headers():
    manager = _make_stream_manager()
    client = FakeStreamClient(
        post_responses=[
            FakePostResponse(headers={"mcp-session-id": "sess-1"}),
            FakePostResponse(),
        ]
    )
    headers = await manager._mcp_headers(client)
    assert headers["Mcp-Session-Id"] == "sess-1"
    assert headers["Accept"].startswith("application/json")
    assert len(client.posts) == 2


@pytest.mark.anyio
async def test_store_turn_truncates_and_sends_triggers():
    manager = _make_stream_manager()
    client = FakeStreamClient(post_responses=[FakePostResponse()])
    triggers = [{"name": "t"}]
    await manager._store_turn(
        client, "p" * (MAX_CHAT_MESSAGE_LENGTH + 500), "r" * (MAX_CHAT_MESSAGE_LENGTH + 500), "user-1", "sess-1", triggers=triggers
    )
    sent = client.posts[0]
    assert sent["url"].endswith("/v1/chats/sess-1/messages")
    assert sent["headers"]["X-User-Id"] == "user-1"
    assert len(sent["json"]["text"]) == MAX_CHAT_MESSAGE_LENGTH
    assert len(sent["json"]["response"]) == MAX_CHAT_MESSAGE_LENGTH
    assert sent["json"]["triggers"] == triggers


@pytest.mark.anyio
async def test_store_turn_without_triggers():
    manager = _make_stream_manager()
    client = FakeStreamClient(post_responses=[FakePostResponse()])
    await manager._store_turn(client, "p", "r", "user-1", "sess-1")
    assert "triggers" not in client.posts[0]["json"]


@pytest.mark.anyio
async def test_close_mcp_session_swallows_http_error():
    manager = _make_stream_manager()
    client = FakeStreamClient(delete_exc=FakeHTTPError())
    await manager._close_mcp_session(client, {"Mcp-Session-Id": "s"})
    assert client.deletes


@pytest.mark.anyio
async def test_close_mcp_session_success():
    manager = _make_stream_manager()
    client = FakeStreamClient()
    await manager._close_mcp_session(client, {"Mcp-Session-Id": "s"})
    assert client.deletes


def _payload():
    return NexusRpcPayloadModel.tool_call("req-1", "open_chat", {"prompt": "p"})


@pytest.mark.anyio
async def test_stream_non_200_yields_error():
    manager = _make_stream_manager()
    response = FakeStreamResponse(status_code=500, read_bytes=b"upstream error")
    client = FakeStreamClient(stream_response=response)
    results = await _collect(manager._stream(client, _payload(), {}))
    assert len(results) == 1
    line, answer, failed = results[0]
    payload = json.loads(line)
    assert payload["error"] is True
    assert payload["done"] is True
    assert response.close_count == 1


@pytest.mark.anyio
async def test_stream_progress_status_and_finished():
    manager = _make_stream_manager()
    lines = [
        ": keep-alive",
        "",
        'data: {"method":"notifications/progress","params":{"message":"working"}}',
        'data: {"status":"loading"}',
        'data: {"result":{"structuredContent":{"response":"partial"}}}',
        'data: {"output":{"response":"final answer","response_type":"finished"}}',
    ]
    client = FakeStreamClient(stream_response=FakeStreamResponse(lines=lines))
    results = await _collect(manager._stream(client, _payload(), {}))
    statuses = [json.loads(line) for line, _, _ in results if line]
    assert any(item.get("status") == {"message": "working"} for item in statuses)
    assert any(item.get("status") == {"message": "loading"} for item in statuses)
    assert results[-1] == ("", "final answer", False)


@pytest.mark.anyio
async def test_stream_error_message():
    manager = _make_stream_manager()
    lines = ['data: {"error":{"message":"boom"}}']
    client = FakeStreamClient(stream_response=FakeStreamResponse(lines=lines))
    results = await _collect(manager._stream(client, _payload(), {}))
    payload = json.loads(results[0][0])
    assert payload["output"]["response"] == "boom"
    assert payload["error"] is True


@pytest.mark.anyio
async def test_stream_is_error_result():
    manager = _make_stream_manager()
    lines = ['data: {"result":{"isError":true,"content":[{"text":"failbit"}]}}']
    client = FakeStreamClient(stream_response=FakeStreamResponse(lines=lines))
    results = await _collect(manager._stream(client, _payload(), {}))
    payload = json.loads(results[0][0])
    assert payload["output"]["response"] == "failbit"
    assert payload["error"] is True


@pytest.mark.anyio
async def test_stream_api_pipeline_closes_early():
    manager = _make_stream_manager()
    lines = ['data: {"output":{"response_type":"api_pipeline"}}']
    response = FakeStreamResponse(lines=lines)
    client = FakeStreamClient(stream_response=response)
    results = await _collect(manager._stream(client, _payload(), {}))
    assert results[-1] == ("", manager.NOT_FOUND_RESPONSE, False)
    assert response.close_count == 1


@pytest.mark.anyio
async def test_stream_triggers_finish():
    manager = _make_stream_manager()
    lines = ['data: {"output":{"response":"resp","triggers":[{"t":1}]}}']
    client = FakeStreamClient(stream_response=FakeStreamResponse(lines=lines))
    results = await _collect(manager._stream(client, _payload(), {}))
    payload = json.loads(results[0][0])
    assert payload["output"]["triggers"] == [{"t": 1}]
    assert payload["done"] is True


@pytest.mark.anyio
async def test_stream_exception_branch_falls_through():
    manager = _make_stream_manager()
    lines = ["data: 5"]
    client = FakeStreamClient(stream_response=FakeStreamResponse(lines=lines))
    results = await _collect(manager._stream(client, _payload(), {}))
    assert results[0] == ("data: 5\n", "", False)
    assert results[-1] == ("", "", False)


@pytest.mark.anyio
async def test_emit_and_finish_and_subscribe():
    manager = _make_stream_manager()
    stream = _make_active_stream()
    await manager._emit(stream, "")
    await manager._emit(stream, "line-1\n")
    await manager._emit(stream, "line-2\n")
    await manager._finish(stream)
    collected = await _collect(manager._subscribe(stream))
    assert collected == ["line-1\n", "line-2\n"]
    assert stream.done is True


@pytest.mark.anyio
async def test_forget_stream_removes_and_keeps():
    manager = _make_stream_manager()
    manager.STREAM_RETENTION_SECONDS = 0
    key = ("user-1", "req-1")
    stream = _make_active_stream()
    manager.active_streams[key] = stream
    await manager._forget_stream(key, stream)
    assert key not in manager.active_streams

    other = _make_active_stream()
    manager.active_streams[key] = other
    await manager._forget_stream(key, stream)
    assert manager.active_streams[key] is other


@pytest.mark.anyio
async def test_run_stream_stores_on_done_event(monkeypatch):
    manager = _make_stream_manager()
    manager.STREAM_RETENTION_SECONDS = 0
    _install_run_client(monkeypatch)

    async def fake_headers(client):
        return {}

    store_calls = []

    async def fake_store(client, prompt, response, user_id, session_id, triggers=None):
        store_calls.append((prompt, response, user_id, session_id, triggers))

    async def fake_close(client, headers):
        return None

    done_line = json.dumps({"output": {"response": "hello", "triggers": [{"t": 1}]}, "done": True, "error": False}) + "\n"
    manager._mcp_headers = fake_headers
    manager._store_turn = fake_store
    manager._close_mcp_session = fake_close
    manager._stream = _FakeStreamGen([(done_line, "", False)])

    stream = _make_active_stream()
    key = ("user-1", "req-1")
    await manager._run_stream(key, stream, "prompt", "user-1", "summarizer", "custom", "Bearer t", "sess-1", "persistent")
    await asyncio.sleep(0)

    assert store_calls and store_calls[0][3] == "sess-1"
    assert store_calls[0][4] == [{"t": 1}]
    assert done_line in stream.lines
    assert stream.done is True


@pytest.mark.anyio
async def test_run_stream_answer_branch_stores(monkeypatch):
    manager = _make_stream_manager()
    manager.STREAM_RETENTION_SECONDS = 0
    _install_run_client(monkeypatch)

    async def fake_headers(client):
        return {"Mcp-Session-Id": "s"}

    store_calls = []

    async def fake_store(client, prompt, response, user_id, session_id, triggers=None):
        store_calls.append((prompt, response, user_id, session_id))

    async def fake_close(client, headers):
        return None

    manager._mcp_headers = fake_headers
    manager._store_turn = fake_store
    manager._close_mcp_session = fake_close
    manager._stream = _FakeStreamGen([("", "the answer", False)])

    stream = _make_active_stream()
    await manager._run_stream(("user-1", "req-1"), stream, "prompt", "user-1", "", "default", "", "sess-1", "persistent")
    await asyncio.sleep(0)

    assert store_calls and store_calls[0][1] == "the answer"
    emitted = json.loads(stream.lines[-1])
    assert emitted["output"]["response"] == "the answer"
    assert emitted["done"] is True


@pytest.mark.anyio
async def test_run_stream_failed_branch(monkeypatch):
    manager = _make_stream_manager()
    manager.STREAM_RETENTION_SECONDS = 0
    _install_run_client(monkeypatch)

    async def fake_headers(client):
        return {}

    async def fake_close(client, headers):
        return None

    manager._mcp_headers = fake_headers
    manager._close_mcp_session = fake_close
    manager._stream = _FakeStreamGen([("failure-line\n", "", True)])

    stream = _make_active_stream()
    await manager._run_stream(("user-1", "req-1"), stream, "prompt", "user-1", "open_chat", "default", "", "", "temporary")
    await asyncio.sleep(0)

    assert stream.lines == ["failure-line\n"]
    assert stream.done is True


@pytest.mark.anyio
async def test_run_stream_exception_emits_error(monkeypatch):
    manager = _make_stream_manager()
    manager.STREAM_RETENTION_SECONDS = 0
    _install_run_client(monkeypatch)

    async def boom_headers(client):
        raise RuntimeError("no headers")

    manager._mcp_headers = boom_headers

    stream = _make_active_stream()
    await manager._run_stream(("user-1", "req-1"), stream, "prompt", "user-1", "open_chat", "default", "", "", "persistent")
    await asyncio.sleep(0)

    payload = json.loads(stream.lines[-1])
    assert payload["error"] is True
    assert payload["output"]["response"] == "Something happened while calling api/chat"
    assert "user-1" not in manager.active_chat_tasks


@pytest.mark.anyio
async def test_stream_response_creates_task_and_subscribes(monkeypatch):
    manager = _make_stream_manager()
    called = {}

    async def fake_run_stream(key, stream, prompt, user_id, tool, type_name, auth_token, session_id, session_type):
        called["args"] = (key, prompt, user_id, tool, type_name, session_type)
        await manager._emit(stream, "one\n")
        await manager._emit(stream, "two\n")
        await manager._finish(stream)

    manager._run_stream = fake_run_stream

    collected = await _collect(
        manager.stream_response("prompt", "user-1", request_id="req-1")
    )
    assert collected == ["one\n", "two\n"]
    assert called["args"][2] == "user-1"
    assert ("user-1", "req-1") in manager.active_streams


@pytest.mark.anyio
async def test_stream_response_resumes_existing_stream(monkeypatch):
    manager = _make_stream_manager()
    ran = {"called": False}

    async def fake_run_stream(*args):
        ran["called"] = True

    manager._run_stream = fake_run_stream

    stream = ActiveNexusStream()
    stream.lines = ["cached\n"]
    stream.done = True
    manager.active_streams[("user-1", "req-1")] = stream

    collected = await _collect(
        manager.stream_response("prompt", "user-1", request_id="req-1")
    )
    assert collected == ["cached\n"]
    assert ran["called"] is False


def test_has_stream():
    manager = _make_stream_manager()
    manager.active_streams[("user-1", "req-1")] = ActiveNexusStream()
    assert manager.has_stream("user-1", "req-1") is True
    assert manager.has_stream("user-1", "missing") is False
    assert manager.has_stream("user-1", "") is False


@pytest.mark.anyio
async def test_cancel_chat_no_task():
    manager = _make_stream_manager()
    assert await manager.cancel_chat("user-1") == {"cancelled": False}


@pytest.mark.anyio
async def test_cancel_chat_done_task():
    manager = _make_stream_manager()

    async def noop():
        return None

    task = asyncio.ensure_future(noop())
    await task
    manager.active_chat_tasks["user-1"] = task
    assert await manager.cancel_chat("user-1") == {"cancelled": False}


@pytest.mark.anyio
async def test_cancel_chat_active_task():
    manager = _make_stream_manager()

    async def sleeper():
        await asyncio.sleep(100)

    task = asyncio.ensure_future(sleeper())
    await asyncio.sleep(0)
    manager.active_chat_tasks["user-1"] = task
    result = await manager.cancel_chat("user-1")
    assert result == {"cancelled": True}
    with pytest.raises(asyncio.CancelledError):
        await task
