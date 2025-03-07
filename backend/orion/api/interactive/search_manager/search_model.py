from typing import Optional

from pydantic import ValidationError

from orion.api.interactive.search_manager.parsers.dynamic_parser import dynamic_parser
from orion.api.interactive.search_manager.parsers.static_parser import static_parser
from orion.api.interactive.search_manager.search_data_model.dynamic import search_dynamic_param_model
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_callback_model import breach_data
from orion.api.interactive.search_manager.search_data_model.enums import leak_listing, general_listing
from orion.api.interactive.search_manager.search_data_model.general import search_general_param_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import search_general_callback_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import search_leak_callback_model
from orion.api.interactive.search_manager.search_data_model.search_callback_model import search_callback_model, result_item
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from orion.api.interactive.search_manager.search_data_model.query_model import query_model
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.constants.constant import CONSTANTS
from orion.constants.strings import GENERAL_STRINGS
from orion.api.interactive.search_manager.search_enums import SEARCH_CALLBACK
from orion.api.interactive.search_manager.spell_checker import spell_checker
from orion.api.server.external_request_manager.external_request_controller import external_request_controller


class search_model:
  # Private Variables
  __instance = None
  __m_session = None
  __m_spell_checker = None

  # Initializations
  def __init__(self):
    self.__m_spell_checker = spell_checker()
    self.__static_parser = static_parser()
    self.__dynamic_parser = dynamic_parser()

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

  async def __query_results(self, param:search_leak_param_model):
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
        m_context, m_status = self.__static_parser.init_callback(m_parsed_documents, m_query_model, total_pages)
        m_context[SEARCH_CALLBACK.M_QUERY_ERROR_URL], m_context[SEARCH_CALLBACK.M_QUERY_ERROR] = self.__m_spell_checker.generate_suggestions(m_query_model.m_search_param_model.q, m_suggestions_content)

        return m_status, m_context

  async def init_page(self, param:search_leak_param_model):
    mStatus, mResult = await self.__query_results(param)
    return mResult

  @staticmethod
  async def dynamic_search_email(param: search_dynamic_param_model):
    result = await external_request_controller.getInstance().fetch_email_leak(param)

    if isinstance(result, list) and len(result)>0:
      return breach_data(**(result[0]))
    else:
      return breach_data().model_dump()

  async def seach_general(self, param: search_general_param_model):
    m_status, m_documents = await elastic_controller.get_instance().search_query_general(param)
    if not m_status:
      return search_callback_model(Result=[], Suggestions=[], Page_Count=0)

    parsed_result = await self.__parse_filtered_documents(m_documents)
    m_parsed_documents, m_suggestions_content, total_pages = parsed_result

    filtered_results = [
      {k: v for k, v in doc.items() if k not in general_listing}
      for doc in m_parsed_documents
    ]

    return search_general_callback_model(
      Result=filtered_results,
      Suggestions=m_suggestions_content,
      Page_Count=total_pages
    )

  @staticmethod
  async def get_leak_doc(doc_id) -> Optional[result_item]:
    try:
      results = await elastic_controller.get_instance().get_leak_doc(doc_id)
      if results:
        return result_item(**results[0])
      return None
    except ValidationError:
      return None

  @staticmethod
  async def get_general_doc(doc_id) -> Optional[result_item]:
    try:
      results = await elastic_controller.get_instance().get_general_doc(doc_id)
      if results:
        return result_item(**results[0])
      return None
    except ValidationError:
      return None

  async def seach_leak_result(self, param: search_leak_param_model):
    m_status, m_documents = await elastic_controller.get_instance().search_query_leak(param)
    if not m_status:
      return search_callback_model(Result=[], Suggestions=[], Page_Count=0)

    parsed_result = await self.__parse_filtered_documents(m_documents)
    m_parsed_documents, m_suggestions_content, total_pages = parsed_result

    filtered_results = [
      {k: v for k, v in doc.items() if k not in leak_listing}
      for doc in m_parsed_documents
    ]

    return search_leak_callback_model(
      Result=filtered_results,
      Suggestions=m_suggestions_content,
      Page_Count=total_pages
    )
