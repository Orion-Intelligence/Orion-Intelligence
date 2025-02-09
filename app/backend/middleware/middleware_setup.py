from brotli_asgi import BrotliMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from backend.middleware.middlewares.user_auth_middleware import user_auth_middleware
from backend.middleware.middlewares.content_security_policy_middleware import content_security_policy_middleware
from backend.middleware.middlewares.maintenance_mode_middleware import maintenance_mode_middleware
from backend.middleware.middlewares.security_headers_middleware import security_headers_middleware
from backend.middleware.middlewares.service_ready_middleware import service_ready_middleware
from configs import config


def setup_middlewares(app):
    app.add_middleware(content_security_policy_middleware)
    app.add_middleware(maintenance_mode_middleware)
    app.add_middleware(service_ready_middleware)
    app.add_middleware(user_auth_middleware)

    if not config.DEBUG:
        app.add_middleware(HTTPSRedirectMiddleware)

    #
    # app.add_middleware(
    #     CORSMiddleware,
    #     allow_origins=config.ALLOWED_CORS_ORIGINS,
    #     allow_credentials=True,
    #     allow_methods=["GET", "POST", "PUT", "DELETE"],
    #     allow_headers=["Authorization", "Content-Type"]
    # )

    # if not config.DEBUG:
    #     app.add_middleware(
    #         TrustedHostMiddleware,
    #         allowed_hosts=config.CSRF_TRUSTED_ORIGINS if config.DEBUG else ["*"]
    #     )

    app.add_middleware(security_headers_middleware)
    app.add_middleware(BrotliMiddleware, quality=5, minimum_size=0)
