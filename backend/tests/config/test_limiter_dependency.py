from __future__ import annotations

import asyncio

import pytest
from fastapi import HTTPException

from configs import limiter_dependency as limiter_module


def test_limiter_dependency_allows_request(monkeypatch):
    async def _run():
        semaphore = asyncio.Semaphore(2)
        queue = asyncio.Queue(2)
        monkeypatch.setattr(limiter_module, "semaphore", semaphore)
        monkeypatch.setattr(limiter_module, "queue", queue)

        agen = limiter_module.limiter_dependency()
        await agen.__anext__()
        await agen.aclose()
        assert queue.qsize() == 0

    asyncio.run(_run())


def test_limiter_dependency_queue_full_returns_429(monkeypatch):
    async def _run():
        queue = asyncio.Queue(1)
        await queue.put(None)

        monkeypatch.setattr(limiter_module, "semaphore", asyncio.Semaphore(1))
        monkeypatch.setattr(limiter_module, "queue", queue)

        agen = limiter_module.limiter_dependency()
        with pytest.raises(HTTPException) as ex:
            await agen.__anext__()

        assert ex.value.status_code == 429
        assert "queue full" in ex.value.detail.lower()

    asyncio.run(_run())
