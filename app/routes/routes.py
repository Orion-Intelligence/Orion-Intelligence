
from fastapi import APIRouter, Depends
from starlette.requests import Request

from backend.view_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from backend.view_managers.interactive.directory_manager.directory_view_model import directory_view_model
from backend.view_managers.interactive.hompage_manager.homepage_view_model import homepage_view_model
from backend.view_managers.interactive.search_manager.parsers.search_api_param_model import search_api_param_model
from backend.view_managers.interactive.search_manager.parsers.search_param_model import search_param_model
from backend.view_managers.interactive.search_manager.search_view_model import search_view_model
from backend.view_managers.server.crawl_controller.crawl_controller import crawl_controller
from backend.view_managers.server.crawl_controller.crawl_enums import CRAWL_COMMANDS

router = APIRouter()

@router.get("/")
async def parser(request: Request):
    return await homepage_view_model.getInstance().invoke_trigger(request)

@router.get("/directory")
async def parser(request: Request, param: directory_param_model = Depends()):
    return await directory_view_model.getInstance().invoke_trigger(request, param)

@router.get("/feeder/unique")
async def parser(request: Request):
    return await crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_FETCH_FEEDER_UNIQUE, request)

@router.get("/feeder")
async def parser(request: Request):
    return await crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_FETCH_FEEDER, request)

@router.get("/parser")
async def parser(request: Request):
    return await crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_FETCH_PARSER, request)

@router.post("/crawl_index")
async def parser(request: Request):
    return await crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_INIT, request)

@router.get("/search")
async def parser(request: Request, param: search_param_model = Depends()):
    return await search_view_model.getInstance().invoke_trigger(request, param)
