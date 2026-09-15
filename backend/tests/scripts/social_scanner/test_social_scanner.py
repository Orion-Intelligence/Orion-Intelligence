from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

import orion.api.interactive.social_manager.social_scanner as ss_module
from orion.api.interactive.social_manager.social_scanner import social_scanner
from orion.api.interactive.social_manager.social_models.social_scan_model import SocialScan
from tests.scripts.social_scanner.fakes import FakeScanCollection, FakeSocialModelInstance
from tests.scripts.social_scanner.helpers import (
    _run,
    make_scanner,
    no_sleep,
    patch_collection,
    patch_log,
    patch_social_model,
)


def _user(user_id="507f1f77bcf86cd799439011"):
    return SimpleNamespace(id=user_id)


def test_get_instance_singleton():
    assert social_scanner.get_instance() is social_scanner.get_instance()


def test_start_recon_empty_query_raises(monkeypatch):
    scanner = make_scanner()
    patch_social_model(monkeypatch)
    with pytest.raises(HTTPException) as exc:
        _run(scanner.start_recon(_user(), None, "   "))
    assert exc.value.status_code == 400


def test_start_recon_delegates_to_start(monkeypatch):
    scanner = make_scanner()
    patch_social_model(monkeypatch)
    captured = {}

    async def fake_start(user_id, headers, kind, payload, profile_username):
        captured.update(user_id=user_id, kind=kind, payload=payload, profile_username=profile_username)
        return {"status": "pending"}

    monkeypatch.setattr(scanner, "_start", fake_start)
    result = _run(scanner.start_recon(_user(), None, "@JohnDoe"))
    assert result == {"status": "pending"}
    assert captured["profile_username"] == "johndoe"
    assert captured["kind"] == "recon"


def test_start_image_recon_delegates(monkeypatch):
    scanner = make_scanner()
    model = FakeSocialModelInstance(decode_result=b"rawbytes")
    patch_social_model(monkeypatch, model)
    captured = {}

    async def fake_start(user_id, headers, kind, payload, profile_username):
        captured.update(kind=kind, payload=payload, profile_username=profile_username)
        return {"status": "pending"}

    monkeypatch.setattr(scanner, "_start", fake_start)
    _run(scanner.start_image_recon(_user(), None, "data:image/png;base64,AAAA"))
    assert captured["kind"] == "recon/image"
    assert captured["payload"]["file_bytes"] == b"rawbytes"
    assert captured["profile_username"].startswith("image scan #")


def test_status_no_row_returns_none(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_one_result=None)
    patch_collection(monkeypatch, scanner, collection)
    result = _run(scanner.status(_user(), None, "john"))
    assert result == {"profile_username": "john", "status": "none"}


def test_status_pending_stale_non_recon_fails(monkeypatch):
    scanner = make_scanner()
    row = {"status": "pending", "scan_kind": "recon/image", "profile_username": "john"}
    collection = FakeScanCollection(find_one_result=row)
    patch_collection(monkeypatch, scanner, collection)
    monkeypatch.setattr(ss_module.social_helper, "is_stale", staticmethod(lambda row, seconds: True))
    result = _run(scanner.status(_user(), None, "john"))
    assert result["status"] == "failed"
    assert collection.update_one_calls


def test_status_pending_stale_recon_restarts(monkeypatch):
    scanner = make_scanner()
    row = {"status": "pending", "scan_kind": "recon", "profile_username": "john"}
    collection = FakeScanCollection(find_one_result=row)
    patch_collection(monkeypatch, scanner, collection)
    patch_social_model(monkeypatch)
    monkeypatch.setattr(ss_module.social_helper, "is_stale", staticmethod(lambda row, seconds: True))

    async def fake_start(*args, **kwargs):
        return {"status": "restarted"}

    monkeypatch.setattr(scanner, "_start", fake_start)
    result = _run(scanner.status(_user(), None, "john"))
    assert result == {"status": "restarted"}


def test_status_pending_not_stale_builds_response(monkeypatch):
    scanner = make_scanner()
    row = {"status": "pending", "scan_progress": 40, "scan_step": "working"}
    collection = FakeScanCollection(find_one_result=row)
    patch_collection(monkeypatch, scanner, collection)
    monkeypatch.setattr(ss_module.social_helper, "is_stale", staticmethod(lambda row, seconds: False))
    result = _run(scanner.status(_user(), None, "john"))
    assert result["status"] == "pending"
    assert result["progress"] == 40


def test_cancel_returns_cancelled(monkeypatch):
    scanner = make_scanner()

    async def fake_cancel_pending(user_id):
        return ["john"]

    monkeypatch.setattr(scanner, "_cancel_pending", fake_cancel_pending)
    result = _run(scanner.cancel(_user()))
    assert result == {"cancelled": True, "profile_username": "john"}


def test_cancel_none(monkeypatch):
    scanner = make_scanner()

    async def fake_cancel_pending(user_id):
        return []

    monkeypatch.setattr(scanner, "_cancel_pending", fake_cancel_pending)
    result = _run(scanner.cancel(_user()))
    assert result == {"cancelled": False, "profile_username": None}


def test_resume_pending_find_error(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_rows=[], raise_on_find=True)
    patch_collection(monkeypatch, scanner, collection)
    log = patch_log(monkeypatch)
    _run(scanner.resume_pending())
    assert log.messages


def test_resume_pending_skips_and_processes(monkeypatch):
    rows = [
        {"user_id": "", "profile_username": "x"},
        {"user_id": "u1", "profile_username": "notstale"},
        {"user_id": "u2", "profile_username": "img", "scan_kind": "recon/image"},
        {"user_id": "u3", "profile_username": "nouser"},
        {"user_id": "u4", "profile_username": "good"},
    ]
    scanner = make_scanner()
    collection = FakeScanCollection(find_rows=rows)
    patch_collection(monkeypatch, scanner, collection)
    patch_social_model(monkeypatch)

    def is_stale(row, seconds):
        return row.get("profile_username") != "notstale"

    monkeypatch.setattr(ss_module.social_helper, "is_stale", staticmethod(is_stale))

    set_status_calls = []

    async def fake_set_status(user_id, profile_username, status, step):
        set_status_calls.append((user_id, profile_username, status))

    async def fake_load_user(user_id):
        return None if user_id == "u3" else _user()

    started = []

    async def fake_start(user_id, headers, kind, payload, profile_username):
        started.append(profile_username)

    monkeypatch.setattr(scanner, "_set_status", fake_set_status)
    monkeypatch.setattr(scanner, "_load_user", fake_load_user)
    monkeypatch.setattr(scanner, "_start", fake_start)
    _run(scanner.resume_pending())
    assert started == ["good"]
    assert ("u2", "img", "failed") in set_status_calls
    assert ("u3", "nouser", "failed") in set_status_calls


def test_start_existing_pending_not_stale(monkeypatch):
    scanner = make_scanner()
    row = {"status": "pending", "scan_progress": 10, "scan_step": "queued"}
    collection = FakeScanCollection(find_one_result=row)
    patch_collection(monkeypatch, scanner, collection)
    monkeypatch.setattr(ss_module.social_helper, "is_stale", staticmethod(lambda row, seconds: False))
    result = _run(scanner._start("u1", {}, "recon", {"query": "john"}, "john"))
    assert result["status"] == "pending"


def test_start_claim_fails(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_one_result=None)
    patch_collection(monkeypatch, scanner, collection)

    async def fake_cancel_pending(user_id, keep=None):
        return []

    async def fake_claim(user_id, profile_username, kind):
        return False

    monkeypatch.setattr(scanner, "_cancel_pending", fake_cancel_pending)
    monkeypatch.setattr(scanner, "_claim", fake_claim)
    result = _run(scanner._start("u1", {}, "recon", {"query": "john"}, "john"))
    assert result["profile_username"] == "john"


def test_start_success_spawns_task(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_one_result=None)
    patch_collection(monkeypatch, scanner, collection)

    async def fake_cancel_pending(user_id, keep=None):
        return []

    async def fake_claim(user_id, profile_username, kind):
        return True

    async def fake_run(scan):
        return None

    monkeypatch.setattr(scanner, "_cancel_pending", fake_cancel_pending)
    monkeypatch.setattr(scanner, "_claim", fake_claim)
    monkeypatch.setattr(scanner, "_run", fake_run)

    async def scenario():
        result = await scanner._start("u1", {}, "recon", {"query": "john"}, "john")
        assert scanner._scans["u1"].task is not None
        await scanner._scans["u1"].task
        return result

    result = _run(scenario())
    assert result["status"] == "pending"
    assert result["progress"] == 5


def test_claim_returns_true_when_claimed(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(claim_result={"user_id": "u1"})
    patch_collection(monkeypatch, scanner, collection)
    assert _run(scanner._claim("u1", "john", "recon")) is True


def test_claim_returns_false_when_none(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(claim_result=None)
    patch_collection(monkeypatch, scanner, collection)
    assert _run(scanner._claim("u1", "john", "recon")) is False


def test_cancel_pending_updates_and_stops_local(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_rows=[{"profile_username": "john"}])
    patch_collection(monkeypatch, scanner, collection)
    scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john")
    scanner._scans["u1"] = scan
    stopped = []

    async def fake_stop_local(local):
        stopped.append(local)

    monkeypatch.setattr(scanner, "_stop_local", fake_stop_local)
    names = _run(scanner._cancel_pending("u1"))
    assert names == ["john"]
    assert collection.update_many_calls
    assert stopped == [scan]


def test_cancel_pending_no_names(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_rows=[])
    patch_collection(monkeypatch, scanner, collection)
    names = _run(scanner._cancel_pending("u1", keep="john"))
    assert names == []
    assert not collection.update_many_calls


def test_run_not_owned_returns(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_one_result=None)
    patch_collection(monkeypatch, scanner, collection)
    patch_social_model(monkeypatch, FakeSocialModelInstance(responses=[(200, {"result": []})]))
    scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john")
    scanner._scans["u1"] = scan
    _run(scanner._run(scan))
    assert collection.update_one_calls == []


def test_run_completes(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_one_result={"scan_cancel_requested": False})
    patch_collection(monkeypatch, scanner, collection)
    patch_social_model(monkeypatch, FakeSocialModelInstance(responses=[(200, {"result": [{"a": 1}]})]))
    monkeypatch.setattr(ss_module.social_helper, "normalize_profiles", staticmethod(lambda result, name: [{"p": 1}]))
    no_sleep(monkeypatch)
    scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john")
    scanner._scans["u1"] = scan
    _run(scanner._run(scan))
    complete_call = collection.update_one_calls[-1]
    assert complete_call[1]["$set"]["status"] == "complete"


def test_run_error_status_fails(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_one_result={"scan_cancel_requested": False})
    patch_collection(monkeypatch, scanner, collection)
    patch_social_model(monkeypatch, FakeSocialModelInstance(responses=[(200, {"status": "error", "message": "timeout"})]))
    no_sleep(monkeypatch)
    scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john")
    scanner._scans["u1"] = scan
    _run(scanner._run(scan))
    assert collection.update_one_calls[-1][1]["$set"]["scan_step"] == "Scan timed out"


def test_run_heartbeat_then_complete(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_one_result={"scan_cancel_requested": False})
    patch_collection(monkeypatch, scanner, collection)
    responses = [(200, {"progress": 30, "step": "working"}), (200, {"result": [{"a": 1}]})]
    patch_social_model(monkeypatch, FakeSocialModelInstance(responses=responses))
    monkeypatch.setattr(ss_module.social_helper, "normalize_profiles", staticmethod(lambda result, name: [{"p": 1}]))
    no_sleep(monkeypatch)
    scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john")
    scanner._scans["u1"] = scan
    _run(scanner._run(scan))
    steps = [call for call in collection.update_one_calls]
    assert steps[-1][1]["$set"]["status"] == "complete"


def test_run_consecutive_failures(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_one_result={"scan_cancel_requested": False})
    patch_collection(monkeypatch, scanner, collection)
    patch_social_model(monkeypatch, FakeSocialModelInstance(responses=[(500, {})] * 5))
    no_sleep(monkeypatch)
    scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john")
    scanner._scans["u1"] = scan
    _run(scanner._run(scan))
    assert collection.update_one_calls[-1][1]["$set"]["scan_step"] == "Social service unreachable"


def test_run_timeout(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_one_result={"scan_cancel_requested": False})
    patch_collection(monkeypatch, scanner, collection)
    patch_social_model(monkeypatch, FakeSocialModelInstance(responses=[(200, {"progress": 10, "step": "x"})]))
    no_sleep(monkeypatch)
    monkeypatch.setattr(social_scanner, "SCAN_TIMEOUT_SECONDS", -1)
    scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john")
    scanner._scans["u1"] = scan
    _run(scanner._run(scan))
    assert collection.update_one_calls[-1][1]["$set"]["scan_step"] == "Scan timed out"


def test_run_cancelled_error_propagates(monkeypatch):
    import asyncio

    scanner = make_scanner()
    collection = FakeScanCollection(find_one_result={"scan_cancel_requested": False})
    patch_collection(monkeypatch, scanner, collection)
    patch_social_model(monkeypatch, FakeSocialModelInstance(responses=[asyncio.CancelledError()]))
    no_sleep(monkeypatch)
    scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john")
    scanner._scans["u1"] = scan
    with pytest.raises(asyncio.CancelledError):
        _run(scanner._run(scan))


def test_run_generic_exception_fails(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_one_result={"scan_cancel_requested": False})
    patch_collection(monkeypatch, scanner, collection)
    patch_social_model(monkeypatch, FakeSocialModelInstance(responses=[RuntimeError("boom")]))
    patch_log(monkeypatch)
    no_sleep(monkeypatch)
    scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john")
    scanner._scans["u1"] = scan
    _run(scanner._run(scan))
    assert collection.update_one_calls[-1][1]["$set"]["status"] == "failed"


def test_still_owned_cancel_requested(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection(find_one_result={"scan_cancel_requested": True})
    patch_collection(monkeypatch, scanner, collection)
    scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john")
    assert _run(scanner._still_owned(scan)) is False


def test_heartbeat_updates(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection()
    patch_collection(monkeypatch, scanner, collection)
    scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john")
    _run(scanner._heartbeat(scan, 50, "step"))
    update = collection.update_one_calls[-1][1]["$set"]
    assert update["scan_progress"] == 50
    assert update["scan_step"] == "step"


def test_heartbeat_no_progress_no_step(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection()
    patch_collection(monkeypatch, scanner, collection)
    scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john")
    _run(scanner._heartbeat(scan, None, ""))
    update = collection.update_one_calls[-1][1]["$set"]
    assert "scan_progress" not in update
    assert "scan_step" not in update


def test_stop_local_cancels_task(monkeypatch):
    import asyncio

    scanner = make_scanner()

    async def scenario():
        async def long_task():
            await asyncio.sleep(100)

        task = asyncio.create_task(long_task())
        scan = SocialScan(user_id="u1", kind="recon", payload={}, headers={}, profile_username="john", task=task)
        scanner._scans["u1"] = scan
        await scanner._stop_local(scan)
        return task

    task = _run(scenario())
    assert task.cancelled() or task.done()


def test_set_status_updates(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection()
    patch_collection(monkeypatch, scanner, collection)
    _run(scanner._set_status("u1", "john", "failed", "step"))
    assert collection.update_one_calls[-1][1]["$set"]["status"] == "failed"


def test_load_user_success(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection()
    patch_collection(monkeypatch, scanner, collection, user=_user())
    result = _run(scanner._load_user("507f1f77bcf86cd799439011"))
    assert result is not None


def test_load_user_error_returns_none(monkeypatch):
    scanner = make_scanner()
    collection = FakeScanCollection()
    patch_collection(monkeypatch, scanner, collection, raise_on_user=True)
    assert _run(scanner._load_user("bad-id")) is None
