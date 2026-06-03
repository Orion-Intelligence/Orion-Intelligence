import base64

from fastapi import APIRouter, Body, Depends, Query

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

social_routes = APIRouter(dependencies=[Depends(status_required([UserStatus.ACTIVE]))])


@social_routes.post(
    "/api/social/recon",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_email(param: SocialReconRequest = Body(...)):
    return await search_model.getInstance().social_search(param, "recon")


@social_routes.post(
    "/api/social/phone/recon",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_phone_recon(param: SocialReconRequest = Body(...)):
    return await search_model.getInstance().social_search(param, "phone")


@social_routes.post(
    "/api/social/profile",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_profile(param: SocialProfileRequest = Body(...)):
    return await search_model.getInstance().social_search(param, "profile")


@social_routes.post(
    "/api/social/online/images",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_online_images(param: SocialOnlineImages = Body(...)):
    return await search_model.getInstance().social_search(param, "online/images")


@social_routes.post(
    "/api/social/recon/image",
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
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_followers(param: SocialFollowersRequest = Body(...)):
    return await graphs_model.getInstance().social_search(param, "followers")


@social_routes.post(
    "/api/social/following",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_following(param: SocialFollowingRequest = Body(...)):
    return await graphs_model.getInstance().social_search(param, "following")


@social_routes.post(
    "/api/social/posts",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_posts(param: SocialProfileRequest = Body(...)):
    return await graphs_model.getInstance().social_search(param, "posts")


@social_routes.post(
    "/api/social/entity",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_entity(param: SocialProfileRequest = Body(...)):
    return await graphs_model.getInstance().social_search(param, "entity")


@social_routes.post(
    "/api/social/metadata",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_social_metadata(param: SocialMetadataRequest = Body(...)):
    return await search_model.getInstance().social_search(param, "metadata")


@social_routes.post(
    "/api/social/session/upsert",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning",bypass_licenses=["osint_advanced"]))])
async def upsert_social_session(data: dict = Body(...), graph_type: str = Query("social"), current_user=Depends(get_current_user)):
    gt = (data or {}).get("graph_type") or graph_type or "social"
    return await graphs_model.getInstance().upsert_data(str(current_user.id), gt, data)


@social_routes.get(
    "/api/social/session/tabs",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning",bypass_licenses=["osint_advanced","social_mapper"]))])
async def get_social_tabs(graph_type: str = Query("social"), current_user=Depends(get_current_user)):
    return await graphs_model.getInstance().get_tabs_summary(str(current_user.id), graph_type)


@social_routes.post(
    "/api/social/session/tab/add",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning",bypass_licenses=["osint_advanced"]))])
async def add_social_tab(tab: dict = Body(...), graph_type: str = Query("social"), current_user=Depends(get_current_user)):
    gt = (tab or {}).get("graph_type") or graph_type or "social"
    return await graphs_model.getInstance().add_tab(str(current_user.id), gt, tab)
