
from fastapi import APIRouter, Depends
from starlette.requests import Request
from backend.route_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from backend.route_managers.interactive.directory_manager.directory_view_model import directory_view_model
from backend.route_managers.interactive.hompage_manager.homepage_view_model import homepage_view_model
from backend.route_managers.interactive.search_manager.search_data_model.search_dynamic_param_model import search_dynamic_param_model
from backend.route_managers.interactive.search_manager.search_data_model.search_param_model import search_param_model
from backend.route_managers.interactive.search_manager.search_view_model import search_view_model

default_routes = APIRouter()

@default_routes.get("/")
async def parser(request: Request):
    return await homepage_view_model.getInstance().invoke_UI(request)

@default_routes.get("/directory")
async def parser(request: Request, param: directory_param_model = Depends()):
    return await directory_view_model.getInstance().invoke_UI(request, param)

@default_routes.get("/search")
async def parser(request: Request, param: search_param_model = Depends()):
    return await search_view_model.getInstance().search(request, param)

@default_routes.get("/dynamic/search")
async def parser(request: Request, param: search_dynamic_param_model = Depends()):
    return await search_view_model.getInstance().dynamic_search(request, param)
