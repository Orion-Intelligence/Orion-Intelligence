from fastapi import APIRouter
from fastapi import Depends,UploadFile
from configs.app_dependency import license_required, role_required, status_required, get_current_user
from configs.limiter_dependency import limiter_dependency
from orion.api.interactive.profile_manager.profile_manager import ProfileManager
from orion.api.server.config_manager.config_controller import config_controller
from orion.api.server.crawl_manager.class_model.report_chat_data_model import ReportChatRequest
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.api.server.entity_manager.entity_manager import entity_manager
from orion.api.server.entity_manager.modal.EntityQueryModel import EntityQueryModel
from orion.services.mongo_manager.shared_model.db_auth_models import user_role, UserStatus
from orion.api.server.config_manager.model.config_data import config_data
from fastapi import Depends, Request, HTTPException
private_api_routes = APIRouter(
    dependencies=[Depends(status_required([UserStatus.ACTIVE]))],
    tags=["Orion API"],
)
public_routes = APIRouter(tags=["Public"])

def cookie_required(request: Request):
    if not request.cookies.get("access_token"):
        raise HTTPException(status_code=401, detail="Missing auth cookie")

@public_routes.get("/api/s/static/{userId}", include_in_schema=False, dependencies=[Depends(cookie_required)])
async def get_profile_resource(userId: str):
    return await ProfileManager.getInstance().getProfileResource(userId)

@public_routes.get("/api/s/static/system/{name}", include_in_schema=False, dependencies=[Depends(cookie_required)])
async def get_system_resource(name: str):
    return await config_controller.getInstance().getSystemResource(name)

@public_routes.get(
    "/api/public",
    dependencies=[],
    summary="Get public configuration",
    description="Get public configuration values used for frontend initialization.",
    tags=["Public", "Config"],
    operation_id="getPublicConfig",
    response_description="Public configuration values used at frontend startup.",
)
async def get_public_config():
    return await config_controller.getInstance().get_all_alerts()

@private_api_routes.post(
    "/api/public/update",
    summary="Update public configuration",
    dependencies=[
        Depends(role_required([
            user_role.ADMIN
        ])),
    ],)
async def update_public_config(param:config_data):
    await config_controller.getInstance().update_all(param)
    return {"success": True}

@private_api_routes.post(
    "/api/upload/system",
    summary="Upload system logo",
    dependencies=[Depends(role_required([user_role.ADMIN]))],
)
async def upload_profile_image(file: UploadFile, current_user=Depends(get_current_user)):
    return await config_controller.getInstance().uploadSystemResource(file, current_user)


@private_api_routes.get(
    "/api/graph",
    summary="Get entity graph relationships",
    description="Fetch graph relationships for a given entity based on its type and value.",
    tags=["Graph", "Entities"],
    operation_id="getEntityRelations",
    response_description="Graph structure representing relationships for the requested entity.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(license_required("cti_graph"))],
)
async def get_entity_relations(query: EntityQueryModel = Depends()):
    manager = entity_manager.get_instance()
    return await manager.get_entity_relations(query)


@private_api_routes.post(
    "/api/nlp/chat/report",
    summary="Process chat report with NLP",
    description="Use NLP pipeline to parse and enrich chat-based report content.",
    tags=["NLP", "Chat"],
    operation_id="chatReportNLP",
    response_description="Parsed and enriched chat report.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN])), Depends(limiter_dependency)],
)
async def chat_report(payload: ReportChatRequest):
    response = await crawl_model.getInstance().parse_chat_ai(payload)
    return response
