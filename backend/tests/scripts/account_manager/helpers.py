from __future__ import annotations

import asyncio
from pathlib import Path
from types import SimpleNamespace

from orion.api.interactive.account_manager.account_manager import AccountManager
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, user_role
from orion.services.mongo_manager.shared_model.db_tenant_model import TenantStatus
from tests.model.fakes import FakeDoc, FakeMongoEngine


def _run(coro):
    return asyncio.run(coro)


def _make_manager(tmp_path: Path, engine: FakeMongoEngine) -> AccountManager:
    manager = object.__new__(AccountManager)
    manager._engine = engine
    manager.BASE_DIR = tmp_path
    manager.IMAGE_DIR = tmp_path / "profile"
    manager.TENANT_DIR = tmp_path / "tenant"
    manager.IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    manager.TENANT_DIR.mkdir(parents=True, exist_ok=True)
    return manager


def _make_user(**overrides):
    data = {
        "id": "507f1f77bcf86cd799439011",
        "username": "alice",
        "email": "alice@example.com",
        "password": "hashed-password",
        "role": user_role.ANALYST,
        "status": UserStatus.ACTIVE,
        "tenant_id": "507f1f77bcf86cd799439012",
        "subscription": True,
        "licenses": [LicenseName.FREE],
        "preferences": {"theme": "light-theme", "profile_visible": True},
        "twofa_enabled": True,
        "twofa_secret": "secret",
        "account_verify_at": None,
        "demo_tour": True,
    }
    data.update(overrides)
    return FakeDoc(**data)


def _make_tenant(**overrides):
    data = {
        "id": "507f1f77bcf86cd799439012",
        "status": TenantStatus.ONBOARDING,
        "is_default": False,
        "user_quota": 5,
        "profile_visibility_enabled": True,
        "alert_run_time": None,
        "name": "",
        "phone": "",
        "country": "",
        "city": "",
        "postal_code": "",
        "licenses": [],
    }
    data.update(overrides)
    return SimpleNamespace(**data)
