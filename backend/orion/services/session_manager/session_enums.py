from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, user_role

secret_password = CONSTANTS.S_AUTH_SECRET_KEY
crawl_secret_password = CONSTANTS.S_CRAWL_SECRET_KEY

admin_mock = admin_user = {"username": "admin", "password": db_user_account.hash_password(
    secret_password), "role": "admin"}

crawler_mock = crawler_user = {"username": "crawl", "password": db_user_account.hash_password(
    crawl_secret_password), "role": user_role.CRAWLER}
