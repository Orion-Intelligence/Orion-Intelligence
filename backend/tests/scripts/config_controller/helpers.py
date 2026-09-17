from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import orion.api.server.config_manager.config_controller as cc
from orion.api.server.config_manager.config_controller import config_controller
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName

from tests.scripts.config_controller.fakes import FakeConfigEngine


def _make_manager(engine=None, base_dir: Path | None = None):
    manager = object.__new__(config_controller)
    manager._engine = engine if engine is not None else FakeConfigEngine()
    manager._config = {}
    manager._configs = {}
    manager.BASE_DIR = base_dir or Path("/tmp")
    manager.SYSTEM_DIR = (base_dir or Path("/tmp")) / "system"
    return manager


def _tenant(tenant_id="tenant-1", is_default=True):
    return SimpleNamespace(id=tenant_id, is_default=is_default)


def _user(role="admin", licenses=None, tenant_id="tenant-1", user_id="user-1"):
    return SimpleNamespace(id=user_id, role=role, licenses=licenses or [], tenant_id=tenant_id)


def _maintainer_user(tenant_id="tenant-1"):
    return _user(role="analyst", licenses=[LicenseName.MAINTAINER], tenant_id=tenant_id)


def _install_redis(monkeypatch, redis):
    monkeypatch.setattr(cc.redis_controller, "getInstance", staticmethod(lambda: redis))


def _install_mail(monkeypatch, mail):
    monkeypatch.setattr(cc.mail_manager, "get_instance", staticmethod(lambda: mail))


def _install_log(monkeypatch, log):
    monkeypatch.setattr(cc, "log", log)


def _install_resource(monkeypatch, resource_manager):
    from orion.api.interactive.resource_manager.resource_manager import ResourceManager

    monkeypatch.setattr(ResourceManager, "get_instance", staticmethod(lambda: resource_manager))


def _install_audit(monkeypatch, audit):
    from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager

    monkeypatch.setattr(AuditLogManager, "get_instance", staticmethod(lambda: audit))
