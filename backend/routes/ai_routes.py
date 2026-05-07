from fastapi import APIRouter, Depends, HTTPException

from configs.app_dependency import get_current_user, license_required, role_required
from configs.limiter_dependency import limiter_dependency
from orion.api.server.config_manager.config_controller import config_controller
from orion.api.server.crawl_manager.class_model.report_chat_data_model import (
    NexusTextAnalysisRequest,
    ReportChatRequest,
)
from orion.api.server.nexus_manager.nexus_manager import nexus_manager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role

ai_routes = APIRouter()


async def ai_enabled_required():
    if config_controller.getInstance().get("ai_endpoint_enabled", "1") != "1":
        raise HTTPException(status_code=403, detail="AI is disabled")


@ai_routes.post(
    "/api/nexus/chat",
    summary="Process chat report with Nexus",
    description="Use the Nexus chat pipeline to process and respond to chat-based report content.",
    tags=["NLP", "Chat"],
    operation_id="nexusChat",
    response_description="Processed Nexus chat response.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(ai_enabled_required),
        Depends(
            role_required(
                [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]
            )
        ),
        Depends(license_required("scanning")),
        Depends(limiter_dependency),
    ],
)
async def nexus_chat(payload: ReportChatRequest, current_user=Depends(get_current_user)):
    response = await nexus_manager.getInstance().parse_chat(payload, user_id=str(current_user.id))
    return response


@ai_routes.post(
    "/api/nexus/chat/cancel",
    include_in_schema=False,
    dependencies=[
        Depends(ai_enabled_required),
        Depends(
            role_required(
                [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]
            )
        ),
    ],
)
async def cancel_nexus_chat(current_user=Depends(get_current_user)):
    return await nexus_manager.getInstance().cancel_chat(user_id=str(current_user.id))


@ai_routes.post(
    "/api/nexus/chat/clear-session",
    include_in_schema=False,
    dependencies=[
        Depends(
            role_required(
                [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]
            )
        ),
    ],
)
async def clear_nexus_chat_session(current_user=Depends(get_current_user)):
    return await nexus_manager.getInstance().clear_chat_session(current_user)


@ai_routes.post(
    "/api/nexus/analyze-text",
    summary="Analyze text with Nexus OCR classifier",
    description="Use the Nexus OCR classifier to analyze text for spam and malicious URLs.",
    tags=["NLP", "Nexus"],
    operation_id="nexusAnalyzeText",
    response_description="Nexus OCR classifier result.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(ai_enabled_required),
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("module:ai", bypass_roles=[user_role.ADMIN])),
        Depends(limiter_dependency),
    ],
)
async def nexus_analyze_text(payload: NexusTextAnalysisRequest,current_user=Depends(get_current_user)):
    return await nexus_manager.getInstance().analyze_text(payload, user_id=str(current_user.id))
