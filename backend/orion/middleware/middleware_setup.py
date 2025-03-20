from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from orion.helper_manager.env_handler import env_handler
from orion.middleware.middlewares.content_security_policy_middleware import content_security_policy_middleware
from orion.middleware.middlewares.security_headers_middleware import security_headers_middleware
from orion.middleware.middlewares.service_ready_middleware import service_ready_middleware
from configs import config


def setup_middlewares(app):
    app.add_middleware(content_security_policy_middleware)
    app.add_middleware(service_ready_middleware)
    PRODUCTION_DOMAIN = env_handler.get_instance().env("PRODUCTION_DOMAIN", "-")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=PRODUCTION_DOMAIN,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type"]
    )

    if not config.DEBUG:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=PRODUCTION_DOMAIN
        )

    app.add_middleware(security_headers_middleware)
