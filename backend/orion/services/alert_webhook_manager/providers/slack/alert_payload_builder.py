from typing import Any

from orion.services.alert_webhook_manager.providers.base_payload_builder import BasePayloadBuilder


class AlertPayloadBuilder(BasePayloadBuilder):
    def fallback_text(self, alert: dict[str, Any]) -> str:
        app_name = self.clean(alert.get("app_name")) or "Application"
        lines = [
            alert["subject"] or f"{app_name} alert",
            "",
            alert["friendly_message"] or "Alert notification",
            f"Status: {alert['scan_status'] or '-'}",
            f"Total alerts: {alert['total_alerts']}",
        ]
        module_text = self.rows_text("Modules", alert["module_rows"], "label", "count")
        if module_text:
            lines.extend(["", module_text])
        ioc_text = self.rows_text("IOCs", alert["ioc_rows"], "type", "value")
        if ioc_text:
            lines.extend(["", ioc_text])
        if alert["action_url"]:
            lines.extend(["", f"View in {app_name}: {alert['action_url']}"])
        return "\n".join(lines)

    def blocks(self, alert: dict[str, Any]) -> list[dict[str, Any]]:
        app_name = self.clean(alert.get("app_name")) or "Application"
        blocks: list[dict[str, Any]] = [
            {"type": "header", "text": {"type": "plain_text", "text": self.truncate(alert["subject"] or f"{app_name} alert", 150)}},
            {"type": "section", "text": {"type": "mrkdwn", "text": self.truncate(alert["friendly_message"] or "Alert notification", 3000)}},
            {"type": "section", "fields": [
                {"type": "mrkdwn", "text": f"*Status:*\n{alert['scan_status'] or '-'}"},
                {"type": "mrkdwn", "text": f"*Total alerts:*\n{alert['total_alerts']}"},
            ]},
        ]
        for text in (self.rows_text("Modules", alert["module_rows"], "label", "count"), self.rows_text("IOCs", alert["ioc_rows"], "type", "value")):
            if text:
                blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": self.truncate(text, 3000)}})
        if alert["action_url"]:
            blocks.append({"type": "actions", "elements": [{"type": "button", "text": {"type": "plain_text", "text": self.truncate(f"View in {app_name}", 75)}, "url": alert["action_url"]}]})
        return blocks
