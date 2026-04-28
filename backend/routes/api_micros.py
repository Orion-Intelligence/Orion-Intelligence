from fastapi import APIRouter, Depends, HTTPException
from configs.app_dependency import get_current_user, license_required, role_required
from configs.limiter_dependency import limiter_dependency
from orion.api.server.config_manager.config_controller import config_controller
from orion.api.server.crawl_manager.class_model import nlp_data_model
from orion.api.server.crawl_manager.class_model.report_chat_data_model import NexusTextAnalysisRequest, ReportChatRequest
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.api.server.crawl_manager.class_model.CTITextRequest import CTITextRequest

micro_routes = APIRouter()


async def ai_endpoint_required():
    if config_controller.getInstance().get("ai_endpoint_enabled", "1") != "1":
        raise HTTPException(status_code=403, detail="AI endpoint is disabled")


@micro_routes.post(
    "/api/cti/fetch",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def fetch_cti_label(payload: CTITextRequest, _=Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))):
    return await crawl_model.fetch_cti_label(payload)


@micro_routes.post(
    "/api/nlp/parse/ai",
    dependencies=[Depends(ai_endpoint_required), Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def parse_ai(payload: nlp_data_model, current_user=Depends(get_current_user)):
    return await crawl_model.getInstance().parse_chat_ai(payload, user_id=str(current_user.id))


@micro_routes.post(
    "/api/nlp/summarize/ai",
    dependencies=[Depends(ai_endpoint_required), Depends(role_required([user_role.ADMIN, user_role.CRAWLER, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:ai", bypass_roles=[user_role.ADMIN])), Depends(limiter_dependency)])
async def summarize_ai(payload: nlp_data_model, current_user=Depends(get_current_user)):
    return await crawl_model.getInstance().parse_summarize_ai(payload, user_id=str(current_user.id))


@micro_routes.post(
    "/api/nlp/chat/report",
    summary="Process chat report with NLP",
    description="Use NLP pipeline to parse and enrich chat-based report content.",
    tags=["NLP", "Chat"],
    operation_id="chatReportNLP",
    response_description="Parsed and enriched chat report.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(ai_endpoint_required), Depends(role_required([user_role.ADMIN])), Depends(limiter_dependency)], )
async def chat_report(payload: ReportChatRequest, current_user=Depends(get_current_user)):
    response = await crawl_model.getInstance().parse_chat_ai(payload, user_id=str(current_user.id))
    return response


@micro_routes.post(
    "/api/nexus/chat",
    summary="Process chat report with Nexus",
    description="Use the Nexus chat pipeline to process and respond to chat-based report content.",
    tags=["NLP", "Chat"],
    operation_id="nexusChat",
    response_description="Processed Nexus chat response.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(ai_endpoint_required), Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), Depends(limiter_dependency)], )
async def nexus_chat(payload: ReportChatRequest, current_user=Depends(get_current_user)):
    response = await crawl_model.getInstance().parse_nexus_chat_ai(payload, user_id=str(current_user.id), stream=True)
    return response


@micro_routes.post(
    "/api/nexus/chat/cancel",
    include_in_schema=False,
    dependencies=[Depends(ai_endpoint_required), Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]))], )
async def cancel_nexus_chat(current_user=Depends(get_current_user)):
    return await crawl_model.getInstance().cancel_nexus_chat_ai(user_id=str(current_user.id))


@micro_routes.post(
    "/api/nexus/analyze-text",
    summary="Analyze text with Nexus OCR classifier",
    description="Use the Nexus OCR classifier to analyze text for spam and malicious URLs.",
    tags=["NLP", "Nexus"],
    operation_id="nexusAnalyzeText",
    response_description="Nexus OCR classifier result.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(ai_endpoint_required), Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:ai", bypass_roles=[user_role.ADMIN])), Depends(limiter_dependency)], )
async def nexus_analyze_text(payload: NexusTextAnalysisRequest, current_user=Depends(get_current_user)):
    return await crawl_model.getInstance().analyze_text_with_nexus(payload, user_id=str(current_user.id))
