from fastapi import APIRouter, Depends
from starlette.requests import Request

from backend.services.session_manager.shared_model.auth_models import user_role
from backend.view_managers.server.crawl_controller.crawl_controller import crawl_controller
from backend.view_managers.server.crawl_controller.crawl_enums import CRAWL_COMMANDS
from configs.app_dependency import role_required, get_current_role

crawl_routes = APIRouter()

@crawl_routes.get("/feeder/unique", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def parser(request: Request):
    return await crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_FETCH_FEEDER_UNIQUE, request)

@crawl_routes.get("/feeder", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def parser(request: Request):
    return await crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_FETCH_FEEDER, request)

@crawl_routes.get("/parser", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def parser(request: Request):
    return await crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_FETCH_PARSER, request)

@crawl_routes.post("/crawl_index", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def parser(request: Request):
    return await crawl_controller.getInstance().invoke_trigger(CRAWL_COMMANDS.M_INIT, request)
