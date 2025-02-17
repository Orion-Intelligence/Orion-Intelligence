from orion.route_managers.interactive.search_manager.search_data_model import search_dynamic_param_model
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

  async def api_search(self, param):
    return await self.__m_search_model.api_seach_result(param)

  async def api_dynamic_search(self, param:search_dynamic_param_model):
    return await self.__m_search_model.api_dynamic_search_result(param)
