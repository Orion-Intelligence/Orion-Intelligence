from starlette.requests import Request
from starlette.templating import Jinja2Templates
from backend.constants.constant import CONSTANTS
from backend.helper_manager.helper_controller import helper_controller
from backend.view_managers.interactive.hompage_manager.homepage_model import homepage_model


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
  async def invoke_trigger(self, request: Request):
    response = await self.__m_homepage_model.init_page()
    return self.templates.TemplateResponse(CONSTANTS.S_TEMPLATE_INDEX_PATH, helper_controller.create_template_context(request, response))
