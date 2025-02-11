from backend.helper_manager.env_handler import env_handler


class ELASTIC_INDEX:
  S_GENERIC_INDEX = "generic_model"
  S_LEAK_INDEX = "leak_model"


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

class ELASTIC_ENUMS:
  mapping_leakdatamodel = {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "max_result_window": 1000000
    },
    "mappings": {
      "dynamic": "true",
      "dynamic_templates": [
        {
          "strings_as_keywords": {
            "match_mapping_type": "string",
            "mapping": {
              "type": "keyword"
            }
          }
        }
      ],
      "properties": {
        "m_title": {"type": "text"},
        "m_url": {"type": "keyword"},
        "m_base_url": {"type": "keyword"},
        "m_content": {"type": "text"},
        "m_important_content": {"type": "text"},
        "m_network": {"type": "keyword"},
        "m_content_type": {"type": "keyword"},
        "m_weblink": {"type": "keyword"},
        "m_dumplink": {"type": "keyword"},
        "m_name": {"type": "text"},
        "m_email_addresses": {"type": "keyword"},
        "m_industry": {"type": "keyword"},
        "m_phone_numbers": {"type": "keyword"},
        "m_addresses": {"type": "keyword"},
        "m_social_media_profiles": {"type": "keyword"},
        "m_websites": {"type": "keyword"},
        "m_company_name": {"type": "keyword"},
        "m_logo_or_images": {"type": "keyword"},
        "m_leak_date": {"type": "date"},
        "m_data_size": {"type": "keyword"},
        "m_country_name": {"type": "keyword"},
        "m_revenue": {"type": "keyword"},
        "m_update_date": {"type": "date"},
        "m_creation_date": {"type": "date"}
      }
    }
  }

  mapping_generic_model = {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "max_result_window": 1000000
    },
    "mappings": {
      "dynamic": "true",
      "dynamic_templates": [
        {
          "strings_as_keywords": {
            "match_mapping_type": "string",
            "mapping": {
              "type": "keyword"
            }
          }
        }
      ],
      "properties": {
        "m_hash": {"type": "keyword"},
        "m_network": {"type": "keyword"},
        "m_hash_url": {"type": "keyword"},
        "m_title": {"type": "text"},
        "m_meta_description": {"type": "text"},
        "m_content": {"type": "text"},
        "m_update_date": {"type": "date"},
        "m_creation_date": {"type": "date"},
        "m_content_type": {"type": "keyword"}
      }
    }
  }
