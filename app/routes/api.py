from fastapi import APIRouter, Depends
from starlette.requests import Request

from backend.management.jobs.insight_job import insight_job
from backend.view_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from backend.view_managers.interactive.directory_manager.directory_view_model import directory_view_model
from backend.view_managers.interactive.search_manager.parsers.search_api_param_model import search_api_param_model
from backend.view_managers.interactive.search_manager.search_view_model import search_view_model
from configs.auth import authenticate

api = APIRouter()

@api.get("/api/directory", dependencies=[Depends(authenticate)])
async def parser(param: directory_param_model = Depends()):
    return await directory_view_model.getInstance().api_invoke_trigger(param)

@api.get("/api/insight", dependencies=[Depends(authenticate)])
async def parser():
    return await insight_job.get_instance().get_trending_insights()

@api.get("/api/search", dependencies=[Depends(authenticate)])
async def parser(param: search_api_param_model = Depends()):
    return await search_view_model.getInstance().api_invoke_trigger(param)
