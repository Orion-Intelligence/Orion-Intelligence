from backend.route_managers.interactive.search_manager.search_data_model import search_dynamic_param_model
from backend.route_managers.interactive.search_manager.search_data_model.search_api_callback_model import search_api_callback_model
from backend.route_managers.interactive.search_manager.search_data_model.search_api_param_model import search_api_param_model
from backend.route_managers.interactive.search_manager.search_data_model.search_param_model import search_param_model
from backend.route_managers.interactive.search_manager.search_data_model.query_model import query_model
from backend.services.elastic_manager.elastic_controller import elastic_controller
from backend.constants.constant import CONSTANTS
from backend.constants.strings import GENERAL_STRINGS
from backend.route_managers.interactive.search_manager.search_enums import SEARCH_CALLBACK
from backend.route_managers.interactive.search_manager.search_session_controller import search_session_controller
from backend.route_managers.interactive.search_manager.spell_checker import spell_checker
from backend.route_managers.server.external_request_manager.external_request_controller import external_request_controller


class search_model:
  # Private Variables
  __instance = None
  __m_session = None
  __m_spell_checker = None

  # Initializations
  def __init__(self):
    self.__m_session = search_session_controller()
    self.__m_spell_checker = spell_checker()

  @staticmethod
  async def __parse_filtered_documents(p_paged_documents):
    mRelevanceListData = []
    mDescription = set()
    total_pages = 0

    try:
      total_hits = p_paged_documents.get('hits', {}).get('total', {}).get('value', 0)
      if total_hits > 0:
        total_pages = total_hits / CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE

      m_result_final = p_paged_documents.get('hits', {}).get('hits', [])

      for m_document in m_result_final:
        m_service = m_document.get('_source', None)
        if not m_service:
          continue

        m_service['m_sub_host'] = m_service.get('m_sub_host', '/')
        m_service['m_host'] = m_service.get('m_host', '')

        m_content_preview = m_service.get("m_content", "")[:500]
        if type(m_content_preview) is not list and m_content_preview in mDescription:
          continue
        else:
          if type(m_content_preview) is not list:
            mDescription.add(m_content_preview)
          else:
            for item in m_content_preview:
              mDescription.add(item)

        mRelevanceListData.append(m_service)

      content_suggestions = p_paged_documents.get('suggest', {}).get('content_suggestion', [])

      return mRelevanceListData, content_suggestions, total_pages

    except Exception as e:
      print("Error parsing filtered documents:", e)
      return mRelevanceListData, [], total_pages

  async def __query_results(self, param:search_param_model):
    m_query_model = query_model()
    m_query_model.m_search_param_model = param
    if m_query_model.m_search_param_model.pSearchParamType != "persona":
      if m_query_model.m_search_param_model.q == GENERAL_STRINGS.S_GENERAL_EMPTY:
        return False, None
      else:
        result = await elastic_controller.get_instance().search_query(m_query_model.m_search_param_model)
        m_status, m_documents = result
        m_parsed_documents, m_suggestions_content, total_pages = await self.__parse_filtered_documents(m_documents)
        m_query_model.set_total_documents(len(m_parsed_documents))
        m_context, m_status = self.__m_session.init_static_callback(m_parsed_documents, m_query_model, total_pages)
        m_context[SEARCH_CALLBACK.M_QUERY_ERROR_URL], m_context[SEARCH_CALLBACK.M_QUERY_ERROR] = self.__m_spell_checker.generate_suggestions(m_query_model.m_search_param_model.q, m_suggestions_content)

        return m_status, m_context

  async def init_page(self, param:search_param_model):
    mStatus, mResult = await self.__query_results(param)
    return mResult

  @staticmethod
  async def dynamic_search_result(param: search_dynamic_param_model):
    result = await external_request_controller.getInstance().fetch_runtime_parser_async(param)
    return result

  @staticmethod
  async def api_dynamic_search_result(param: search_dynamic_param_model):
    result = await external_request_controller.getInstance().fetch_runtime_parser_async(param)
    return result

  async def api_seach_result(self, param: search_api_param_model):
    m_status, m_documents = await elastic_controller.get_instance().search_query_api(param)
    if not m_status:
      return search_api_callback_model(Result=[], Suggestions=[], Page_Count=0)

    parsed_result = await self.__parse_filtered_documents(m_documents)
    m_parsed_documents, m_suggestions_content, total_pages = parsed_result

    return search_api_callback_model(
      Result=m_parsed_documents,
      Suggestions=m_suggestions_content,
      Page_Count=total_pages
    )
