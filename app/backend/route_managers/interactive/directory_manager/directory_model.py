from backend.services.mongo_manager.mongo_controller import mongo_controller
from backend.constants.constant import CONSTANTS
from backend.route_managers.interactive.directory_manager.directory_session_controller import directory_session_controller
from backend.route_managers.interactive.directory_manager.directory_shared_model.directory_api_callback_model import directory_api_callback_model
from backend.route_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model


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
    return await mongo_controller.getInstance().get_url_status(p_directory_class_model, (p_directory_class_model.page_number - 1) * CONSTANTS.S_SETTINGS_DIRECTORY_LIST_MAX_SIZE, CONSTANTS.S_SETTINGS_DIRECTORY_LIST_MAX_SIZE)

  async def api_directory(self, param:directory_param_model):
    try:
      m_result = await self.__load_onion_links(param)
      response_data = m_result
      return directory_api_callback_model(**response_data)
    except Exception as ex:
      return {"error_manager": "An internal error_manager occurred."+str(ex)}

  async def init_page(self, param:directory_param_model):
    result = await self.__load_onion_links(param)
    m_documents, count, m_status = result

    m_context, m_status = self.__m_session.init_callback(param, m_documents, count)
    return m_context, m_status
