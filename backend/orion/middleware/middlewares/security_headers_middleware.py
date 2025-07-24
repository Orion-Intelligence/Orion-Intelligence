from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from configs import config
from orion.helper_manager.env_handler import env_handler


class security_headers_middleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response: Response = await call_next(request)
        DEBUG = env_handler.get_instance().env("PRODUCTION", "0") != "1"

        if DEBUG:
            hsts_value = f"max-age={config.SECURE_HSTS_SECONDS}; includeSubDomains; preload"
            response.headers["Strict-Transport-Security"] = hsts_value
        else:
            response.headers["Strict-Transport-Security"] = "max-age=31536000"

        response.headers["X-Content-Type-Options"] = "nosniff" if config.SECURE_CONTENT_TYPE_NOSNIFF else "off"
        response.headers["X-XSS-Protection"] = "1; mode=block" if config.SECURE_BROWSER_XSS_FILTER else "0"

        return response
