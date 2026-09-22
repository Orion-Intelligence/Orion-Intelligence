from __future__ import annotations

import asyncio
from types import SimpleNamespace

import orion.api.interactive.takedown_manager.takedown_manager as tm
from orion.api.interactive.takedown_manager.takedown_manager import TakedownManager
from tests.model.fakes import FakeMongoEngine


def _run(coro):
    return asyncio.run(coro)


def _make_manager(engine=None, collection=None):
    manager = object.__new__(TakedownManager)
    manager._engine = engine if engine is not None else FakeMongoEngine()
    manager._collection = collection
    return manager


def _user(tenant_id="tenant-1", user_id="user-1", username="analyst", role=None):
    return SimpleNamespace(tenant_id=tenant_id, id=user_id, username=username, role=role)


def _set_env(monkeypatch, mapping):
    instance = SimpleNamespace(env=lambda key, default=None: mapping.get(key, default))
    monkeypatch.setattr(tm.env_handler, "get_instance", staticmethod(lambda: instance))


def _use_http_client(monkeypatch, responses=None, exc=None):
    responses = list(responses or [])
    posts: list[tuple] = []

    class _Client:
        def __init__(self, timeout=None):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_value, tb):
            return False

        async def post(self, url, json=None):
            posts.append((url, json))
            if exc is not None:
                raise exc
            if responses:
                return responses.pop(0)
            from tests.scripts.takedown_manager.fakes import FakeHttpResponse
            return FakeHttpResponse()

    monkeypatch.setattr(tm.httpx, "AsyncClient", _Client)

    async def _no_sleep(_seconds):
        return None

    monkeypatch.setattr(tm.asyncio, "sleep", _no_sleep)
    return posts


def _use_mail(monkeypatch, mail):
    monkeypatch.setattr(tm.mail_manager, "get_instance", staticmethod(lambda: mail))


def _use_elastic(monkeypatch, connection):
    monkeypatch.setattr(tm.elastic_controller, "get_instance", staticmethod(lambda: connection))
