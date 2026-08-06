import time
import urllib.parse
from typing import Any

from fastapi import HTTPException

from orion.services.alert_webhook_manager.alert_connector_helper import ConnectorHttp
from orion.services.alert_webhook_manager.providers.jira.alert_payload_builder import AlertPayloadBuilder


class JiraConnector:
    def __init__(self):
        self._payload_builder = AlertPayloadBuilder()

    def app_settings(self, connector) -> dict[str, Any]:
        data = connector.data if connector else {}
        return {
            "jira_client_id": data.get("client_id", ""),
            "jira_configured": bool(connector and connector.enabled and data.get("client_id") and data.get("client_secret")),
        }

    def app_credentials(self, payload: dict[str, Any]) -> tuple[Any, Any]:
        return payload.get("jira_client_id"), payload.get("jira_client_secret")

    def tenant_settings(self, connector) -> dict[str, Any]:
        data = connector.data if connector else {}
        return {
            "jira_connected": bool(connector and connector.enabled and data.get("access_token") and data.get("cloud_id")),
            "jira_site_url": data.get("site_url", ""),
            "jira_site_name": data.get("site_name", ""),
            "jira_project_key": data.get("project_key", ""),
            "jira_issue_type": data.get("issue_type", ""),
        }

    def tenant_defaults(self, _existing_data: dict[str, Any], _payload: dict[str, Any]) -> dict[str, Any]:
        return {}

    def connect_url(self, app: dict[str, str], redirect_uri: str, state: str) -> str:
        query = urllib.parse.urlencode({
            "audience": "api.atlassian.com",
            "client_id": app["client_id"],
            "scope": "read:jira-work write:jira-work offline_access",
            "redirect_uri": redirect_uri,
            "state": state,
            "response_type": "code",
            "prompt": "consent",
        })
        return f"https://auth.atlassian.com/authorize?{query}"

    def exchange_callback(self, app: dict[str, str], redirect_uri: str, code: str, existing_data: dict[str, Any]) -> dict[str, Any]:
        token_response = ConnectorHttp.post_json("https://auth.atlassian.com/oauth/token", {"grant_type": "authorization_code", "client_id": app["client_id"], "client_secret": app["client_secret"], "code": code, "redirect_uri": redirect_uri})
        access_token = token_response.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Jira connection failed")
        resources = ConnectorHttp.request_json("https://api.atlassian.com/oauth/token/accessible-resources", None, {"Authorization": f"Bearer {access_token}"})
        resource = resources[0] if isinstance(resources, list) and resources else {}
        cloud_id = resource.get("id")
        if not cloud_id:
            raise HTTPException(status_code=400, detail="No Jira site was selected")
        project = self._default_project(cloud_id, access_token)
        return {
            **existing_data,
            "access_token": access_token,
            "refresh_token": token_response.get("refresh_token") or "",
            "expires_at": str(int(time.time()) + int(token_response.get("expires_in") or 3600)),
            "cloud_id": cloud_id,
            "site_url": resource.get("url") or "",
            "site_name": resource.get("name") or "",
            "project_id": project["id"],
            "project_key": project["key"],
            "project_name": project["name"],
            "issue_type": self._default_issue_type(cloud_id, access_token, project["id"]),
        }

    def delivery_config(self, config: dict[str, Any] | None) -> dict[str, str] | None:
        return self._payload_builder.delivery_config(config)

    def should_refresh_access_token(self, config: dict[str, Any]) -> bool:
        try:
            expires_at = int(config.get("expires_at") or "0")
        except ValueError:
            expires_at = 0
        return bool(config.get("refresh_token")) and expires_at <= int(time.time()) + 60

    def refresh_access_token(self, app: dict[str, str], config: dict[str, Any]) -> dict[str, Any]:
        response = ConnectorHttp.post_json("https://auth.atlassian.com/oauth/token", {"grant_type": "refresh_token", "client_id": app["client_id"], "client_secret": app["client_secret"], "refresh_token": config["refresh_token"]})
        return {
            **config,
            "access_token": response.get("access_token") or config["access_token"],
            "refresh_token": response.get("refresh_token") or config["refresh_token"],
            "expires_at": str(int(time.time()) + int(response.get("expires_in") or 3600)),
        }

    def send_alert(self, config: dict[str, str], alert: dict[str, Any]) -> None:
        ConnectorHttp.post_json(f"https://api.atlassian.com/ex/jira/{config['cloud_id']}/rest/api/3/issue", self._payload_builder.payload(config, alert), headers={"Authorization": f"Bearer {config['access_token']}"})

    def _default_project(self, cloud_id: str, access_token: str) -> dict[str, str]:
        response = ConnectorHttp.request_json(f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/project/search?maxResults=1", None, {"Authorization": f"Bearer {access_token}"})
        project = (response.get("values") or [{}])[0] if isinstance(response, dict) else {}
        if not project.get("id") or not project.get("key"):
            raise HTTPException(status_code=400, detail="No Jira project is available for this site")
        return {"id": str(project["id"]), "key": str(project["key"]).upper(), "name": str(project.get("name") or project["key"])}

    def _default_issue_type(self, cloud_id: str, access_token: str, project_id: str) -> str:
        issue_types = ConnectorHttp.request_json(f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/issuetype/project?projectId={project_id}", None, {"Authorization": f"Bearer {access_token}"})
        if not isinstance(issue_types, list) or not issue_types:
            raise HTTPException(status_code=400, detail="No Jira issue type is available for this project")
        preferred = next((issue_type for issue_type in issue_types if issue_type.get("name") == "Task"), issue_types[0])
        return str(preferred.get("name") or "Task")
