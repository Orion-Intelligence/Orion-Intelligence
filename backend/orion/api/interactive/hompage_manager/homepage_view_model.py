from starlette.requests import Request
from orion.api.interactive.hompage_manager.homepage_model import homepage_model


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

  # External Request Callbacks
  async def invoke_analytics(self, request: Request):
    return await self.__m_homepage_model.invoke_analytics()
