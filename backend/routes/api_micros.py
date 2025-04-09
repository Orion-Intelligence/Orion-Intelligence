from orion.api.server.crawl_manager.class_model.file_model import ScreenshotPayload
from orion.api.server.crawl_manager.class_model.general_model import GeneralDataModel
from orion.api.server.crawl_manager.crawl_model import crawl_model
from fastapi import APIRouter, Depends
from starlette.requests import Request
from orion.api.server.crawl_manager.class_model.defacement_model import DefacementDataModel
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.api.server.crawl_manager.class_model.leak_model import LeakDataModel
from orion.api.server.crawl_manager.crawl_controller import crawl_controller
from configs.app_dependency import role_required
from orion.shared_models.crawl_models.CTITextRequest import CTITextRequest

micro_routes = APIRouter()

@micro_routes.post("/api/cti/fetch", dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))])
async def fetch_cti_label(payload: CTITextRequest, _=Depends(role_required([user_role.ADMIN, user_role.CRAWLER]))):
    return await crawl_model.fetch_cti_label(payload)
