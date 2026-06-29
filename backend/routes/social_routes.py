from fastapi import APIRouter, Body, Depends

from configs.app_dependency import get_current_user, license_required, role_required, status_required
from orion.api.interactive.social_manager.social_models.search_social_param_model import (
    SocialFollowersRequest,
    SocialFollowingRequest,
    SocialForumRequest,
    SocialMetadataRequest,
    SocialPostsRequest,
    SocialOnlineImages,
    SocialProfileRequest,
    SocialReconRequest,
    SocialShortsRequest,
    SocialVideosRequest,
)
from orion.api.interactive.social_manager.social_model import social_model
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role

social_routes = APIRouter(dependencies=[Depends(status_required([UserStatus.ACTIVE]))])


@social_routes.post(
    "/api/social/recon",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_email(param: SocialReconRequest = Body(...)):
    return await social_model.getInstance().search_recon(param)


@social_routes.post(
    "/api/social/forum",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_social_forum_profiles(param: SocialForumRequest = Body(...)):
    return await social_model.getInstance().search_forum_profiles(param)


@social_routes.post(
    "/api/social/phone/recon",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_phone_recon(param: SocialReconRequest = Body(...)):
    return await social_model.getInstance().search_phone_recon(param)


@social_routes.post(
    "/api/social/profile",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_profile(param: SocialProfileRequest = Body(...)):
    return await social_model.getInstance().search_profile(param)


@social_routes.post(
    "/api/social/online/images",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_online_images(param: SocialOnlineImages = Body(...)):
    return await social_model.getInstance().search_online_images(param)


@social_routes.post(
    "/api/social/recon/image",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("scanning")),
    ],
)
async def search_dynamic_image(payload: dict = Body(...)):
    return await social_model.getInstance().search_image(payload)


@social_routes.post(
    "/api/social/followers",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_followers(param: SocialFollowersRequest = Body(...)):
    return await social_model.getInstance().search_followers(param)


@social_routes.post(
    "/api/social/following",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_following(param: SocialFollowingRequest = Body(...)):
    return await social_model.getInstance().search_following(param)


@social_routes.post(
    "/api/social/posts",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_posts(param: SocialPostsRequest = Body(...)):
    return await social_model.getInstance().search_posts(param)


@social_routes.post(
    "/api/social/videos",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_videos(param: SocialVideosRequest = Body(...)):
    return await social_model.getInstance().search_videos(param)


@social_routes.post(
    "/api/social/shorts",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_shorts(param: SocialShortsRequest = Body(...)):
    return await social_model.getInstance().search_shorts(param)


@social_routes.post(
    "/api/social/entity",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_entity(param: SocialProfileRequest = Body(...)):
    return await social_model.getInstance().search_entity(param)


@social_routes.post(
    "/api/social/metadata",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_social_metadata(param: SocialMetadataRequest = Body(...)):
    return await social_model.getInstance().search_metadata(param)


@social_routes.post(
    "/api/social/data",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning", bypass_licenses=["osint_advanced"]))])
async def append_social_data(data: dict = Body(...), current_user=Depends(get_current_user)):
    profile_username = (data or {}).get("profile_username") or (data or {}).get("root_username") or (data or {}).get("username") or ""
    profiles = (data or {}).get("profiles") or []
    replace = bool((data or {}).get("replace"))
    return await social_model.getInstance().append_social_profiles(str(current_user.id), profile_username, profiles, replace=replace)


@social_routes.get(
    "/api/social/data",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning", bypass_licenses=["osint_advanced", "social_mapper"]))])
async def get_social_data(current_user=Depends(get_current_user)):
    return await social_model.getInstance().get_social_profiles(str(current_user.id))


@social_routes.get(
    "/api/social/data/{profile_username}",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning", bypass_licenses=["osint_advanced", "social_mapper"]))])
async def get_social_profiles(profile_username: str, current_user=Depends(get_current_user)):
    return await social_model.getInstance().get_social_profiles(str(current_user.id), profile_username)


@social_routes.delete(
    "/api/social/data/{profile_username:path}",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning", bypass_licenses=["osint_advanced"]))])
async def delete_social_profiles(profile_username: str, current_user=Depends(get_current_user)):
    return await social_model.getInstance().delete_social_profiles(str(current_user.id), profile_username)
