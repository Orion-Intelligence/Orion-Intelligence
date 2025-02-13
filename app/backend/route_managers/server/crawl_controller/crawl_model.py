import os
from datetime import datetime, timezone
from starlette.responses import JSONResponse

from backend.route_managers.server.crawl_controller.class_model.general_model import GeneralDataModel
from backend.route_managers.server.crawl_controller.crawl_enums import CRAWL_PATHS, CRAWL_CALLBACK_RESPONSES
from backend.services.mongo_manager.mongo_controller import mongo_controller
from backend.route_managers.server.crawl_controller.class_model.leak_model import LeakDataModel
from fastapi.responses import FileResponse

from backend.services.mongo_manager.shared_model.db_url_data_model import db_url_data_model


class crawl_model:
  # Private Variables
  __instance = None

  def __init__(self):
    if crawl_model.__instance is not None:
      pass
    else:
      crawl_model.__instance = self
      self._engine = mongo_controller.getInstance().get_engine()

  async def init_general(self, general_index: GeneralDataModel):
    general_model = await self._engine.find_one(db_url_data_model, db_url_data_model.url == general_index.m_base_url)

    if general_model:
      general_model.leak_model_last_update = datetime.now(timezone.utc)
    else:
      general_model = db_url_data_model(url=general_index.base_url)
      general_model.network_type = general_index.network_type
      general_model.geneic_model_last_update = datetime.now(timezone.utc)

    await self._engine.save(general_model)
    return JSONResponse(content={"message": CRAWL_CALLBACK_RESPONSES.M_WEBSITE_INDEXED}, status_code=200)

  async def init_leak(self, leak_index: LeakDataModel):
    general_model = await self._engine.find_one(db_url_data_model, db_url_data_model.url == leak_index.base_url)

    if general_model:
      general_model.leak_model_last_update = datetime.now(timezone.utc)
    else:
      general_model = db_url_data_model(url=leak_index.base_url)
      general_model.network_type = leak_index.m_network
      general_model.geneic_model_last_update = datetime.now(timezone.utc)

    await self._engine.save(general_model)
    return JSONResponse(content={"message": CRAWL_CALLBACK_RESPONSES.M_WEBSITE_INDEXED}, status_code=200)

  @staticmethod
  async def fetch_parser():
    if os.path.exists(CRAWL_PATHS.M_PARSER_FILE_PATH):
        return FileResponse(CRAWL_PATHS.M_PARSER_FILE_PATH, media_type="application/zip", filename="parser_files.zip")

  @staticmethod
  async def fetch_feeder():
    if os.path.exists(CRAWL_PATHS.M_FEEDER_FILE_PATH):
        return FileResponse(CRAWL_PATHS.M_FEEDER_FILE_PATH, media_type="text/plain", filename="crawl_data_unique.txt")
