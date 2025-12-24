from fastapi import APIRouter, Depends

from configs.app_dependency import role_required
from configs.limiter_dependency import limiter_dependency
from orion.api.server.crawl_manager.class_model.report_chat_data_model import ReportChatRequest
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.shared_models.crawl_models.CTITextRequest import CTITextRequest

micro_routes = APIRouter()


@micro_routes.post(
    "/api/cti/fetch",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def fetch_cti_label(payload: CTITextRequest, _=Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))):
    return await crawl_model.fetch_cti_label(payload)


@micro_routes.post(
    "/api/nlp/chat/report",
    summary="Process chat report with NLP",
    description="Use NLP pipeline to parse and enrich chat-based report content.",
    tags=["NLP", "Chat"],
    operation_id="chatReportNLP",
    response_description="Parsed and enriched chat report.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN])), Depends(limiter_dependency)], )
async def chat_report(payload: ReportChatRequest):
    response = await crawl_model.getInstance().parse_chat_ai(payload)
    return response
