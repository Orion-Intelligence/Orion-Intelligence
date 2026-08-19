from fastapi import APIRouter, Body, Depends

from configs.app_dependency import get_current_user, license_required, role_required, status_required
from orion.api.interactive.social_profile_management.models import (
    SocialPersonaCreateRequest,
    SocialPersonaListResponse,
    SocialPersonaResponse,
    SocialPersonaUpdateRequest,
    SocialProfileAssignmentRequest,
    SocialProfileAssignmentResponse,
    SocialProfileCallbackRequest,
    SocialProfileCallbackResponse,
    SocialProfileConnectRequest,
    SocialProfileListResponse,
    SocialProfileResponse,
    SocialProfileUpdateRequest,
)
from orion.api.interactive.social_profile_management.social_profile_management_manager import SocialProfileManagementManager
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role

social_profile_management_routes = APIRouter(dependencies=[Depends(status_required([UserStatus.ACTIVE]))])
route_permissions = [
    Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    Depends(license_required("social_mapper", bypass_licenses=["maintainer"], bypass_roles=[user_role.ADMIN])),
]


@social_profile_management_routes.get("/api/social-profile-management/personas", response_model=SocialPersonaListResponse, dependencies=route_permissions)
async def get_personas(current_user=Depends(get_current_user)):
    return await SocialProfileManagementManager.get_instance().get_personas(current_user)


@social_profile_management_routes.post("/api/social-profile-management/personas", response_model=SocialPersonaResponse, dependencies=route_permissions)
async def create_persona(data: SocialPersonaCreateRequest = Body(...), current_user=Depends(get_current_user)):
    return await SocialProfileManagementManager.get_instance().create_persona(current_user, data)


@social_profile_management_routes.put("/api/social-profile-management/personas/{persona_id}", response_model=SocialPersonaResponse, dependencies=route_permissions)
async def update_persona(persona_id: str, data: SocialPersonaUpdateRequest = Body(...), current_user=Depends(get_current_user)):
    return await SocialProfileManagementManager.get_instance().update_persona(current_user, persona_id, data)


@social_profile_management_routes.delete("/api/social-profile-management/personas/{persona_id}", dependencies=route_permissions)
async def delete_persona(persona_id: str, current_user=Depends(get_current_user)):
    return await SocialProfileManagementManager.get_instance().delete_persona(current_user, persona_id)


@social_profile_management_routes.get("/api/social-profile-management/profiles", response_model=SocialProfileListResponse, dependencies=route_permissions)
async def get_profiles(current_user=Depends(get_current_user)):
    return await SocialProfileManagementManager.get_instance().get_profiles(current_user)


@social_profile_management_routes.post("/api/social-profile-management/profiles/connect", response_model=SocialProfileResponse, dependencies=route_permissions)
async def connect_profile(data: SocialProfileConnectRequest = Body(...), current_user=Depends(get_current_user)):
    return await SocialProfileManagementManager.get_instance().connect_profile(current_user, data)


@social_profile_management_routes.post("/api/social-profile-management/profiles/{profile_id}/connect", response_model=SocialProfileResponse, dependencies=route_permissions)
async def reconnect_profile(profile_id: str, current_user=Depends(get_current_user)):
    return await SocialProfileManagementManager.get_instance().reconnect_profile(current_user, profile_id)


@social_profile_management_routes.put("/api/social-profile-management/profiles/{profile_id}", response_model=SocialProfileResponse, dependencies=route_permissions)
async def update_profile(profile_id: str, data: SocialProfileUpdateRequest = Body(...), current_user=Depends(get_current_user)):
    return await SocialProfileManagementManager.get_instance().update_profile(current_user, profile_id, data)


@social_profile_management_routes.delete("/api/social-profile-management/profiles/{profile_id}", dependencies=route_permissions)
async def delete_profile(profile_id: str, current_user=Depends(get_current_user)):
    return await SocialProfileManagementManager.get_instance().delete_profile(current_user, profile_id)


@social_profile_management_routes.post("/api/social-profile-management/assignments", response_model=SocialProfileAssignmentResponse, dependencies=route_permissions)
async def assign_profile(data: SocialProfileAssignmentRequest = Body(...), current_user=Depends(get_current_user)):
    return await SocialProfileManagementManager.get_instance().assign_profile(current_user, data)


@social_profile_management_routes.delete("/api/social-profile-management/assignments/{profile_id}", response_model=SocialProfileAssignmentResponse, dependencies=route_permissions)
async def remove_assignment(profile_id: str, current_user=Depends(get_current_user)):
    return await SocialProfileManagementManager.get_instance().remove_assignment(current_user, profile_id)


@social_profile_management_routes.post("/api/social-profile-management/callback", response_model=SocialProfileCallbackResponse, dependencies=route_permissions)
async def social_profile_callback(data: SocialProfileCallbackRequest = Body(...), current_user=Depends(get_current_user)):
    return await SocialProfileManagementManager.get_instance().callback(current_user, data)
