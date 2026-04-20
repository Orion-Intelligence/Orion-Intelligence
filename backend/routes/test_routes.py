import json
from pathlib import Path

from fastapi import APIRouter, Body, Depends, UploadFile, File, Query, HTTPException
from configs.app_dependency import get_current_user, license_required, role_required, status_required
from configs.limiter_dependency import limiter_dependency
from orion.api.interactive.account_manager.account_manager import AccountManager
from orion.api.interactive.auth_manager.auth_manager import auth_manager
from orion.api.interactive.auth_manager.models.forgot_password_request import ForgotPasswordRequest
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import (search_dynamic_crack_model, search_dynamic_param_model, search_dynamic_social_model, search_dynamic_onion_search, )
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import (
    DomainScanRequest,
    UrlVulnerabilityScanRequest,
)
from orion.api.server.crawl_manager.class_model.ip_scan_request_model import (
    GeoCameraDetectRangesRequest,
    GeoCameraDetectRequest,
    NetIntelDeepScanRequest,
    ResolveIPRequest,
)
from orion.helper_manager.env_handler import env_handler
from orion.services.mongo_manager.shared_model.db_auth_models import (UserStatus, user_role, )


_MOCKS_DIR = Path(__file__).resolve().parents[1] / "static" / "test" / "mocks" / "api"
_ELASTIC_MOCKS_DIR = Path(__file__).resolve().parents[1] / "static" / "test" / "mocks" / "elastic"


def _mock_step(key: str):
    p = _MOCKS_DIR / f".{key}.state"
    p.parent.mkdir(parents=True, exist_ok=True)
    try:
        n = int(p.read_text(encoding="utf-8").strip() or "0")
    except FileNotFoundError:
        n = 0
    except Exception:
        n = 0
    p.write_text(str(n + 1), encoding="utf-8")
    if n == 0:
        return {"status": "pending", "progress": 20, "step": "running"}
    return None


def _load_elastic_mock(filename: str):
    return json.loads((_ELASTIC_MOCKS_DIR / filename).read_text(encoding="utf-8"))

def _load_api_mock(filename: str):
    return json.loads((_MOCKS_DIR / filename).read_text(encoding="utf-8"))

def _pending_or_api_mock(step_key: str, filename: str):
    step = _mock_step(step_key)
    if step:
        return step
    return _load_api_mock(filename)

def _pending_or_elastic_mock(step_key: str, filename: str):
    step = _mock_step(step_key)
    if step:
        return step
    return _load_elastic_mock(filename)

def _pending_or_dynamic_scan(scan_type: str):
    step_key = f"urlscan_domain_{scan_type}"
    step = _mock_step(step_key)
    if step:
        return step
    filename = f"urlscan_domain_{scan_type}.json"
    print(_MOCKS_DIR / filename)
    return _load_api_mock(filename)


def require_testing_enabled():
    if env_handler.get_instance().env("TESTING_ENABLED", "0") != "1":
        raise HTTPException(status_code=403, detail="Test routes are disabled")
    return True


test_routes = APIRouter(
    dependencies=[
        Depends(status_required([UserStatus.ACTIVE])),
        Depends(require_testing_enabled),
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
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_search_dynamic_email(param: search_dynamic_param_model = Body(...)):
    step = _mock_step("dynamic_user")
    if step:
        return step
    return json.loads((_MOCKS_DIR / "dynamic_user_done.json").read_text(encoding="utf-8"))


@test_routes.post(
    "/api/dynamic/cracked",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_search_dynamic_cracked(param: search_dynamic_crack_model = Body(...)):
    step = _mock_step("dynamic_cracked")
    if step:
        return step
    return json.loads((_MOCKS_DIR / "dynamic_cracked.json").read_text(encoding="utf-8"))


@test_routes.post("/api/forgot")
async def forgotPassword(request: ForgotPasswordRequest):
    return await auth_manager.forgot_password(request.email)


@test_routes.post(
    "/api/dynamic/software",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_search_dynamic_software(param: search_dynamic_crack_model = Body(...)):
    return _pending_or_api_mock("dynamic_software", "dynamic_software.json")

@test_routes.post(
    "/api/urlscan/ip",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
@test_routes.post(
    "/api/urlscan/dns",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_search_dynamic_ip_scan(param: DomainScanRequest = Body(...)):
    return _pending_or_api_mock("urlscan_ip", "urlscan_domain_iplookup.json")

@test_routes.post(
    "/api/dynamic/social",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_search_dynamic_social(param: search_dynamic_social_model = Body(...)):
    step = _mock_step("dynamic_social")
    if step:
        return step
    return json.loads((_MOCKS_DIR / "dynamic_social.json").read_text(encoding="utf-8"))


@test_routes.post(
    "/api/dynamic/wanted",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_search_dynamic_wanted(param: search_dynamic_social_model = Body(...)):
    return _pending_or_api_mock("dynamic_wanted", "dynamic_wanted.json")


@test_routes.post(
    "/api/dynamic/national-identity",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_search_dynamic_national_identity(param: search_dynamic_crack_model = Body(...)):
    return _pending_or_api_mock("dynamic_national_identity", "dynamic_national_identity.json")

@test_routes.post(
    "/api/urlscan/domain",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency),
        Depends(license_required("scanning")), ], )
async def test_parse_domain(payload: DomainScanRequest):
    return _pending_or_dynamic_scan(payload.scanType)

@test_routes.post(
    "/api/urlscan/subdomains",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency),
        Depends(license_required("scanning")), ], )
async def test_parse_subdomains(payload: DomainScanRequest):
    return _pending_or_dynamic_scan(payload.scanType)

@test_routes.post(
    "/api/urlscan/wayback",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency),
        Depends(license_required("scanning")), ], )
async def test_parse_wayback(payload: DomainScanRequest):
    return _pending_or_dynamic_scan(payload.scanType)

@test_routes.post(
    "/api/ioc/extract",
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)

async def extract_ioc():
    step = _mock_step(f"ioc_file_extract")
    if step:
        return step
    return json.loads((_MOCKS_DIR / f"ioc_file_extract.json").read_text(encoding="utf-8"))

@test_routes.post(
    "/api/apk/scan",
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def extract_ioc(file: UploadFile = File(...)):
    step = _mock_step(f"ioc_apk_extract")
    if step:
        return step
    return json.loads((_MOCKS_DIR / f"ioc_apk_extract.json").read_text(encoding="utf-8"))

@test_routes.post(
    "/api/crypto/scan",
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def extract_crypto():
    step = _mock_step(f"dynamic_crypto_scan")
    if step:
        return step
    return json.loads((_MOCKS_DIR / f"dynamic_crypto_scan.json").read_text(encoding="utf-8"))


@test_routes.post(
    "/api/cross/search",
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("scanning")),
    ],
)
async def test_cross_search(payload: search_dynamic_onion_search = Body(...)):
    return _pending_or_api_mock("dynamic_cross_search", "dynamic_cross_search.json")


@test_routes.post(
    "/api/netintel/resolve_ip",
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def test_netintel_resolve_ip(payload: ResolveIPRequest = Body(...)):
    step = _mock_step("netintel_resolve_ip")
    if step:
        return step
    return json.loads((_MOCKS_DIR / "netintel_resolve_ip.json").read_text(encoding="utf-8"))


@test_routes.post(
    "/api/netintel/ipscanner",
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def test_netintel_ipscanner(payload: NetIntelDeepScanRequest = Body(...)):
    step = _mock_step("netintel_ipscanner")
    if step:
        return step
    return json.loads((_MOCKS_DIR / "netintel_ipscanner.json").read_text(encoding="utf-8"))


@test_routes.post(
    "/api/netintel/url_vulnerability_scan",
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def test_netintel_url_vulnerability_scan(payload: UrlVulnerabilityScanRequest = Body(...)):
    return _pending_or_dynamic_scan("basic")


@test_routes.post(
    "/api/netintel/iot_detect",
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def test_netintel_camera_detect(payload: GeoCameraDetectRequest = Body(...)):
    step = _mock_step("netintel_camera_detect")
    if step:
        return step
    return json.loads((_MOCKS_DIR / "netintel_camera_detect.json").read_text(encoding="utf-8"))


@test_routes.post(
    "/api/netintel/camera_detect_ranges",
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def test_netintel_camera_detect_ranges(payload: GeoCameraDetectRangesRequest = Body(...)):
    step = _mock_step("netintel_camera_detect_ranges")
    if step:
        return step
    return json.loads((_MOCKS_DIR / "netintel_camera_detect_ranges.json").read_text(encoding="utf-8"))


@test_routes.post(
    "/api/social/recon",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_recon(payload: dict = Body(...)):
    return _pending_or_elastic_mock("social_recon", "social_recon.json")


@test_routes.post(
    "/api/social/recon/image",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_recon_image(payload: dict = Body(...)):
    return _pending_or_elastic_mock("social_recon_image", "social_recon_image.json")


@test_routes.post(
    "/api/social/profile",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_profile(payload: dict = Body(...)):
    return _pending_or_elastic_mock("social_profile", "social_profile.json")


@test_routes.post(
    "/api/social/online/images",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_online_images(payload: dict = Body(...)):
    return _pending_or_elastic_mock("social_online_images", "social_online_images.json")


@test_routes.post(
    "/api/social/posts",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_posts(payload: dict = Body(...)):
    return _pending_or_elastic_mock("social_posts", "social_posts.json")


@test_routes.post(
    "/api/social/followers",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_followers(payload: dict = Body(...)):
    return _pending_or_elastic_mock("social_followers", "social_followers.json")


@test_routes.post(
    "/api/social/following",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_following(payload: dict = Body(...)):
    return _pending_or_elastic_mock("social_following", "social_following.json")


@test_routes.post(
    "/api/social/entity",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_entity(payload: dict = Body(...)):
    return _pending_or_elastic_mock("social_entity", "social_entity.json")


@test_routes.post(
    "/api/social/session/upsert",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_session_upsert(data: dict = Body(...), graph_type: str = Query("social")):
    return _pending_or_elastic_mock(f"social_session_upsert_{graph_type}", "social_session_upsert.json")


@test_routes.get(
    "/api/social/session/tabs",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_session_tabs(graph_type: str = Query("social")):
    if graph_type == "graph":
        return _load_elastic_mock("social_session_tabs_graph.json")
    return _load_elastic_mock("social_session_tabs_social.json")


@test_routes.post(
    "/api/social/session/tab/add",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_session_tab_add(tab: dict = Body(...), graph_type: str = Query("social")):
    return _pending_or_elastic_mock(f"social_session_tab_add_{graph_type}", "social_session_tab_add.json")
