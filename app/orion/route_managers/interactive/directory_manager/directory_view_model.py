from starlette.requests import Request
from starlette.responses import RedirectResponse
from starlette.templating import Jinja2Templates

from orion.constants.constant import CONSTANTS
from orion.helper_manager.helper_controller import helper_controller
from orion.route_managers.interactive.directory_manager.directory_model import directory_model
from orion.route_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model


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

  async def invoke_UI(self, request: Request, param: directory_param_model):
    m_response, m_status = await self.__m_directory_model.init_page(param)
    if m_status:
      return self.templates.TemplateResponse(CONSTANTS.S_TEMPLATE_DIRECTORY_WEBSITE_PATH, helper_controller.create_template_context(request, m_response))
    else:
      return RedirectResponse(url="/directory", status_code=302)