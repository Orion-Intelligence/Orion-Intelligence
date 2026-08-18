from fastapi import APIRouter, Body, Depends

from configs.app_dependency import get_current_user
from orion.api.interactive.profile_manager.profile_manager import ProfileManager

manage_profiles_routes = APIRouter()


@manage_profiles_routes.post("/api/manage-profiles/platforms", include_in_schema=False)
async def manage_profiles_platforms(current_user=Depends(get_current_user)):
    return await ProfileManager.get_instance().list_platforms(current_user)


@manage_profiles_routes.post("/api/manage-profiles/session", include_in_schema=False)
async def manage_profiles_session(payload: dict = Body(default={}), current_user=Depends(get_current_user)):
    return await ProfileManager.get_instance().capture_session(current_user, str(payload.get("platform") or ""), str(payload.get("url") or ""))


@manage_profiles_routes.post("/api/manage-profiles/sessions", include_in_schema=False)
async def manage_profiles_sessions(current_user=Depends(get_current_user)):
    return await ProfileManager.get_instance().list_sessions(current_user)


@manage_profiles_routes.get("/api/manage-profiles/session/download/{platform}/{session_id}", include_in_schema=False)
async def manage_profiles_session_download(platform: str, session_id: str, current_user=Depends(get_current_user)):
    return await ProfileManager.get_instance().download_session(current_user, platform, session_id)


@manage_profiles_routes.delete("/api/manage-profiles/session/{platform}/{session_id}", include_in_schema=False)
async def manage_profiles_session_delete(platform: str, session_id: str, current_user=Depends(get_current_user)):
    return await ProfileManager.get_instance().delete_session(current_user, platform, session_id)
