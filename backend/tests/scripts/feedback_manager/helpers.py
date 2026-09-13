from __future__ import annotations

import asyncio
from types import SimpleNamespace

from cryptography.fernet import Fernet

import orion.api.interactive.feedback_manager.feedback_manager as feedback_module
from orion.api.interactive.feedback_manager.feedback_manager import FeedbackManager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from tests.model.fakes import FakeDoc, FakeMongoEngine


def _run(coro):
    return asyncio.run(coro)


def _make_manager(engine: FakeMongoEngine) -> FeedbackManager:
    manager = object.__new__(FeedbackManager)
    manager._engine = engine
    return manager


def _make_user(**overrides):
    data = {
        "id": "507f1f77bcf86cd799439011",
        "username": "alice",
        "email": "alice@example.com",
        "role": user_role.ANALYST,
        "tenant_uuid": "507f1f77bcf86cd799439012",
        "preferences": {"profile_visible": True},
        "licenses": [],
    }
    data.update(overrides)
    return FakeDoc(**data)


def _make_tenant(**overrides):
    data = {
        "id": "507f1f77bcf86cd799439012",
        "name": "",
        "profile_visibility_enabled": True,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def _current_user(**overrides):
    data = {"id": "507f1f77bcf86cd799439011", "username": "alice", "role": user_role.ADMIN, "tenant_uuid": "507f1f77bcf86cd799439012"}
    data.update(overrides)
    return SimpleNamespace(**data)


def _patch_tenant_lookup(monkeypatch, engine):
    monkeypatch.setattr(
        feedback_module.mongo_controller,
        "get_instance",
        staticmethod(lambda: SimpleNamespace(get_engine=lambda: engine)),
    )


def _patch_key_manager(monkeypatch, key):
    monkeypatch.setattr(
        feedback_module.KeyManager,
        "get_instance",
        staticmethod(lambda: SimpleNamespace(get_or_create_dek=lambda _tenant_id: asyncio.sleep(0, result=key))),
    )


def _patch_search(monkeypatch, fake):
    monkeypatch.setattr(feedback_module.search_manager, "getInstance", staticmethod(lambda: fake))


class FakeSearch:
    def __init__(self, results=None, errors=None):
        self.results = results or {}
        self.errors = errors or {}

    async def _resolve(self, name, doc_id):
        if name in self.errors:
            raise self.errors[name]
        return self.results.get(name)

    async def request_leak_doc(self, doc_id, _user):
        return await self._resolve("leak", doc_id)

    async def request_general_doc(self, doc_id, _user):
        return await self._resolve("general", doc_id)

    async def request_exploit_doc(self, doc_id, _user):
        return await self._resolve("exploit", doc_id)

    async def request_apt_doc(self, doc_id, _user):
        return await self._resolve("apt", doc_id)

    async def request_malware_doc(self, doc_id, _user):
        return await self._resolve("malware", doc_id)

    async def request_chat_doc(self, doc_id, _user):
        return await self._resolve("chat", doc_id)

    async def request_social_doc(self, doc_id, _user):
        return await self._resolve("social", doc_id)

    async def request_defacement_doc(self, doc_id):
        return await self._resolve("defacement", doc_id)


def _encrypt(key, text):
    return Fernet(key).encrypt(text.encode()).decode()
