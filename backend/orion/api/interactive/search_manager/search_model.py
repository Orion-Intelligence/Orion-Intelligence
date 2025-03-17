from typing import Optional

from orion.api.interactive.search_manager.search_callback_model import search_callback
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import search_defacement_callback_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_callback_model import breach_data
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import search_dynamic_param_model
from orion.api.interactive.search_manager.search_data_model.enums import general_listing, leak_listing
from orion.api.interactive.search_manager.search_data_model.general import search_general_param_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import search_general_callback_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import search_leak_callback_model
from orion.api.interactive.search_manager.search_data_model.search_callback_model import result_item
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from orion.api.server.external_request_manager.external_request_controller import external_request_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator


class search_model:
  # Private Variables
  __instance = None
  __search_callback = search_callback()

  # Initializations
  @staticmethod
  def getInstance():
    if search_model.__instance is None:
      search_model.__instance = search_model()
    return search_model.__instance

  def __init__(self):
    if search_model.__instance is not None:
      pass
    else:
      search_model.__instance = self

  @staticmethod
  async def dynamic_search_email(param: search_dynamic_param_model):
    result = await external_request_controller.getInstance().fetch_email_leak(param)

    if isinstance(result, list) and len(result)>0:
      return breach_data(**(result[0]))
    else:
      return breach_data().model_dump()

  async def request_defacement_doc(self, doc_id) -> Optional[result_item]:
    result = await elastic_controller.get_instance().get_doc(ELASTIC_INDEX.S_DEFACEMENT_INDEX, doc_id)
    return await self.__search_callback.get_doc(result)

  async def request_leak_doc(self, doc_id) -> Optional[result_item]:
    result = await elastic_controller.get_instance().get_doc(ELASTIC_INDEX.S_LEAK_INDEX, doc_id)
    return await self.__search_callback.get_doc(result)

  async def request_general_doc(self, doc_id) -> Optional[result_item]:
    result = await elastic_controller.get_instance().get_doc(ELASTIC_INDEX.S_GENERIC_INDEX, doc_id)
    return await self.__search_callback.get_doc(result)

  async def search_general_result(self, param: search_general_param_model):
    document, data_filter = elastic_request_generator().on_search_general_data(param)
    m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)
    return await self.__search_callback.search_handler(
      m_status, m_documents,
      search_general_callback_model,
      general_listing
    )

  async def search_leak_result(self, param: search_leak_param_model):
    document, data_filter = elastic_request_generator().on_search_leakdata(param)
    m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)
    return await self.__search_callback.search_handler(
      m_status, m_documents,
      search_leak_callback_model,
      leak_listing
    )

  async def search_defacement_result(self, param: search_defacement_param_model):
    document, data_filter = elastic_request_generator().on_search_defacementdata(param)
    m_status, m_documents = await elastic_controller.get_instance().search_query(document, data_filter)

    return await self.__search_callback.search_handler(
      m_status, m_documents,
      search_defacement_callback_model,
      []
    )
