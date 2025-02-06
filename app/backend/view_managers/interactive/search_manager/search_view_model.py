from starlette.requests import Request
from starlette.templating import Jinja2Templates

from backend.constants.constant import CONSTANTS
from backend.helper_manager.helper_controller import helper_controller
from backend.view_managers.interactive.search_manager.parsers.search_api_param_model import search_api_param_model
from backend.view_managers.interactive.search_manager.parsers.search_param_model import search_param_model
from backend.view_managers.interactive.search_manager.search_model import search_model


class search_view_model:
  # Private Variables
  __instance = None
  __m_search_model = None

  # Initializations
  @staticmethod
  def getInstance():
    if search_view_model.__instance is None:
      search_view_model()
    return search_view_model.__instance

  def __init__(self):
    if search_view_model.__instance is not None:
      pass
    else:
      search_view_model.__instance = self
      self.__m_search_model = search_model()
      self.templates = Jinja2Templates(directory="templates")

  async def api_invoke_trigger(self, param):
    return await self.__m_search_model.api_result(param)

  # External Request Callbacks
  async def invoke_trigger(self, request: Request, param:search_param_model):
    response = await self.__m_search_model.init_page(param)
    return self.templates.TemplateResponse(CONSTANTS.S_TEMPLATE_SEARCH_WEBSITE_PATH, helper_controller.create_template_context(request, response))