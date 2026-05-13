from fastapi import Body, Depends, APIRouter
from configs.app_dependency import license_required, role_required, get_current_user, status_required
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role
from orion.api.interactive.case_manager.case_manager import CaseManager
from orion.api.interactive.case_manager.models.case_models import CreateCaseRequest

case_routes = APIRouter(dependencies=[Depends(status_required([UserStatus.ACTIVE]))])
@case_routes.get(
    "/api/profile/cases",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER])),
        Depends(license_required("maintainer")),
    ],
)
async def get_cases(current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().get_cases(current_user)


@case_routes.post(
    "/api/profile/cases",
    status_code=201,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER])),
        Depends(license_required("maintainer")),
    ],
)
async def create_case(payload: CreateCaseRequest = Body(...), current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().create_case(payload, current_user)


@case_routes.get(
    "/api/profile/cases/next-id",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER])),
        Depends(license_required("maintainer")),
    ],
)
async def get_next_case_id(current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().get_next_case_id(current_user)


@case_routes.get(
    "/api/profile/cases/validate/{case_id}",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER])),
        Depends(license_required("maintainer")),
    ],
)
async def validate_case(case_id: str, current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().validate_case_exists(case_id, current_user)

@case_routes.get(
    "/api/profile/cases/{case_id}",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER])),
        Depends(license_required("maintainer")),
    ],
)
async def get_case(case_id: str, current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().get_case_by_id(case_id, current_user)


@case_routes.put(
    "/api/profile/cases/{case_id}",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER])),
        Depends(license_required("maintainer")),
    ],
)
async def update_case(case_id: str, payload: CreateCaseRequest = Body(...), current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().update_case(case_id, payload, current_user)

@case_routes.get(
    "/api/profile/cases/check/{case_id}",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER])),
        Depends(license_required("maintainer")),
    ],
)
async def check_case_exists(case_id: str, current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().check_case_exists_safe(case_id, current_user)