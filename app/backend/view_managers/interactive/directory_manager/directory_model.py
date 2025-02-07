from datetime import datetime, timedelta, timezone
from bson import ObjectId
from backend.services.mongo_manager.mongo_controller import mongo_controller
from backend.constants.constant import CONSTANTS
from backend.view_managers.interactive.directory_manager.directory_session_controller import directory_session_controller
from backend.view_managers.interactive.directory_manager.directory_shared_model.directory_api_callback_model import directory_api_callback_model
from backend.view_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model


class directory_model:
  # Private Variables
  __instance = None
  __m_session = None

  # Initializations
  def __init__(self):
    self.__m_session = directory_session_controller()
    pass

  @staticmethod
  async def __load_onion_links(p_directory_class_model):
    m_documents, count, m_status = await mongo_controller.getInstance().get_url_status(p_directory_class_model.m_content_type, p_directory_class_model.m_index, p_directory_class_model.m_network, (p_directory_class_model.m_page_number - 1) * CONSTANTS.S_SETTINGS_DIRECTORY_LIST_MAX_SIZE, CONSTANTS.S_SETTINGS_DIRECTORY_LIST_MAX_SIZE)
    if m_status:
      m_documents = list(m_documents)
      utc_now = datetime.now(timezone.utc)
      threshold_date = utc_now - timedelta(days=5)

      for mDoc in m_documents:
        if 'leak_status_date' in mDoc and isinstance(mDoc['leak_status_date'], datetime):
          mDoc['leak_status_date'] = (mDoc['leak_status_date'].replace(tzinfo=timezone.utc) if mDoc['leak_status_date'].tzinfo is None else mDoc['leak_status_date'])
          mDoc['leak_status_date'] = 1 if mDoc['leak_status_date'] >= threshold_date else 0
        else:
          mDoc['leak_status_date'] = 0

        if 'url_status_date' in mDoc and isinstance(mDoc['url_status_date'], datetime):
          mDoc['url_status_date'] = (mDoc['url_status_date'].replace(tzinfo=timezone.utc) if mDoc['url_status_date'].tzinfo is None else mDoc['url_status_date'])
          mDoc['url_status_date'] = 1 if mDoc['url_status_date'] >= threshold_date else 0
        else:
          mDoc['url_status_date'] = 0

        for key, value in mDoc.items():
          if isinstance(value, ObjectId):
            mDoc[key] = str(value)

      return {"documents": m_documents, "count": count, "content_type_parameter": p_directory_class_model.m_content_type, "index_parameter": p_directory_class_model.m_index}
    else:
      return {"documents": [], "count": count, "content_type_parameter": p_directory_class_model.m_content_type, "index_parameter": p_directory_class_model.m_index}

  async def api_directory(self, param:directory_param_model):
    try:
      m_result = await self.__load_onion_links(param)
      response_data = m_result
      return directory_api_callback_model(**response_data)
    except Exception as ex:
      return {"error_manager": "An internal error_manager occurred."+str(ex)}

  async def init_page(self, param:directory_param_model):
    result = await self.__load_onion_links(param)

    m_row_model_list = result["documents"]
    count = result["count"]

    m_context, m_status = self.__m_session.init_callback(param, m_row_model_list, count)
    return m_context, m_status
