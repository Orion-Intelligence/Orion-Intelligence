from typing import Optional

from fastapi import Depends, Query
from fastapi import APIRouter
from orion.api.interactive.directory_manager.directory_model import directory_model
from orion.api.interactive.hompage_manager.homepage_model import homepage_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.server.config_manager.config_controller import config_controller
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.api.server.entity_manager.entity_manager import entity_manager
from orion.api.server.entity_manager.modal.EntityQueryModel import EntityQueryModel
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.api.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import search_dynamic_param_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_param_model import search_general_param_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from configs.app_dependency import role_required

api_routes = APIRouter()


@api_routes.get("/api/directory", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))], description="Fetch the directory listing with optional filters for categories, types, or tags.")
async def get_directory(param: directory_param_model = Depends()):
  return await directory_model.getInstance().invoke_directory(param)


@api_routes.get("/api/insight", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))], description="Retrieve analytics and strategic insights for dashboard overview.")
async def get_insight():
  return await homepage_model.getInstance().invoke_analytics()


@api_routes.get("/api/search/strategic", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))], description="Search strategic intelligence reports using filters like category, title, date, or hash.")
async def search_general(param: search_general_param_model = Depends()):
  return await search_model.getInstance().search_general_result(param)


@api_routes.get("/api/search/breach", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))], description="Search breach (leak) intelligence reports using parameters such as company, country, or hash.")
async def search_leak(param: search_leak_param_model = Depends()):
  return await search_model.getInstance().search_leak_result(param)


@api_routes.get("/api/search/defacement", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))], description="Search defacement intelligence reports by keywords, group names, or affected domains.")
async def search_defacement(param: search_defacement_param_model = Depends()):
  return await search_model.getInstance().search_defacement_result(param)


@api_routes.get("/api/search/defacement/{doc_id}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))], description="Get a specific defacement document by its document ID.")
async def get_defacement_document(doc_id: str):
  return await search_model.getInstance().request_defacement_doc(doc_id)


@api_routes.get("/api/search/breach/{doc_id}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))], description="Get a specific breach (leak) document by its document ID and optional language.")
async def get_leak_document(doc_id: str, lang: Optional[str] = Query(None, alias="lang")):
  return await search_model.getInstance().request_leak_doc(doc_id, lang)


@api_routes.get("/api/search/strategic/{doc_id}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))], description="Get a specific strategic report document by its document ID and optional language.")
async def get_general_document(doc_id: str, lang: Optional[str] = Query(None, alias="lang")):
  return await search_model.getInstance().request_general_doc(doc_id, lang)


@api_routes.get("/api/dynamic/email", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))], description="Perform a dynamic search for emails found in breach and defacement data.")
async def search_dynamic_email(param: search_dynamic_param_model = Depends()):
  return await search_model.getInstance().dynamic_search_email(param)


@api_routes.get("/api/search/breach/screenshot/{filename}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))], description="Retrieve the screenshot associated with a breach document (image is in .webp format).")
async def get_screenshot(filename: str):
  return await crawl_model.getInstance().get_screenshot_file(f"{filename}.webp")


@api_routes.get("/api/graph", description="Fetch the graph relationships for a given entity based on its model type and value.")
async def get_entity_relations(query: EntityQueryModel = Depends()):
  manager = entity_manager.get_instance()
  return await manager.get_entity_relations(query)


@api_routes.get("/api/public", description="Get publicly exposed configuration values for frontend initialization.")
async def get_public_config():
  return await config_controller.getInstance().get_all()
