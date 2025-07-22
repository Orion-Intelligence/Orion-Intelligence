from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.requests import Request

from configs import config
from orion.helper_manager.env_handler import env_handler


class security_headers_middleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        DEBUG = env_handler.get_instance().env("PRODUCTION", "0") != "1"
        host = request.headers.get("host", "")
        is_tor_request = ".onion" in host

        if not is_tor_request:
            if DEBUG:
                hsts_value = f"max-age={config.SECURE_HSTS_SECONDS}; includeSubDomains; preload"
                response.headers["Strict-Transport-Security"] = hsts_value
            else:
                response.headers["Strict-Transport-Security"] = "max-age=31536000"
            response.headers["X-Content-Type-Options"] = "nosniff" if config.SECURE_CONTENT_TYPE_NOSNIFF else "off"
            response.headers["X-XSS-Protection"] = "1; mode=block" if config.SECURE_BROWSER_XSS_FILTER else "0"
            response.headers["Access-Control-Allow-Origin"] = "*"
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range"
            response.headers["Access-Control-Expose-Headers"] = "Content-Length,Content-Range"

        return response
