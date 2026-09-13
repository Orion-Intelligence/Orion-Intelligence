from __future__ import annotations

import asyncio
from types import SimpleNamespace

import orion.api.interactive.auth_manager.auth_manager as am_module
from orion.api.interactive.auth_manager.auth_manager import auth_manager
from tests.model.fakes import FakeMongoEngine
from tests.scripts.auth_manager.fakes import (
    FakeAuditManager,
    FakeAuthInstance,
    FakeConfigController,
    FakeMailManager,
    FakePwdContext,
    FakeSessionManager,
)


def _run(coro):
    return asyncio.run(coro)


def make_engine(find_one_results=None):
    return FakeMongoEngine(find_one_results=find_one_results or [])


def patch_mongo(monkeypatch, engine):
    monkeypatch.setattr(
        am_module.mongo_controller,
        "get_instance",
        staticmethod(lambda: SimpleNamespace(get_engine=lambda: engine)),
    )
    return engine


def patch_common(monkeypatch, verify_result=True):
    FakeSessionManager.reset()
    FakeAuditManager.reset()
    FakeMailManager.reset()
    monkeypatch.setattr(am_module, "session_manager", FakeSessionManager)
    monkeypatch.setattr(am_module, "AuditLogManager", FakeAuditManager)
    monkeypatch.setattr(am_module, "mail_manager", FakeMailManager)
    monkeypatch.setattr(am_module, "CONSTANTS", SimpleNamespace(S_AUTH_PWD_CONTEXT=FakePwdContext(verify_result)))
    monkeypatch.setattr(
        am_module.env_handler,
        "get_instance",
        staticmethod(lambda: SimpleNamespace(env=lambda key, default=None: "http://app.example.com")),
    )
    monkeypatch.setattr(am_module.TenantManager, "build_tenant_url", staticmethod(lambda app_url, tenant, path: f"{app_url}{path}"))
    monkeypatch.setattr(
        "orion.api.server.config_manager.config_controller.config_controller",
        FakeConfigController,
    )


def patch_authenticate(monkeypatch, user):
    instance = FakeAuthInstance(user)
    monkeypatch.setattr(auth_manager, "get_instance", staticmethod(lambda: instance))
    return instance


def make_instance(engine):
    manager = object.__new__(auth_manager)
    manager._engine = engine
    return manager
