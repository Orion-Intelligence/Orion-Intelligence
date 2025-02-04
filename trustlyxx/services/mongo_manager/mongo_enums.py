from app.backend.helper_manager.env_handler import env_handler
import enum


class MONGODB_COLLECTIONS:
  S_UNIQUE_URL = 'm_unique_url'
  S_SUBMIT = 'm_submitted_websites'
  S_USER_MODEL = 'm_users'
  S_STATUS = 'm_status'
  S_URL_STATUS = 'm_url_status'

class MONGO_COMMANDS(enum.Enum):
  M_REPORT_URL = 1
  M_UPLOAD_URL = 2
  M_FIND_URL = 3
  M_FIND_SECRET_KEY = 4
  M_SEARCH_BY_TOKEN = 5
  M_TOTAL_DOCUMENTS = 6
  M_FETCH_DOCUMENT_BY_ID = 7
  M_ONION_LIST = 8
  M_VERIFY_CREDENTIAL = 9
  M_UPDATE_STATUS = 10
  M_FETCH_STATUS = 11
  M_READ_RAW = 12
  M_UNIQUE_URL_ADD = 13
  M_UNIQUE_URL_CLEAR = 14
  M_UNIQUE_URL_READ = 15
  M_CRAWL_HEARTBEAT = 16
  M_CRONHEARTBEAT = 17
  M_UPDATE_URL_STATUS = 18
  M_GET_URL_STATUS = 19

class MONGO_CONNECTIONS:
  S_MONGO_DATABASE_NAME = 'backend-web'
  S_MONGO_DATABASE_PORT = 27017
  S_MONGO_DATABASE_IP = 'mongo'
  S_MONGO_USERNAME = env_handler.get_instance().env('MONGO_ROOT_USERNAME')
  S_MONGO_PASSWORD = env_handler.get_instance().env('MONGO_ROOT_PASSWORD')


class MONGODB_KEYS:
  S_DOCUMENT = 'm_document'
  S_FILTER = 'm_filter'
  S_VALUE = 'm_value'


class MONGODB_CRUD:
  S_CREATE = 1
  S_READ = 2
  S_UPDATE = 3
  S_DELETE = 4
  S_REPLACE = 5


class MANAGE_MONGO_MESSAGES:
  S_INSERT_FAILURE = "[1] Something unexpected happened while inserting"
  S_INSERT_SUCCESS = "[2] Document Created Successfully"
  S_UPDATE_FAILURE = "[3] Something unexpected happened while updating"
  S_UPDATE_SUCCESS = "[4] Data Updated Successfully"
  S_DELETE_FAILURE = "[5] Something unexpected happened while deleting"
  S_REPLACE_SUCCESS = "[4] Data Replaced Successfully"
  S_REPLACE_FAILURE = "[5] Something unexpected happened while replacing"
  S_DELETE_SUCCESS = "[6] Data Deleted Successfully"
  S_READ_FAILURE = "[5] Something unexpected happened while reading"
  S_READ_SUCCESS = "[6] Data Read Successfully"
