import json
from pathlib import Path

from fastapi import APIRouter, Body, Depends, UploadFile, File, Query
from configs.app_dependency import license_required, role_required, status_required
from configs.limiter_dependency import limiter_dependency
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import (search_dynamic_crack_model, search_dynamic_param_model, search_dynamic_social_model, )
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import (DomainScanRequest, )
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


test_routes = APIRouter(
    dependencies=[
        Depends(status_required([UserStatus.ACTIVE])),
        Depends(lambda: env_handler.get_instance().env("TESTING_ENABLED", "0") == "1"),
    ]
)


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


@test_routes.post(
    "/api/dynamic/software",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_search_dynamic_software(param: search_dynamic_crack_model = Body(...)):
    step = _mock_step("dynamic_software")
    if step:
        return step
    return json.loads((_MOCKS_DIR / "dynamic_software.json").read_text(encoding="utf-8"))

@test_routes.post(
    "/api/urlscan/ip",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_search_dynamic_software(param: search_dynamic_crack_model = Body(...)):
    step = _mock_step("dynamic_software")
    if step:
        return step
    return json.loads((_MOCKS_DIR / "urlscan_domain_iplookup.json").read_text(encoding="utf-8"))

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
    "/api/urlscan/domain",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency),
        Depends(license_required("scanning")), ], )
async def test_parse_text(payload: DomainScanRequest):
    step = _mock_step(f"urlscan_domain_{payload.scanType}")
    if step:
        return step
    print((_MOCKS_DIR / f"urlscan_domain_{payload.scanType}.json"))
    return json.loads((_MOCKS_DIR / f"urlscan_domain_{payload.scanType}.json").read_text(encoding="utf-8"))

@test_routes.post(
    "/api/urlscan/subdomains",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency),
        Depends(license_required("scanning")), ], )
async def test_parse_text(payload: DomainScanRequest):
    step = _mock_step(f"urlscan_domain_{payload.scanType}")
    if step:
        return step
    print((_MOCKS_DIR / f"urlscan_domain_{payload.scanType}.json"))
    return json.loads((_MOCKS_DIR / f"urlscan_domain_{payload.scanType}.json").read_text(encoding="utf-8"))

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
    "/api/social/recon",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_recon(payload: dict = Body(...)):
    step = _mock_step("social_recon")
    if step:
        return step
    return _load_elastic_mock("social_recon.json")


@test_routes.post(
    "/api/social/recon/image",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_recon_image(payload: dict = Body(...)):
    step = _mock_step("social_recon_image")
    if step:
        return step
    return _load_elastic_mock("social_recon_image.json")


@test_routes.post(
    "/api/social/profile",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_profile(payload: dict = Body(...)):
    step = _mock_step("social_profile")
    if step:
        return step
    return _load_elastic_mock("social_profile.json")


@test_routes.post(
    "/api/social/online/images",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_online_images(payload: dict = Body(...)):
    step = _mock_step("social_online_images")
    if step:
        return step
    return _load_elastic_mock("social_online_images.json")


@test_routes.post(
    "/api/social/posts",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_posts(payload: dict = Body(...)):
    step = _mock_step("social_posts")
    if step:
        return step
    return _load_elastic_mock("social_posts.json")


@test_routes.post(
    "/api/social/followers",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_followers(payload: dict = Body(...)):
    step = _mock_step("social_followers")
    if step:
        return step
    return _load_elastic_mock("social_followers.json")


@test_routes.post(
    "/api/social/following",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_following(payload: dict = Body(...)):
    step = _mock_step("social_following")
    if step:
        return step
    return _load_elastic_mock("social_following.json")


@test_routes.post(
    "/api/social/entity",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_entity(payload: dict = Body(...)):
    step = _mock_step("social_entity")
    if step:
        return step
    return _load_elastic_mock("social_entity.json")


@test_routes.post(
    "/api/social/session/upsert",
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def test_social_session_upsert(data: dict = Body(...), graph_type: str = Query("social")):
    step = _mock_step(f"social_session_upsert_{graph_type}")
    if step:
        return step
    return _load_elastic_mock("social_session_upsert.json")


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
    step = _mock_step(f"social_session_tab_add_{graph_type}")
    if step:
        return step
    return _load_elastic_mock("social_session_tab_add.json")
