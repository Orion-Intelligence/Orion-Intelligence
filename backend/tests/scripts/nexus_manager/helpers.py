from __future__ import annotations

import asyncio
from types import SimpleNamespace

from orion.api.server.nexus_manager.stream_manager import ActiveNexusStream, NexusStreamManager


def _run(coro):
    return asyncio.run(coro)


def _make_stream_manager(base_url="http://trusted-nexus-api:8030"):
    manager = object.__new__(NexusStreamManager)
    manager.base_url = base_url
    manager.active_chat_tasks = {}
    manager.active_streams = {}
    return manager


def _make_active_stream():
    return ActiveNexusStream()


async def _collect(agen):
    return [item async for item in agen]


class _FakeStreamGen:
    def __init__(self, items):
        self._items = list(items)

    async def __call__(self, client, payload, headers):
        for item in self._items:
            yield item


def _install_run_client(monkeypatch):
    import orion.api.server.nexus_manager.stream_manager as sm
    from tests.scripts.nexus_manager.fakes import FakeRunClient

    FakeRunClient.instances = []
    monkeypatch.setattr(sm.httpx, "AsyncClient", FakeRunClient)
    return FakeRunClient


def _make_gateway():
    from orion.api.server.nexus_manager.nexus_chat_gateway import nexus_chat_gateway

    gateway = object.__new__(nexus_chat_gateway)
    gateway._shared_sessions = {}
    return gateway


def _install_gateway_client(monkeypatch, responses, exc=None):
    import orion.api.server.nexus_manager.nexus_chat_gateway as ncg
    from tests.scripts.nexus_manager.fakes import FakeGatewayClientFactory

    factory = FakeGatewayClientFactory(responses, exc)
    monkeypatch.setattr(ncg.httpx, "AsyncClient", factory)
    return factory


def _install_gateway_env(monkeypatch, value=""):
    import orion.api.server.nexus_manager.nexus_chat_gateway as ncg

    instance = SimpleNamespace(env=lambda key: value)
    monkeypatch.setattr(ncg.env_handler, "get_instance", staticmethod(lambda: instance))
