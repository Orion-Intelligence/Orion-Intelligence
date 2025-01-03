from django.utils.deprecation import MiddlewareMixin
from trustly.app.helper_manager.env_handler import env_handler


class ContentSecurityPolicyMiddleware(MiddlewareMixin):

    DEBUG = env_handler.get_instance().env("PRODUCTION", "0") != "1"

    def process_response(self, request, response):
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "media-src 'self'; "
            "frame-src 'none'; "
            "frame-ancestors 'none'; "
            "object-src 'none'; "
            "form-action 'self'; "
            "base-uri 'self'; "
            "upgrade-insecure-requests; "
            "report-uri /csp-report-endpoint/; "
            "require-trusted-types-for 'script';"
        )

        if not self.DEBUG:
            response['Strict-Transport-Security'] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Set Permissions-Policy header
        response['Permissions-Policy'] = (
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

        response['X-Frame-Options'] = "DENY"

        return response
