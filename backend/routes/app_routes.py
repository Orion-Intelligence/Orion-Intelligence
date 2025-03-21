from typing import Optional

from fastapi import Depends, Query
from fastapi import APIRouter, Form, HTTPException, Request
from orion.api.interactive.directory_manager.directory_model import directory_model
from orion.api.interactive.hompage_manager.homepage_model import homepage_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.server.config_manager.config_controller import config_controller
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.api.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import search_dynamic_param_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_param_model import search_general_param_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from configs.app_dependency import role_required

admin_routes = APIRouter()

@admin_routes.get("/admin/api/db_system_model/row-action")
async def block_row_action(name: str = Query(...)):
  if name == "delete":
    raise HTTPException(status_code=403, detail="Deletion of system settings is not allowed")

  return {"message": f"Action '{name}' is not restricted"}
