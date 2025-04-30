from orion.api.server.crawl_manager.class_model.chat_model import chat_data_model
from orion.api.server.crawl_manager.class_model.defacement_model import DefacementDataModel
from orion.api.server.crawl_manager.class_model.general_model import GeneralDataModel
from orion.api.server.crawl_manager.class_model.leak_model import LeakDataModel
from orion.api.server.crawl_manager.crawl_model import crawl_model


class crawl_helper:
  # Private Variables
  __instance = None
  __crawl_model = None

  # Initializations
  @staticmethod
  def getInstance():
    if crawl_helper.__instance is None:
      crawl_helper()
    return crawl_helper.__instance

  def __init__(self):
    if crawl_helper.__instance is not None:
      pass
    else:
      crawl_helper.__instance = self
      self.__crawl_model = crawl_model()

