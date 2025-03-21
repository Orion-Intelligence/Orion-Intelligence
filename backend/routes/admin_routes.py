from fastapi import Query
from fastapi import APIRouter, HTTPException

admin_routes = APIRouter()

@admin_routes.get("/admin/api/db_system_model/row-action")
async def block_row_action(name: str = Query(...)):
  if name == "delete":
    raise HTTPException(status_code=403, detail="Deletion of system settings is not allowed")

  return {"message": f"Action '{name}' is not restricted"}
