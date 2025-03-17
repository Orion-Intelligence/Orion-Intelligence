import os
from datetime import datetime, timezone
from starlette.responses import JSONResponse

from orion.api.server.crawl_manager.class_model.defacement_model import DefacementDataModel
from orion.api.server.crawl_manager.class_model.general_model import GeneralDataModel
from orion.api.server.crawl_manager.crawl_enums import CRAWL_PATHS, CRAWL_CALLBACK_RESPONSES
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.api.server.crawl_manager.class_model.leak_model import LeakDataModel
from fastapi.responses import FileResponse

from orion.services.mongo_manager.shared_model.db_url_data_model import db_url_data_model


class crawl_model:
  # Private Variables
  __instance = None

  def __init__(self):
    if crawl_model.__instance is not None:
      pass
    else:
      crawl_model.__instance = self
      self._engine = mongo_controller.get_instance().get_engine()

  async def _update_or_create_model(self, base_url: str, new_content_type: list, new_index_type: list, network_type: str, is_leak_update: bool):
    general_model = await self._engine.find_one(db_url_data_model, db_url_data_model.url == base_url)
    if general_model:
      general_model.content_type = list(set((general_model.content_type or []) + new_content_type))
      general_model.index_type = list(set((general_model.index_type or []) + new_index_type))
      if is_leak_update:
        general_model.leak_model_last_update = datetime.now(timezone.utc)
      else:
        general_model.geneic_model_last_update = datetime.now(timezone.utc)
    else:
      general_model = db_url_data_model(
        url=base_url,
        content_type=list(set(new_content_type)),
        index_type=list(set(new_index_type)),
        network_type=network_type,
        leak_model_last_update=datetime.now(timezone.utc) if is_leak_update else None,
        geneic_model_last_update=datetime.now(timezone.utc) if not is_leak_update else None
      )

    await self._engine.save(general_model)
    return JSONResponse(content={"message": CRAWL_CALLBACK_RESPONSES.M_WEBSITE_INDEXED}, status_code=200)

  async def init_general(self, general_index: GeneralDataModel):
    m_data = elastic_request_generator().index_query_general(general_index.model_dump())
    await elastic_controller.get_instance().index_data(m_data)
    return await self._update_or_create_model(
      base_url=general_index.m_base_url,
      new_content_type=general_index.m_content_type,
      new_index_type=['general'],
      network_type=general_index.m_network,
      is_leak_update=False
    )

  async def init_leak(self, leak_index: LeakDataModel):
    m_data = elastic_request_generator().index_query_leak(leak_index.model_dump())
    await elastic_controller.get_instance().index_data(m_data)
    return await self._update_or_create_model(
      base_url=leak_index.base_url,
      new_content_type=['leaks'],
      new_index_type=['leak'],
      network_type=leak_index.m_network,
      is_leak_update=True
    )

  async def init_defacement(self, defacement_index: DefacementDataModel):
    m_data = elastic_request_generator().index_query_defacement(defacement_index.model_dump())
    await elastic_controller.get_instance().index_data(m_data)
    return await self._update_or_create_model(
      base_url=defacement_index.base_url,
      new_content_type=['defacement'],
      new_index_type=['defacement'],
      network_type=defacement_index.m_network,
      is_leak_update=True
    )

  @staticmethod
  async def fetch_parser():
    if os.path.exists(CRAWL_PATHS.M_PARSER_FILE_PATH):
        return FileResponse(CRAWL_PATHS.M_PARSER_FILE_PATH, media_type="application/zip", filename="parser_files.zip")
    else:
      return JSONResponse(content={"detail": "File not found"}, status_code=404)

  @staticmethod
  async def fetch_feeder():
    if os.path.exists(CRAWL_PATHS.M_FEEDER_FILE_PATH):
        return FileResponse(CRAWL_PATHS.M_FEEDER_FILE_PATH, media_type="text/plain", filename="crawl_data_unique.txt")
    else:
      return JSONResponse(content={"detail": "File not found"}, status_code=404)
