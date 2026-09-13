from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

import interface as frontend_interface


def _client_with_frontend(tmp_path, monkeypatch, *, set_nonce: bool = True):
    monkeypatch.setattr(frontend_interface, "ANGULAR_BUILD_DIR", tmp_path)
    app = FastAPI()

    if set_nonce:
        @app.middleware("http")
        async def _set_nonce(request, call_next):
            request.state.csp_nonce = "test-nonce"
            return await call_next(request)

    app.include_router(frontend_interface.interface)
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver")
