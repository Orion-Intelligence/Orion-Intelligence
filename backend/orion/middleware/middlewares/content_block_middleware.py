from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, RedirectResponse

from orion.services.session_manager.session_manager import session_manager
from routes.auth_routes import token_from_request


class content_block_middleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if path.startswith("/api/"):
            return await call_next(request)

        if not (path == "/dashboard" or path.startswith("/dashboard/")):
            return await call_next(request)

        token = token_from_request(request)

        user = None
        if token:
            try:
                user = await session_manager.get_instance().get_current_user(token)
            except Exception:
                user = None

        if not user:
            return RedirectResponse(url="/login", status_code=302)

        response: Response = await call_next(request)
        return response
