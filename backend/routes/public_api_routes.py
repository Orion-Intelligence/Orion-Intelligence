from fastapi import APIRouter
from orion.api.interactive.profile_manager.profile_manager import ProfileManager
from orion.api.server.config_manager.config_controller import config_controller
from fastapi import Depends, Request, HTTPException
public_routes = APIRouter(tags=["Public"])

def cookie_required(request: Request):
    if not request.cookies.get("access_token"):
        raise HTTPException(status_code=401, detail="Missing auth cookie")

@public_routes.get("/api/s/static/{userId}", include_in_schema=False, dependencies=[Depends(cookie_required)])
async def get_profile_resource(userId: str):
    return await ProfileManager.getInstance().getProfileResource(userId)

@public_routes.get("/api/s/static/system/{name}", include_in_schema=False, dependencies=[Depends(cookie_required)])
async def get_system_resource(name: str):
    return await config_controller.getInstance().getSystemResource(name)

@public_routes.get(
    "/api/public",
    dependencies=[],
    summary="Get public configuration",
    description="Get public configuration values used for frontend initialization.",
    tags=["Public", "Config"],
    operation_id="getPublicConfig",
    response_description="Public configuration values used at frontend startup.",
)
async def get_public_config():
    return await config_controller.getInstance().get_all_alerts()
