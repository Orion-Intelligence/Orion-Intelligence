import math

from app.backend.constants.constant import CONSTANTS
from app.backend.view_managers.interactive.directory_manager.directory_enums import DIRECTORY_CALLBACK, DIRECTORY_PARAMS, DIRECTORY_SESSION_COMMANDS
from app.backend.view_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_class_model
from app.services.request_manager.request_handler import request_handler


class directory_session_controller(request_handler):

  # Helper Methods
  @staticmethod
  def __pre_init_parameters(p_data):
    m_browser = False
    if DIRECTORY_PARAMS.M_PAGE_NUMBER in p_data.GET:
      m_num = int(p_data.GET[DIRECTORY_PARAMS.M_PAGE_NUMBER])
    else:
      m_num = 1

    if DIRECTORY_PARAMS.M_CONTENT_TYPE in p_data.GET:
      m_type = p_data.GET[DIRECTORY_PARAMS.M_CONTENT_TYPE]
    else:
      m_type = ""
    if DIRECTORY_PARAMS.M_INDEX in p_data.GET:
      m_index = p_data.GET[DIRECTORY_PARAMS.M_INDEX]
    else:
      m_index = ""

    if DIRECTORY_PARAMS.M_NETWORK in p_data.GET:
      m_network = p_data.GET[DIRECTORY_PARAMS.M_NETWORK]
    else:
      m_network = ""

    if m_num < 1:
      m_num = 1

    m_directory_model = directory_class_model(m_num, None, m_type, m_index, m_network)

    if DIRECTORY_PARAMS.M_SECURE_SERVICE in p_data.GET:
      m_directory_model.m_site = p_data.GET[DIRECTORY_PARAMS.M_SECURE_SERVICE]

    return m_directory_model, True, m_browser

  @staticmethod
  def __init_parameters(p_links, p_count):
    total_pages = max(1, math.ceil(p_count / CONSTANTS.S_SETTINGS_DIRECTORY_LIST_MAX_SIZE))

    current_page = p_links.m_page_number
    max_display_pages = 5
    half_range = max_display_pages // 2

    if total_pages <= max_display_pages:
      start_page = 1
      end_page = total_pages
    elif current_page <= half_range:
      start_page = 1
      end_page = min(max_display_pages, total_pages)
    elif current_page > total_pages - half_range:
      start_page = max(1, total_pages - max_display_pages + 1)
      end_page = total_pages
    else:
      start_page = current_page - half_range
      end_page = min(current_page + half_range, total_pages)

    # Calculate the starting index for the current page
    items_per_page = CONSTANTS.S_SETTINGS_DIRECTORY_LIST_MAX_SIZE
    starting_index = (current_page - 1) * items_per_page + 1
    indexed_items = [{**item, "index": idx + starting_index} for idx, item in enumerate(p_links.m_row_model_list[0:len(p_links.m_row_model_list)])]

    m_context = {DIRECTORY_CALLBACK.M_PAGE_NUMBER: current_page, DIRECTORY_CALLBACK.M_NETWORK: p_links.m_network, DIRECTORY_CALLBACK.M_TOTAL_PAGES: total_pages, DIRECTORY_CALLBACK.M_START_PAGE: start_page, DIRECTORY_CALLBACK.M_ENDPAGE: end_page, DIRECTORY_CALLBACK.M_PAGINATION: range(start_page, end_page + 1), DIRECTORY_CALLBACK.M_SECURE_SERVICE_NOTICE: p_links.m_site, DIRECTORY_CALLBACK.M_ONION_LINKS: indexed_items,
      DIRECTORY_CALLBACK.M_MAX_PAGE_REACHED: len(p_links.m_row_model_list) <= items_per_page - 2, DIRECTORY_CALLBACK.M_CONTENT_TYPE: p_links.m_content_type, DIRECTORY_CALLBACK.M_INDEX: p_links.m_index, }

    if p_links.m_page_number > 1 and len(p_links.m_row_model_list) == 0:
      return m_context, False
    else:
      return m_context, True

  def __validate_parameters(self, p_context):
    pass

  # External Request Callbacks
  def invoke_trigger(self, p_command, p_data):
    if p_command == DIRECTORY_SESSION_COMMANDS.M_PRE_INIT:
      return self.__pre_init_parameters(p_data[0])
    if p_command == DIRECTORY_SESSION_COMMANDS.M_INIT:
      return self.__init_parameters(p_data[0], p_data[1])
