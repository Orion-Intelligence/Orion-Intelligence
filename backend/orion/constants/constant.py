from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

from orion.helper_manager.env_handler import env_handler


class CONSTANTS:
    S_SETTINGS_INDEX_EXPIRY_TIMEOUT = 5184000
    S_SETTINGS_INDEX_EXPIRY = 15
    S_SETTINGS_INDEX_STATS_DAILY_TIMEOUT = 15
    S_SETTINGS_INDEX_STATS_WEEKLY_TIMEOUT = 604800
    S_SETTINGS_SEARCHED_DOCUMENT_SIZE = 10
    S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC = 10
    S_SETTINGS_SEARCHED_DOCUMENT_SIZE_CONSOLIDATED = 15
    S_SETTINGS_FETCHED_DOCUMENT_SIZE = 30
    S_SETTINGS_FETCHED_INSIGHT_DOCUMENT_SIZE = 10
    S_SETTINGS_DIRECTORY_LIST_MAX_SIZE = 1000
    S_SETTINGS_SEARCH_MAX_DYNAMIC_RESOURCE_LIMIT = 1

    S_AUTH_SECRET_KEY = env_handler.get_instance().env("S_SUPER_PASSWORD_V1")
    S_CRAWL_SECRET_KEY = env_handler.get_instance().env("S_CRAWLER_PASSWORD")
    S_AUTH_ALGORITHM = "HS256"
    S_AUTH_ACCESS_TOKEN_EXPIRE_MINUTES = 30
    S_AUTH_OAUTH2_SCHEME = OAuth2PasswordBearer(tokenUrl="token")
    S_AUTH_PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")
    S_ENCRYPTION_KEY = env_handler.get_instance().env("ENCRYPTION_KEY")


allowed_keys: set[str] = set()
mail_template = None
license_rules = {}
