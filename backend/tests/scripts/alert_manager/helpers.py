from __future__ import annotations

import asyncio
from types import SimpleNamespace

import orion.api.interactive.alert_manager.alert_manager as am
from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.api.interactive.alert_manager.alert_mail_helper import AlertMailHelper
from orion.api.interactive.alert_manager.alert_summary_helper import AlertSummaryHelper
from tests.model.fakes import FakeMongoEngine, FakeRedis


def _run(coro):
    return asyncio.run(coro)


def _make_manager(engine=None, redis=None):
    engine = engine if engine is not None else FakeMongoEngine()
    redis = redis if redis is not None else FakeRedis()
    manager = object.__new__(AlertManager)
    manager._engine = engine
    manager._redis = redis
    manager._alert_summary_ttl_seconds = 300
    manager._summary_helper = AlertSummaryHelper(engine, redis, 300)
    manager._mail_helper = AlertMailHelper(engine)
    return manager


def _user(tenant_id="507f1f77bcf86cd799439011", email="user@example.com", username="user", **extra):
    return SimpleNamespace(tenant_id=tenant_id, email=email, username=username, **extra)


def _set_env(monkeypatch, mapping):
    instance = SimpleNamespace(env=lambda key, default="": mapping.get(key, default))
    monkeypatch.setattr(am.env_handler, "get_instance", staticmethod(lambda: instance))


def _use_mail_stack(monkeypatch, template=None, mail=None, webhook=None):
    if template is not None:
        monkeypatch.setattr(am.constant, "alert_mail_template", template)
    if mail is not None:
        monkeypatch.setattr(am.mail_manager, "get_instance", staticmethod(lambda: mail))
    if webhook is not None:
        monkeypatch.setattr(am.AlertWebhookManager, "get_instance", staticmethod(lambda: webhook))


def _use_key_manager(monkeypatch, dek):
    async def get_or_create_dek(tenant_id):
        return dek

    instance = SimpleNamespace(get_or_create_dek=get_or_create_dek)
    monkeypatch.setattr(am.KeyManager, "get_instance", staticmethod(lambda: instance))
