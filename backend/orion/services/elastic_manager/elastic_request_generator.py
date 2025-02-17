import hashlib
from datetime import datetime, timedelta, timezone

from orion.constants.constant import CONSTANTS
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS, ELASTIC_INDEX


class elastic_request_generator:
  @staticmethod
  def on_search_leakdata(p_query_model):
    m_user_query = p_query_model.q.lower() + "*"
    m_safe_search = p_query_model.mSearchParamSafeSearch
    m_page_number = p_query_model.mSearchParamPage
    m_network = p_query_model.mNetwork
    must_clauses = []
    must_not_clause = []

    # Safe search filtering
    if m_safe_search == "True":
      must_not_clause.append({"term": {"m_content_type": "adult"}})

    # Network filtering
    if m_network and m_network != "all":
      must_clauses.append({"term": {"m_network": m_network}})

    # Query statement construction
    query_statement = {
      "min_score": 0,
      "query": {
        "function_score": {
          "query": {
            "bool": {
              "must": must_clauses,
              "should": [
                {
                  "query_string": {
                    "query": m_user_query,
                    "fields": [
                      "m_title^3",
                      "m_meta_description^2",
                      "m_content^1.5",
                      "m_important_content^1.5",
                      "m_content_tokens^2",
                      "m_keywords^1.8",
                    ],
                    "default_operator": "OR",
                    "lenient": True,
                    "analyze_wildcard": True,
                  }
                }
              ],
              "must_not": must_not_clause,
            }
          },
          "functions": [
            {
              "gauss": {
                "m_update_date": {
                  "origin": "now",
                  "scale": "30d",
                  "offset": "10d",
                  "decay": 0.5,
                }
              },
              "weight": 2,
            }
          ],
          "boost_mode": "sum",
        }
      },
      "suggest": {
        "important_content_suggestion": {
          "text": m_user_query,
          "term": {
            "field": "m_important_content",
            "min_word_length": 3,
            "max_term_freq": 0.05,
            "sort": "score",
            "string_distance": "levenshtein",
          },
        },
        "content_suggestion": {
          "text": m_user_query,
          "term": {
            "field": "m_content",
            "min_word_length": 3,
            "max_term_freq": 0.05,
            "sort": "score",
            "string_distance": "levenshtein",
          },
        },
      },
      "from": (m_page_number - 1) * CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE_GENERIC,
      "size": CONSTANTS.S_SETTINGS_FETCHED_DOCUMENT_SIZE,
      "track_total_hits": True,
    }

    return ELASTIC_INDEX.S_LEAK_INDEX, query_statement

  @staticmethod
  def clear_expire_index():
    utc_now = datetime.now(timezone.utc)
    threshold_time = utc_now - timedelta(seconds=CONSTANTS.S_SETTINGS_INDEX_EXPIRY)
    return {
      "query": {"range": {"m_update_date": {"lt": threshold_time.isoformat()}}}
    }

  @staticmethod
  def index_query_general(p_index_data):
    index_entries = []
    utc_now = datetime.now(timezone.utc)
    current_timestamp = utc_now.isoformat()

    if isinstance(p_index_data, list):
      pass
    else:
      p_index_data["m_update_date"] = current_timestamp
      p_index_data["m_hash_content"] = hashlib.sha256(
        (p_index_data["m_important_content"] + p_index_data["m_title"]).encode()
      ).hexdigest()
      p_index_data["m_hash_url"] = hashlib.sha256(
        (p_index_data["m_url"] + p_index_data["m_title"]).encode()
      ).hexdigest()
      p_index_data["m_hash"] = p_index_data["m_url"]

      index_entries.append(
        {
          ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
          ELASTIC_KEYS.S_VALUE: p_index_data,
        }
      )

    return index_entries

  @staticmethod
  def index_query_leak(p_index_data):
    contact_link = p_index_data.get("contact_link", "")
    index_entries = []
    utc_now = datetime.now(timezone.utc)
    current_timestamp = utc_now.isoformat()

    for card in p_index_data.get("cards_data", []):
      data_hash = helper_controller.generate_data_hash(card)
      card["m_hash"] = data_hash
      card["m_update_date"] = current_timestamp
      card["m_contact_link"] = contact_link
      index_entries.append(
        {
          ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
          ELASTIC_KEYS.S_VALUE: card,
        }
      )

    return index_entries

  @staticmethod
  def generate_insight_queries():
    queries = [
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {"Document Count": {"value_count": {"field": "m_hash"}}},
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {"Most Recent": {"max": {"field": "m_update_date"}}},
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {"Oldest Update": {"min": {"field": "m_update_date"}}},
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "query": {"range": {"m_update_date": {"gte": "now-5d/d"}}},
          "aggs": {
            "Updated 5 Days ago": {"value_count": {"field": "m_hash"}}
          },
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "query": {"range": {"m_update_date": {"gte": "now-10d/d"}}},
          "aggs": {
            "Updated 9 Days ago": {"value_count": {"field": "m_hash"}}
          },
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {"Average Score": {"avg": {"field": "m_validity_score"}}},
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {"URL/Document": {"value_count": {"field": "m_sub_url"}}},
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {
            "Archive/Document": {"value_count": {"field": "m_archive_url"}}
          },
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {"Email/Document": {"value_count": {"field": "m_emails"}}},
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {
            "Phone/Document": {"value_count": {"field": "m_phone_numbers"}}
          },
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {
            "Clearnet/Document": {
              "value_count": {"field": "m_clearnet_links"}
            }
          },
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {
            "Common Type": {
              "terms": {"field": "m_content_type", "size": 1}
            }
          },
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {"Document Count": {"value_count": {"field": "m_hash"}}},
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {
            "Unique Base URLs": {"value_count": {"field": "m_base_url"}}
          },
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {"URL/Documents": {"value_count": {"field": "m_weblink"}}},
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {
            "Dumps/Document": {"value_count": {"field": "m_dumplink"}}
          },
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "query": {"range": {"m_update_date": {"gte": "now-5d/d"}}},
          "aggs": {
            "Updated 5 Days ago": {"value_count": {"field": "m_hash"}}
          },
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "query": {"range": {"m_update_date": {"gte": "now-10d/d"}}},
          "aggs": {
            "Updated 9 Days ago": {"value_count": {"field": "m_hash"}}
          },
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {"Most Recent": {"max": {"field": "m_update_date"}}},
        },
      },
      {
        ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX,
        ELASTIC_KEYS.S_FILTER: {
          "size": 0,
          "aggs": {"Oldest Update": {"min": {"field": "m_update_date"}}},
        },
      },
    ]

    return queries
