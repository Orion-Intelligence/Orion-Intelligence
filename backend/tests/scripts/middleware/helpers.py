from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from starlette.responses import PlainTextResponse
from starlette.types import Receive, Scope, Send


async def _noop_app(_scope: Scope, _receive: Receive, _send: Send) -> None:
    return


@asynccontextmanager
async def _client_with_middleware(middleware_cls, *, endpoint="/"):
    app = FastAPI()
    app.add_middleware(middleware_cls)

    @app.get(endpoint)
    async def _handler():
        return PlainTextResponse("ok")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        yield client
