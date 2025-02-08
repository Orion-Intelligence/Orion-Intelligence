from backend.constants.constant import CONSTANTS
from backend.services.session_manager.shared_model.auth_models import user_account, user_role

secret_password = CONSTANTS.S_AUTH_SECRET_KEY

admin_mock = admin_user = {
  "username": "admin",
  "password": user_account.hash_password(secret_password),
  "role": "admin"
}

crawler_mock = crawler_user = {
  "username": "crawl",
  "password": user_account.hash_password(secret_password),
  "role": user_role.CRAWLER
}
