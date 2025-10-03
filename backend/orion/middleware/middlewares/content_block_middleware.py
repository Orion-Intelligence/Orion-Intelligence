from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, RedirectResponse
from orion.services.session_manager.session_manager import session_manager
from datetime import datetime, timezone

ACCESS_COOKIE = "access_token"

class content_block_middleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if path.startswith("/api/"):
            return await call_next(request)

        if not (path == "/dashboard" or path.startswith("/dashboard/")):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        parts = auth_header.split(" ", 1)
        bearer = parts[1] if len(parts) == 2 and parts[0] == "Bearer" else None
        token = bearer or request.cookies.get(ACCESS_COOKIE)

        user = None
        if token:
            try:
                user = await session_manager.get_instance().get_current_user(token)
            except:
                user = None

        if not user:
            return RedirectResponse(url="/login", status_code=302)

        if (
            str(getattr(user, "role", "")).lower() == "profile"
            and not bool(getattr(user, "subscription", False))
            and getattr(user, "account_verify_at", None) is not None
            and (datetime.now(timezone.utc) - user.account_verify_at).days >= 30
            and not path.startswith("/payment")
        ):
            return RedirectResponse(url="/payment", status_code=302)

        response: Response = await call_next(request)
        return response
