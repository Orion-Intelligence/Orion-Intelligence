from fastapi import APIRouter, Depends
from starlette.requests import Request
from orion.view_managers.interactive.hompage_manager.homepage_view_model import homepage_view_model
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.view_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from orion.view_managers.interactive.directory_manager.directory_view_model import directory_view_model
from orion.view_managers.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import search_dynamic_param_model
from orion.view_managers.interactive.search_manager.search_data_model.general.search_general_param_model import search_general_param_model
from orion.view_managers.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from orion.view_managers.interactive.search_manager.search_view_model import search_view_model
from configs.app_dependency import role_required

api_routes = APIRouter()

@api_routes.get("/api/directory", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(request: Request, param: directory_param_model = Depends()):
    return await directory_view_model.getInstance().invoke_directory(param)

@api_routes.get("/api/insight", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(request: Request, ):
    return await homepage_view_model.getInstance().invoke_analytics(request)

@api_routes.get("/api/search/general", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(request: Request, param: search_general_param_model = Depends()):
    return await search_view_model.getInstance().search_general(param)

@api_routes.get("/api/search/leak", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(request: Request, param: search_leak_param_model = Depends()):
    return await search_view_model.getInstance().search_leak(param)

@api_routes.get("/api/dynamic/search", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(request: Request, param: search_dynamic_param_model = Depends()):
    return await search_view_model.getInstance().dynamic_search(param)
