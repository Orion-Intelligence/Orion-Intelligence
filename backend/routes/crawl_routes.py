from orion.api.server.crawl_manager.class_model.chat_model import chat_data_model
from orion.api.server.crawl_manager.class_model.entity_model import entity_model
from orion.api.server.crawl_manager.class_model.file_model import ScreenshotPayload
from orion.api.server.crawl_manager.class_model.general_model import GeneralDataModel
from orion.api.server.crawl_manager.class_model.nlp_data_model import nlp_data_model
from orion.api.server.crawl_manager.crawl_model import crawl_model
from fastapi import APIRouter, Depends
from starlette.requests import Request
from orion.api.server.crawl_manager.class_model.defacement_model import DefacementDataModel
from orion.helper_manager.helper_controller import helper_controller
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.api.server.crawl_manager.class_model.leak_model import LeakDataModel
from orion.api.server.crawl_manager.crawl_controller import crawl_controller
from configs.app_dependency import role_required

crawl_routes = APIRouter()

@crawl_routes.get("/api/feeder/{index_type}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def feeder(index_type: str):
  return await crawl_controller.getInstance().invoke_fetch_feeder(index_type)

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

@crawl_routes.post("/api/screenshot", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def screenshot(payload: ScreenshotPayload, _=Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))):
  return await crawl_model.getInstance().invoke_file_upload(payload)

@crawl_routes.post("/api/index/generic", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def index_generic(request: Request):
  body = await request.json()
  return await crawl_controller.getInstance().invoke_generic_index(GeneralDataModel(**body))

@crawl_routes.post("/api/nlp/parse", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def parse_text(payload: nlp_data_model):
    return await crawl_controller.getInstance().parse_chat(payload)

@crawl_routes.post("/api/index/chat", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def index_chat_data(request: Request):
    body = await request.json()
    return await crawl_controller.getInstance().invoke_chat_index(chat_data_model(**body))

@crawl_routes.post("/api/index/entity", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def index_entity(request: Request):
    body = await request.json()
    await crawl_controller.getInstance().invoke_entity_index(entity_model(**body))

