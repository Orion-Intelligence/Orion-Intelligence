from starlette.requests import Request
from starlette.templating import Jinja2Templates
from orion.constants.constant import CONSTANTS
from orion.helper_manager.helper_controller import helper_controller
from orion.route_managers.interactive.hompage_manager.homepage_model import homepage_model


class homepage_view_model:
  # Private Variables
  __instance = None
  __m_homepage_model = None

  # Initializations
  @staticmethod
  def getInstance():
    if homepage_view_model.__instance is None:
      homepage_view_model()
    return homepage_view_model.__instance

  def __init__(self):
    if homepage_view_model.__instance is not None:
      pass
    else:
      homepage_view_model.__instance = self
      self.__m_homepage_model = homepage_model()
      self.templates = Jinja2Templates(directory="templates")

  # External Request Callbacks
  async def invoke_analytics_api(self, request: Request):
    return await self.__m_homepage_model.invoke_analytics()
