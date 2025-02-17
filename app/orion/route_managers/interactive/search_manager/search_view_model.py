from starlette.requests import Request
from starlette.templating import Jinja2Templates

from orion.constants.constant import CONSTANTS
from orion.helper_manager.helper_controller import helper_controller
from orion.route_managers.interactive.search_manager.search_data_model import search_dynamic_param_model
from orion.route_managers.interactive.search_manager.search_data_model.search_param_model import search_param_model
from orion.route_managers.interactive.search_manager.search_model import search_model


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

  async def api_search(self, param):
    return await self.__m_search_model.api_seach_result(param)

  async def dynamic_search(self, request, param:search_dynamic_param_model):
    response = self.__m_search_model.dynamic_search_result(param)
    return self.templates.TemplateResponse(CONSTANTS.S_TEMPLATE_SEARCH_WEBSITE_PATH, helper_controller.create_template_context(request, response))

  async def api_dynamic_search(self, param:search_dynamic_param_model):
    return await self.__m_search_model.api_dynamic_search_result(param)

  # External Request Callbacks
  async def search(self, request: Request, param:search_param_model):
    response = await self.__m_search_model.init_page(param)
    return self.templates.TemplateResponse(CONSTANTS.S_TEMPLATE_SEARCH_WEBSITE_PATH, helper_controller.create_template_context(request, response))