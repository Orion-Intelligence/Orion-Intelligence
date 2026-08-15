from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, WebSocket, WebSocketDisconnect, status
from starlette.responses import JSONResponse

from configs.app_dependency import get_current_user
from configs.auth_cookie import EXTENSION_COOKIE_PATH, set_extension_cookie, token_from_request, ACCESS_COOKIE
from configs.limiter_dependency import auth_rate_limit
from orion.api.interactive.auth_manager.auth_manager import auth_manager
from orion.api.interactive.extension_manager.extension_socket_manager import extension_socket_manager
from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS
from orion.services.session_manager.session_manager import session_manager

extension_routes = APIRouter()


async def socket_user_key(token: str | None) -> str | None:
    try:
        current_user = await session_manager.get_instance().get_current_user(token)
    except HTTPException:
        return None
    return str(current_user.id)


@extension_routes.post("/api/extension/login")
async def extension_login(request: Request, response: Response = None, username: str = Body(...), password: str = Body(...), redis_store: redis_controller = Depends(redis_controller.getInstance)):
    async def authenticate_and_login():
        current_user = await auth_manager.get_instance().authenticate_user(username, password)
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user or password")

        session_id = getattr(current_user, "current_session_id", None)
        redis_session_id = await redis_store.invoke_trigger(
            REDIS_COMMANDS.S_GET_STRING,
            [f"session:{current_user.id}", None, None],
        )
        if not session_id or redis_session_id != session_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="orion_login_required")

        return await auth_manager.login(
            username,
            password,
            client="extension",
            tenant_id=getattr(request.state, "tenant", None),
        )

    result = await auth_rate_limit(redis_store, username, authenticate_and_login)
    access_token = result.get("access_token")

    if result.get("twofa_required"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="twofa_required")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="login_failed")

    set_extension_cookie(response, access_token)
    return {"detail": "Logged in"}


@extension_routes.get("/api/extension/session")
async def extension_session(current_user=Depends(get_current_user), redis_store: redis_controller = Depends(redis_controller.getInstance)):
    session_id = getattr(current_user, "current_session_id", None)
    redis_session_id = await redis_store.invoke_trigger(
        REDIS_COMMANDS.S_GET_STRING,
        [f"session:{current_user.id}", None, None],
    )
    if not session_id or redis_session_id != session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="orion_login_required")

    return {"username": getattr(current_user, "username", ""), "detail": "Active"}


@extension_routes.post("/api/extension/refresh")
async def extension_refresh(request: Request, response: Response = None):
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    result = await session_manager.get_instance().refresh_token(token, tenant_id=getattr(request.state, "tenant", None))
    access_token = result.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="refresh_failed")

    set_extension_cookie(response, access_token)
    return {"detail": "Refreshed"}


@extension_routes.post("/api/extension/logout")
async def extension_logout(request: Request):
    user_key = await socket_user_key(token_from_request(request))
    if user_key:
        await extension_socket_manager.get_instance().disconnect(user_key)

    resp = JSONResponse(content={"detail": "Logged out"})
    resp.delete_cookie(ACCESS_COOKIE, path=EXTENSION_COOKIE_PATH)
    return resp


@extension_routes.websocket("/api/extension/socket")
async def extension_socket(websocket: WebSocket):
    user_key = await socket_user_key(token_from_request(websocket))
    if not user_key:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    socket_manager = extension_socket_manager.get_instance()
    await websocket.accept()
    socket_manager.register(user_key, websocket)

    try:
        await websocket.send_json({"detail": "Connected"})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        return
    finally:
        socket_manager.unregister(user_key, websocket)
