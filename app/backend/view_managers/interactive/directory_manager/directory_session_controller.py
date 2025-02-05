import math

from backend.constants.constant import CONSTANTS
from backend.view_managers.interactive.directory_manager.directory_shared_model.directory_callback_model import directory_callback_model, directory_callback_link


class directory_session_controller:


  @staticmethod
  def init_callback(p_links, m_row_model_list, p_count):
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

    items_per_page = CONSTANTS.S_SETTINGS_DIRECTORY_LIST_MAX_SIZE
    starting_index = (current_page - 1) * items_per_page + 1

    indexed_items = [
      directory_callback_link(**{**item, "index": idx + starting_index})
      for idx, item in enumerate(m_row_model_list)
    ]
    m_context = directory_callback_model(
      page=current_page,
      mNetwork=p_links.m_network,
      mTotalPage=total_pages,
      mStartPage=start_page,
      mEndPage=end_page,
      mPagination=list(range(start_page, end_page + 1)),
      mUseSecureServiceNotice=p_links.m_site,
      mDirectoryCallbackLinks=indexed_items,
      mDirectoryCallbackPageNumberMaxReached=len(m_row_model_list) <= items_per_page - 2,
      mContentType=p_links.m_content_type,
      mIndex=p_links.m_index
    )
    if p_links.m_page_number > 1 and len(m_row_model_list) == 0:
      return m_context, False
    else:
      return m_context, True

