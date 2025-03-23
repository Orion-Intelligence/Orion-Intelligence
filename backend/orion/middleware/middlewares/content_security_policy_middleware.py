from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from orion.helper_manager.env_handler import env_handler


class content_security_policy_middleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.DEBUG = env_handler.get_instance().env("PRODUCTION", "0") != "1"

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        if any(path in request.url.path for path in [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/npm/swagger-ui-dist@5/swagger-ui.css",
            "/npm/swagger-ui-dist@5/swagger-ui-bundle.js"
        ]):
            return response

        if request.url.path.startswith("/admin"):
            response.headers["Content-Security-Policy"] = (
                "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' *; "
                "style-src 'self' 'unsafe-inline' *; "
                "img-src 'self' data: *; "
                "font-src 'self' *; "
                "connect-src 'self' *; "
                "media-src 'self' *; "
                "frame-src *; "
                "frame-ancestors *; "
                "object-src *; "
                "form-action *; "
                "base-uri 'self'; "
                "upgrade-insecure-requests; "
                "report-uri /csp-report-endpoint/;"
            )
        else:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self'; "
                "img-src 'self' data: http://orion.genesistechnologies.org; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "media-src 'self'; "
                "frame-ancestors 'self'; "
                "object-src 'none'; "
                "form-action 'self'; "
                "base-uri 'self'; "
                "upgrade-insecure-requests; "
                "report-uri /csp-report-endpoint/;"
            )

        if not self.DEBUG:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
            response.headers["Expect-CT"] = (
                "max-age=86400, enforce, report-uri=\"/ct-report-endpoint/\""
            )

        response.headers["Permissions-Policy"] = (
            "accelerometer=(), "
            "camera=(), "
            "geolocation=(), "
            "gyroscope=(), "
            "magnetometer=(), "
            "microphone=(), "
            "payment=(), "
            "usb=(), "
            "fullscreen=(), "
            "xr-spatial-tracking=()"
        )

        if self.DEBUG:
            response.headers["X-Frame-Options"] = "ALLOW-FROM http://localhost:4200"
        else:
            response.headers["X-Frame-Options"] = "SAMEORIGIN"

        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response