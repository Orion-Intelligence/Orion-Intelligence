from __future__ import annotations

from contextlib import nullcontext

import asyncio
from types import SimpleNamespace

from cryptography.fernet import Fernet

from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
from orion.helper_manager.env_handler import env_handler
from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.mongo_manager.shared_model.db_tenant_model import (
    IocCategory,
    TenantStatus,
    db_tenant_model,
)
from tests.scripts.tenant_manager.fakes import (
    DEK,
    FakeAccount,
    FakeAlertManager,
    FakeAudit,
    FakeConfig,
    FakeKeyManager,
    FakeMail,
    FakeResource,
    ModelEngine,
)


def _run(coro):
    return asyncio.run(coro)


def enc():
    return Fernet(DEK)


def _e(value):
    return Fernet(DEK).encrypt((value or "").encode()).decode()


def _make_manager(engine=None):
    manager = object.__new__(TenantManager)
    manager._engine = engine if engine is not None else ModelEngine()
    return manager


def _enc_ioc(ioc_id, name, values):
    cipher = Fernet(DEK)
    return IocCategory(
        ioc_id=cipher.encrypt(ioc_id.encode()).decode(),
        name=cipher.encrypt(name.encode()).decode(),
        values=[cipher.encrypt(v.encode()).decode() for v in values],
    )


def _make_tenant(**overrides):
    data = dict(
        name=_e("Acme"),
        phone=_e("123"),
        country=_e("US"),
        city=_e("NYC"),
        postal_code=_e("10001"),
        email=_e("user@acme.com"),
        licenses=[_e("free")],
        iocs=[],
        is_default=False,
        status=TenantStatus.ONBOARDING,
        user_quota=5,
        slug="acme",
    )
    data.update(overrides)
    return db_tenant_model(**data)


def _set_env(monkeypatch, **values):
    env_vars = env_handler.get_instance()._env_vars
    for key, value in values.items():
        monkeypatch.setitem(env_vars, key, value)


def _patch_managers(monkeypatch, *, config_cached="1", account=None, resource=None, mail=None, engine=None):
    key_manager = FakeKeyManager()
    mail_manager = mail or FakeMail()
    config = FakeConfig(config_cached)
    audit = FakeAudit()
    alerts = FakeAlertManager()
    account_manager = account or FakeAccount()
    resource_manager = resource or FakeResource()

    monkeypatch.setattr(KeyManager, "get_instance", staticmethod(lambda: key_manager))
    monkeypatch.setattr(TenantManager, "quota_lock", staticmethod(lambda tenant: nullcontext()))
    monkeypatch.setattr(
        "orion.services.mail_manager.mail_manager.mail_manager.get_instance",
        staticmethod(lambda: mail_manager),
    )
    monkeypatch.setattr(
        "orion.api.server.config_manager.config_controller.config_controller.getInstance",
        staticmethod(lambda: config),
    )
    monkeypatch.setattr(
        "orion.api.interactive.auditlog_manager.audit_log_manager.AuditLogManager.get_instance",
        staticmethod(lambda: audit),
    )
    monkeypatch.setattr(
        "orion.api.interactive.alert_manager.alert_manager.AlertManager.getInstance",
        staticmethod(lambda: alerts),
    )
    monkeypatch.setattr(
        "orion.api.interactive.resource_manager.resource_manager.ResourceManager.get_instance",
        staticmethod(lambda: resource_manager),
    )
    monkeypatch.setattr(
        "orion.api.interactive.account_manager.account_manager.AccountManager.get_instance",
        staticmethod(lambda: account_manager),
    )
    if engine is not None:
        monkeypatch.setattr(
            "orion.services.mongo_manager.mongo_controller.mongo_controller.get_instance",
            staticmethod(lambda: SimpleNamespace(get_engine=lambda: engine)),
        )

    return SimpleNamespace(
        km=key_manager,
        mail=mail_manager,
        config=config,
        audit=audit,
        alerts=alerts,
        account=account_manager,
        resource=resource_manager,
    )
