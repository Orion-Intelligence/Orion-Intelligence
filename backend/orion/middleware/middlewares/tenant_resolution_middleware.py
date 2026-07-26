from urllib.parse import urlsplit

from cryptography.fernet import Fernet
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from orion.helper_manager.env_handler import env_handler
from orion.management.managers.service_manager import service_manager
from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model


class tenant_resolution_middleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if getattr(request.state, "tenant", None) is not None:
            return await call_next(request)
        if not service_manager.get_instance().check_status():
            return await call_next(request)

        raw_host = request.headers.get("x-forwarded-host") or request.headers.get("host") or ""
        raw_host = raw_host.split(",", 1)[0].strip().lower()
        hostname = urlsplit(f"//{raw_host}").hostname or ""
        hostname = hostname.rstrip(".")

        production_domain = str(env_handler.get_instance().env("PRODUCTION_DOMAIN", "") or "").strip().lower().rstrip(".")
        if production_domain == "*":
            app_url = str(env_handler.get_instance().env("APP_URL", "") or "").strip()
            production_domain = (urlsplit(app_url).hostname or "").lower().rstrip(".")
        if "://" in production_domain:
            production_domain = urlsplit(production_domain).hostname or ""
        production_domain = production_domain.removeprefix("*.")

        tenant_slug = None
        if hostname in (production_domain, "localhost", "127.0.0.1"):
            is_default_tenant = True
        elif production_domain and hostname.endswith(f".{production_domain}"):
            tenant_slug = hostname[: -(len(production_domain) + 1)]
            is_default_tenant = False
        elif hostname.endswith(".localhost"):
            tenant_slug = hostname[:-10]
            is_default_tenant = False
        else:
            return JSONResponse(status_code=404, content={"detail": "Tenant not found"})

        if tenant_slug and "." in tenant_slug:
            return JSONResponse(status_code=404, content={"detail": "Tenant not found"})

        engine = mongo_controller.get_instance().get_engine()
        if engine is None:
            return JSONResponse(status_code=503, content={"detail": "Tenant service unavailable"})

        try:
            if is_default_tenant:
                tenant = await engine.find_one(db_tenant_model, db_tenant_model.is_default == True)
            else:
                tenant = await engine.find_one(db_tenant_model, db_tenant_model.slug == tenant_slug)
                if tenant is None:
                    for item in await engine.find(db_tenant_model):
                        name = str(getattr(item, "name", "") or "")
                        if name.startswith("gAAAA"):
                            key = await engine.find_one(db_keys, db_keys.auth_id == str(item.id))
                            if key:
                                name = Fernet(KeyManager.get_instance()._unwrap(key.wrapped_key)).decrypt(name.encode()).decode()
                        if not getattr(item, "slug", None) and name.strip().lower() == tenant_slug:
                            tenant = item
                            break
        except Exception:
            return JSONResponse(status_code=503, content={"detail": "Tenant service unavailable"})

        if tenant is None:
            return JSONResponse(status_code=404, content={"detail": "Tenant not found"})

        request.state.tenant = tenant
        return await call_next(request)
