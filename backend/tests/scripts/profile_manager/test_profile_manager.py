from __future__ import annotations

import base64
import io
import json
import zipfile
from datetime import UTC, datetime
from types import SimpleNamespace

import pytest
from cryptography.fernet import Fernet
from fastapi import HTTPException

import orion.api.interactive.profile_manager.profile_manager as pm_module
from orion.constants.constant import CONSTANTS
from orion.api.interactive.profile_manager.model.models import (
    SocialAutomationAdDetectionResultRequest,
    SocialAutomationResultRequest,
    SocialAutomationDetectedAdModel,
    SocialAutomationPostResultRequest,
    SocialPersonaCreateRequest,
    SocialPersonaUpdateRequest,
    SocialProfileAssignmentRequest,
    SocialProfileCallbackRequest,
    SocialProfileConnectRequest,
    SocialProfileUpdateRequest,
)
from orion.api.interactive.profile_manager.profile_manager import ProfileManager
from orion.services.mongo_manager.shared_model.db_social_automation_result_model import db_social_automation_result_model
from orion.services.mongo_manager.shared_model.db_social_profile_management_model import (
    ManagedSocialProfile,
    SocialPersona,
    SocialPersonaAgeGroup,
    SocialPersonaGender,
    SocialProfileAssignmentStatus,
    SocialProfileConnectionStatus,
    SocialProfilePurpose,
    db_social_profile_management_model,
)
from orion.services.mongo_manager.shared_model.db_social_session_model import db_social_session_model
from tests.model.fakes import FakeMongoEngine
from tests.scripts.profile_manager.helpers import (
    DupSaveEngine,
    FakeSocketManager,
    _make_key_manager,
    _make_manager,
    _make_user,
    _null_log,
    _run,
)


def _patch_socket(monkeypatch, fake_socket):
    monkeypatch.setattr(pm_module, "extension_socket_manager", SimpleNamespace(get_instance=lambda: fake_socket))


def _patch_key_manager(monkeypatch):
    fake_km, key = _make_key_manager()
    monkeypatch.setattr(pm_module, "KeyManager", fake_km)
    return key


def _patch_log(monkeypatch):
    monkeypatch.setattr(pm_module, "log", _null_log())


def _session_record(**overrides):
    data = {
        "user_id": "507f1f77bcf86cd799439011",
        "platform": "facebook",
        "session_id": "sess-1",
        "file_name": "sess-1.enc",
        "byte_size": 10,
        "username": "alice",
    }
    data.update(overrides)
    return db_social_session_model(**data)


def _profile(**overrides):
    data = {
        "profile_id": "prof-1",
        "platform": "facebook",
        "purposes": [],
        "session_id": None,
    }
    data.update(overrides)
    return ManagedSocialProfile(**data)


def _persona(**overrides):
    data = {
        "persona_id": "pers-1",
        "name": "Persona",
        "age_group": SocialPersonaAgeGroup.AGE_18_24,
    }
    data.update(overrides)
    return SocialPersona(**data)


def test_user_key_and_safe_platform_and_adult_status():
    manager = _make_manager(FakeMongoEngine())
    assert manager._user_key(SimpleNamespace(id="abc")) == "abc"
    assert manager._user_key(SimpleNamespace(id=None)) == ""
    assert manager._safe_platform("Face Book!") == "facebook"
    assert manager._adult_status(SocialPersonaAgeGroup.AGE_13_17) is False
    assert manager._adult_status(SocialPersonaAgeGroup.AGE_25_34) is True


def test_validate_interests_limit():
    manager = _make_manager(FakeMongoEngine())
    manager._validate_interests(["a", "b", "c"])
    with pytest.raises(HTTPException) as exc:
        manager._validate_interests(["a", "b", "c", "d"])
    assert exc.value.status_code == 400


def test_find_persona_and_profile_raise_when_missing():
    manager = _make_manager(FakeMongoEngine())
    record = db_social_profile_management_model(user_id="u")
    with pytest.raises(HTTPException) as exc1:
        manager._find_persona(record, "nope")
    assert exc1.value.status_code == 404
    with pytest.raises(HTTPException) as exc2:
        manager._find_profile(record, "nope")
    assert exc2.value.status_code == 404


def test_tenant_cipher_uses_key_manager(monkeypatch):
    key = _patch_key_manager(monkeypatch)
    manager = _make_manager(FakeMongoEngine())
    cipher = _run(manager._tenant_cipher(_make_user()))
    token = cipher.encrypt(b"hello")
    assert Fernet(key).decrypt(token) == b"hello"


def test_list_platforms_pending_without_user_key():
    manager = _make_manager(FakeMongoEngine())
    assert _run(manager.list_platforms(SimpleNamespace(id=""))) == {"status": "pending"}


def test_list_platforms_fires_when_no_reply(monkeypatch):
    fake_socket = FakeSocketManager(reply=None)
    _patch_socket(monkeypatch, fake_socket)
    manager = _make_manager(FakeMongoEngine())
    assert _run(manager.list_platforms(_make_user())) == {"status": "pending"}
    assert fake_socket.fired


def test_list_platforms_returns_error(monkeypatch):
    _patch_socket(monkeypatch, FakeSocketManager(reply={"error": "boom"}))
    manager = _make_manager(FakeMongoEngine())
    assert _run(manager.list_platforms(_make_user())) == {"error": "boom"}


def test_list_platforms_returns_items(monkeypatch):
    _patch_socket(monkeypatch, FakeSocketManager(reply={"implemented": True, "items": [{"id": "x"}]}))
    manager = _make_manager(FakeMongoEngine())
    assert _run(manager.list_platforms(_make_user())) == {"result": {"items": [{"id": "x"}]}}


def test_extract_session_file_variants():
    assert ProfileManager.extract_session_file({"error": "e"}) == (None, {"error": "e"})
    assert ProfileManager.extract_session_file({"implemented": True, "items": []})[1] == {"error": "no_session_data"}
    assert ProfileManager.extract_session_file({"implemented": True, "items": ["bad"]})[1] == {"error": "no_session_data"}
    good = {"implemented": True, "items": [{"zip_base64": "AAA"}]}
    session_file, error = ProfileManager.extract_session_file(good)
    assert error is None
    assert session_file["zip_base64"] == "AAA"


def test_capture_session_pending_without_user_key():
    manager = _make_manager(FakeMongoEngine())
    assert _run(manager.capture_session(SimpleNamespace(id=""), "facebook", "http://x")) == {"status": "pending"}


def test_capture_session_fires_when_no_reply_and_under_limit(monkeypatch):
    fake_socket = FakeSocketManager(reply=None)
    _patch_socket(monkeypatch, fake_socket)
    engine = FakeMongoEngine()
    engine.count_result = 0
    manager = _make_manager(engine)
    result = _run(manager.capture_session(_make_user(), "Facebook", "http://x"))
    assert result == {"status": "pending"}
    assert fake_socket.fired


def test_capture_session_session_limit(monkeypatch):
    _patch_socket(monkeypatch, FakeSocketManager(reply=None))
    engine = FakeMongoEngine()
    engine.count_result = 999
    manager = _make_manager(engine)
    result = _run(manager.capture_session(_make_user(), "facebook", "http://x"))
    assert result == {"error": "session_limit"}


def test_capture_session_edit_seeds_command(monkeypatch):
    fake_socket = FakeSocketManager(reply=None)
    _patch_socket(monkeypatch, fake_socket)
    record = _session_record()
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)

    async def fake_state(*_a, **_k):
        return {"url": "http://seed", "cookies": [{"name": "c"}]}

    manager._read_session_state = fake_state
    result = _run(manager.capture_session(_make_user(), "facebook", "http://x", session_id="sess-1"))
    assert result == {"status": "pending"}
    _, command = fake_socket.fired[0]
    assert command["url"] == "http://seed"
    assert "payload" in command


def test_capture_session_edit_without_state(monkeypatch):
    fake_socket = FakeSocketManager(reply=None)
    _patch_socket(monkeypatch, fake_socket)
    record = _session_record()
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)

    async def fake_state(*_a, **_k):
        return None

    manager._read_session_state = fake_state
    result = _run(manager.capture_session(_make_user(), "facebook", "http://x", session_id="sess-1"))
    assert result == {"status": "pending"}


def test_capture_session_reply_error(monkeypatch):
    _patch_socket(monkeypatch, FakeSocketManager(reply={"error": "denied"}))
    manager = _make_manager(FakeMongoEngine())
    assert _run(manager.capture_session(_make_user(), "facebook", "http://x")) == {"error": "denied"}


def _zip_b64(payload):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as archive:
        archive.writestr("session.json", json.dumps(payload))
    return base64.b64encode(buf.getvalue()).decode("ascii")


def test_capture_session_saves_new_record(monkeypatch, tmp_path):
    monkeypatch.setattr(CONSTANTS, "S_SESSION_RESOURCE_DIR", tmp_path)
    _patch_key_manager(monkeypatch)
    reply = {"implemented": True, "items": [{"zip_base64": _zip_b64({"cookies": []}), "username": "bob"}]}
    _patch_socket(monkeypatch, FakeSocketManager(reply=reply))
    engine = FakeMongoEngine()
    manager = _make_manager(engine)
    result = _run(manager.capture_session(_make_user(), "Facebook", "http://x"))
    assert result["result"]["saved"] is True
    assert engine.saved
    saved = engine.saved[0]
    assert saved.username == "bob"


def test_capture_session_updates_existing_record(monkeypatch, tmp_path):
    monkeypatch.setattr(CONSTANTS, "S_SESSION_RESOURCE_DIR", tmp_path)
    _patch_key_manager(monkeypatch)
    reply = {"implemented": True, "items": [{"zip_base64": _zip_b64({"cookies": []}), "username": "new"}]}
    _patch_socket(monkeypatch, FakeSocketManager(reply=reply))
    record = _session_record(session_id="sess-9")
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    result = _run(manager.capture_session(_make_user(), "facebook", "http://x", session_id="sess-9"))
    assert result["result"]["session_id"] == "sess-9"
    assert record.username == "new"
    assert record.verified is False


def test_capture_session_store_failure(monkeypatch, tmp_path):
    monkeypatch.setattr(CONSTANTS, "S_SESSION_RESOURCE_DIR", tmp_path)
    _patch_key_manager(monkeypatch)
    reply = {"implemented": True, "items": [{"zip_base64": "not-valid-base64-!!!"}]}
    _patch_socket(monkeypatch, FakeSocketManager(reply=reply))
    manager = _make_manager(FakeMongoEngine())
    result = _run(manager.capture_session(_make_user(), "facebook", "http://x"))
    assert result == {"error": "session_store_failed"}


def test_verify_session_without_user_key():
    manager = _make_manager(FakeMongoEngine())
    result = _run(manager.verify_session(SimpleNamespace(id=""), "facebook", "http://x", "s"))
    assert result == {"error": "no_session_data"}


def test_verify_session_record_missing(monkeypatch):
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    result = _run(manager.verify_session(_make_user(), "facebook", "http://x", "s"))
    assert result == {"error": "no_session_data"}


def test_verify_session_extension_required(monkeypatch):
    _patch_log(monkeypatch)
    fake_socket = FakeSocketManager(reply=None, live=False)
    _patch_socket(monkeypatch, fake_socket)
    record = _session_record()
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    result = _run(manager.verify_session(_make_user(), "facebook", "http://x", "sess-1"))
    assert result == {"error": "extension_required"}
    assert record.verify_error == "extension_required"


def test_verify_session_unreadable(monkeypatch):
    fake_socket = FakeSocketManager(reply=None, live=True)
    _patch_socket(monkeypatch, fake_socket)
    record = _session_record()
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)

    async def fake_state(*_a, **_k):
        return None

    manager._read_session_state = fake_state
    result = _run(manager.verify_session(_make_user(), "facebook", "http://x", "sess-1"))
    assert result == {"error": "session_unreadable"}


def test_verify_session_fires_when_readable(monkeypatch):
    fake_socket = FakeSocketManager(reply=None, live=True)
    _patch_socket(monkeypatch, fake_socket)
    record = _session_record()
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)

    async def fake_state(*_a, **_k):
        return {"url": "http://seed", "cookies": []}

    manager._read_session_state = fake_state
    result = _run(manager.verify_session(_make_user(), "facebook", "", "sess-1"))
    assert result == {"status": "pending"}
    assert fake_socket.fired


def test_verify_session_duplicate_user(monkeypatch):
    reply = {"implemented": True, "items": [{"username": "dup"}]}
    _patch_socket(monkeypatch, FakeSocketManager(reply=reply))
    record = _session_record(session_id="sess-1")
    duplicate = _session_record(session_id="sess-2")
    engine = FakeMongoEngine(find_one_results=[record, duplicate])
    manager = _make_manager(engine)
    result = _run(manager.verify_session(_make_user(), "facebook", "http://x", "sess-1"))
    assert result == {"error": "user_already_exists"}


def test_verify_session_success(monkeypatch):
    reply = {"implemented": True, "items": [{"username": "alice"}]}
    _patch_socket(monkeypatch, FakeSocketManager(reply=reply))
    record = _session_record(session_id="sess-1")
    engine = FakeMongoEngine(find_one_results=[record, None])
    manager = _make_manager(engine)
    result = _run(manager.verify_session(_make_user(), "facebook", "http://x", "sess-1"))
    assert result["result"]["verified"] is True
    assert record.verified is True


def test_verify_session_not_verified(monkeypatch):
    reply = {"implemented": False, "items": [], "error": ""}
    _patch_socket(monkeypatch, FakeSocketManager(reply=reply))
    record = _session_record(session_id="sess-1")
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    result = _run(manager.verify_session(_make_user(), "facebook", "http://x", "sess-1"))
    assert result["result"]["verified"] is False


def test_read_session_state_file_roundtrip(tmp_path):
    key = Fernet.generate_key()
    cipher = Fernet(key)
    path = tmp_path / "session.enc"
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as archive:
        archive.writestr("session.json", json.dumps({"cookies": [{"name": "a"}, {"noname": 1}, "bad"], "url": "http://x"}))
    path.write_bytes(cipher.encrypt(buf.getvalue()))
    state = ProfileManager.read_session_state_file(path, cipher)
    assert state["cookies"] == [{"name": "a"}]


def test_read_session_state_file_missing(tmp_path):
    cipher = Fernet(Fernet.generate_key())
    assert ProfileManager.read_session_state_file(tmp_path / "nope.enc", cipher) is None


def test_read_session_state_file_bad_payload(tmp_path):
    cipher = Fernet(Fernet.generate_key())
    path = tmp_path / "bad.enc"
    path.write_bytes(b"not-a-fernet-token")
    assert ProfileManager.read_session_state_file(path, cipher) is None


def test_read_session_state_delegates(monkeypatch, tmp_path):
    monkeypatch.setattr(CONSTANTS, "S_SESSION_RESOURCE_DIR", tmp_path)
    key = _patch_key_manager(monkeypatch)
    cipher = Fernet(key)
    path = tmp_path / "u" / "facebook" / "f.enc"
    path.parent.mkdir(parents=True)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as archive:
        archive.writestr("session.json", json.dumps({"cookies": [], "url": "http://z"}))
    path.write_bytes(cipher.encrypt(buf.getvalue()))
    manager = _make_manager(FakeMongoEngine())
    state = _run(manager._read_session_state(_make_user(), "u", "facebook", "f.enc"))
    assert state["url"] == "http://z"


def test_seed_payload_with_origins():
    state = {
        "origins": [{"indexedDB": {"a": 1}}],
        "cookies": [{"name": "c"}],
        "localStorage": {"k": "v"},
        "userAgent": "UA",
    }
    payload = ProfileManager._seed_payload(state)
    assert payload["indexedDB"] == {"a": 1}
    assert payload["userAgent"] == "UA"
    assert payload["cookies"] == [{"name": "c"}]


def test_seed_payload_defaults():
    payload = ProfileManager._seed_payload({})
    assert payload["cookies"] == []
    assert payload["indexedDB"] == {}


def test_get_all_social_profile_records():
    record = db_social_profile_management_model(user_id="u")
    manager = _make_manager(FakeMongoEngine(records=[record]))
    assert _run(manager.get_all_social_profile_records()) == [record]


def test_get_user_for_social_record_success():
    engine = FakeMongoEngine(find_one_results=[SimpleNamespace(id="x")])
    manager = _make_manager(engine)
    record = SimpleNamespace(user_id="507f1f77bcf86cd799439011")
    assert _run(manager.get_user_for_social_record(record)).id == "x"


def test_get_user_for_social_record_bad_id():
    manager = _make_manager(FakeMongoEngine())
    record = SimpleNamespace(user_id="not-an-object-id")
    assert _run(manager.get_user_for_social_record(record)) is None


def test_read_profile_session_state_no_session():
    manager = _make_manager(FakeMongoEngine())
    profile = _profile(session_id=None)
    assert _run(manager.read_profile_session_state(_make_user(), profile)) is None


def test_read_profile_session_state_missing_session_record():
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    profile = _profile(session_id="sess-1")
    assert _run(manager.read_profile_session_state(_make_user(), profile)) is None


def test_read_profile_session_state_prunes_orphan(monkeypatch, tmp_path):
    monkeypatch.setattr(CONSTANTS, "S_SESSION_RESOURCE_DIR", tmp_path)
    _patch_log(monkeypatch)
    session = _session_record()
    engine = FakeMongoEngine(find_one_results=[session], records=[session])
    manager = _make_manager(engine)
    profile = _profile(session_id="sess-1")
    assert _run(manager.read_profile_session_state(_make_user(), profile)) is None
    assert session in engine.deleted


def test_read_profile_session_state_unreadable(monkeypatch, tmp_path):
    monkeypatch.setattr(CONSTANTS, "S_SESSION_RESOURCE_DIR", tmp_path)
    _patch_log(monkeypatch)
    session = _session_record()
    session_path = tmp_path / "507f1f77bcf86cd799439011" / "facebook" / "sess-1.enc"
    session_path.parent.mkdir(parents=True)
    session_path.write_bytes(b"garbage")
    engine = FakeMongoEngine(find_one_results=[session])
    manager = _make_manager(engine)

    async def fake_state(*_a, **_k):
        return None

    manager._read_session_state = fake_state
    profile = _profile(session_id="sess-1")
    assert _run(manager.read_profile_session_state(_make_user(), profile)) is None


def test_read_profile_session_state_returns_state(monkeypatch, tmp_path):
    monkeypatch.setattr(CONSTANTS, "S_SESSION_RESOURCE_DIR", tmp_path)
    session = _session_record()
    session_path = tmp_path / "507f1f77bcf86cd799439011" / "facebook" / "sess-1.enc"
    session_path.parent.mkdir(parents=True)
    session_path.write_bytes(b"garbage")
    engine = FakeMongoEngine(find_one_results=[session])
    manager = _make_manager(engine)

    async def fake_state(*_a, **_k):
        return {"url": "http://x"}

    manager._read_session_state = fake_state
    profile = _profile(session_id="sess-1")
    assert _run(manager.read_profile_session_state(_make_user(), profile)) == {"url": "http://x"}


def test_prune_orphan_session_handles_exception(monkeypatch):
    _patch_log(monkeypatch)

    class BoomEngine(FakeMongoEngine):
        async def delete(self, model):
            raise RuntimeError("boom")

    manager = _make_manager(BoomEngine())
    session = _session_record()
    _run(manager._prune_orphan_session(session, "path"))


def test_store_verification_returns_result(monkeypatch):
    engine = FakeMongoEngine()
    manager = _make_manager(engine)
    record = _session_record()
    result = _run(manager._store_verification(record, True, "carol", ""))
    assert result["result"]["username"] == "carol"
    assert engine.saved


def test_store_verification_returns_error():
    manager = _make_manager(FakeMongoEngine())
    record = _session_record()
    result = _run(manager._store_verification(record, False, "", "bad"))
    assert result == {"error": "bad"}


def test_list_sessions_groups_and_sorts():
    older = _session_record(session_id="a", platform="facebook")
    newer = _session_record(session_id="b", platform="facebook", verified=True, verified_at=datetime.now(UTC))
    manager = _make_manager(FakeMongoEngine(records=[older, newer]))
    result = _run(manager.list_sessions(_make_user()))
    platforms = result["result"]["platforms"]
    assert set(platforms["facebook"][0].keys()) >= {"id", "capturedAt", "username", "verified", "verifiedAt"}


def test_delete_session_no_record():
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    assert _run(manager.delete_session(_make_user(), "facebook", "sess-1")) == {"result": {"deleted": True}}


def test_delete_session_removes_and_disconnects_profile(tmp_path, monkeypatch):
    monkeypatch.setattr(CONSTANTS, "S_SESSION_RESOURCE_DIR", tmp_path)
    session = _session_record(session_id="sess1")
    path = tmp_path / "507f1f77bcf86cd799439011" / "facebook" / "sess-1.enc"
    path.parent.mkdir(parents=True)
    path.write_bytes(b"x")
    profile = _profile(session_id="sess1", connection_status=SocialProfileConnectionStatus.CONNECTED)
    social = db_social_profile_management_model(user_id="u", profiles=[profile])
    engine = FakeMongoEngine(find_one_results=[session, social])
    manager = _make_manager(engine)
    result = _run(manager.delete_session(_make_user(), "facebook", "sess1"))
    assert result == {"result": {"deleted": True}}
    assert session in engine.deleted
    assert profile.session_id is None
    assert profile.connection_status == SocialProfileConnectionStatus.DISCONNECTED


def test_delete_session_no_social_record():
    session = _session_record(session_id="sess1")
    engine = FakeMongoEngine(find_one_results=[session, None])
    manager = _make_manager(engine)
    result = _run(manager.delete_session(_make_user(), "facebook", "sess1"))
    assert result == {"result": {"deleted": True}}


def test_create_persona_success():
    engine = FakeMongoEngine(find_one_results=[db_social_profile_management_model(user_id="u")])
    manager = _make_manager(engine)
    data = SocialPersonaCreateRequest(name="  Ada  ", age_group=SocialPersonaAgeGroup.AGE_25_34, interests=["ai"])
    response = _run(manager.create_persona(_make_user(), data))
    assert response.name == "Ada"
    assert response.adult_status is True


def test_create_persona_blank_name():
    engine = FakeMongoEngine(find_one_results=[db_social_profile_management_model(user_id="u")])
    manager = _make_manager(engine)
    data = SocialPersonaCreateRequest(name="   ", age_group=SocialPersonaAgeGroup.AGE_25_34)
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_persona(_make_user(), data))
    assert exc.value.status_code == 400


def test_get_personas_empty():
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    result = _run(manager.get_personas(_make_user()))
    assert result.personas == []


def test_get_personas_returns_list():
    record = db_social_profile_management_model(user_id="u", personas=[_persona()])
    manager = _make_manager(FakeMongoEngine(find_one_results=[record]))
    result = _run(manager.get_personas(_make_user()))
    assert len(result.personas) == 1


def test_update_persona_all_fields():
    persona = _persona()
    record = db_social_profile_management_model(user_id="u", personas=[persona])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = SocialPersonaUpdateRequest(
        name="New",
        age_group=SocialPersonaAgeGroup.AGE_13_17,
        gender=SocialPersonaGender.FEMALE,
        country="  US  ",
        city="  NY  ",
        interests=["a"],
    )
    response = _run(manager.update_persona(_make_user(), "pers-1", data))
    assert response.name == "New"
    assert response.country == "US"
    assert response.adult_status is False


def test_update_persona_blank_name():
    persona = _persona()
    record = db_social_profile_management_model(user_id="u", personas=[persona])
    manager = _make_manager(FakeMongoEngine(find_one_results=[record]))
    data = SocialPersonaUpdateRequest(name="   ")
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_persona(_make_user(), "pers-1", data))
    assert exc.value.status_code == 400


def test_delete_persona_unassigns_profiles():
    persona = _persona()
    profile = _profile(assigned_persona_id="pers-1", assignment_status=SocialProfileAssignmentStatus.ASSIGNED)
    record = db_social_profile_management_model(user_id="u", personas=[persona], profiles=[profile])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    result = _run(manager.delete_persona(_make_user(), "pers-1"))
    assert result == {"message": "Persona deleted successfully"}
    assert record.personas == []
    assert profile.assigned_persona_id is None


def test_connect_profile_success():
    session = _session_record(session_id="sess-1")
    record = db_social_profile_management_model(user_id="u")
    engine = FakeMongoEngine(find_one_results=[record, session])
    manager = _make_manager(engine)
    data = SocialProfileConnectRequest(platform="Facebook", session_id="sess-1", profile_name="  P  ", purposes=[SocialProfilePurpose.POSTING])
    response = _run(manager.connect_profile(_make_user(), data))
    assert response.connection_status == SocialProfileConnectionStatus.CONNECTED
    assert response.profile_name == "P"


def test_get_profiles_empty():
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    assert _run(manager.get_profiles(_make_user())).profiles == []


def test_get_profiles_returns_list():
    record = db_social_profile_management_model(user_id="u", profiles=[_profile()])
    manager = _make_manager(FakeMongoEngine(find_one_results=[record]))
    assert len(_run(manager.get_profiles(_make_user())).profiles) == 1


def test_update_profile_fields_and_session():
    session = _session_record(session_id="sess-2")
    profile = _profile(profile_id="prof-1", session_id=None)
    record = db_social_profile_management_model(user_id="u", profiles=[profile])
    engine = FakeMongoEngine(find_one_results=[record, session])
    manager = _make_manager(engine)
    data = SocialProfileUpdateRequest(
        profile_name="  N  ",
        profile_username="  U  ",
        connection_status=SocialProfileConnectionStatus.FAILED,
        session_id="sess-2",
        purposes=[SocialProfilePurpose.AD_MONITORING],
    )
    response = _run(manager.update_profile(_make_user(), "prof-1", data))
    assert response.session_id == "sess-2"
    assert response.connection_status == SocialProfileConnectionStatus.CONNECTED


def test_delete_profile():
    profile = _profile()
    record = db_social_profile_management_model(user_id="u", profiles=[profile])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    result = _run(manager.delete_profile(_make_user(), "prof-1"))
    assert result == {"message": "Social profile deleted successfully"}
    assert record.profiles == []


def test_assign_profile_success():
    persona = _persona()
    profile = _profile(profile_id="prof-1")
    record = db_social_profile_management_model(user_id="u", personas=[persona], profiles=[profile])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = SocialProfileAssignmentRequest(persona_id="pers-1", profile_id="prof-1")
    response = _run(manager.assign_profile(_make_user(), data))
    assert response.profile.assigned_persona_id == "pers-1"


def test_assign_profile_duplicate_on_platform():
    persona = _persona()
    other = _profile(profile_id="prof-2", assigned_persona_id="pers-1", platform="facebook")
    profile = _profile(profile_id="prof-1", platform="facebook")
    record = db_social_profile_management_model(user_id="u", personas=[persona], profiles=[other, profile])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = SocialProfileAssignmentRequest(persona_id="pers-1", profile_id="prof-1")
    with pytest.raises(HTTPException) as exc:
        _run(manager.assign_profile(_make_user(), data))
    assert exc.value.status_code == 400


def test_remove_assignment():
    profile = _profile(assigned_persona_id="pers-1", assignment_status=SocialProfileAssignmentStatus.ASSIGNED)
    record = db_social_profile_management_model(user_id="u", profiles=[profile])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    response = _run(manager.remove_assignment(_make_user(), "prof-1"))
    assert response.profile.assigned_persona_id is None


def test_callback_platform_mismatch():
    profile = _profile(platform="facebook")
    record = db_social_profile_management_model(user_id="u", profiles=[profile])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = SocialProfileCallbackRequest(profile_id="prof-1", platform="instagram")
    with pytest.raises(HTTPException) as exc:
        _run(manager.callback(_make_user(), data))
    assert exc.value.status_code == 400


def test_callback_success():
    profile = _profile(platform="facebook")
    record = db_social_profile_management_model(user_id="u", profiles=[profile])
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = SocialProfileCallbackRequest(profile_id="prof-1", platform="Facebook")
    response = _run(manager.callback(_make_user(), data))
    assert response.connection_status == SocialProfileConnectionStatus.PENDING


def test_store_automation_result_post(monkeypatch):
    record = db_social_automation_result_model(user_id="u1")
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    post = SocialAutomationPostResultRequest(profile_id="prof-1", post_url="http://p", session_expired=False)
    data = SocialAutomationResultRequest(user_id="u1", profile_id="prof-1", result_type="post", post_result=post)
    result = _run(manager.store_automation_result(data))
    assert result == {"status": "success"}
    assert len(record.post_results) == 1


def test_store_automation_result_ad_detection_expires_session(monkeypatch):
    _patch_log(monkeypatch)
    result_record = db_social_automation_result_model(user_id="u1")
    profile = _profile(profile_id="prof-1", session_id="sess-1", platform="facebook")
    social = db_social_profile_management_model(user_id="u1", profiles=[profile])
    session = _session_record(session_id="sess-1")
    engine = FakeMongoEngine(find_one_results=[result_record, social, session])
    manager = _make_manager(engine)
    ad = SocialAutomationDetectedAdModel(url="http://ad")
    ad_result = SocialAutomationAdDetectionResultRequest(profile_id="prof-1", total_detected_ads=1, ads=[ad], session_expired=True)
    data = SocialAutomationResultRequest(user_id="u1", profile_id="prof-1", result_type="ad_detection", ad_detection_result=ad_result)
    result = _run(manager.store_automation_result(data))
    assert result == {"status": "success"}
    assert len(result_record.ad_detection_results) == 1
    assert session.verified is False


def test_store_automation_result_unknown_type(monkeypatch):
    _patch_log(monkeypatch)
    record = db_social_automation_result_model(user_id="u1")
    engine = FakeMongoEngine(find_one_results=[record])
    manager = _make_manager(engine)
    data = SocialAutomationResultRequest(user_id="u1", profile_id="prof-1", result_type="mystery")
    result = _run(manager.store_automation_result(data))
    assert result == {"status": "ignored"}


def test_get_or_create_automation_result_creates(monkeypatch):
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    record = _run(manager._get_or_create_automation_result_record("u1"))
    assert record.user_id == "u1"
    assert engine.saved


def test_get_or_create_automation_result_duplicate_then_found(monkeypatch):
    existing = db_social_automation_result_model(user_id="u1")
    engine = DupSaveEngine(find_one_results=[None, existing], save_exc_times=1)
    manager = _make_manager(engine)
    record = _run(manager._get_or_create_automation_result_record("u1"))
    assert record is existing


def test_get_or_create_automation_result_duplicate_then_raises(monkeypatch):
    engine = DupSaveEngine(find_one_results=[None, None], save_exc_times=1)
    manager = _make_manager(engine)
    with pytest.raises(Exception):
        _run(manager._get_or_create_automation_result_record("u1"))


def test_invalidate_profile_session_no_record():
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    _run(manager._invalidate_profile_session("u1", "prof-1"))


def test_invalidate_profile_session_profile_without_session():
    profile = _profile(profile_id="prof-1", session_id=None)
    social = db_social_profile_management_model(user_id="u1", profiles=[profile])
    manager = _make_manager(FakeMongoEngine(find_one_results=[social]))
    _run(manager._invalidate_profile_session("u1", "prof-1"))


def test_invalidate_profile_session_session_missing():
    profile = _profile(profile_id="prof-1", session_id="sess-1")
    social = db_social_profile_management_model(user_id="u1", profiles=[profile])
    engine = FakeMongoEngine(find_one_results=[social, None])
    manager = _make_manager(engine)
    _run(manager._invalidate_profile_session("u1", "prof-1"))


def test_invalidate_profile_session_marks_unverified(monkeypatch):
    _patch_log(monkeypatch)
    profile = _profile(profile_id="prof-1", session_id="sess-1", platform="facebook")
    social = db_social_profile_management_model(user_id="u1", profiles=[profile])
    session = _session_record(session_id="sess-1", verified=True)
    engine = FakeMongoEngine(find_one_results=[social, session])
    manager = _make_manager(engine)
    _run(manager._invalidate_profile_session("u1", "prof-1"))
    assert session.verified is False


def test_get_profile_results_no_record():
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))
    with pytest.raises(HTTPException) as exc:
        _run(manager.get_profile_results(_make_user(), "prof-1"))
    assert exc.value.status_code == 404


def test_get_profile_results_no_results():
    profile = _profile(profile_id="prof-1")
    record = db_social_profile_management_model(user_id="u", profiles=[profile])
    engine = FakeMongoEngine(find_one_results=[record, None])
    manager = _make_manager(engine)
    response = _run(manager.get_profile_results(_make_user(), "prof-1"))
    assert response.profile_id == "prof-1"
    assert response.post_results == []


def test_get_profile_results_sorted():
    profile = _profile(profile_id="prof-1")
    record = db_social_profile_management_model(user_id="u", profiles=[profile])
    results = db_social_automation_result_model(user_id="u")
    from orion.services.mongo_manager.shared_model.db_social_automation_result_model import SocialPostResult
    results.post_results = [
        SocialPostResult(profile_id="prof-1", date_time=datetime(2026, 1, 1, tzinfo=UTC)),
        SocialPostResult(profile_id="prof-1", date_time=datetime(2026, 2, 1, tzinfo=UTC)),
        SocialPostResult(profile_id="other", date_time=datetime(2026, 3, 1, tzinfo=UTC)),
    ]
    engine = FakeMongoEngine(find_one_results=[record, results])
    manager = _make_manager(engine)
    response = _run(manager.get_profile_results(_make_user(), "prof-1"))
    assert len(response.post_results) == 2
    assert response.post_results[0].date_time > response.post_results[1].date_time


def test_get_or_create_social_record_creates_new():
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    record = _run(manager._get_or_create_social_record(_make_user()))
    assert record.user_id == "507f1f77bcf86cd799439011"
    assert engine.saved


def test_get_or_create_social_record_duplicate_then_found():
    existing = db_social_profile_management_model(user_id="u")
    engine = DupSaveEngine(find_one_results=[None, existing], save_exc_times=1)
    manager = _make_manager(engine)
    record = _run(manager._get_or_create_social_record(_make_user()))
    assert record is existing


def test_get_or_create_social_record_duplicate_then_raises():
    engine = DupSaveEngine(find_one_results=[None, None], save_exc_times=1)
    manager = _make_manager(engine)
    with pytest.raises(Exception):
        _run(manager._get_or_create_social_record(_make_user()))


def test_validate_profile_session_requires_session():
    manager = _make_manager(FakeMongoEngine())
    record = db_social_profile_management_model(user_id="u")
    with pytest.raises(HTTPException) as exc:
        _run(manager._validate_profile_session(_make_user(), record, "facebook", None))
    assert exc.value.status_code == 400


def test_validate_profile_session_duplicate_in_profiles():
    manager = _make_manager(FakeMongoEngine())
    profile = _profile(profile_id="prof-9", session_id="sess-1")
    record = db_social_profile_management_model(user_id="u", profiles=[profile])
    with pytest.raises(HTTPException) as exc:
        _run(manager._validate_profile_session(_make_user(), record, "facebook", "sess-1"))
    assert exc.value.status_code == 400


def test_validate_profile_session_session_not_found():
    engine = FakeMongoEngine(find_one_results=[None])
    manager = _make_manager(engine)
    record = db_social_profile_management_model(user_id="u")
    with pytest.raises(HTTPException) as exc:
        _run(manager._validate_profile_session(_make_user(), record, "facebook", "sess-1"))
    assert exc.value.status_code == 404
