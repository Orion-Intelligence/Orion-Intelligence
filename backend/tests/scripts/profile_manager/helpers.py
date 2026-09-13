from __future__ import annotations

import asyncio
from types import SimpleNamespace

from cryptography.fernet import Fernet
from pymongo.errors import DuplicateKeyError

from orion.api.interactive.profile_manager.profile_manager import ProfileManager
from tests.model.fakes import FakeMongoEngine


def _run(coro):
    return asyncio.run(coro)


class DupSaveEngine(FakeMongoEngine):
    def __init__(self, *args, save_exc_times: int = 0, **kwargs):
        super().__init__(*args, **kwargs)
        self.save_exc_times = save_exc_times

    async def save(self, model):
        if self.save_exc_times > 0:
            self.save_exc_times -= 1
            raise DuplicateKeyError("duplicate")
        return await super().save(model)


class FakeSocketManager:
    def __init__(self, reply=None, live=True):
        self.reply = reply
        self.live = live
        self.fired = []
        self.take_calls = []

    async def take_result(self, user_key, result_key):
        self.take_calls.append((user_key, result_key))
        return self.reply

    async def fire(self, user_key, command):
        self.fired.append((user_key, command))

    async def has_live_socket(self, user_key):
        return self.live


def _make_manager(engine) -> ProfileManager:
    manager = object.__new__(ProfileManager)
    manager._engine = engine
    return manager


def _make_user(user_id="507f1f77bcf86cd799439011", tenant_uuid="507f1f77bcf86cd799439012"):
    return SimpleNamespace(id=user_id, tenant_uuid=tenant_uuid)


def _make_key_manager():
    key = Fernet.generate_key()

    async def get_or_create_dek(_tenant):
        return key

    return SimpleNamespace(get_instance=staticmethod(lambda: SimpleNamespace(get_or_create_dek=get_or_create_dek))), key


class _NullLogger:
    def i(self, *_a):
        return None

    def w(self, *_a):
        return None

    def e(self, *_a):
        return None


def _null_log():
    logger = _NullLogger()
    return SimpleNamespace(g=staticmethod(lambda: logger))
