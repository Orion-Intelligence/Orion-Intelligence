from logging import fatal

from orion.route_managers.interactive.directory_manager.directory_shared_model.directory_callback_model import directory_callback_model, directory_callback_link
from orion.route_managers.interactive.directory_manager.local_helper_methods.directory_helper_methods import directory_helper_methods
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.constants.constant import CONSTANTS
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

  async def __load_onion_links(self, param:directory_param_model):
    result = await self.fetch_filtered_urls(param)
    pydantic_results = [directory_callback_link.from_odmantic(doc) for doc in result]
    start_page, end_page, total_pages, invalid_page = directory_helper_methods.get_pagination(param.page, len(pydantic_results))
    items_per_page = CONSTANTS.S_SETTINGS_DIRECTORY_LIST_MAX_SIZE
    if total_pages < param.page:
      return None, False

    return directory_callback_model(
      page=param.page,
      mNetwork=param.network,
      mTotalPage=total_pages,
      mStartPage=start_page,
      mEndPage=end_page,
      mPagination=list(range(start_page, end_page + 1)),
      mDirectoryCallbackLinks=pydantic_results,
      mDirectoryCallbackPageNumberMaxReached=len(pydantic_results) <= items_per_page - 2,
      mContentType=param.content_type,
      mItemPerPage=items_per_page,
      mIndex=param.index
    ), invalid_page

  async def api_directory(self, param:directory_param_model):
    result = await self.fetch_filtered_urls(param)
    return [directory_callback_link.from_odmantic(doc) for doc in result]

  async def init_page(self, param:directory_param_model):
    return await self.__load_onion_links(param)
