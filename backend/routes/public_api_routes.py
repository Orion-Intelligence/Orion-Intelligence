from fastapi import APIRouter, Depends
from fastapi import Request, HTTPException
from orion.api.interactive.resource_manager.resource_manager import ResourceManager
from orion.api.server.config_manager.config_controller import config_controller

public_routes = APIRouter(tags=["Public"])


def cookie_required(request: Request):
    if not request.cookies.get("access_token"):
        raise HTTPException(status_code=401, detail="Missing auth cookie")


@public_routes.get(
    "/api/public",
    dependencies=[],
    summary="Get public configuration",
    description="Get public configuration values used for frontend initialization.",
    tags=["Public", "Config"],
    operation_id="getPublicConfig",
    response_description="Public configuration values used at frontend startup.", )
async def get_public_config():
    return await config_controller.getInstance().get_system_info()


@public_routes.get("/api/s/static/tenant/{id}", include_in_schema=False, dependencies=[Depends(cookie_required)])
async def get_tenant_resource(id: str):
    return await ResourceManager.get_instance().get_tenant_image(id)


@public_routes.get("/api/s/static/user/{id}", include_in_schema=False, dependencies=[Depends(cookie_required)])
async def get_user_resource(id: str):
    return await ResourceManager.get_instance().get_user_image(id)


@public_routes.get("/api/s/static/system/{id}", include_in_schema=False, dependencies=[Depends(cookie_required)])
async def get_user_resource():
    return await ResourceManager.get_instance().get_system_image(id)

@public_routes.get("/robots.txt", include_in_schema=False)
async def robots_txt():
    return await ResourceManager.get_instance().get_robots_txt()
