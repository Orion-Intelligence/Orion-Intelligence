from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse

from configs.app_dependency import get_current_user, role_required, status_required
from orion.services.alert_webhook_manager.alert_connector_manager import AlertConnectorManager
from orion.services.mongo_manager.shared_model.db_alert_connector_model import AlertConnectorProvider
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role

alert_connector_routes = APIRouter(dependencies=[Depends(status_required([UserStatus.ACTIVE]))])


def get_alert_connector_manager() -> AlertConnectorManager:
    return AlertConnectorManager.get_instance()


@alert_connector_routes.get("/api/alert-connectors/settings", dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))])
async def get_alert_connector_settings(current_user=Depends(get_current_user), manager: AlertConnectorManager = Depends(get_alert_connector_manager)) -> dict:
    return await manager.get_settings(current_user)


@alert_connector_routes.post("/api/alert-connectors/settings", dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))])
async def save_alert_connector_settings(payload: dict, current_user=Depends(get_current_user), manager: AlertConnectorManager = Depends(get_alert_connector_manager)) -> dict:
    return await manager.save_settings(current_user, payload)


@alert_connector_routes.get("/api/alert-connectors/{provider}/connect", dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))])
async def connect_provider(provider: AlertConnectorProvider, request: Request, current_user=Depends(get_current_user), manager: AlertConnectorManager = Depends(get_alert_connector_manager)) -> RedirectResponse:
    return RedirectResponse(url=await manager.connect_url(provider, request, current_user), status_code=302)


@alert_connector_routes.get("/api/alert-connectors/{provider}/callback", dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))])
async def connector_callback(provider: AlertConnectorProvider, request: Request, code: str, state: str, manager: AlertConnectorManager = Depends(get_alert_connector_manager)) -> RedirectResponse:
    return await manager.handle_callback(provider, request, code, state)
