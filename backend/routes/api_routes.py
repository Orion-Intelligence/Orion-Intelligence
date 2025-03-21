from typing import Optional

from fastapi import Depends, Query
from fastapi import APIRouter, Form, HTTPException, Request
from orion.api.interactive.directory_manager.directory_model import directory_model
from orion.api.interactive.hompage_manager.homepage_model import homepage_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.server.config_manager.config_controller import config_controller
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.api.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import search_dynamic_param_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_param_model import search_general_param_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from configs.app_dependency import role_required

api_routes = APIRouter()


@api_routes.get("/api/directory", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def get_directory(param: directory_param_model = Depends()):
  return await directory_model.getInstance().invoke_directory(param)


@api_routes.get("/api/insight", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def get_insight():
  return await homepage_model.getInstance().invoke_analytics()


@api_routes.get("/api/search/general", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def search_general(param: search_general_param_model = Depends()):
  return await search_model.getInstance().search_general_result(param)


@api_routes.get("/api/search/leak", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def search_leak(param: search_leak_param_model = Depends()):
  return await search_model.getInstance().search_leak_result(param)


@api_routes.get("/api/search/defacement", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def search_defacement(param: search_defacement_param_model = Depends()):
  return await search_model.getInstance().search_defacement_result(param)


@api_routes.get("/api/search/defacement/{doc_id}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def get_defacement_document(doc_id: str):
  return await search_model.getInstance().request_defacement_doc(doc_id)


@api_routes.get("/api/search/leak/{doc_id}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def get_leak_document(doc_id: str):
  return await search_model.getInstance().request_leak_doc(doc_id)


@api_routes.get("/api/search/general/{doc_id}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def get_general_document(doc_id: str, lang: Optional[str] = Query(None, alias="lang")):
  return await search_model.getInstance().request_general_doc(doc_id, lang)


@api_routes.get("/api/dynamic/email", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def search_dynamic_email(param: search_dynamic_param_model = Depends()):
  return await search_model.getInstance().dynamic_search_email(param)


@api_routes.get("/api/public")
async def get_public_config():
  return await config_controller.getInstance().get_all()
