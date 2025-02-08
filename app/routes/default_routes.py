
from fastapi import APIRouter, Depends
from starlette.requests import Request
from backend.view_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from backend.view_managers.interactive.directory_manager.directory_view_model import directory_view_model
from backend.view_managers.interactive.hompage_manager.homepage_view_model import homepage_view_model
from backend.view_managers.interactive.search_manager.parsers.search_param_model import search_param_model
from backend.view_managers.interactive.search_manager.search_view_model import search_view_model

default_routes = APIRouter()

@default_routes.get("/")
async def parser(request: Request):
    return await homepage_view_model.getInstance().invoke_trigger(request)

@default_routes.get("/directory")
async def parser(request: Request, param: directory_param_model = Depends()):
    return await directory_view_model.getInstance().invoke_trigger(request, param)

@default_routes.get("/search")
async def parser(request: Request, param: search_param_model = Depends()):
    return await search_view_model.getInstance().invoke_trigger(request, param)
