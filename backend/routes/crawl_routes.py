from typing import List

from fastapi import APIRouter, Depends, Body
from fastapi import Request

from configs.app_dependency import role_required
from configs.limiter_dependency import limiter_dependency
from orion.api.server.crawl_manager.class_model.chat_model import chat_data_model
from orion.api.server.crawl_manager.class_model.credential_model import credential_data_model
from orion.api.server.crawl_manager.class_model.defacement_model import DefacementDataModel
from orion.api.server.crawl_manager.class_model.dump_model import DumpModel
from orion.api.server.crawl_manager.class_model.entity_model import entity_model
from orion.api.server.crawl_manager.class_model.exploit_model import ExploitDataModel
from orion.api.server.crawl_manager.class_model.file_model import ScreenshotPayload
from orion.api.server.crawl_manager.class_model.general_model import GeneralDataModel
from orion.api.server.crawl_manager.class_model.leak_model import LeakDataModel
from orion.api.server.crawl_manager.class_model.log_model import LogBatchModel
from orion.api.server.crawl_manager.class_model.nlp_data_model import nlp_data_model
from orion.api.server.crawl_manager.class_model.social_model import social_data_model
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.api.server.entity_manager.entity_manager import entity_manager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role

crawl_routes = APIRouter()


@crawl_routes.get(
    "/api/feeder/{index_type}",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def feeder(index_type: str):
    return await crawl_model.getInstance().invoke_fetch_feeder(index_type)


@crawl_routes.get(
    "/api/parser",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def parser():
    return await crawl_model.getInstance().invoke_fetch_parser()


@crawl_routes.post(
    "/api/index/leak",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def index_leak_data(request: Request):
    body = await request.json()
    return await crawl_model.getInstance().invoke_leak_index(LeakDataModel(**body))


@crawl_routes.post(
    "/api/index/news",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def index_news_data(request: Request):
    body = await request.json()
    return await crawl_model.getInstance().invoke_news_index(LeakDataModel(**body))


@crawl_routes.post(
    "/api/index/tracking",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def index_tracking_data(request: Request):
    body = await request.json()
    return await crawl_model.getInstance().invoke_tracking_index(LeakDataModel(**body))


@crawl_routes.post(
    "/api/index/exploit",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def index_exploit_data(request: Request):
    body = await request.json()
    return await crawl_model.getInstance().invoke_exploit_index(ExploitDataModel(**body))


@crawl_routes.post(
    "/api/index/defacement",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def index_defacement_data(request: Request):
    body = await request.json()
    return await crawl_model.getInstance().invoke_defacement_index(DefacementDataModel(**body))


@crawl_routes.post(
    "/api/screenshot",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def screenshot(payload: ScreenshotPayload, _=Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))):
    return await crawl_model.getInstance().invoke_file_upload(payload)


@crawl_routes.post(
    "/api/index/generic",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def index_generic(request: Request):
    body = await request.json()
    return await crawl_model.getInstance().invoke_generic_index(GeneralDataModel(**body))


@crawl_routes.post(
    "/api/nlp/parse",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def parse_text(payload: nlp_data_model):
    return await crawl_model.getInstance().parse_chat(payload)


@crawl_routes.post(
    "/api/nlp/parse/ai",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def parse_ai(payload: nlp_data_model):
    return await crawl_model.getInstance().parse_chat_ai(payload)


@crawl_routes.post(
    "/api/nlp/summarize/ai",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def summarize_ai(payload: nlp_data_model):
    return await crawl_model.getInstance().parse_summarize_ai(payload)


@crawl_routes.post(
    "/api/index/chat",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def index_chat_data(request: Request):
    body = await request.json()
    return await crawl_model.getInstance().invoke_chat_index(chat_data_model(**body))


@crawl_routes.post("/api/index/social", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def index_social_data(request: Request):
    body = await request.json()
    return await crawl_model.getInstance().invoke_social_index(social_data_model(**body))


@crawl_routes.post(
    "/api/index/credential",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def index_credential_data(request: Request):
    body = await request.json()
    return await crawl_model.getInstance().invoke_credential_index(credential_data_model(**body))


@crawl_routes.post(
    "/api/index/entity",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def index_entities(_: Request, entities: List[entity_model] = Body(...)):
    results = []
    for entity in entities:
        result = await entity_manager.get_instance().create_or_update_entity_nodes(entity)
        results.append(result)
    return results


@crawl_routes.post("/api/index/dump", dependencies=[Depends(limiter_dependency)])
async def index_dump(request: Request):
    body = await request.json()
    return await crawl_model.getInstance().invoke_dump_index(DumpModel(**body))


@crawl_routes.post("/api/index/stealerlog", dependencies=[Depends(limiter_dependency)])
async def index_stealerlog(model: LogBatchModel):
    return await crawl_model.getInstance().invoke_stealerlog_index(model)
