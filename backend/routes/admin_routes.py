from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from orion.api.interactive.auth_manager.auth_manager import auth_manager

admin_routes = APIRouter()

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
