from fastapi import APIRouter, Body, Depends, HTTPException, Request

from configs.app_dependency import get_current_user, license_required, role_required
from configs.auth_cookie import token_from_request
from configs.limiter_dependency import limiter_dependency
from orion.api.server.config_manager.config_controller import config_controller
from orion.api.server.crawl_manager.class_model import nlp_data_model
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.api.server.nexus_manager.model.nexus_chat_model import NexusTextAnalysisRequest, ReportChatRequest
from orion.api.server.nexus_manager.nexus_manager import nexus_manager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.api.server.nexus_manager.nexus_chat_gateway import nexus_chat_gateway

ai_routes = APIRouter()


async def ai_enabled_required():
    if await config_controller.getInstance().get_cached("ai_endpoint_enabled", "1") != "1":
        raise HTTPException(status_code=403, detail="AI is disabled")


@ai_routes.post(
    "/api/nlp/parse/ai",
    include_in_schema=False,
    dependencies=[Depends(ai_enabled_required), Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def parse_ai(payload: nlp_data_model, current_user=Depends(get_current_user)):
    return await crawl_model.getInstance().parse_chat_ai(payload, user_id=str(current_user.id))


@ai_routes.post(
    "/api/nlp/summarize/ai",
    include_in_schema=False,
    dependencies=[Depends(ai_enabled_required), Depends(role_required([user_role.ADMIN, user_role.CRAWLER, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:ai", bypass_roles=[user_role.ADMIN])), Depends(limiter_dependency)])
async def summarize_ai(payload: nlp_data_model, current_user=Depends(get_current_user)):
    return await crawl_model.getInstance().parse_summarize_ai(payload, user_id=str(current_user.id))


@ai_routes.post(
    "/api/nlp/chat/report",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(ai_enabled_required), Depends(role_required([user_role.ADMIN])), Depends(limiter_dependency)], )
async def chat_report(payload: ReportChatRequest, current_user=Depends(get_current_user)):
    response = await crawl_model.getInstance().parse_chat_ai(payload, user_id=str(current_user.id))
    return response


@ai_routes.post(
    "/api/nexus/chat",
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
async def nexus_chat(request: Request, payload: ReportChatRequest, current_user=Depends(get_current_user)):
    response = await nexus_manager.getInstance().parse_chat(payload, user_id=str(current_user.id), current_user=current_user, auth_token=token_from_request(request) or "")
    return response


@ai_routes.post(
    "/api/nexus/chat/workspace",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(ai_enabled_required), Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), Depends(limiter_dependency)], )
async def nexus_workspace_chat(request: Request, payload: ReportChatRequest | None = Body(default=None), current_user=Depends(get_current_user)):
    user_id = str(current_user.id)
    if payload is None or not payload.message.strip():
        return await nexus_manager.getInstance().resume_chat(user_id=user_id)
    response = await nexus_manager.getInstance().parse_chat(payload, user_id=user_id, current_user=current_user, recoverable=True, auth_token=token_from_request(request) or "")
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
async def clear_nexus_chat_session(payload: dict | None = Body(default=None), current_user=Depends(get_current_user)):
    return await nexus_manager.getInstance().clear_chat_session(current_user, session_id=str((payload or {}).get("session_id") or ""))


@ai_routes.post(
    "/api/nexus/analyze-text",
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


@ai_routes.post(
    "/api/nexus/chats",
    status_code=201,
    include_in_schema=False,
    dependencies=[
        Depends(ai_enabled_required),
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("scanning")),
        Depends(limiter_dependency),
    ],
)
async def create_nexus_chat(payload: dict = Body(default={"title": "New Chat"}), current_user=Depends(get_current_user)):
    return await nexus_chat_gateway.getInstance().create_chat(payload, current_user)


@ai_routes.get(
    "/api/nexus/chats",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(ai_enabled_required),
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("scanning")),
        Depends(limiter_dependency),
    ],
)
async def list_nexus_chats(current_user=Depends(get_current_user)):
    return await nexus_chat_gateway.getInstance().list_chats(current_user)


@ai_routes.get(
    "/api/nexus/chats/{session_id}",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(ai_enabled_required),
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("scanning")),
        Depends(limiter_dependency),
    ],
)
async def get_nexus_chat(session_id: str, current_user=Depends(get_current_user)):
    return await nexus_chat_gateway.getInstance().get_chat(session_id, current_user)


@ai_routes.post(
    "/api/nexus/chats/{session_id}/messages",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(ai_enabled_required),
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("scanning")),
        Depends(limiter_dependency),
    ],
)
async def send_nexus_chat_message(session_id: str, payload: dict = Body(...), current_user=Depends(get_current_user)):
    return await nexus_chat_gateway.getInstance().send_message(session_id, payload, current_user)


@ai_routes.put(
    "/api/nexus/chats/{session_id}",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(ai_enabled_required),
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("scanning")),
        Depends(limiter_dependency),
    ],
)
async def rename_nexus_chat(session_id: str, payload: dict = Body(...), current_user=Depends(get_current_user)):
    return await nexus_chat_gateway.getInstance().rename_chat(session_id, payload, current_user)


@ai_routes.delete(
    "/api/nexus/chats/{session_id}",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(ai_enabled_required),
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("scanning")),
        Depends(limiter_dependency),
    ],
)
async def delete_nexus_chat(session_id: str, current_user=Depends(get_current_user)):
    return await nexus_chat_gateway.getInstance().delete_chat(session_id, current_user)
