from fastapi import APIRouter, Depends
from starlette.requests import Request

from orion.api.server.crawl_manager.class_model.defacement_model import DefacementDataModel
from orion.api.server.crawl_manager.class_model.general_model import GeneralDataModel
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.api.server.crawl_manager.class_model.leak_model import LeakDataModel
from orion.api.server.crawl_manager.crawl_controller import crawl_controller
from configs.app_dependency import role_required

crawl_routes = APIRouter()

@crawl_routes.get("/api/feeder/generic", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def feeder_unqiue():
  return await crawl_controller.getInstance().invoke_fetch_feeder_generic()

@crawl_routes.get("/api/feeder/leak", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def feeder_unqiue():
  return await crawl_controller.getInstance().invoke_fetch_feeder_leak()

@crawl_routes.get("/api/parser", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def parser():
    return await crawl_controller.getInstance().invoke_fetch_parser()

@crawl_routes.post("/api/index/leak", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def index_leak_data(request: Request):
  body = await request.json()
  return await crawl_controller.getInstance().invoke_leak_index(LeakDataModel(**body))

@crawl_routes.post("/api/index/defacement", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def index_defacement_data(request: Request):
  body = await request.json()
  return await crawl_controller.getInstance().invoke_defacement_index(DefacementDataModel(**body))

@crawl_routes.post("/api/index/generic", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def index_generic(request: Request):
  body = await request.json()
  return await crawl_controller.getInstance().invoke_generic_index(GeneralDataModel(**body))
