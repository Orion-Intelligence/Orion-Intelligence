from starlette.requests import Request

from backend.constants.constant import CONSTANTS
from backend.helper_manager.helper_controller import helper_controller
from backend.view_managers.server.maintenance_manager.maintenance_model import maintenance_model
from fastapi.templating import Jinja2Templates


class maintenance_view_model:

  # Private Variables
  __instance = None
  __m_maintenance_model = None

  # Initializations
  @staticmethod
  def getInstance():
    if maintenance_view_model.__instance is None:
      maintenance_view_model()
    return maintenance_view_model.__instance

  def __init__(self):
    if maintenance_view_model.__instance is not None:
      pass
    else:
      maintenance_view_model.__instance = self
      self.__m_maintenance_model = maintenance_model()
      self.templates = Jinja2Templates(directory="templates")

  # External Request Callbacks
  async def invoke_trigger(self, request: Request):
    response = await self.__m_maintenance_model.invoke_trigger()
    return self.templates.TemplateResponse(CONSTANTS.S_TEMPLATE_MAINTENANCE_WEBSITE_PATH, helper_controller.create_template_context(request, response))