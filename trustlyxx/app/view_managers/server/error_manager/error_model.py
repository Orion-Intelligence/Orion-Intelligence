from starlette.templating import Jinja2Templates

from app.backend.view_managers.server.error_manager.error_session_controller import error_session_controller
from app.backend.view_managers.server.error_manager.shared_model.error_param_model import error_param_model


class error_model:
  __instance = None
  __m_session = None

  def __init__(self):
    self.__m_session = error_session_controller()
    self.__m_templates = Jinja2Templates(directory="backend/user/server/error")
    pass

  async def init_page(self, request: error_param_model):
    return await self.__m_session.init_callback(request)
