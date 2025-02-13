from fastapi import APIRouter, Depends
from starlette.requests import Request

from backend.management.jobs.insight_job import insight_job
from backend.services.mongo_manager.shared_model.db_auth_models import user_role
from backend.route_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from backend.route_managers.interactive.directory_manager.directory_view_model import directory_view_model
from backend.route_managers.interactive.search_manager.search_data_model.search_api_param_model import search_api_param_model
from backend.route_managers.interactive.search_manager.search_data_model.search_dynamic_param_model import search_dynamic_param_model
from backend.route_managers.interactive.search_manager.search_view_model import search_view_model
from configs.app_dependency import role_required

api_routes = APIRouter()

@api_routes.get("/api/directory", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(request: Request, param: directory_param_model = Depends()):
    return await directory_view_model.getInstance().api_invoke_trigger(param)

@api_routes.get("/api/insight", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(request: Request, ):
    return await insight_job.get_instance().get_trending_insights()

@api_routes.get("/api/search", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(request: Request, param: search_api_param_model = Depends()):
    return await search_view_model.getInstance().api_search(param)

@api_routes.get("/api/dynamic/search", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def parser(request: Request, param: search_dynamic_param_model = Depends()):
    return await search_view_model.getInstance().api_dynamic_search(param)
