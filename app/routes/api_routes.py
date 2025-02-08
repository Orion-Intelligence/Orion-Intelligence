from fastapi import APIRouter, Depends
from backend.management.jobs.insight_job import insight_job
from backend.services.session_manager.shared_model.auth_models import user_role
from backend.view_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from backend.view_managers.interactive.directory_manager.directory_view_model import directory_view_model
from backend.view_managers.interactive.search_manager.parsers.search_api_param_model import search_api_param_model
from backend.view_managers.interactive.search_manager.search_view_model import search_view_model
from configs.app_dependency import role_required

api_routes = APIRouter()

@api_routes.get("/api/directory", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(param: directory_param_model = Depends()):
    return await directory_view_model.getInstance().api_invoke_trigger(param)

@api_routes.get("/api/insight", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser():
    return await insight_job.get_instance().get_trending_insights()

@api_routes.get("/api/search", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(param: search_api_param_model = Depends()):
    return await search_view_model.getInstance().api_invoke_trigger(param)
