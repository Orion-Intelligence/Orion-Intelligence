from fastapi import Body, Depends, APIRouter
from fastapi import File
from fastapi import UploadFile
from configs.app_dependency import role_required, get_current_user, status_required
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role
from orion.api.interactive.case_manager.case_manager import CaseManager
from orion.api.interactive.case_manager.case_share_manager import CaseShareManager
from orion.api.interactive.case_manager.models.case_models import CreateCaseRequest
from orion.api.interactive.case_manager.models.case_models import CreateCaseShareRequest
from orion.api.interactive.case_manager.models.case_models import UpdateCaseRequest

case_routes = APIRouter(dependencies=[Depends(status_required([UserStatus.ACTIVE]))])
@case_routes.get(
    "/api/profile/cases",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def get_cases(current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().get_cases(current_user)


@case_routes.post(
    "/api/profile/cases",
    status_code=201,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def create_case(payload: CreateCaseRequest = Body(...), current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().create_case(payload, current_user)


@case_routes.get(
    "/api/profile/cases/next-id",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def get_next_case_id(current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().get_next_case_id(current_user)


@case_routes.get(
    "/api/profile/cases/analysts",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def get_case_analysts(current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().get_case_analysts(current_user)


@case_routes.post(
    "/api/profile/cases/{case_id}/shares",
    status_code=201,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def create_case_share(case_id: str, payload: CreateCaseShareRequest = Body(...), current_user=Depends(get_current_user)):
    return await CaseShareManager.get_instance().create_case_share(case_id, payload, current_user)


@case_routes.delete(
    "/api/profile/cases/{case_id}/shares",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def revoke_case_shares(case_id: str, current_user=Depends(get_current_user)):
    return await CaseShareManager.get_instance().revoke_case_shares(case_id, current_user)


@case_routes.get(
    "/api/profile/cases/{case_id}",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def get_case(case_id: str, current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().get_case_by_id(case_id, current_user)


@case_routes.put(
    "/api/profile/cases/{case_id}",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def update_case(case_id: str, payload: UpdateCaseRequest = Body(...), current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().update_case(case_id, payload, current_user)


@case_routes.post(
    "/api/profile/cases/{case_id}/artifacts/{artifact_id}/file",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def upload_artifact_file(
    case_id: str,
    artifact_id: str,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    return await CaseManager.get_instance().upload_artifact_file(
        case_id, artifact_id, file, current_user
    )


@case_routes.get(
    "/api/profile/cases/{case_id}/artifacts/{artifact_id}/file/view",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def view_artifact_file(
    case_id: str,
    artifact_id: str,
    current_user=Depends(get_current_user),
):
    return await CaseManager.get_instance().get_artifact_file_response(
        case_id, artifact_id, current_user, download=False
    )


@case_routes.get(
    "/api/profile/cases/{case_id}/artifacts/{artifact_id}/file/download",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def download_artifact_file(
    case_id: str,
    artifact_id: str,
    current_user=Depends(get_current_user),
):
    return await CaseManager.get_instance().get_artifact_file_response(
        case_id, artifact_id, current_user, download=True
    )


@case_routes.delete(
    "/api/profile/cases/{case_id}/artifacts/{artifact_id}/file",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def delete_artifact_file(
    case_id: str,
    artifact_id: str,
    current_user=Depends(get_current_user),
):
    return await CaseManager.get_instance().delete_artifact_file_from_case(
        case_id, artifact_id, current_user
    )


@case_routes.delete(
    "/api/profile/cases/{case_id}",
    status_code=200,
    tags=["Case Management"],
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
    ],
)
async def delete_case(case_id: str, current_user=Depends(get_current_user)):
    return await CaseManager.get_instance().delete_case(case_id, current_user)
