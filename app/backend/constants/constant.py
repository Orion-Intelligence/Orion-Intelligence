from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext

from backend.helper_manager.env_handler import env_handler


class CONSTANTS:
  S_TEMPLATE_ERROR_WEBSITE_PATH = "trustly/user/server/error/error.html"
  S_TEMPLATE_MAINTENANCE_WEBSITE_PATH = "trustly/user/server/maintenance/maintenance.html"
  S_TEMPLATE_DIRECTORY_WEBSITE_PATH = "trustly/user/interactive/directory/index.html"
  S_TEMPLATE_INDEX_PATH = "trustly/user/interactive/homepage/index.html"
  S_TEMPLATE_SEARCH_WEBSITE_PATH = "trustly/user/interactive/search/search.html"
  S_TEMPLATE_LOGIN_PATH = "trustly/user/interactive/login/index.html"

  # Settings Constants
  S_SETTINGS_INDEX_EXPIRY = 864000
  S_SETTINGS_INDEX_STATS_DAILY_TIMEOUT = 86400
  S_SETTINGS_INDEX_STATS_WEEKLY_TIMEOUT = 604800
  S_SETTINGS_SEARCHED_DOCUMENT_SIZE = 20
  S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC = 20
  S_SETTINGS_FETCHED_DOCUMENT_SIZE = 20
  S_SETTINGS_DIRECTORY_LIST_MAX_SIZE = 1000

  S_AUTH_SECRET_KEY = env_handler.get_instance().env("S_SUPER_PASSWORD")
  S_AUTH_ALGORITHM = "HS256"
  S_AUTH_ACCESS_TOKEN_EXPIRE_MINUTES = 30
  S_AUTH_OAUTH2_SCHEME = OAuth2PasswordBearer(tokenUrl="token")
  S_AUTH_PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")