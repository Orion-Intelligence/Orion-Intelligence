from starlette.requests import Request
from starlette.templating import Jinja2Templates

from backend.constants.constant import CONSTANTS
from backend.helper_manager.helper_controller import helper_controller
from backend.route_managers.interactive.directory_manager.directory_model import directory_model
from backend.route_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model


class directory_view_model:
  # Private Variables
  __instance = None
  __m_directory_model = None

  # Initializations
  @staticmethod
  def getInstance():
    if directory_view_model.__instance is None:
      directory_view_model()
    return directory_view_model.__instance

  def __init__(self):
    if directory_view_model.__instance is not None:
      pass
    else:
      directory_view_model.__instance = self
      self.__m_directory_model = directory_model()
      self.templates = Jinja2Templates(directory="templates")

  async def api_invoke_trigger(self, param: directory_param_model):
    return await self.__m_directory_model.api_directory(param)

  async def invoke_trigger(self, request: Request, param: directory_param_model):
    m_response, m_status = await self.__m_directory_model.init_page(param)
    if m_status:
      return self.templates.TemplateResponse(CONSTANTS.S_TEMPLATE_DIRECTORY_WEBSITE_PATH, helper_controller.create_template_context(request, m_response))
    else:
      return self.templates.TemplateResponse('/directory/?page=1', helper_controller.create_template_context(request, m_response))
