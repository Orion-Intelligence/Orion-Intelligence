import base64
import hashlib
import hmac
import threading
import time
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, Request
from starlette.responses import RedirectResponse

from orion.constants.constant import CONSTANTS
from orion.services.alert_webhook_manager.alert_connector_helper import AlertConnectorHelper
from orion.services.alert_webhook_manager.providers.provider_registry import ALERT_CONNECTOR_PROVIDERS
from orion.services.mongo_manager.shared_model.db_alert_connector_model import AlertConnectorProvider, AlertConnectorType, db_alert_connector_model


class AlertConnectorManager:
    __instance = None
    __lock = threading.Lock()

    @staticmethod
    def get_instance():
        if AlertConnectorManager.__instance is None:
            with AlertConnectorManager.__lock:
                if AlertConnectorManager.__instance is None:
                    AlertConnectorManager.__instance = AlertConnectorManager()
        return AlertConnectorManager.__instance

    def __init__(self):
        if AlertConnectorManager.__instance is not None:
            raise Exception("This class is a singleton!")
        from orion.services.mongo_manager.mongo_controller import mongo_controller

        self._engine = mongo_controller.get_instance().get_engine()
        self._providers = ALERT_CONNECTOR_PROVIDERS
        self._state_secret = CONSTANTS.S_AUTH_SECRET_KEY
        AlertConnectorManager.__instance = self

    async def get_settings(self, current_user) -> dict[str, Any]:
        tenant_id = str(getattr(current_user, "tenant_uuid", "") or "")
        settings: dict[str, dict[str, Any]] = {"app": {}, "tenant": {}}
        for provider, handler in self._providers.items():
            settings["app"].update(handler.app_settings(await self._connector(AlertConnectorType.APP, provider, "")))
            settings["tenant"].update(handler.tenant_settings(await self._connector(AlertConnectorType.TENANT, provider, tenant_id)))
        return settings

    async def save_settings(self, current_user, payload: dict[str, Any]) -> dict[str, Any]:
        tenant_id = str(getattr(current_user, "tenant_uuid", "") or "")
        role = getattr(current_user, "role", "")
        if (getattr(role, "value", role) or "") == "admin":
            for provider, handler in self._providers.items():
                await self._save_app(provider, *handler.app_credentials(payload))
        await self._save_tenant_defaults(tenant_id, payload)
        return await self.get_settings(current_user)

    async def connect_url(self, provider: AlertConnectorProvider, request: Request, current_user) -> str:
        app = await self._configured_app(provider)
        redirect_uri = AlertConnectorHelper.callback_url(request, provider)
        return self._provider(provider).connect_url(app, redirect_uri, self._state(provider.value, str(getattr(current_user, "tenant_uuid", "") or "")))

    async def handle_callback(self, provider: AlertConnectorProvider, request: Request, code: str, state: str) -> RedirectResponse:
        tenant_id = self._tenant_id_from_state(state, provider.value)
        app = await self._configured_app(provider)
        existing = await self._connector(AlertConnectorType.TENANT, provider, tenant_id)
        existing_data = existing.data if existing else {}
        data = self._provider(provider).exchange_callback(app, AlertConnectorHelper.callback_url(request, provider), code, existing_data)
        await self._upsert(AlertConnectorType.TENANT, provider, tenant_id, True, data)
        return AlertConnectorHelper.settings_redirect(provider.value, "connected")

    async def tenant_provider_config(self, tenant_id: str, provider: AlertConnectorProvider) -> dict[str, Any] | None:
        connector = await self._connector(AlertConnectorType.TENANT, provider, str(tenant_id or ""))
        if not connector or not connector.enabled:
            return None
        return connector.data or {}

    async def refresh_provider_access_token(self, tenant_id: str, provider: AlertConnectorProvider, config: dict[str, Any]) -> dict[str, Any]:
        handler = self._provider(provider)
        if not handler.should_refresh_access_token(config):
            return config
        updated = handler.refresh_access_token(await self._configured_app(provider), config)
        await self._upsert(AlertConnectorType.TENANT, provider, str(tenant_id or ""), True, updated)
        return updated

    async def _save_app(self, provider: AlertConnectorProvider, client_id: Any, client_secret: Any) -> None:
        existing = await self._connector(AlertConnectorType.APP, provider, "")
        data = dict(existing.data) if existing else {}
        if client_id is not None:
            data["client_id"] = str(client_id or "").strip()
        if client_secret:
            data["client_secret"] = str(client_secret).strip()
        enabled = bool(data.get("client_id") and data.get("client_secret"))
        await self._upsert(AlertConnectorType.APP, provider, "", enabled, data)

    async def _save_tenant_defaults(self, tenant_id: str, payload: dict[str, Any]) -> None:
        for provider, handler in self._providers.items():
            existing = await self._connector(AlertConnectorType.TENANT, provider, tenant_id)
            data = handler.tenant_defaults(dict(existing.data) if existing else {}, payload)
            if data:
                await self._upsert(AlertConnectorType.TENANT, provider, tenant_id, bool(existing.enabled) if existing else False, data)

    async def _configured_app(self, provider: AlertConnectorProvider) -> dict[str, str]:
        connector = await self._connector(AlertConnectorType.APP, provider, "")
        data = connector.data if connector else {}
        client_id = str(data.get("client_id") or "").strip()
        client_secret = str(data.get("client_secret") or "").strip()
        if not connector or not connector.enabled or not client_id or not client_secret:
            raise HTTPException(status_code=400, detail=f"{provider.value.title()} app connector is not configured")
        return {"client_id": client_id, "client_secret": client_secret}

    async def _connector(self, connector_type: AlertConnectorType, provider: AlertConnectorProvider, tenant_id: str) -> db_alert_connector_model | None:
        return await self._engine.find_one(db_alert_connector_model, (db_alert_connector_model.connector_type == connector_type) & (db_alert_connector_model.provider == provider) & (db_alert_connector_model.tenant_id == str(tenant_id or "")))

    async def _upsert(self, connector_type: AlertConnectorType, provider: AlertConnectorProvider, tenant_id: str, enabled: bool, data: dict[str, Any]) -> db_alert_connector_model:
        connector = await self._connector(connector_type, provider, tenant_id)
        now = datetime.now(UTC)
        if connector:
            connector.enabled = enabled
            connector.data = data
            connector.updated_at = now
        else:
            connector = db_alert_connector_model(connector_type=connector_type, provider=provider, tenant_id=str(tenant_id or ""), enabled=enabled, data=data, created_at=now, updated_at=now)
        await self._engine.save(connector)
        return connector

    def _provider(self, provider: AlertConnectorProvider):
        handler = self._providers.get(provider)
        if not handler:
            raise HTTPException(status_code=400, detail=f"{provider.value.title()} connector is not supported")
        return handler

    def _state(self, provider: str, tenant_id: str) -> str:
        if not self._state_secret:
            raise HTTPException(status_code=400, detail="Integration state secret is not configured")
        timestamp = str(int(time.time()))
        payload = f"{provider}.{tenant_id}.{timestamp}"
        signature = hmac.new(self._state_secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
        return base64.urlsafe_b64encode(f"{payload}.{signature}".encode("utf-8")).decode("ascii")

    def _tenant_id_from_state(self, state: str, provider: str) -> str:
        if not self._state_secret:
            raise HTTPException(status_code=400, detail="Integration state secret is not configured")
        try:
            decoded = base64.urlsafe_b64decode(state.encode("ascii")).decode("utf-8")
            state_provider, tenant_id, timestamp, signature = decoded.split(".", 3)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid integration state") from exc
        payload = f"{state_provider}.{tenant_id}.{timestamp}"
        expected = hmac.new(self._state_secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if state_provider != provider or not hmac.compare_digest(signature, expected) or int(time.time()) - int(timestamp) > 900:
            raise HTTPException(status_code=400, detail="Invalid integration state")
        return tenant_id
