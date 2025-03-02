from orion.api.interactive.directory_manager.directory_model import directory_model
from orion.api.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model


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

  async def invoke_directory(self, param: directory_param_model):
    return await self.__m_directory_model.directory(param)
