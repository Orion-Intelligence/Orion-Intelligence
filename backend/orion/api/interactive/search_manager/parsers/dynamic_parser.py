import json
from orion.constants.strings import GENERAL_STRINGS
from orion.api.interactive.search_manager.search_enums import SEARCH_CALLBACK, API_RESPONSE
from orion.helper_manager.env_handler import env_handler

class dynamic_parser:

  @staticmethod
  def __init_runtime_parser(p_document_list, p_status, p_search_model):
    api_access = env_handler.get_instance().env('API_ACCESS')
    if p_status == API_RESPONSE.M_PENDING:
      m_context = {SEARCH_CALLBACK.M_API_ACCESS: api_access, SEARCH_CALLBACK.M_DYNAMIC_PARSER_STATUS: "false", SEARCH_CALLBACK.M_QUERY: p_search_model.m_search_query, SEARCH_CALLBACK.M_SAFE_SEARCH: p_search_model.m_safe_search, SEARCH_CALLBACK.M_CURRENT_PAGE_NUM: p_search_model.m_page_number, SEARCH_CALLBACK.K_SEARCH_TYPE: p_search_model.m_search_type, SEARCH_CALLBACK.M_PAGE_NUM: 1, SEARCH_CALLBACK.M_MAX_PAGINATION: 1, SEARCH_CALLBACK.M_RESULT_COUNT: GENERAL_STRINGS.S_GENERAL_EMPTY, SEARCH_CALLBACK.M_SECURE_SERVICE_NOTICE: p_search_model.m_site, SEARCH_CALLBACK.M_USERNAME_QUERY: p_search_model.m_username}
      return True, m_context

    else:
      m_documents = json.loads(p_document_list) if isinstance(p_document_list, str) else p_document_list
      merged_data = {}

      for document in m_documents:
        base_url = document.get("base_url", "")
        for card in document.get("cards_data", []):
          for key, value in card.items():
            if key not in merged_data:
              merged_data[key] = []
            if isinstance(value, list):
              merged_data[key].extend(value)
            elif value is not None and len(value) > 2:
              merged_data[key].append(value)
          if "m_url" not in card:
            if "m_url" not in merged_data:
              merged_data["m_url"] = []
            merged_data["m_url"].append(base_url)

      for key in merged_data:
        merged_data[key] = list(set(merged_data[key]))

      modified_data = {}
      for key in merged_data:
        new_key = key.replace("m_", "").replace("_", " ").title()
        modified_data[new_key] = merged_data[key]

      api_access = env_handler.get_instance().env('API_ACCESS')
      m_context = {SEARCH_CALLBACK.M_API_ACCESS: api_access, SEARCH_CALLBACK.M_DYNAMIC_PARSER_STATUS: "true", SEARCH_CALLBACK.M_QUERY: p_search_model.m_search_query, SEARCH_CALLBACK.M_SAFE_SEARCH: p_search_model.m_safe_search, SEARCH_CALLBACK.M_CURRENT_PAGE_NUM: p_search_model.m_page_number, SEARCH_CALLBACK.K_SEARCH_TYPE: p_search_model.m_search_type, SEARCH_CALLBACK.M_DOCUMENT: modified_data, SEARCH_CALLBACK.M_PAGE_NUM: 1, SEARCH_CALLBACK.M_MAX_PAGINATION: 1, SEARCH_CALLBACK.M_RESULT_COUNT: GENERAL_STRINGS.S_GENERAL_EMPTY, SEARCH_CALLBACK.M_SECURE_SERVICE_NOTICE: p_search_model.m_site, SEARCH_CALLBACK.M_USERNAME_QUERY: p_search_model.m_username}

      return True, m_context
