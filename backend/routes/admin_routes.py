from fastapi import APIRouter, HTTPException, Query, Request, Depends, UploadFile
from fastapi.responses import RedirectResponse

from configs.app_dependency import status_required, role_required, get_current_user
from orion.api.interactive.auth_manager.auth_manager import auth_manager
from orion.api.server.config_manager.config_controller import config_controller
from orion.api.server.config_manager.model.config_data import config_data
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role

admin_routes = APIRouter(
    dependencies=[Depends(status_required([UserStatus.ACTIVE]))], tags=["Orion API"], )


@admin_routes.get("/admin/api/db_system_model/row-action")
async def block_row_action(name: str = Query(...)):
    if name == "delete":
        raise HTTPException(status_code=403, detail="Deletion of system settings is not allowed")
    return {"message": f"Action '{name}' is not restricted"}


@admin_routes.post("/admin/api/db_user_account/edit/{id}")
async def custom_edit_api(id: str, request: Request):
    await auth_manager.edit_userStatus_and_sendMail_from_admin(id, request)
    return RedirectResponse(url="/admin/db_user_account/list", status_code=303)


@admin_routes.post("/admin/api/db_user_account/edit/{id}/")
async def custom_edit_api_trailing(id: str, request: Request):
    await auth_manager.edit_userStatus_and_sendMail_from_admin(id, request)
    return RedirectResponse(url="/admin/db_user_account/list", status_code=303)


@admin_routes.post(
    "/api/public/update", summary="Update public configuration", dependencies=[Depends(
        role_required(
            [user_role.ADMIN])), ], )
async def update_public_config(param: config_data):
    return await config_controller.getInstance().update_public_config(param)


@admin_routes.post(
    "/api/upload/system", summary="Upload system logo", dependencies=[Depends(role_required([user_role.ADMIN]))], )
async def upload_system_image(file: UploadFile, current_user=Depends(get_current_user)):
    return await config_controller.getInstance().uploadSystemResource(file, current_user)
