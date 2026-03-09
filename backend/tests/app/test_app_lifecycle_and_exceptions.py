"""Coverage map: checklist items 1-12, 41-50 (core app/middleware behaviors)."""

from __future__ import annotations

import asyncio
import importlib
from types import SimpleNamespace
from typing import cast

import fastapi
import httpx
import pytest
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.types import ExceptionHandler


def _make_dummy_app():
    app = FastAPI()

    @app.get("/ok")
    async def ok():
        return {"ok": True}

    return app


def _request(app: FastAPI, method: str, path: str, **kwargs):
    follow_redirects = kwargs.pop("follow_redirects", True)

    async def _run():
        transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://testserver",
            follow_redirects=follow_redirects,
        ) as client:
            return await client.request(method, path, **kwargs)

    return asyncio.run(_run())


def _patch_main_import_safety(monkeypatch):
    monkeypatch.setattr(fastapi.FastAPI, "mount", lambda self, *args, **kwargs: None)


def test_service_ready_middleware_returns_503_when_not_ready(monkeypatch):
    from orion.middleware.middlewares.service_ready_middleware import service_ready_middleware
    from orion.management.managers.service_manager import service_manager

    app = FastAPI()
    app.add_middleware(service_ready_middleware)

    @app.get("/ok")
    async def ok():
        return {"ok": True}

    monkeypatch.setattr(service_manager, "get_instance", staticmethod(lambda: SimpleNamespace(check_status=lambda: False)))

    resp = _request(app, "GET", "/ok")
    assert resp.status_code == 503


def test_service_ready_middleware_allows_when_ready(monkeypatch):
    from orion.middleware.middlewares.service_ready_middleware import service_ready_middleware
    from orion.management.managers.service_manager import service_manager

    app = FastAPI()
    app.add_middleware(service_ready_middleware)

    @app.get("/ok")
    async def ok():
        return {"ok": True}

    monkeypatch.setattr(service_manager, "get_instance", staticmethod(lambda: SimpleNamespace(check_status=lambda: True)))

    resp = _request(app, "GET", "/ok")
    assert resp.status_code == 200


def test_interface_serves_frontend_fallback(monkeypatch, tmp_path):
    import interface as interface_module

    index = tmp_path / "index.html"
    index.write_text("<html>ok</html>", encoding="utf-8")

    monkeypatch.setattr(interface_module, "ANGULAR_BUILD_DIR", tmp_path)

    resp = asyncio.run(interface_module.serve_frontend("dashboard/anything"))
    assert resp.status_code == 200


def test_interface_returns_404_for_api_like_unknown(monkeypatch, tmp_path):
    import interface as interface_module

    with pytest.raises(fastapi.HTTPException) as exc:
        asyncio.run(interface_module.serve_frontend("api/unknown/path"))
    assert exc.value.status_code == 404


def test_global_exception_handler_debug_json(monkeypatch):
    from configs import exception_handlers as eh

    monkeypatch.setattr(eh.config, "DEBUG", True)

    app = FastAPI()
    app.add_exception_handler(Exception, eh.global_exception_handler)

    @app.get("/boom")
    async def boom():
        raise RuntimeError("kaboom")

    resp = _request(app, "GET", "/boom")
    assert resp.status_code == 500
    assert "error" in resp.json()


def test_validation_exception_handler_debug_json(monkeypatch):
    from configs import exception_handlers as eh

    monkeypatch.setattr(eh.config, "DEBUG", True)

    app = FastAPI()
    app.add_exception_handler(
        RequestValidationError,
        cast(ExceptionHandler, eh.validation_exception_handler),
    )

    @app.get("/item/{item_id}")
    async def item(item_id: int):
        return {"id": item_id}

    resp = _request(app, "GET", "/item/not-int")
    assert resp.status_code == 422
    assert "validation_errors" in resp.json()


def test_global_exception_handler_non_debug_redirect(monkeypatch):
    from configs import exception_handlers as eh

    monkeypatch.setattr(eh.config, "DEBUG", False)

    app = FastAPI()
    app.add_exception_handler(Exception, eh.global_exception_handler)

    @app.get("/boom")
    async def boom():
        raise RuntimeError("kaboom")

    resp = _request(app, "GET", "/boom", follow_redirects=False)
    assert resp.status_code in (302, 307)


def test_setup_middlewares_wires_security_headers(monkeypatch):
    from orion.middleware.middleware_setup import setup_middlewares
    from orion.management.managers.service_manager import service_manager

    app = _make_dummy_app()
    monkeypatch.setattr(service_manager, "get_instance", staticmethod(lambda: SimpleNamespace(check_status=lambda: True)))
    setup_middlewares(app)

    resp = _request(app, "GET", "/ok")
    assert resp.status_code == 200
    assert "x-content-type-options" in resp.headers


def test_setup_middlewares_adds_trustedhost_in_non_debug(monkeypatch):
    from orion.middleware.middleware_setup import setup_middlewares
    from configs import config

    monkeypatch.setattr(config, "DEBUG", False)
    app = _make_dummy_app()
    setup_middlewares(app)

    middleware_names = [m.cls.__name__ for m in getattr(app, "user_middleware", [])]
    assert "TrustedHostMiddleware" in middleware_names


def test_cache_admin_adds_no_store_for_admin_path():
    from orion.middleware.middlewares.cache_admin import cache_admin

    app = FastAPI()
    app.add_middleware(cache_admin)

    @app.get("/admin")
    async def admin():
        return {"ok": True}

    resp = _request(app, "GET", "/admin")
    assert "no-store" in resp.headers.get("cache-control", "")


def test_content_security_policy_header_present():
    from orion.middleware.middlewares.content_security_policy_middleware import content_security_policy_middleware

    app = FastAPI()
    app.add_middleware(content_security_policy_middleware)

    @app.get("/ok")
    async def ok():
        return {"ok": True}

    resp = _request(app, "GET", "/ok")
    assert "content-security-policy" in resp.headers


def test_content_security_policy_admin_variant():
    from orion.middleware.middlewares.content_security_policy_middleware import content_security_policy_middleware

    app = FastAPI()
    app.add_middleware(content_security_policy_middleware)

    @app.get("/admin/test")
    async def admin_test():
        return {"ok": True}

    resp = _request(app, "GET", "/admin/test")
    assert "frame-ancestors" in resp.headers.get("content-security-policy", "")


def test_main_includes_test_router_when_testing_enabled(monkeypatch):
    import routes.test_routes as tr
    from orion.helper_manager.env_handler import env_handler

    _patch_main_import_safety(monkeypatch)
    monkeypatch.setattr(env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda k, d=None: "1" if k == "TESTING_ENABLED" else d)))

    include_calls = []
    orig_include_router = fastapi.FastAPI.include_router

    def _capture_include(self, router, *args, **kwargs):
        include_calls.append(router)
        return orig_include_router(self, router, *args, **kwargs)

    monkeypatch.setattr(fastapi.FastAPI, "include_router", _capture_include)

    import main as main_module

    importlib.reload(main_module)
    assert any(r is tr.test_routes for r in include_calls)


def test_main_skips_test_router_when_testing_disabled(monkeypatch):
    import routes.test_routes as tr
    from orion.helper_manager.env_handler import env_handler

    _patch_main_import_safety(monkeypatch)
    monkeypatch.setattr(env_handler, "get_instance", staticmethod(lambda: SimpleNamespace(env=lambda k, d=None: "0" if k == "TESTING_ENABLED" else d)))

    include_calls = []
    orig_include_router = fastapi.FastAPI.include_router

    def _capture_include(self, router, *args, **kwargs):
        include_calls.append(router)
        return orig_include_router(self, router, *args, **kwargs)

    monkeypatch.setattr(fastapi.FastAPI, "include_router", _capture_include)

    import main as main_module

    importlib.reload(main_module)
    assert all(r is not tr.test_routes for r in include_calls)


def test_lifespan_runs_apply_test_overrides_and_init_sequence(monkeypatch):
    _patch_main_import_safety(monkeypatch)

    import main as main_module

    calls = []

    class _FakeTM:
        async def apply_test_overrides(self):
            calls.append("apply_test_overrides")

    class _FakeSM:
        async def build_assets(self, _):
            calls.append("build_assets")

        async def init_services(self):
            calls.append("init_services")

    class _FakeAdmin:
        def mount_to(self, _):
            calls.append("mount_admin")

    monkeypatch.setattr(main_module.test_manager, "get_instance", staticmethod(lambda: _FakeTM()))
    monkeypatch.setattr(main_module.service_manager, "get_instance", staticmethod(lambda: _FakeSM()))
    monkeypatch.setattr(main_module, "setup_admin", lambda _: _FakeAdmin())
    monkeypatch.setattr(main_module.mongo_controller, "get_instance", staticmethod(lambda: SimpleNamespace(get_engine=lambda: object())))

    app = FastAPI()

    async def _run():
        async with main_module.lifespan(app):
            pass

    asyncio.run(_run())
    assert calls[:4] == ["apply_test_overrides", "build_assets", "init_services", "mount_admin"]


def test_lifespan_propagates_build_assets_failure(monkeypatch):
    _patch_main_import_safety(monkeypatch)

    import main as main_module

    class _FakeTM:
        async def apply_test_overrides(self):
            return None

    class _FailSM:
        async def build_assets(self, _):
            raise FileNotFoundError("assets missing")

        async def init_services(self):
            return None

    monkeypatch.setattr(main_module.test_manager, "get_instance", staticmethod(lambda: _FakeTM()))
    monkeypatch.setattr(main_module.service_manager, "get_instance", staticmethod(lambda: _FailSM()))

    app = FastAPI()

    async def _run():
        async with main_module.lifespan(app):
            pass

    with pytest.raises(FileNotFoundError, match="assets missing"):
        asyncio.run(_run())
