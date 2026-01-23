import json
from pathlib import Path

from fastapi import APIRouter, Body, Depends
from configs.app_dependency import license_required, role_required, status_required
from configs.limiter_dependency import limiter_dependency
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import (search_dynamic_crack_model, search_dynamic_param_model, search_dynamic_social_model, )
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import (DomainScanRequest, )
from orion.helper_manager.env_handler import env_handler
from orion.services.mongo_manager.shared_model.db_auth_models import (UserStatus, user_role, )


_MOCKS_DIR = Path(__file__).resolve().parents[1] / "static" / "test" / "mocks" / "api"


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
    return json.loads((_MOCKS_DIR / f"urlscan_domain_{payload.scanType}.json").read_text(encoding="utf-8"))
