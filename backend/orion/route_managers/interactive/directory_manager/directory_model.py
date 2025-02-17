from orion.route_managers.interactive.directory_manager.directory_shared_model.directory_callback_model import directory_callback_link
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.route_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from orion.services.mongo_manager.shared_model.db_url_data_model import db_url_data_model


class directory_model:

  # Private Variables
  __instance = None

  # Initializations
  def __init__(self):
    self._engine = mongo_controller.getInstance().get_engine()

  async def fetch_filtered_urls(self, params: directory_param_model):
    query_conditions = {}

    if params.content_type != "all":
        query_conditions["content_type"] = {"$elemMatch": {"$eq": params.content_type}}
    if params.index != "all":
        query_conditions["index_type"] = {"$elemMatch": {"$eq": params.index}}
    if params.network != "all":
        query_conditions["network_type"] = params.network

    return await self._engine.find(db_url_data_model, query_conditions, skip=(params.page - 1) * 10, limit=10)

  async def api_directory(self, param:directory_param_model):
    result = await self.fetch_filtered_urls(param)
    return [directory_callback_link.from_odmantic(doc) for doc in result]
