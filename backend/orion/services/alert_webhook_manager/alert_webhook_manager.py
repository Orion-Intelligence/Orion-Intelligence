import asyncio
import threading
from typing import Any

from orion.services.alert_webhook_manager.alert_connector_manager import AlertConnectorManager
from orion.services.alert_webhook_manager.providers.provider_registry import ALERT_CONNECTOR_PROVIDERS
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.shared_model.db_alert_connector_model import AlertConnectorProvider


class AlertWebhookManager:
    __instance = None
    __lock = threading.Lock()

    @staticmethod
    def get_instance():
        if AlertWebhookManager.__instance is None:
            with AlertWebhookManager.__lock:
                if AlertWebhookManager.__instance is None:
                    AlertWebhookManager.__instance = AlertWebhookManager()
        return AlertWebhookManager.__instance

    def __init__(self):
        if AlertWebhookManager.__instance is not None:
            raise Exception("This class is a singleton!")
        self._connector_manager = AlertConnectorManager.get_instance()
        self._providers = ALERT_CONNECTOR_PROVIDERS
        AlertWebhookManager.__instance = self

    async def send_alert(self, *, tenant_id: str, subject: str, email_title: str, friendly_message: str, scan_status: str, total_alerts: int, module_rows: list[dict[str, Any]], ioc_rows: list[dict[str, str]], action_url: str = "") -> None:
        app_name = "Application"
        try:
            from orion.api.server.config_manager.config_controller import config_controller
            app_name = await config_controller.getInstance().get_cached("app_name", app_name, tenant_id=tenant_id)
        except Exception:
            pass
        alert = {"subject": subject, "email_title": email_title, "friendly_message": friendly_message, "scan_status": scan_status, "total_alerts": total_alerts, "module_rows": module_rows, "ioc_rows": ioc_rows, "action_url": action_url, "app_name": app_name}
        tasks = []
        for provider in self._providers:
            if task := await self._delivery_task(provider, tenant_id, alert):
                tasks.append(task)
        if not tasks:
            return
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for result in results:
            if isinstance(result, Exception):
                log.g().w(f"Alert webhook delivery failed: {str(result)}")

    async def _delivery_task(self, provider: AlertConnectorProvider, tenant_id: str, alert: dict[str, Any]):
        connector = self._providers[provider]
        config = connector.delivery_config(await self._connector_manager.tenant_provider_config(tenant_id, provider))
        if not config:
            return None
        config = await self._connector_manager.refresh_provider_access_token(tenant_id, provider, config)
        return asyncio.to_thread(connector.send_alert, config, alert)
