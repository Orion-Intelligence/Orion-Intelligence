from orion.helper_manager.env_handler import env_handler

DEBUG = env_handler.get_instance().env("PRODUCTION", "0") != "1"
PRODUCTION_DOMAIN = env_handler.get_instance().env("PRODUCTION_DOMAIN", "-")
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 600
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_SAMESITE = 'Strict' if not DEBUG else 'None'
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https') if not DEBUG else None
CSRF_TRUSTED_ORIGINS = (
    ['http://localhost', 'http://127.0.0.1', 'http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:8080',
        'http://0.0.0.0:8070', ] if DEBUG else [f'https://{PRODUCTION_DOMAIN}', ])

ALLOWED_CORS_ORIGINS = CSRF_TRUSTED_ORIGINS if DEBUG else [f'https://{PRODUCTION_DOMAIN}']
