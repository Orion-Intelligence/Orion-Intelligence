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
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:8080; "
                "style-src 'self' 'unsafe-inline' http://localhost:8080 https://rsms.me 'sha256-t5rPoyH1kFcEaf2vXeRBMZ+GzoaaW+jA8RtFPKpF9vA='; "
                "img-src 'self' data: http://orion.genesistechnologies.org; "
                "font-src 'self' https://rsms.me https://rsms.me/inter/; "
                "connect-src 'self'; "
                "media-src 'self'; "
                "frame-src 'none'; "
                "frame-ancestors 'none'; "
                "object-src 'none'; "
                "form-action 'self'; "
                "base-uri 'self'; "
                "upgrade-insecure-requests; "
                "report-uri /csp-report-endpoint/;"
            )
        else:
            response.headers["Content-Security-Policy"] = (
                "default-src 'none'; "
                "script-src 'none'; "
                "style-src 'self'; "
                "img-src 'self' data: http://orion.genesistechnologies.org; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "media-src 'self'; "
                "frame-src 'none'; "
                "frame-ancestors 'none'; "
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

        response.headers["X-Frame-Options"] = "DENY"

        if not self.DEBUG:
            response.headers["Expect-CT"] = (
                "max-age=86400, enforce, report-uri=\"/ct-report-endpoint/\""
            )

        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response