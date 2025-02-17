from orion.route_managers.server.crawl_controller.class_model.general_model import GeneralDataModel
from orion.route_managers.server.crawl_controller.class_model.leak_model import LeakDataModel
from orion.route_managers.server.crawl_controller.crawl_model import crawl_model


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

  async def invoke_leak_index(self, leak_index: LeakDataModel):
    return await self.__crawl_model.init_leak(leak_index)

  async def invoke_generic_index(self, leak_index: GeneralDataModel):
    return await self.__crawl_model.init_general(leak_index)

  async def invoke_fetch_parser(self):
    return await self.__crawl_model.fetch_feeder()

  async def invoke_fetch_feeder(self):
    return await self.__crawl_model.fetch_parser()
