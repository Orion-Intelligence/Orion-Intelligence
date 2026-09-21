from urllib.parse import urlsplit

from bson import ObjectId
from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from configs import config
from configs.auth_cookie import token_from_request
from orion.api.interactive.backup_manager.maintenance_state import maintenance_state
from orion.helper_manager.env_handler import env_handler
from orion.management.managers.service_manager import service_manager
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model
from orion.services.session_manager.session_manager import session_manager


class tenant_resolution_middleware(BaseHTTPMiddleware):
    TENANT_MAINTENANCE_EXEMPT_PREFIXES = (
        "/maintenance-assets/",
        "/static/maintenance",
        "/api/s/static/system/",
    )
    ACCESS_BLOCK_EXEMPT_PREFIXES = (
        "/api/token",
        "/api/logout",
        "/api/get/tenant/node",
        "/api/public",
        "/api/s/static/",
    )

    async def dispatch(self, request: Request, call_next):
        if getattr(request.state, "tenant", None) is not None:
            return await call_next(request)
        if not service_manager.get_instance().check_status():
            return await call_next(request)

        raw_host = request.headers.get("host") or ""
        if config.DEBUG:
            raw_host = request.headers.get("x-forwarded-host") or raw_host
        raw_host = raw_host.split(",", 1)[0].strip().lower()
        hostname = urlsplit(f"//{raw_host}").hostname or ""
        hostname = hostname.rstrip(".")

        app_url = str(env_handler.get_instance().env("APP_URL", "") or "").strip()
        app_hostname = (urlsplit(app_url).hostname or "").lower().rstrip(".")
        production_domain = str(env_handler.get_instance().env("PRODUCTION_DOMAIN", "") or "").strip().lower().rstrip(".")
        if production_domain == "*":
            production_domain = app_hostname
        if "://" in production_domain:
            production_domain = urlsplit(production_domain).hostname or ""
        production_domain = production_domain.removeprefix("*.")
        tenant_base_domain = str(
            env_handler.get_instance().env("TENANT_BASE_DOMAIN", "") or ""
        ).strip().lower().rstrip(".")
        if "://" in tenant_base_domain:
            tenant_base_domain = urlsplit(tenant_base_domain).hostname or ""
        tenant_base_domain = tenant_base_domain.removeprefix("*.") or production_domain

        tenant_slug = None
        if hostname in (production_domain, app_hostname, "localhost", "127.0.0.1"):
            is_default_tenant = True
        elif tenant_base_domain and hostname.endswith(f".{tenant_base_domain}"):
            tenant_slug = hostname[: -(len(tenant_base_domain) + 1)]
            is_default_tenant = False
        elif hostname.endswith(".localhost"):
            tenant_slug = hostname[:-10]
            is_default_tenant = False
        elif hostname == "trusted-web-main" and not request.headers.get("x-real-ip"):
            is_default_tenant = False
        else:
            return JSONResponse(status_code=404, content={"detail": "Tenant not found"})

        if tenant_slug and "." in tenant_slug:
            return JSONResponse(status_code=404, content={"detail": "Tenant not found"})

        engine = mongo_controller.get_instance().get_engine()
        if engine is None:
            return JSONResponse(status_code=503, content={"detail": "Tenant service unavailable"})

        try:
            if hostname == "trusted-web-main":
                token = token_from_request(request)
                if token:
                    user = await session_manager.get_instance().get_current_user(token)
                    tenant = await engine.find_one(db_tenant_model,db_tenant_model.id == ObjectId(str(user.tenant_id)),)
                else:
                    tenant = await engine.find_one(db_tenant_model, db_tenant_model.is_default == True)
            elif is_default_tenant:
                tenant = await engine.find_one(db_tenant_model, db_tenant_model.is_default == True)
            else:
                tenant = await engine.find_one(db_tenant_model, db_tenant_model.slug == tenant_slug)
        except HTTPException as exc:
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
        except Exception:
            return JSONResponse(status_code=503, content={"detail": "Tenant service unavailable"})

        if tenant is None:
            return JSONResponse(status_code=404, content={"detail": "Tenant not found"})

        if maintenance_state.get_instance().is_tenant_fenced(tenant.id, getattr(tenant, "parent_tenant_id", None)) and not request.url.path.startswith(self.TENANT_MAINTENANCE_EXEMPT_PREFIXES):
            return JSONResponse(status_code=503, content={"detail": "Tenant service unavailable"})

        if request.url.path.startswith("/api/") and not request.url.path.startswith(self.ACCESS_BLOCK_EXEMPT_PREFIXES):
            from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
            reason = await TenantManager.get_instance().access_block_reason(tenant)
            if reason:
                return JSONResponse(status_code=403, content={"detail": reason, "access_blocked": True})

        request.state.tenant = tenant
        return await call_next(request)
