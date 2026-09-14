from typing import Any

from orion.services.alert_webhook_manager.providers.base_payload_builder import BasePayloadBuilder


class AlertPayloadBuilder(BasePayloadBuilder):
    def delivery_config(self, config: dict[str, Any] | None) -> dict[str, str] | None:
        values = {
            "access_token": self.clean((config or {}).get("access_token")),
            "refresh_token": self.clean((config or {}).get("refresh_token")),
            "expires_at": self.clean((config or {}).get("expires_at")),
            "cloud_id": self.clean((config or {}).get("cloud_id")),
            "project_key": self.clean((config or {}).get("project_key")).upper(),
            "issue_type": self.clean((config or {}).get("issue_type")) or "Task",
        }
        return values if all(values[key] for key in ("access_token", "cloud_id", "project_key")) else None

    def payload(self, config: dict[str, str], alert: dict[str, Any]) -> dict[str, Any]:
        app_name = self.clean(alert.get("app_name")) or "Application"
        description = self.optimized_response_text(alert["email_title"] or alert["subject"], alert["friendly_message"], alert["scan_status"], alert["total_alerts"], alert["module_rows"], alert["ioc_rows"], alert["action_url"], app_name)
        return {
            "fields": {
                "project": {"key": config["project_key"]},
                "summary": self.truncate(alert["subject"] or alert["email_title"] or f"{app_name} alert", 255),
                "description": self.description(description),
                "issuetype": {"name": config["issue_type"] or "Task"},
            }
        }

    def optimized_response_text(self, subject: str, friendly_message: str, scan_status: str, total_alerts: int, module_rows: list[dict[str, Any]], ioc_rows: list[dict[str, str]], action_url: str, app_name: str = "Application") -> str:
        lines = [
            subject or f"{app_name} alert",
            "",
            friendly_message or "Alert notification",
            f"Status: {scan_status or '-'}",
            f"Total alerts: {total_alerts}",
        ]
        module_text = self.rows_text("Modules", module_rows, "label", "count")
        if module_text:
            lines.extend(["", module_text])
        ioc_text = self.rows_text("IOCs", ioc_rows, "type", "value")
        if ioc_text:
            lines.extend(["", ioc_text])
        if action_url:
            lines.extend(["", f"View in {app_name}: {action_url}"])
        return "\n".join(lines)

    def description(self, text: str) -> dict[str, Any]:
        content = []
        for line in text.splitlines() or [""]:
            paragraph: dict[str, Any] = {"type": "paragraph"}
            if line:
                paragraph["content"] = [{"type": "text", "text": line}]
            content.append(paragraph)
        return {"type": "doc", "version": 1, "content": content}
