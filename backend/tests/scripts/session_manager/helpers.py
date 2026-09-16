from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace

import jwt

from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, user_role
from orion.services.session_manager.session_manager import session_manager
from tests.model.fakes import FakeEngine, FakeRedis


def _run(coro):
    return asyncio.run(coro)


def _make_user(**overrides):
    data = {
        "id": "507f1f77bcf86cd799439011",
        "username": "alice",
        "role": user_role.ADMIN,
        "status": UserStatus.ACTIVE,
        "current_session_id": "sid-123",
        "tenant_id": "507f1f77bcf86cd799439012",
        "subscription": True,
        "account_verify_at": datetime.now(timezone.utc),
        "licenses": [LicenseName.MAINTAINER],
        "twofa_secret": None,
        "twofa_enabled": False,
        "password_reset_required": False,
        "password_reset_token": None,
        "password_reset_expiry": None,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def _make_manager(*, user=None, find_one_results=None):
    engine = FakeEngine(user, find_one_results=find_one_results)

    class session_manager_under_test(session_manager):
        _redis = FakeRedis()
        _session_ttl = 1800

        @property
        def _engine(self):
            return engine

    return object.__new__(session_manager_under_test)


def _token(payload):
    return jwt.encode(
        payload,
        CONSTANTS.S_AUTH_SECRET_KEY,
        algorithm=CONSTANTS.S_AUTH_ALGORITHM,
    )
