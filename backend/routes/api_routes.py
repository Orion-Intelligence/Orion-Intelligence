from fastapi import APIRouter, Depends
from starlette.requests import Request
from orion.api.interactive.hompage_manager.homepage_view_model import homepage_view_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.server.config_manager.config_controller import config_controller
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.api.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from orion.api.interactive.directory_manager.directory_view_model import directory_view_model
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import search_dynamic_param_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_param_model import search_general_param_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from orion.api.interactive.search_manager.search_view_model import search_view_model
from configs.app_dependency import role_required

api_routes = APIRouter()

@api_routes.get("/api/directory", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(param: directory_param_model = Depends()):
    return await directory_view_model.getInstance().invoke_directory(param)

@api_routes.get("/api/insight", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(request: Request):
    return await homepage_view_model.getInstance().invoke_analytics(request)

@api_routes.get("/api/search/general", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(param: search_general_param_model = Depends()):
    return await search_view_model.getInstance().search_general(param)

@api_routes.get("/api/search/leak", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(param: search_leak_param_model = Depends()):
    return await search_view_model.getInstance().search_leak(param)

@api_routes.get("/api/search/defacement", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(param: search_defacement_param_model = Depends()):
    return await search_view_model.getInstance().search_defacement(param)

@api_routes.get("/api/search/leak/{doc_id}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(doc_id: str):
    return await search_view_model.getInstance().get_leak_doc(doc_id)

@api_routes.get("/api/search/general/{doc_id}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(doc_id: str):
    return await search_view_model.getInstance().get_general_doc(doc_id)

@api_routes.get("/api/dynamic/email", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(param: search_dynamic_param_model = Depends()):
    return await search_view_model.getInstance().dynamic_search_email(param)

@api_routes.get("/api/public")
async def parser():
    return await config_controller.getInstance().get_all()
