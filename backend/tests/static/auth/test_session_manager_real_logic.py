from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import jwt
import pytest
from fastapi import HTTPException

from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, user_role
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS
from orion.services.session_manager.session_manager import session_manager


class _FakeEngine:
    def __init__(self, user):
        self.user = user

    async def find_one(self, *_args, **_kwargs):
        return self.user

    async def save(self, _user):
        return None


class _FakeEngineRefresh:
    def __init__(self, user, maintainer_user):
        self.user = user
        self.maintainer_user = maintainer_user
        self.calls = 0
        self.saved = []

    async def find_one(self, *_args, **_kwargs):
        self.calls += 1
        if self.calls == 1:
            return self.user
        return self.maintainer_user

    async def save(self, user):
        self.saved.append(user)
        return None


class _FakeRedis:
    def __init__(self, sid=None):
        self.sid = sid
        self.calls = []

    async def invoke_trigger(self, command, payload):
        self.calls.append((command, payload))
        if command == REDIS_COMMANDS.S_GET_STRING:
            return self.sid
        if command == REDIS_COMMANDS.S_SET_STRING:
            self.sid = payload[1]
            return True
        return None


def _token(payload: dict):
    return jwt.encode(payload, CONSTANTS.S_AUTH_SECRET_KEY, algorithm=CONSTANTS.S_AUTH_ALGORITHM)


def _new_manager(user, redis_sid=None):
    sm = object.__new__(session_manager)
    sm._engine = _FakeEngine(user)
    sm._redis = _FakeRedis(sid=redis_sid)
    sm._session_ttl = 1800
    return sm


def test_get_current_user_rejects_missing_token():
    user = SimpleNamespace(username="john", role="member", id="u1", current_session_id="sid-1")
    sm = _new_manager(user)

    with pytest.raises(HTTPException) as ex:
        asyncio.run(sm.get_current_user(""))

    assert ex.value.status_code == 401


def test_get_current_user_rejects_invalid_jwt():
    user = SimpleNamespace(username="john", role="member", id="u1", current_session_id="sid-1")
    sm = _new_manager(user)

    with pytest.raises(HTTPException) as ex:
        asyncio.run(sm.get_current_user("not-a-jwt"))

    assert ex.value.status_code == 401
    assert ex.value.detail == "Invalid token"


def test_get_current_user_rejects_sid_mismatch():
    user = SimpleNamespace(username="john", role="member", id="u1", current_session_id="sid-current")
    sm = _new_manager(user, redis_sid="sid-other")

    token = _token({"sub": "john", "sid": "sid-token"})

    with pytest.raises(HTTPException) as ex:
        asyncio.run(sm.get_current_user(token))

    assert ex.value.status_code == 401
    assert "multiple active sessions" in ex.value.detail.lower()


def test_get_current_user_refreshes_redis_ttl_on_valid_session():
    user = SimpleNamespace(username="john", role="member", id="u1", current_session_id="sid-1")
    sm = _new_manager(user, redis_sid="sid-1")

    token = _token({"sub": "john", "sid": "sid-1"})
    out = asyncio.run(sm.get_current_user(token))

    assert out.username == "john"
    set_calls = [c for c in sm._redis.calls if c[0] == REDIS_COMMANDS.S_SET_STRING]
    assert set_calls
    assert set_calls[-1][1][0] == "session:u1"
    assert set_calls[-1][1][1] == "sid-1"


def test_crawler_role_bypasses_sid_checks():
    user = SimpleNamespace(username="crawler_u", role="crawler", id="u2", current_session_id="sid-current")
    sm = _new_manager(user, redis_sid="something-else")

    token = _token({"sub": "crawler_u"})
    out = asyncio.run(sm.get_current_user(token))

    assert out.username == "crawler_u"


def test_create_access_token_sets_sid_for_non_crawler():
    user = SimpleNamespace(
        username="john",
        role=user_role.MEMBER,
        id="u1",
        current_session_id=None,
    )
    sm = _new_manager(user)
    sm.get_current_role = lambda _token: asyncio.sleep(0, result=user_role.MEMBER)

    token, role = asyncio.run(sm.create_access_token({"sub": "john"}, timedelta(hours=3)))
    payload = jwt.decode(token, CONSTANTS.S_AUTH_SECRET_KEY, algorithms=[CONSTANTS.S_AUTH_ALGORITHM])

    assert role == user_role.MEMBER
    assert "sid" in payload
    assert any(c[0] == REDIS_COMMANDS.S_SET_STRING for c in sm._redis.calls)


def test_create_access_token_marks_free_token():
    user = SimpleNamespace(username="john", role=user_role.MEMBER, id="u1", current_session_id=None)
    sm = _new_manager(user)
    sm.get_current_role = lambda _token: asyncio.sleep(0, result=user_role.MEMBER)

    token, _ = asyncio.run(sm.create_access_token({"sub": "john"}, free=True))
    payload = jwt.decode(token, CONSTANTS.S_AUTH_SECRET_KEY, algorithms=[CONSTANTS.S_AUTH_ALGORITHM], options={"verify_exp": False})

    assert payload["free"] is True


def test_refresh_token_returns_same_for_free_token():
    user = SimpleNamespace(username="john", role=user_role.MEMBER, id="u1", current_session_id="sid-1")
    sm = _new_manager(user)

    token = _token({"sub": "john", "free": True})
    out = asyncio.run(sm.refresh_token(token))
    assert out["access_token"] == token
    assert out["token_type"] == "bearer"


def test_refresh_token_rejects_missing_sub():
    user = SimpleNamespace(username="john", role=user_role.MEMBER, id="u1", current_session_id="sid-1")
    sm = _new_manager(user)

    token = _token({"sid": "sid-1"})
    with pytest.raises(HTTPException) as ex:
        asyncio.run(sm.refresh_token(token))
    assert ex.value.status_code == 401
    assert ex.value.detail == "Invalid token"


def test_refresh_token_rejects_sid_mismatch_in_redis():
    user = SimpleNamespace(
        username="john",
        role=user_role.MEMBER,
        id="u1",
        tenant_uuid="507f1f77bcf86cd799439011",
        current_session_id="sid-current",
        subscription=True,
        account_verify_at=None,
        licenses=[LicenseName.FREE],
        status=UserStatus.ACTIVE,
    )
    maintainer = SimpleNamespace(account_verify_at=None)

    sm = object.__new__(session_manager)
    sm._engine = _FakeEngineRefresh(user, maintainer)
    sm._redis = _FakeRedis(sid="sid-redis")
    sm._session_ttl = 1800
    sm.has_onboarding = lambda *_: asyncio.sleep(0, result=False)

    token = _token({"sub": "john", "sid": "sid-token"})
    with pytest.raises(HTTPException) as ex:
        asyncio.run(sm.refresh_token(token))
    assert ex.value.status_code == 401
    assert ex.value.detail == "Invalid token"


def test_get_current_role_rejects_unknown_role():
    user = SimpleNamespace(username="john", role="nope", id="u1", current_session_id="sid-1", status=UserStatus.ACTIVE)
    sm = _new_manager(user, redis_sid="sid-1")
    token = _token({"sub": "john", "sid": "sid-1"})

    with pytest.raises(HTTPException) as ex:
        asyncio.run(sm.get_current_role(token))
    assert ex.value.status_code == 403


def test_get_current_status_rejects_unknown_status():
    user = SimpleNamespace(username="john", role=user_role.MEMBER, id="u1", current_session_id="sid-1", status="weird")
    sm = _new_manager(user, redis_sid="sid-1")
    token = _token({"sub": "john", "sid": "sid-1"})

    with pytest.raises(HTTPException) as ex:
        asyncio.run(sm.get_current_status(token))
    assert ex.value.status_code == 403


def test_create_temp_token_contains_twofa_claim():
    token = asyncio.run(session_manager.create_temp_token("john", ttl_minutes=5, extra={"x": 1}))
    payload = jwt.decode(token, CONSTANTS.S_AUTH_SECRET_KEY, algorithms=[CONSTANTS.S_AUTH_ALGORITHM])
    assert payload["sub"] == "john"
    assert payload["twofa"] is True
    assert payload["x"] == 1


def test_has_onboarding_false_for_empty_company_id():
    sm = object.__new__(session_manager)
    sm._engine = _FakeEngine(None)
    out = asyncio.run(sm.has_onboarding(""))
    assert out is False


def test_refresh_token_trial_expired_member_returns_402():
    user = SimpleNamespace(
        username="john",
        role=user_role.MEMBER,
        id="u1",
        tenant_uuid="507f1f77bcf86cd799439011",
        current_session_id="sid-1",
        subscription=False,
        account_verify_at=None,
        licenses=[LicenseName.FREE],
        status=UserStatus.ACTIVE,
    )
    maintainer = SimpleNamespace(account_verify_at=datetime.now(timezone.utc) - timedelta(days=40))

    sm = object.__new__(session_manager)
    sm._engine = _FakeEngineRefresh(user, maintainer)
    sm._redis = _FakeRedis(sid="sid-1")
    sm._session_ttl = 1800
    sm.has_onboarding = lambda *_: asyncio.sleep(0, result=False)

    token = _token({"sub": "john", "sid": "sid-1"})
    with pytest.raises(HTTPException) as ex:
        asyncio.run(sm.refresh_token(token))
    assert ex.value.status_code == 402


def test_generate_verification_token_returns_uuid_like_string():
    token = session_manager.generate_verification_token()
    assert isinstance(token, str)
    assert len(token) >= 32


def test_logout_user_noop_paths():
    # Current implementation is a no-op for any token value.
    assert session_manager.logout_user("") is None
    assert session_manager.logout_user("token-1") is None


def test_verify_2fa_and_issue_sets_secret_and_returns_session(monkeypatch):
    import pyotp

    user = SimpleNamespace(
        username="john",
        role=user_role.MEMBER,
        id="u1",
        tenant_uuid="507f1f77bcf86cd799439011",
        twofa_secret=None,
        twofa_enabled=False,
        subscription=True,
        account_verify_at=None,
        licenses=[LicenseName.FREE],
        status=UserStatus.ACTIVE,
    )
    sm = _new_manager(user, redis_sid="sid-1")
    sm.create_access_token = lambda *_args, **_kwargs: asyncio.sleep(0, result=("access-1", user_role.MEMBER))

    original_get_instance = session_manager.get_instance
    monkeypatch.setattr(session_manager, "get_instance", staticmethod(lambda: SimpleNamespace(has_onboarding=lambda *_: asyncio.sleep(0, result=True))))
    monkeypatch.setattr(pyotp, "TOTP", lambda _secret: SimpleNamespace(verify=lambda _code, valid_window=1: True))

    temp = asyncio.run(session_manager.create_temp_token("john", extra={"tfa_secret": "SECRET"}))
    out = asyncio.run(sm.verify_2fa_and_issue(temp, "123456"))

    monkeypatch.setattr(session_manager, "get_instance", original_get_instance)
    assert out["access_token"] == "access-1"
    assert out["session"]["hasOnboarding"] is True
    assert user.twofa_secret == "SECRET"
    assert user.twofa_enabled is True


def test_verify_2fa_and_issue_rejects_invalid_code():
    import pyotp

    user = SimpleNamespace(username="john", role=user_role.MEMBER, id="u1", tenant_uuid="507f1f77bcf86cd799439011", twofa_secret="SECRET")
    sm = _new_manager(user, redis_sid="sid-1")
    pyotp.TOTP = lambda _secret: SimpleNamespace(verify=lambda _code, valid_window=1: False)

    temp = asyncio.run(session_manager.create_temp_token("john"))
    with pytest.raises(HTTPException) as ex:
        asyncio.run(sm.verify_2fa_and_issue(temp, "000000"))
    assert ex.value.status_code == 401


def test_refresh_token_success_for_member_and_crawler_paths():
    member = SimpleNamespace(
        username="john",
        role=user_role.MEMBER,
        id="u1",
        tenant_uuid="507f1f77bcf86cd799439011",
        current_session_id="sid-1",
        subscription=True,
        account_verify_at=None,
        licenses=[LicenseName.FREE],
        status=UserStatus.ACTIVE,
    )
    maintainer = SimpleNamespace(account_verify_at=None)
    sm = object.__new__(session_manager)
    sm._engine = _FakeEngineRefresh(member, maintainer)
    sm._redis = _FakeRedis(sid="sid-1")
    sm._session_ttl = 1800
    sm.has_onboarding = lambda *_: asyncio.sleep(0, result=True)

    token = _token({"sub": "john", "sid": "sid-1"})
    out = asyncio.run(sm.refresh_token(token))
    assert out["token_type"] == "bearer"
    assert out["session"]["hasOnboarding"] is True

    crawler = SimpleNamespace(
        username="crawl",
        role=user_role.CRAWLER,
        id="u2",
        tenant_uuid="507f1f77bcf86cd799439012",
        current_session_id="sid-c",
        subscription=False,
        account_verify_at=None,
        licenses=[LicenseName.ENTERPRISE],
        status=UserStatus.ACTIVE,
    )
    crawler_maintainer = SimpleNamespace(account_verify_at=None)
    sm2 = object.__new__(session_manager)
    sm2._engine = _FakeEngineRefresh(crawler, crawler_maintainer)
    sm2._redis = _FakeRedis(sid="sid-c")
    sm2._session_ttl = 1800
    sm2.has_onboarding = lambda *_: asyncio.sleep(0, result=False)
    out2 = asyncio.run(sm2.refresh_token(_token({"sub": "crawl"})))
    assert out2["session"]["role"] == "crawler"
