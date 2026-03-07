from __future__ import annotations

import asyncio
from types import SimpleNamespace

import jwt
import pytest
from fastapi import HTTPException

from orion.constants.constant import CONSTANTS
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS
from orion.services.session_manager.session_manager import session_manager


class _FakeEngine:
    def __init__(self, user):
        self.user = user

    async def find_one(self, *_args, **_kwargs):
        return self.user

    async def save(self, _user):
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
