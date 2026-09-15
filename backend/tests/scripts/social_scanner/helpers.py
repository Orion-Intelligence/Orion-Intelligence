from __future__ import annotations

import asyncio
from types import SimpleNamespace

import orion.api.interactive.social_manager.social_scanner as ss_module
from orion.api.interactive.social_manager.social_scanner import social_scanner
from tests.scripts.social_scanner.fakes import (
    FakeLog,
    FakeScanCollection,
    FakeScanEngine,
    FakeSocialModelInstance,
)


def _run(coro):
    return asyncio.run(coro)


def make_scanner():
    scanner = object.__new__(social_scanner)
    scanner._worker_id = "worker-test"
    scanner._scans = {}
    scanner._lock = asyncio.Lock()
    return scanner


def patch_collection(monkeypatch, scanner, collection, user=None, raise_on_user=False):
    engine = FakeScanEngine(collection, user=user, raise_on_user=raise_on_user)
    monkeypatch.setattr(
        ss_module.mongo_controller,
        "get_instance",
        staticmethod(lambda: SimpleNamespace(get_engine=lambda: engine)),
    )
    return engine


def patch_social_model(monkeypatch, model=None):
    model = model or FakeSocialModelInstance()
    monkeypatch.setattr(ss_module.social_manager, "getInstance", staticmethod(lambda: model))
    monkeypatch.setattr(ss_module.social_manager, "_social_headers", staticmethod(lambda user, request: {"h": "v"}))
    monkeypatch.setattr(ss_module.social_manager, "default_profile_config", staticmethod(lambda profiles: {"disallowed": []}))
    monkeypatch.setattr(ss_module.social_manager, "_drop_unstorable_ints", staticmethod(lambda value: value))
    return model


def patch_log(monkeypatch):
    fake = FakeLog()
    monkeypatch.setattr(ss_module, "log", fake)
    return fake


def no_sleep(monkeypatch):
    async def _sleep(_seconds):
        return None

    monkeypatch.setattr(ss_module.asyncio, "sleep", _sleep)
