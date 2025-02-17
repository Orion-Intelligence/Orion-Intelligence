from fastapi import APIRouter, Depends
from starlette.requests import Request

from orion.route_managers.server.crawl_controller.class_model.general_model import GeneralDataModel
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.route_managers.server.crawl_controller.class_model.leak_model import LeakDataModel
from orion.route_managers.server.crawl_controller.crawl_controller import crawl_controller
from configs.app_dependency import role_required

crawl_routes = APIRouter()

@crawl_routes.get("/api/feeder/unique", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def parser(request: Request):
  return await crawl_controller.getInstance().invoke_fetch_parser()

@crawl_routes.get("/api/parser")
async def parser(request: Request):
    return await crawl_controller.getInstance().invoke_fetch_feeder()

@crawl_routes.post("/api/index/leak", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def get_leak_data(request: Request):
  body = await request.json()
  return await crawl_controller.getInstance().invoke_leak_index(LeakDataModel(**body))

@crawl_routes.post("/api/index/generic", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def parser(request: Request):
  body = await request.json()
  return await crawl_controller.getInstance().invoke_generic_index(GeneralDataModel(**body))
