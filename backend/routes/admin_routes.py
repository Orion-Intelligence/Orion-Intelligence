from fastapi import APIRouter, HTTPException
from fastapi import Query
from fastapi import Request
from fastapi import Request, Depends
from odmantic import AIOEngine
from bson import ObjectId
from fastapi.responses import RedirectResponse
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.send_mail.send_mail import send_email



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

    user = await engine.find_one(db_user_account, db_user_account.id == ObjectId(id))
    if not user:
        return {"error": "User not found"}

    old_status = getattr(user, "status", None)
    new_status = updates.get("status", old_status)

    for field, value in updates.items():
        if hasattr(user, field):
            setattr(user, field, value)

    await engine.save(user)

    if old_status != "onboarding" and new_status == "onboarding":
        await send_email(
        to=user.email,
        subject="Your account has been approved",
        body=f"Hi {user.username},\n\nYour account is now approved. You can log in and start onboarding.\n\nBest regards,\nTeam")
        

    return RedirectResponse(url="/admin/db_user_account/list", status_code=302)
