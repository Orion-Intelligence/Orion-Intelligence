from fastapi import APIRouter, Body, Depends, File, Query, UploadFile

from configs.app_dependency import get_current_user, license_required, role_required, status_required
from configs.limiter_dependency import limiter_dependency
from orion.api.interactive.account_manager.account_manager import AccountManager
from orion.api.interactive.auth_manager.auth_manager import auth_manager
from orion.api.interactive.auth_manager.models.forgot_password_request import ForgotPasswordRequest
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import search_dynamic_crack_model, search_dynamic_onion_search, search_dynamic_param_model, search_dynamic_social_model
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import DomainScanRequest, UrlVulnerabilityScanRequest
from orion.api.server.crawl_manager.class_model.ip_scan_request_model import GeoCameraDetectRangesRequest, GeoCameraDetectRequest, NetIntelDeepScanRequest, ResolveIPRequest
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role
from routes.helper.route_test_helper import TestRouteHelper


SCAN_ROLES = [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]
SCAN_DEPS = [Depends(role_required(SCAN_ROLES)), Depends(license_required("scanning"))]
SCAN_LIMITED_DEPS = [
    Depends(role_required(SCAN_ROLES)),
    Depends(limiter_dependency),
    Depends(license_required("scanning")),
]
ANALYST_DEPS = [Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))]
ADMIN_DEPS = [Depends(role_required([user_role.ADMIN]))]
ANALYST_SCAN_DEPS = [
    Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    Depends(license_required("scanning")),
]


test_routes = APIRouter(
    dependencies=[
        Depends(status_required([UserStatus.ACTIVE])),
        Depends(TestRouteHelper.require_testing_enabled),
    ]
)


@test_routes.post(
    "/api/get/tenant/node",
    include_in_schema=False,
)
async def test_get_tenant_node(current_user=Depends(get_current_user)):
    response = await AccountManager.get_instance().get_node(current_user)

    if response.user.username == "enterprise_tour1":
        response.user.demo_tour = False
    else:
        response.user.demo_tour = True

    return response


@test_routes.post(
    "/api/dynamic/user",
    dependencies=SCAN_DEPS,
)
async def test_search_dynamic_email(param: search_dynamic_param_model = Body(...)):
    return TestRouteHelper.pending_or_api_mock("dynamic_user", "dynamic_user_done.json")


@test_routes.post(
    "/api/dynamic/cracked",
    dependencies=SCAN_DEPS,
)
async def test_search_dynamic_cracked(param: search_dynamic_crack_model = Body(...)):
    return TestRouteHelper.pending_or_api_mock("dynamic_cracked", "dynamic_cracked.json")


@test_routes.post("/api/forgot")
async def forgotPassword(request: ForgotPasswordRequest):
    return await auth_manager.forgot_password(request.email)


@test_routes.post(
    "/api/dynamic/software",
    dependencies=SCAN_DEPS,
)
async def test_search_dynamic_software(param: search_dynamic_crack_model = Body(...)):
    return TestRouteHelper.pending_or_api_mock("dynamic_software", "dynamic_software.json")


@test_routes.post(
    "/api/urlscan/ip",
    dependencies=SCAN_DEPS,
)
@test_routes.post(
    "/api/urlscan/dns",
    dependencies=SCAN_DEPS,
)
async def test_search_dynamic_ip_scan(param: DomainScanRequest = Body(...)):
    return TestRouteHelper.pending_or_api_mock("urlscan_ip", "urlscan_domain_iplookup.json")


@test_routes.post(
    "/api/dynamic/social",
    dependencies=SCAN_DEPS,
)
async def test_search_dynamic_social(param: search_dynamic_social_model = Body(...)):
    return TestRouteHelper.pending_or_api_mock("dynamic_social", "dynamic_social.json")


@test_routes.post(
    "/api/dynamic/wanted",
    dependencies=SCAN_DEPS,
)
async def test_search_dynamic_wanted(param: search_dynamic_social_model = Body(...)):
    return TestRouteHelper.pending_or_api_mock("dynamic_wanted", "dynamic_wanted.json")


@test_routes.post(
    "/api/dynamic/national-identity",
    dependencies=SCAN_DEPS,
)
async def test_search_dynamic_national_identity(param: search_dynamic_crack_model = Body(...)):
    return TestRouteHelper.pending_or_api_mock("dynamic_national_identity", "dynamic_national_identity.json")


@test_routes.post(
    "/api/urlscan/domain",
    dependencies=SCAN_LIMITED_DEPS,
)
async def test_parse_domain(payload: DomainScanRequest):
    return TestRouteHelper.pending_or_dynamic_scan(payload.scanType)


@test_routes.post(
    "/api/urlscan/subdomains",
    dependencies=SCAN_LIMITED_DEPS,
)
async def test_parse_subdomains(payload: DomainScanRequest):
    return TestRouteHelper.pending_or_dynamic_scan(payload.scanType)


@test_routes.post(
    "/api/urlscan/wayback",
    dependencies=SCAN_LIMITED_DEPS,
)
async def test_parse_wayback(payload: DomainScanRequest):
    return TestRouteHelper.pending_or_dynamic_scan(payload.scanType)


@test_routes.post(
    "/api/ioc/extract",
    dependencies=ANALYST_DEPS,
)
async def extract_ioc(file: UploadFile = File(...)):
    return TestRouteHelper.pending_or_api_mock("ioc_file_extract", "ioc_file_extract.json")


@test_routes.post(
    "/file/scan/{user_id}",
    include_in_schema=False,
)
async def file_scan(user_id: str, file: UploadFile = File(...)):
    return TestRouteHelper.pending_or_api_mock("ioc_file_extract", "ioc_file_extract.json")


@test_routes.post(
    "/api/apk/scan",
    include_in_schema=False,
    dependencies=ANALYST_DEPS,
)
async def extract_apk_ioc(file: UploadFile = File(...)):
    return TestRouteHelper.pending_or_api_mock("ioc_apk_extract", "ioc_apk_extract.json")


@test_routes.post(
    "/api/crypto/scan",
    include_in_schema=False,
    dependencies=ANALYST_DEPS,
)
async def extract_crypto():
    return TestRouteHelper.pending_or_api_mock("dynamic_crypto_scan", "dynamic_crypto_scan.json")


@test_routes.post(
    "/api/nexus/analyze-text",
    include_in_schema=False,
    dependencies=ANALYST_DEPS,
)
async def test_nexus_analyze_text(_payload: dict = Body(...)):
    return TestRouteHelper.load_api_mock("nexus_analyze_text.json")


@test_routes.post(
    "/api/nlp/chat/report",
    include_in_schema=False,
    dependencies=ADMIN_DEPS,
)
async def test_nlp_chat_report(_payload: dict = Body(...)):
    return TestRouteHelper.static_test_chat_response()


@test_routes.post(
    "/api/nexus/chat",
    include_in_schema=False,
    dependencies=SCAN_DEPS,
)
async def test_nexus_chat(_payload: dict = Body(...)):
    return TestRouteHelper.static_test_chat_streaming_response()


@test_routes.post(
    "/api/nexus/chat/workspace",
    include_in_schema=False,
    dependencies=SCAN_DEPS,
)
async def test_nexus_workspace_chat(_payload: dict | None = Body(default=None)):
    return TestRouteHelper.static_test_chat_streaming_response()


@test_routes.post(
    "/api/get/current/user/chat-history",
    include_in_schema=False,
    dependencies=ANALYST_DEPS,
)
async def test_get_current_user_chat_history():
    return {"history": [], "chat_history": []}


@test_routes.post(
    "/api/update/current/user/chat-history",
    include_in_schema=False,
    dependencies=ANALYST_DEPS,
)
async def test_update_current_user_chat_history(data: dict = Body(...)):
    history = data.get("chat_history", [])
    return {"history": history, "chat_history": history}


@test_routes.post(
    "/api/cross/search",
    include_in_schema=False,
    dependencies=ANALYST_SCAN_DEPS,
)
async def test_cross_search(payload: search_dynamic_onion_search = Body(...)):
    return TestRouteHelper.pending_or_api_mock("dynamic_cross_search", "dynamic_cross_search.json")


@test_routes.post(
    "/api/netintel/resolve_ip",
    include_in_schema=False,
    dependencies=ANALYST_DEPS,
)
async def test_netintel_resolve_ip(payload: ResolveIPRequest = Body(...)):
    return TestRouteHelper.pending_or_api_mock("netintel_resolve_ip", "netintel_resolve_ip.json")


@test_routes.post(
    "/api/netintel/ipscanner",
    include_in_schema=False,
    dependencies=ANALYST_DEPS,
)
async def test_netintel_ipscanner(payload: NetIntelDeepScanRequest = Body(...)):
    return TestRouteHelper.pending_or_api_mock("netintel_ipscanner", "netintel_ipscanner.json")


@test_routes.post(
    "/api/netintel/url_vulnerability_scan",
    include_in_schema=False,
    dependencies=ANALYST_DEPS,
)
async def test_netintel_url_vulnerability_scan(payload: UrlVulnerabilityScanRequest = Body(...)):
    return TestRouteHelper.pending_or_dynamic_scan("basic")


@test_routes.post(
    "/api/netintel/iot_detect",
    include_in_schema=False,
    dependencies=ANALYST_DEPS,
)
async def test_netintel_camera_detect(payload: GeoCameraDetectRequest = Body(...)):
    return TestRouteHelper.pending_or_api_mock("netintel_camera_detect", "netintel_camera_detect.json")


@test_routes.post(
    "/api/netintel/camera_detect_ranges",
    include_in_schema=False,
    dependencies=ANALYST_DEPS,
)
async def test_netintel_camera_detect_ranges(payload: GeoCameraDetectRangesRequest = Body(...)):
    return TestRouteHelper.pending_or_api_mock("netintel_camera_detect_ranges", "netintel_camera_detect_ranges.json")


@test_routes.post(
    "/api/social/recon",
    dependencies=SCAN_DEPS,
)
async def test_social_recon(payload: dict = Body(...)):
    return TestRouteHelper.pending_or_elastic_mock("social_recon", "social_recon.json")


@test_routes.post(
    "/api/social/recon/image",
    dependencies=SCAN_DEPS,
)
async def test_social_recon_image(payload: dict = Body(...)):
    return TestRouteHelper.pending_or_elastic_mock("social_recon_image", "social_recon_image.json")


@test_routes.post(
    "/api/social/profile",
    dependencies=SCAN_DEPS,
)
async def test_social_profile(payload: dict = Body(...)):
    return TestRouteHelper.pending_or_elastic_mock("social_profile", "social_profile.json")


@test_routes.post(
    "/api/social/online/images",
    dependencies=SCAN_DEPS,
)
async def test_social_online_images(payload: dict = Body(...)):
    return TestRouteHelper.pending_or_elastic_mock("social_online_images", "social_online_images.json")


@test_routes.post(
    "/api/social/posts",
    dependencies=SCAN_DEPS,
)
async def test_social_posts(payload: dict = Body(...)):
    return TestRouteHelper.pending_or_elastic_mock("social_posts", "social_posts.json")


@test_routes.post(
    "/api/social/followers",
    dependencies=SCAN_DEPS,
)
async def test_social_followers(payload: dict = Body(...)):
    return TestRouteHelper.pending_or_elastic_mock("social_followers", "social_followers.json")


@test_routes.post(
    "/api/social/following",
    dependencies=SCAN_DEPS,
)
async def test_social_following(payload: dict = Body(...)):
    return TestRouteHelper.pending_or_elastic_mock("social_following", "social_following.json")


@test_routes.post(
    "/api/social/entity",
    dependencies=SCAN_DEPS,
)
async def test_social_entity(payload: dict = Body(...)):
    return TestRouteHelper.pending_or_elastic_mock("social_entity", "social_entity.json")


@test_routes.post(
    "/api/social/session/upsert",
    dependencies=SCAN_DEPS,
)
async def test_social_session_upsert(data: dict = Body(...), graph_type: str = Query("social")):
    return TestRouteHelper.pending_or_elastic_mock(f"social_session_upsert_{graph_type}", "social_session_upsert.json")


@test_routes.get(
    "/api/social/session/tabs",
    dependencies=SCAN_DEPS,
)
async def test_social_session_tabs(graph_type: str = Query("social")):
    if graph_type == "graph":
        return TestRouteHelper.load_elastic_mock("social_session_tabs_graph.json")
    return TestRouteHelper.load_elastic_mock("social_session_tabs_social.json")


@test_routes.post(
    "/api/social/session/tab/add",
    dependencies=SCAN_DEPS,
)
async def test_social_session_tab_add(tab: dict = Body(...), graph_type: str = Query("social")):
    return TestRouteHelper.pending_or_elastic_mock(f"social_session_tab_add_{graph_type}", "social_session_tab_add.json")
