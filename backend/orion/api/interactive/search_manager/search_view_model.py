from orion.api.interactive.search_manager.search_data_model.dynamic import search_dynamic_param_model
from orion.api.interactive.search_manager.search_model import search_model


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

  async def search_general(self, param):
    return await self.__m_search_model.seach_general(param)

  async def search_leak(self, param):
    return await self.__m_search_model.seach_leak_result(param)

  async def search_defacement(self, param):
    return await self.__m_search_model.seach_defacement_result(param)

  async def get_defacement_doc(self, doc_id):
    return await self.__m_search_model.get_defacement_doc(doc_id)

  async def get_leak_doc(self, doc_id):
    return await self.__m_search_model.get_leak_doc(doc_id)

  async def get_general_doc(self, doc_id):
    return await self.__m_search_model.get_general_doc(doc_id)

  async def dynamic_search_email(self, param: search_dynamic_param_model):
    return await self.__m_search_model.dynamic_search_email(param)
