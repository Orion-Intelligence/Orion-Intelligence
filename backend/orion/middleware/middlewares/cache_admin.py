# middleware_no_cache.py
from starlette.middleware.base import BaseHTTPMiddleware


class cache_admin(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        p = request.url.path
        if p == "/admin" or p.startswith("/admin/"):
            response.headers["Cache-Control"] = "no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response
