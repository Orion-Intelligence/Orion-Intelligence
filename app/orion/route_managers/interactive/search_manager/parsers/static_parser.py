import math
import random
import string
from datetime import datetime, timezone
from orion.constants.constant import CONSTANTS
from orion.constants.strings import GENERAL_STRINGS, SEARCH_STRINGS
from orion.helper_manager.helper_controller import helper_controller
from orion.route_managers.interactive.search_manager.local_helper_methods.search_helper_methods import search_helper_methods
from orion.route_managers.interactive.search_manager.search_data_model.query_model import query_model
from orion.route_managers.interactive.search_manager.search_enums import SEARCH_CALLBACK, SEARCH_DOCUMENT_CALLBACK
from orion.helper_manager.env_handler import env_handler

class static_parser:

  def __init__(self):
    self.__local_helper_methods = search_helper_methods()

  def __generate_url_context(self, p_document, p_tokenized_query, p_search_model):
    m_title = p_document.get(SEARCH_DOCUMENT_CALLBACK.M_TITLE, "")
    if len(m_title) < 2:
      m_title = p_document.get(SEARCH_DOCUMENT_CALLBACK.M_HOST, "")

    if SEARCH_DOCUMENT_CALLBACK.M_SECTION in p_document:
      m_description = self.__local_helper_methods.clip_sections(p_document[SEARCH_DOCUMENT_CALLBACK.M_SECTION], p_tokenized_query, 300, p_document.get(SEARCH_DOCUMENT_CALLBACK.M_IMPORTANT_DESCRIPTION, "")[:300])
    else:
      m_description = p_document.get(SEARCH_DOCUMENT_CALLBACK.M_IMPORTANT_DESCRIPTION, "")
      if len(m_description) > 400:
        m_description = m_description[:400] + "..."

    m_description = m_description.replace('<dir>', ' ').replace('</dir>', ' ')
    m_description_highlight = self.__local_helper_methods.highlight_tokens_in_text(m_description, p_tokenized_query)

    mRelevanceContextOriginal = {SEARCH_CALLBACK.M_TITLE: self.__local_helper_methods.normalize_text(m_title), SEARCH_CALLBACK.M_URL: p_document.get(SEARCH_DOCUMENT_CALLBACK.M_HOST, "") + p_document.get(SEARCH_DOCUMENT_CALLBACK.M_SUB_HOST, ""), SEARCH_CALLBACK.M_DESCRIPTION: m_description}

    random_id = ''.join(random.choices(string.ascii_letters, k=10))

    m_update_date_str = p_document.get("m_update_date", "")
    try:
      m_update_date = datetime.fromisoformat(m_update_date_str)
    except ValueError:
      m_update_date = datetime.now(timezone.utc)

    current_time = datetime.now(timezone.utc)
    time_difference = (current_time - m_update_date).total_seconds() / 60

    if time_difference < 7200:
      expiry_status = 0
    elif time_difference < 14400:
      expiry_status = 1
    else:
      expiry_status = 2

    if "m_extra_tags" in p_document:
      mRelevanceContext = {SEARCH_CALLBACK.M_NETWORK: p_document.get("m_network", ""), SEARCH_CALLBACK.M_URL: p_document.get(SEARCH_DOCUMENT_CALLBACK.M_SUB_HOST, ""), SEARCH_CALLBACK.M_TITLE: self.__local_helper_methods.normalize_text(m_title), SEARCH_CALLBACK.M_DESCRIPTION_HIGHLIGHT: m_description_highlight, SEARCH_CALLBACK.M_DESCRIPTION: m_description, SEARCH_CALLBACK.M_CONTACT_LINK: [p_document.get("m_contact_link", "")], SEARCH_CALLBACK.M_EXTRALINK: p_document.get("m_extra_tags", ""), SEARCH_CALLBACK.M_WEBLINK: p_document.get("m_weblink", ""), SEARCH_CALLBACK.M_DUMPLINK: p_document.get("m_dumplink", ""), SEARCH_CALLBACK.M_MORE_ID: random_id, SEARCH_CALLBACK.M_FULL_CONTENT: p_document.get("m_content", ""), SEARCH_CALLBACK.K_CONTENT_TYPE: [p_document.get("m_content_type", "")], SEARCH_CALLBACK.M_URL_DISPLAY_TYPE: ["leak"], SEARCH_CALLBACK.M_UPDATE_DATA: m_update_date_str, SEARCH_CALLBACK.M_CREATION_DATA: p_document.get("m_creation_date", ""), SEARCH_CALLBACK.M_EXPIRY: expiry_status}
    else:
      mRelevanceContext = {SEARCH_CALLBACK.M_NETWORK: p_document.get("m_network", ""), SEARCH_CALLBACK.M_TITLE: self.__local_helper_methods.normalize_text(m_title), SEARCH_CALLBACK.M_MORE_ID: random_id, SEARCH_CALLBACK.M_URL: p_document.get(SEARCH_DOCUMENT_CALLBACK.M_SUB_HOST, ""), SEARCH_CALLBACK.M_SECTION: p_document.get("m_section", ""), SEARCH_CALLBACK.M_DESCRIPTION: m_description, SEARCH_CALLBACK.M_DESCRIPTION_HIGHLIGHT: m_description_highlight, SEARCH_CALLBACK.M_URL_DISPLAY_TYPE: "general", SEARCH_CALLBACK.M_UPDATE_DATA: m_update_date_str, SEARCH_CALLBACK.M_EXPIRY: expiry_status, SEARCH_CALLBACK.K_CONTENT_TYPE: p_document.get("m_content_type", ""), SEARCH_CALLBACK.M_NAME: p_document.get("m_names", ""), SEARCH_CALLBACK.M_CONTENT: p_document.get("m_content", ""), SEARCH_CALLBACK.M_DOCUMENT_LEAK: p_document.get("m_document", ""), SEARCH_CALLBACK.M_VIDEO: p_document.get("m_video", ""), SEARCH_CALLBACK.M_ARCHIVE_URL: p_document.get("m_archive_url", ""), SEARCH_CALLBACK.M_CREATION_DATA: p_document.get("m_creation_date", ""),
        SEARCH_CALLBACK.M_EMAILS: p_document.get("m_emails", ""), SEARCH_CALLBACK.M_PHONE_NUMBER: p_document.get("m_phone_numbers", "")}

    if str(p_search_model.m_search_param_model.mSearchParamSafeSearch).lower() in ['false', 'true']:
      return mRelevanceContext, mRelevanceContextOriginal
    else:
      return None, None

  @staticmethod
  def init_generic_item_callbacks(p_search_model: query_model, p_relevance_context_list, p_related_business_list, p_related_news_list, p_related_files_list, total_pages):
    current_page = p_search_model.m_search_param_model.mSearchParamPage
    total_pages = math.ceil(total_pages)  # Ensure total_pages is an integer

    # Determine start and end page for pagination display
    start_page = max(1, current_page - 2)
    end_page = min(total_pages, current_page + 2)

    # Ensure a full range of 5 pages is displayed if possible
    if end_page - start_page < 4:
      if start_page == 1:
        end_page = min(total_pages, start_page + 4)
      elif end_page == total_pages:
        start_page = max(1, end_page - 4)

    if p_search_model.m_search_param_model.mSearchParamPage > total_pages:
      p_search_model.m_page_number = total_pages

    if len(p_relevance_context_list) < 5:
      total_pages = p_search_model.m_search_param_model.mSearchParamPage
      end_page = total_pages

    page_range = range(start_page, end_page + 1)
    api_access = env_handler.get_instance().env('API_ACCESS')
    m_context = {SEARCH_CALLBACK.M_API_ACCESS:api_access, SEARCH_CALLBACK.M_NETWORK: p_search_model.m_search_param_model.mNetwork, SEARCH_CALLBACK.M_QUERY: p_search_model.m_search_param_model.q, SEARCH_CALLBACK.M_SAFE_SEARCH: p_search_model.m_search_param_model.mSearchParamSafeSearch, SEARCH_CALLBACK.M_CURRENT_PAGE_NUM: p_search_model.m_search_param_model.mSearchParamPage, SEARCH_CALLBACK.K_SEARCH_TYPE: p_search_model.m_search_param_model.pSearchParamType, SEARCH_CALLBACK.M_DOCUMENT: p_relevance_context_list, SEARCH_CALLBACK.M_PAGE_NUM: page_range, SEARCH_CALLBACK.M_MAX_PAGINATION: total_pages, SEARCH_CALLBACK.M_RESULT_COUNT: GENERAL_STRINGS.S_GENERAL_EMPTY, SEARCH_CALLBACK.M_RELATED_BUSINESS_SITES: p_related_business_list, SEARCH_CALLBACK.M_RELATED_NEWS_SITES: p_related_news_list, SEARCH_CALLBACK.M_RELATED_FILES: p_related_files_list}

    return m_context

  def init_callback(self, p_document_list, p_search_model: query_model, total_pages):
    m_relevance_context_list = []
    m_related_business_list = []
    m_related_news_list = []
    m_related_files_list = []

    p_tokenized_query = p_search_model.m_search_param_model.q.lower().split(" ")

    total_p_document_list_length = len(p_document_list)

    if p_search_model.m_search_param_model.mSearchParamPage != 1:
      p_document_list = p_document_list[:CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE]

    m_documents_length = len(p_document_list)

    m_clearnet_links_count = sum(len(doc['m_clearnet_links']) for doc in p_document_list if 'm_clearnet_links' in doc)
    m_document_count = sum(len(doc['m_document']) for doc in p_document_list if 'm_document' in doc)

    m_links_counter = 0
    active_links = 0
    seldom_active_links = 0
    inactive_links = 0

    m_emails = set()
    unique_urls = []
    m_phone_number = set()
    m_archive_url = set()
    m_document_result = set()

    for m_document in p_document_list:
      m_links_counter += 1

      if p_search_model.m_search_param_model.pSearchParamType != SEARCH_STRINGS.S_SEARCH_CONTENT_TYPE_IMAGE:
        m_relevance_context, m_relevance_context_original = self.__generate_url_context(m_document, p_tokenized_query, p_search_model)
        if m_relevance_context:
          m_relevance_context_list.append(m_relevance_context)

      if 'm_creation_date' in m_document and 'm_update_date' in m_document:
        try:
          m_creation_date = datetime.fromisoformat(m_document['m_creation_date'].replace('Z', '+00:00'))
          m_update_date = datetime.fromisoformat(m_document['m_update_date'].replace('Z', '+00:00'))
          days_difference = (m_update_date - m_creation_date).days

          if days_difference <= 5:
            active_links += 1
          elif days_difference <= 10:
            seldom_active_links += 1
          else:
            inactive_links += 1
        except ValueError:
          pass

      if 'm_emails' in m_document and isinstance(m_document['m_emails'], list):
        m_emails.update(m_document['m_emails'])

      if 'm_url' in m_document:
        unique_urls.append({'m_title': m_document.get('m_title', 'Untitled'), 'm_url': m_document['m_url']})

      if 'm_phone_numbers' in m_document and isinstance(m_document['m_phone_numbers'], list):
        m_phone_number.update(m_document['m_phone_numbers'])

      if 'm_archive_url' in m_document and isinstance(m_document['m_archive_url'], list):
        m_archive_url.update(m_document['m_archive_url'])

      if 'm_document' in m_document and isinstance(m_document['m_document'], list):
        m_document_result.update(m_document['m_document'])

    mContext = self.init_generic_item_callbacks(p_search_model, m_relevance_context_list, m_related_business_list, m_related_news_list, m_related_files_list, total_pages)

    mContext['analytics'] = {'m_document': list(m_document_result), 'mPhoneNumber': list(m_phone_number), 'mArchiveUrl': list(m_archive_url), 'm_emails': list(m_emails), 'unique_urls': unique_urls, 'total_p_document_list_length': total_p_document_list_length, 'm_documents_length': m_documents_length, 'm_clearnet_links_count': m_clearnet_links_count, 'm_document_count': m_document_count, 'active_links': active_links, 'seldom_active_links': seldom_active_links, 'inactive_links': inactive_links, }

    if p_search_model.m_total_documents >= CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE:
      mContext[SEARCH_CALLBACK.M_RESULT_COUNT] = helper_controller.on_create_random_search_count(p_search_model.m_total_documents)
    else:
      mContext[SEARCH_CALLBACK.M_RESULT_COUNT] = p_search_model.m_total_documents

    return mContext, True
