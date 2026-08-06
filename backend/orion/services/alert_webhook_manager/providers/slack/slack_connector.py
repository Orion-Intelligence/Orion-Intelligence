import urllib.parse
from typing import Any

from fastapi import HTTPException

from orion.services.alert_webhook_manager.alert_connector_helper import ConnectorHttp
from orion.services.alert_webhook_manager.providers.slack.alert_payload_builder import AlertPayloadBuilder


class SlackConnector:
    def __init__(self):
        self._payload_builder = AlertPayloadBuilder()

    def app_settings(self, connector) -> dict[str, Any]:
        data = connector.data if connector else {}
        return {
            "slack_client_id": data.get("client_id", ""),
            "slack_configured": bool(connector and connector.enabled and data.get("client_id") and data.get("client_secret")),
        }

    def app_credentials(self, payload: dict[str, Any]) -> tuple[Any, Any]:
        return payload.get("slack_client_id"), payload.get("slack_client_secret")

    def tenant_settings(self, connector) -> dict[str, Any]:
        data = connector.data if connector else {}
        return {
            "slack_connected": bool(connector and connector.enabled and data.get("webhook_url")),
            "slack_channel": data.get("channel", ""),
            "slack_team": data.get("team_name", ""),
        }

    def tenant_defaults(self, _existing_data: dict[str, Any], _payload: dict[str, Any]) -> dict[str, Any]:
        return {}

    def connect_url(self, app: dict[str, str], redirect_uri: str, state: str) -> str:
        query = urllib.parse.urlencode({"client_id": app["client_id"], "scope": "incoming-webhook", "redirect_uri": redirect_uri, "state": state})
        return f"https://slack.com/oauth/v2/authorize?{query}"

    def exchange_callback(self, app: dict[str, str], redirect_uri: str, code: str, _existing_data: dict[str, Any] | None = None) -> dict[str, Any]:
        body = urllib.parse.urlencode({"client_id": app["client_id"], "client_secret": app["client_secret"], "code": code, "redirect_uri": redirect_uri}).encode("utf-8")
        response = ConnectorHttp.request_json("https://slack.com/api/oauth.v2.access", body, {"Content-Type": "application/x-www-form-urlencoded"})
        if not response.get("ok"):
            raise HTTPException(status_code=400, detail=response.get("error") or "Slack connection failed")
        incoming_webhook = response.get("incoming_webhook") or {}
        webhook_url = incoming_webhook.get("url")
        if not webhook_url:
            raise HTTPException(status_code=400, detail="Slack did not return an incoming webhook")
        return {
            "webhook_url": webhook_url,
            "channel": incoming_webhook.get("channel") or "",
            "channel_id": incoming_webhook.get("channel_id") or "",
            "configuration_url": incoming_webhook.get("configuration_url") or "",
            "team_id": response.get("team", {}).get("id") or "",
            "team_name": response.get("team", {}).get("name") or "",
        }

    def delivery_config(self, config: dict[str, Any] | None) -> dict[str, str] | None:
        webhook_url = self._payload_builder.clean((config or {}).get("webhook_url"))
        return {"webhook_url": webhook_url} if webhook_url else None

    def should_refresh_access_token(self, _config: dict[str, Any]) -> bool:
        return False

    def send_alert(self, config: dict[str, str], alert: dict[str, Any]) -> None:
        ConnectorHttp.post_json(config["webhook_url"], {"text": self._payload_builder.fallback_text(alert), "blocks": self._payload_builder.blocks(alert)})
