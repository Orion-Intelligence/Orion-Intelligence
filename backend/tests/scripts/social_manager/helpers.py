from __future__ import annotations

import asyncio
from types import SimpleNamespace

import orion.api.interactive.social_manager.social_manager as social_module
from orion.api.interactive.social_manager.social_manager import social_manager
from orion.services.mongo_manager.shared_model.db_social_model import SOCIAL_COLLECTION


def _run(coro):
    return asyncio.run(coro)


class _FakeCursor:
    def __init__(self, rows):
        self._rows = list(rows)

    def sort(self, *_args, **_kwargs):
        return self

    def __aiter__(self):
        self._iter = iter(self._rows)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


class _FakeSocialCollection:
    def __init__(self, rows=None, deleted_count=0, raise_on_find=False):
        self.rows = list(rows or [])
        self.deleted_count = deleted_count
        self.raise_on_find = raise_on_find
        self.update_calls = []
        self.delete_calls = []

    def find(self, query):
        self.find_query = query
        if self.raise_on_find:
            raise RuntimeError("db down")
        return _FakeCursor(self.rows)

    async def update_one(self, query, update, upsert=False):
        self.update_calls.append((query, update, upsert))
        return SimpleNamespace(upserted_id="x", modified_count=1)

    async def delete_many(self, query):
        self.delete_calls.append(query)
        return SimpleNamespace(deleted_count=self.deleted_count)


class _FakeSocialEngine:
    def __init__(self, rows=None, deleted_count=0, raise_on_find=False, graph_session=None):
        self.collection = _FakeSocialCollection(rows, deleted_count, raise_on_find)
        self.database = {SOCIAL_COLLECTION: self.collection}
        self.graph_session = graph_session
        self.saved = []

    async def find_one(self, _model, _query):
        return self.graph_session

    async def save(self, model):
        self.saved.append(model)
        return model


def _make_manager(engine=None) -> social_manager:
    manager = object.__new__(social_manager)
    manager._engine = engine if engine is not None else _FakeSocialEngine()
    return manager


def _patch_env(monkeypatch, values):
    monkeypatch.setattr(
        social_module.env_handler,
        "get_instance",
        staticmethod(lambda: SimpleNamespace(env=lambda key, default=None: values.get(key, default))),
    )


class _FakeExtManager:
    def __init__(self, reply=None, inflight=False, live_socket=True):
        self.reply = reply
        self.inflight = inflight
        self.live_socket = live_socket
        self.cancelled = []
        self.fired = []

    async def cancel(self, user_key, scope):
        self.cancelled.append((user_key, scope))

    async def take_result(self, user_key, scope):
        return self.reply

    async def is_inflight(self, user_key, scope):
        return self.inflight

    async def has_live_socket(self, user_key):
        return self.live_socket

    async def fire(self, user_key, command, scope):
        self.fired.append((user_key, command, scope))


def _patch_extension(monkeypatch, fake):
    import orion.api.interactive.extension_manager.extension_socket_manager as ext_module

    monkeypatch.setattr(ext_module.extension_socket_manager, "get_instance", staticmethod(lambda: fake))
