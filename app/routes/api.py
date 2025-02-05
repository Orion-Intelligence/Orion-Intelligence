from fastapi import APIRouter, Depends
from starlette.requests import Request

from backend.management.jobs.insight_job import insight_job
from backend.view_managers.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from backend.view_managers.interactive.directory_manager.directory_view_model import directory_view_model
from configs.auth import authenticate

api = APIRouter()

@api.get("/api/directory", dependencies=[Depends(authenticate)])
async def parser(request: Request, param: directory_param_model = Depends()):
    return await directory_view_model.getInstance().api_invoke_trigger(request, param)

@api.get("/api/insight", dependencies=[Depends(authenticate)])
async def parser(request: Request):
    return await insight_job.get_instance().get_trending_insights()

# @api.get("/api/search")
# async def parser(request: Request):
#     return await search_view_model.getInstance().invoke_trigger(SEARCH_MODEL_COMMANDS.M_FETCH_RESULT, request)
