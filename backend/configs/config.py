from orion.helper_manager.env_handler import env_handler

DEBUG = env_handler.get_instance().env("PRODUCTION", "0") != "1"
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
