import base64

from fastapi import APIRouter, Body, Depends, Query, UploadFile, File

from configs.app_dependency import get_current_user, license_required, role_required, status_required
from orion.api.interactive.graph_manager.graph_models.search_social_param_model import (
    SocialFollowersRequest,
    SocialFollowingRequest,
    SocialMetadataRequest,
    SocialOnlineImages,
    SocialProfileRequest,
    SocialReconRequest,
)
from orion.api.interactive.graph_manager.graphs_model import graphs_model
from orion.api.interactive.search_manager.search_model import search_model
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role
from routes.docs.docs import (SOCIAL_DOCS)

social_routes = APIRouter(dependencies=[Depends(status_required([UserStatus.ACTIVE]))])


@social_routes.post(
    "/api/social/recon",
    summary="Cross-platform identity search to locate a user's digital footprint",
    description=SOCIAL_DOCS["profile_global_presence"]["description"],
    tags=["Socail Search"],
    operation_id="getSocailProfileGlobalPresence",
    response_description=SOCIAL_DOCS["profile_global_presence"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_email(param: SocialReconRequest = Body(...)):
    return await search_model.getInstance().social_search(param, "recon")


@social_routes.post(
    "/api/social/phone/recon",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_phone_recon(param: SocialReconRequest = Body(...)):
    return await search_model.getInstance().social_search(param, "phone")


@social_routes.post(
    "/api/social/profile",
    summary="Scrapes the profile of requested social account",
    description=SOCIAL_DOCS["profile_search"]["description"],
    tags=["Socail Search"],
    operation_id="getSocailProfiles",
    response_description=SOCIAL_DOCS["profile_search"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_profile(param: SocialProfileRequest = Body(...)):
    return await search_model.getInstance().social_search(param, "profile")


@social_routes.post(
    "/api/social/online/images",
    summary="Scrapes the images of requested social account",
    description=SOCIAL_DOCS["profile_images"]["description"],
    tags=["Socail Search"],
    operation_id="getSocailProfileImages",
    response_description=SOCIAL_DOCS["profile_images"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_online_images(param: SocialOnlineImages = Body(...)):
    return await search_model.getInstance().social_search(param, "online/images")


@social_routes.post(
    "/api/social/recon/image",
    summary="Reverse image search to identify associated social profiles",
    description=SOCIAL_DOCS["recon_image_search"]["description"],
    tags=["Socail Search"],
    operation_id="getSocailReconImageSearch",
    response_description=SOCIAL_DOCS["recon_image_search"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("scanning")),
    ],
)
async def search_dynamic_image(payload: dict = Body(...)):
    image_base64 = payload.get("image_base64")
    if not image_base64:
        return {"status": "error", "message": "image_base64_required"}

    file_bytes = base64.b64decode(image_base64)

    return await search_model.getInstance().social_search(
        {"file_bytes": file_bytes, "filename": "upload.png"},
        "recon/image",
    )


@social_routes.post(
    "/api/social/followers",
    summary="Scrapes the followers of requested social account",
    description=SOCIAL_DOCS["profile_followers"]["description"],
    tags=["Socail Search"],
    operation_id="getSocailProfileFollowers",
    response_description=SOCIAL_DOCS["profile_followers"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_followers(param: SocialFollowersRequest = Body(...)):
    return await graphs_model.getInstance().social_search(param, "followers")


@social_routes.post(
    "/api/social/following",
    summary="Scrapes the following of requested social account",
    description=SOCIAL_DOCS["profile_following"]["description"],
    tags=["Socail Search"],
    operation_id="getSocailProfileFollowing",
    response_description=SOCIAL_DOCS["profile_following"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_following(param: SocialFollowingRequest = Body(...)):
    return await graphs_model.getInstance().social_search(param, "following")


@social_routes.post(
    "/api/social/posts",
    summary="Scrapes the posts of requested social account",
    description=SOCIAL_DOCS["profile_posts"]["description"],
    tags=["Socail Search"],
    operation_id="getSocailProfilePosts",
    response_description=SOCIAL_DOCS["profile_posts"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_posts(param: SocialProfileRequest = Body(...)):
    return await graphs_model.getInstance().social_search(param, "posts")


@social_routes.post(
    "/api/social/entity",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_entity(param: SocialProfileRequest = Body(...)):
    return await graphs_model.getInstance().social_search(param, "entity")


@social_routes.post(
    "/api/social/metadata",
    summary="Search for specific keyword combinations linked to a username across social platforms.",
    description=SOCIAL_DOCS["profile_metadata"]["description"],
    tags=["Socail Search"],
    operation_id="getSocailMetadata",
    response_description=SOCIAL_DOCS["profile_metadata"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_social_metadata(param: SocialMetadataRequest = Body(...)):
    return await search_model.getInstance().social_search(param, "metadata")


@social_routes.post(
    "/api/social/session/upsert",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def upsert_social_session(data: dict = Body(...), graph_type: str = Query("social"), current_user=Depends(get_current_user)):
    gt = (data or {}).get("graph_type") or graph_type or "social"
    return await graphs_model.getInstance().upsert_data(str(current_user.id), gt, data)


@social_routes.get(
    "/api/social/session/tabs",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def get_social_tabs(graph_type: str = Query("social"), current_user=Depends(get_current_user)):
    return await graphs_model.getInstance().get_tabs_summary(str(current_user.id), graph_type)


@social_routes.post(
    "/api/social/session/tab/add",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def add_social_tab(tab: dict = Body(...), graph_type: str = Query("social"), current_user=Depends(get_current_user)):
    gt = (tab or {}).get("graph_type") or graph_type or "social"
    return await graphs_model.getInstance().add_tab(str(current_user.id), gt, tab)
