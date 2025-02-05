from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

import config


class security_headers_middleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response: Response = await call_next(request)

        if not config.DEBUG:
            response.headers["Strict-Transport-Security"] = f"max-age={config.SECURE_HSTS_SECONDS}; includeSubDomains; preload"
        else:
            response.headers["Strict-Transport-Security"] = "0"

        response.headers["X-Content-Type-Options"] = "nosniff" if config.SECURE_CONTENT_TYPE_NOSNIFF else "off"
        response.headers["X-Frame-Options"] = config.X_FRAME_OPTIONS
        response.headers["X-XSS-Protection"] = "1; mode=block" if config.SECURE_BROWSER_XSS_FILTER else "0"

        return response
