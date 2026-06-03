from fastapi import APIRouter, Depends, Query
from fastapi import Request, HTTPException
from orion.api.interactive.account_manager.chat_share_manager import ChatShareManager
from orion.api.interactive.case_manager.case_share_manager import CaseShareManager
from orion.api.interactive.resource_manager.resource_manager import ResourceManager
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import search_credential_param_model
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.server.config_manager.config_controller import config_controller

public_routes = APIRouter()


def cookie_required(request: Request):
    if not request.cookies.get("access_token"):
        raise HTTPException(status_code=401, detail="Missing auth cookie")


@public_routes.get(
    "/api/public",
    dependencies=[],
)
async def get_public_config():
    return await config_controller.getInstance().get_system_info()


@public_routes.get("/api/s/static/tenant/{id}", include_in_schema=False, dependencies=[Depends(cookie_required)])
async def get_tenant_resource(id: str):
    return await ResourceManager.get_instance().get_tenant_image(id)


@public_routes.get("/api/s/static/user/{id}", include_in_schema=False, dependencies=[Depends(cookie_required)])
async def get_user_resource(id: str):
    return await ResourceManager.get_instance().get_user_image(id)


@public_routes.get("/api/s/static/favicon", include_in_schema=False)
async def get_system_resource():
    return await ResourceManager.get_instance().get_favicon()

@public_routes.get("/api/s/static/system/{id}", include_in_schema=False)
async def get_system_resource(request: Request, id: str):
    return await ResourceManager.get_instance().get_system_image(id)


@public_routes.get("/api/public/case-shares/{share_id}", include_in_schema=False)
async def open_case_share(share_id: str, token: str = Query(...)):
    return await CaseShareManager.get_instance().open_case_share(share_id, token)

@public_routes.get("/api/public/chat-shares/{share_id}", include_in_schema=False)
async def open_chat_share(share_id: str, token: str = Query(...)):
    return await ChatShareManager.get_instance().open_chat_share(share_id, token)

@public_routes.get("/robots.txt", include_in_schema=False)
async def robots_txt():
    return await ResourceManager.get_instance().get_robots_txt()

@public_routes.get(
    "/api/search/stealerlogs",
    include_in_schema=False,
    status_code=200
)
async def search_stealerlog(q: str = Query(...)):
    param = search_credential_param_model(q=q)
    try:
        return await search_model.getInstance().search_stealerlogs_persona_breach(param)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to search stealer logs") from exc
