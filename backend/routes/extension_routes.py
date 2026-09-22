from routes.docs.docs import EXTENSION_DOCS
import json
import asyncio
import secrets
from pathlib import Path

from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, WebSocket, WebSocketDisconnect, status
from starlette.responses import FileResponse, JSONResponse

from configs.app_dependency import get_extension_user
from configs.auth_cookie import clear_extension_cookie, extension_token_from_request, set_extension_cookie
from configs.limiter_dependency import auth_rate_limit
from orion.api.interactive.auth_manager.auth_manager import auth_manager
from orion.services.log_manager.log_controller import log
from orion.api.interactive.case_manager.case_communication_manager import CaseCommunicationManager
from orion.api.interactive.extension_manager.extension_socket_manager import extension_socket_manager
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS
from orion.services.session_manager.session_manager import session_manager

extension_routes = APIRouter()


async def _persist_communication_capture(user_key: str, result_key: str | None, payload: dict) -> tuple[str, str] | None:
    if not isinstance(result_key, str) or ":" not in result_key:
        return None
    parsed = CaseCommunicationManager.parse_result_scope(result_key.split(":", 1)[1])
    if parsed is None:
        return None
    case_id, communication_id = parsed
    try:
        saved = await CaseCommunicationManager.get_instance().persist_socket_capture(user_key, case_id, communication_id, payload)
    except Exception:
        return None
    return (case_id, communication_id) if saved else None


WS_TICKET_TTL_SECONDS = 30
EXTENSION_DIR = Path(__file__).resolve().parents[1] / "workspace" / "extension"
EXTENSION_ARTIFACTS = {
    "chrome/orion-social-chrome.crx": ("application/x-chrome-extension", False),
    "chrome/orion-social-chrome-unpacked.zip": ("application/zip", True),
    "chrome/updates.xml": ("application/xml", False),
    "chrome/policy/linux/orion-social.json": ("application/json", True),
    "chrome/policy/windows/orion-social.reg": ("application/octet-stream", True),
    "chrome/policy/macos/orion-social.mobileconfig": ("application/x-apple-aspen-config", True),
    "firefox/orion-social-firefox.xpi": ("application/x-xpinstall", False),
    "firefox/updates.json": ("application/json", False),
}


async def system_session_active(current_user, redis_store: redis_controller) -> bool:
    session_id = getattr(current_user, "current_session_id", None)
    if not session_id:
        return False
    redis_session_id = await redis_store.invoke_trigger(
        REDIS_COMMANDS.S_GET_STRING,
        [f"session:{current_user.id}", None, None],
    )
    return redis_session_id == session_id


async def extension_user_from_token(token: str | None) -> db_user_account | None:
    try:
        return await session_manager.get_instance().get_current_user(token)
    except Exception:
        return None


async def socket_user_key(token: str | None) -> str | None:
    current_user = await extension_user_from_token(token)
    if not current_user:
        return None
    if not await system_session_active(current_user, redis_controller.getInstance()):
        return None
    return str(current_user.id)


@extension_routes.post("/api/extension/login",
    summary="Post login",
    description=EXTENSION_DOCS["extension_auth"]["description"],
    tags=["Extension"],
    operation_id="postApiExtensionLogin",
    response_description=EXTENSION_DOCS["extension_auth"]["response_description"], include_in_schema=True)
async def extension_login(request: Request, response: Response = None, username: str = Body(...), password: str = Body(...), redis_store: redis_controller = Depends(redis_controller.getInstance)):
    async def authenticate_and_login():
        current_user = await auth_manager.get_instance().authenticate_user(username, password)
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user or password")

        if not await system_session_active(current_user, redis_store):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="orion_login_required")

        return await auth_manager.login(
            username,
            password,
            client="extension",
            tenant_id=session_manager.tenant_identifier(getattr(request.state, "tenant", None)),
        )

    result = await auth_rate_limit(redis_store, username, authenticate_and_login, request)
    access_token = result.get("access_token")

    if result.get("twofa_required"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="twofa_required")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="login_failed")

    set_extension_cookie(response, access_token)
    return {"detail": "Logged in", "access_token": access_token}


@extension_routes.get("/api/extension/session",
    summary="Get session",
    description=EXTENSION_DOCS["extension_session"]["description"],
    tags=["Extension"],
    operation_id="getApiExtensionSession",
    response_description=EXTENSION_DOCS["extension_session"]["response_description"], include_in_schema=True)
async def extension_session(current_user=Depends(get_extension_user), redis_store: redis_controller = Depends(redis_controller.getInstance)):
    return {
        "username": getattr(current_user, "username", ""),
        "detail": "Active",
        "system_connected": await system_session_active(current_user, redis_store),
        "extension_connected": await extension_socket_manager.get_instance().has_live_socket(str(current_user.id)),
    }


@extension_routes.post("/api/extension/refresh",
    summary="Post refresh",
    description=EXTENSION_DOCS["extension_auth"]["description"],
    tags=["Extension"],
    operation_id="postApiExtensionRefresh",
    response_description=EXTENSION_DOCS["extension_auth"]["response_description"], include_in_schema=True)
async def extension_refresh(request: Request, response: Response = None):
    token = extension_token_from_request(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    result = await session_manager.get_instance().refresh_token(token, tenant_id=session_manager.tenant_identifier(getattr(request.state, "tenant", None)))
    access_token = result.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="refresh_failed")

    set_extension_cookie(response, access_token)
    return {"detail": "Refreshed", "access_token": access_token}


@extension_routes.post("/api/extension/logout",
    summary="Post logout",
    description=EXTENSION_DOCS["extension_auth"]["description"],
    tags=["Extension"],
    operation_id="postApiExtensionLogout",
    response_description=EXTENSION_DOCS["extension_auth"]["response_description"], include_in_schema=True)
async def extension_logout(request: Request):
    token = extension_token_from_request(request)
    current_user = await extension_user_from_token(token)
    if current_user:
        await extension_socket_manager.get_instance().disconnect(str(current_user.id))
    await session_manager.get_instance().invalidate_user_session(token)

    resp = JSONResponse(content={"detail": "Logged out"})
    clear_extension_cookie(resp)
    return resp


@extension_routes.post("/api/extension/ws-ticket",
    summary="Post ws-ticket",
    description=EXTENSION_DOCS["extension_websocket"]["description"],
    tags=["Extension"],
    operation_id="postApiExtensionWs-Ticket",
    response_description=EXTENSION_DOCS["extension_websocket"]["response_description"], include_in_schema=True)
async def extension_ws_ticket(request: Request, redis_store: redis_controller = Depends(redis_controller.getInstance)):
    token = extension_token_from_request(request)
    if not await extension_user_from_token(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    ticket = secrets.token_urlsafe(32)
    await redis_store.invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [f"ws_ticket:{ticket}", token, WS_TICKET_TTL_SECONDS])
    return {"ticket": ticket}


@extension_routes.websocket("/api/extension/socket")
async def extension_socket(websocket: WebSocket):
    token = extension_token_from_request(websocket)
    if not token:
        ticket = websocket.query_params.get("ticket")
        if ticket:
            redis_store = redis_controller.getInstance()
            token = await redis_store.invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [f"ws_ticket:{ticket}", None, None])
            if token:
                await redis_store.invoke_trigger(REDIS_COMMANDS.S_DELETE_KEY, [f"ws_ticket:{ticket}"])
    user_key = await socket_user_key(token)
    if not user_key:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    socket_manager = extension_socket_manager.get_instance()
    await websocket.accept()
    socket_id = await socket_manager.register(user_key, websocket)

    try:
        await websocket.send_json({"detail": "Connected"})
        while True:
            try:
                text = await asyncio.wait_for(websocket.receive_text(), timeout=5)
            except TimeoutError:
                # The socket was authenticated at connect via the ws-ticket; keep it alive
                # for the connection's lifetime instead of re-validating the token every 5s
                # (which the web session competes for and would close the socket repeatedly).
                await socket_manager.touch_socket(user_key, socket_id)
                continue

            try:
                payload = json.loads(text)
            except (json.JSONDecodeError, TypeError):
                continue
            await socket_manager.touch_socket(user_key, socket_id)
            if isinstance(payload, dict) and payload.get("request_id"):
                if payload.get("ack"):
                    await socket_manager.acknowledge(payload["request_id"])
                else:
                    result_key = await socket_manager.resolve(payload["request_id"], payload)
                    captured = await _persist_communication_capture(user_key, result_key, payload)
                    if captured:
                        case_id, communication_id = captured
                        try:
                            await websocket.send_json({"type": "comm-captured", "caseId": case_id, "communicationId": communication_id, "hasSession": True})
                        except Exception as exc:
                            log.g().w(f"EXTENSION SOCKET: capture acknowledgement not delivered for case {case_id}: {exc}")
    except WebSocketDisconnect:
        return
    finally:
        await socket_manager.unregister(user_key, websocket, socket_id)


@extension_routes.get("/ext/{artifact:path}",
    summary="Get {artifact:path}",
    description=EXTENSION_DOCS["extension_artifacts"]["description"],
    tags=["Extension"],
    operation_id="getExtArtifactpath",
    response_description=EXTENSION_DOCS["extension_artifacts"]["response_description"], include_in_schema=True)
async def extension_artifact(artifact: str):
    entry = EXTENSION_ARTIFACTS.get(artifact)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extension package not found")

    media_type, as_attachment = entry
    file_path = EXTENSION_DIR / artifact
    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extension package not found")

    return FileResponse(
        file_path,
        media_type=media_type,
        filename=file_path.name if as_attachment else None,
        headers={"Cache-Control": "no-store"},
    )
