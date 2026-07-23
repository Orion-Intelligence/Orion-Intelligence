import json
import urllib.error
import urllib.request
from typing import Any

from fastapi import HTTPException, Request
from starlette.responses import RedirectResponse

from orion.services.mongo_manager.shared_model.db_alert_connector_model import AlertConnectorProvider


class ConnectorHttp:
    @staticmethod
    def request_json(url: str, data: bytes | None, headers: dict[str, str], method: str | None = None) -> Any:
        request_method = method or ("POST" if data else "GET")
        request = urllib.request.Request(url, data=data, headers={"Accept": "application/json", "User-Agent": "Orion-Alert-Connector/1.0", **headers}, method=request_method)
        try:
            with urllib.request.urlopen(request, timeout=15) as response:  # nosec B310
                body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8")
            detail = ConnectorHttp._error_detail(body) or exc.reason or "Connector request failed"
            raise HTTPException(status_code=400, detail=detail) from exc
        return json.loads(body) if body else {}

    @staticmethod
    def post_json(url: str, payload: dict[str, Any], headers: dict[str, str] | None = None) -> Any:
        return ConnectorHttp.request_json(url, json.dumps(payload).encode("utf-8"), {"Content-Type": "application/json", **(headers or {})}, method="POST")

    @staticmethod
    def _error_detail(body: str) -> str:
        try:
            response = json.loads(body) if body else {}
        except ValueError:
            return body
        if isinstance(response, dict):
            return str(response.get("error") or response.get("error_description") or response.get("message") or "")
        return body


class AlertConnectorHelper:
    @staticmethod
    def callback_url(request: Request, provider: AlertConnectorProvider) -> str:
        return str(request.url_for("connector_callback", provider=provider.value))

    @staticmethod
    def settings_redirect(provider: str, status: str) -> RedirectResponse:
        return RedirectResponse(url=f"/dashboard/profile/tenant-settings?integration={provider}&status={status}", status_code=302)
