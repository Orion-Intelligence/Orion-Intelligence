from orion.api.server.crawl_manager.class_model.defacement_model import DefacementDataModel
from orion.api.server.crawl_manager.class_model.general_model import GeneralDataModel
from orion.api.server.crawl_manager.class_model.leak_model import LeakDataModel
from orion.api.server.crawl_manager.crawl_model import crawl_model


class crawl_controller:
  # Private Variables
  __instance = None
  __crawl_model = None

  # Initializations
  @staticmethod
  def getInstance():
    if crawl_controller.__instance is None:
      crawl_controller()
    return crawl_controller.__instance

  def __init__(self):
    if crawl_controller.__instance is not None:
      pass
    else:
      crawl_controller.__instance = self
      self.__crawl_model = crawl_model()

  async def invoke_defacement_index(self, leak_index: DefacementDataModel):
    return await self.__crawl_model.init_defacement(leak_index)

  async def invoke_leak_index(self, leak_index: LeakDataModel):
    return await self.__crawl_model.init_leak(leak_index)

  async def invoke_generic_index(self, leak_index: GeneralDataModel):
    return await self.__crawl_model.init_general(leak_index)

  async def invoke_fetch_parser(self):
    return await self.__crawl_model.fetch_parser()

  async def invoke_fetch_feeder_generic(self):
    return await self.__crawl_model.fetch_feeder_generic()

  async def invoke_fetch_feeder_leak(self):
    return await self.__crawl_model.fetch_feeder_leak()
