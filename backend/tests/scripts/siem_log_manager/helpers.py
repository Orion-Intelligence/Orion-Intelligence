from __future__ import annotations

import asyncio


def _run(coro):
    return asyncio.run(coro)
