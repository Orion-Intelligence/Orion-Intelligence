from app.backend.helper_manager.env_handler import env_handler


class ELASTIC_CRUD_COMMANDS:
  S_CREATE = 1
  S_READ = 2
  S_UPDATE = 3
  S_DELETE = 4
  S_SUGGEST = 5
  S_READ_RAW = 6
  S_INDEX = 7
  S_INSIGHT = 8


class ELASTIC_INDEX:
  S_GENERIC_INDEX = "generic_model"
  S_LEAK_INDEX = "leak_model"


class ELASTIC_INDEX_COLLECTION:
  M_HOST = "m_host"
  M_CONTENT_TYPE = "m_content_type"


class ELASTIC_CONNECTIONS:
  S_DATABASE_NAME = 'backend-elastic-search'
  S_DATABASE_PORT = 9400
  S_DATABASE_IP = 'http://elasticsearch'
  S_ELASTIC_USERNAME = env_handler.get_instance().env('ELASTIC_ROOT_USERNAME')
  S_ELASTIC_PASSWORD = env_handler.get_instance().env('ELASTIC_ROOT_PASSWORD')


class ELASTIC_KEYS:
  S_ID = 'm_id'
  S_DOCUMENT = 'm_document'
  S_FILTER = 'm_filter'
  S_VALUE = 'm_value'


class ELASTIC_REQUEST_COMMANDS:
  S_SEARCH = 1
  S_ONION_LIST = 2
  S_INDEX_GENERAL = 4
  S_INDEX_LEAK = 5
  S_CLEAR_EXPIRE_INDEX = 6
  S_GENERATE_INSIGHT = 7


class MANAGE_ELASTIC_MESSAGES:
  S_INSERT_FAILURE = "[1] Something unexpected happened while inserting"
  S_INSERT_SUCCESS = "[2] Document Created Successfully"
  S_UPDATE_FAILURE = "[3] Something unexpected happened while updating"
  S_UPDATE_SUCCESS = "[4] Data Updated Successfully"
  S_DELETE_FAILURE = "[5] Something unexpected happened while deleting"
  S_DELETE_SUCCESS = "[6] Data Deleted Successfully"
  S_READ_FAILURE = "[5] Something unexpected happened while reading"
  S_READ_SUCCESS = "[6] Data Read Successfully"
  S_COUNT_FAILURE = "[1] Something unexpected happened while counting"
