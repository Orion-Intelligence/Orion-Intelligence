from fastapi import APIRouter, HTTPException
from fastapi import Query
from fastapi import Request
from fastapi import Request, Depends
from odmantic import AIOEngine
from fastapi.responses import RedirectResponse
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account
from orion.services.mongo_manager.mongo_controller import mongo_controller



admin_routes = APIRouter()


@admin_routes.get("/admin/api/db_system_model/row-action")
async def block_row_action(name: str = Query(...)):
    if name == "delete":
        raise HTTPException(status_code=403, detail="Deletion of system settings is not allowed")

    return {"message": f"Action '{name}' is not restricted"}

@admin_routes.post("/admin/db_user_account/edit/{id}")
async def custom_edit(
    id: str,
    request: Request,
    engine: AIOEngine = Depends(mongo_controller.get_instance().get_engine)
):
    form = await request.form()
    updates = dict(form)
    await db_user_account.edit_userStatus_and_sendMail(engine, id, updates)
    return RedirectResponse(url="/admin/db_user_account/list", status_code=302)
