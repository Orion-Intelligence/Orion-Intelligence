from typing import Any


class AlertPayloadBuilder:
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
        description = self.optimized_response_text(alert["email_title"] or alert["subject"], alert["friendly_message"], alert["scan_status"], alert["total_alerts"], alert["module_rows"], alert["ioc_rows"], alert["action_url"])
        return {
            "fields": {
                "project": {"key": config["project_key"]},
                "summary": self.truncate(alert["subject"] or alert["email_title"] or "Orion alert", 255),
                "description": self.description(description),
                "issuetype": {"name": config["issue_type"] or "Task"},
            }
        }

    def optimized_response_text(self, subject: str, friendly_message: str, scan_status: str, total_alerts: int, module_rows: list[dict[str, Any]], ioc_rows: list[dict[str, str]], action_url: str) -> str:
        lines = [
            subject or "Orion alert",
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
            lines.extend(["", f"View in Orion: {action_url}"])
        return "\n".join(lines)

    def description(self, text: str) -> dict[str, Any]:
        content = []
        for line in text.splitlines() or [""]:
            paragraph: dict[str, Any] = {"type": "paragraph"}
            if line:
                paragraph["content"] = [{"type": "text", "text": line}]
            content.append(paragraph)
        return {"type": "doc", "version": 1, "content": content}

    def clean(self, value: Any) -> str:
        return str(value or "").strip()

    def rows_text(self, title: str, rows: list[dict[str, Any]], key_field: str, value_field: str) -> str:
        normalized_rows = []
        for row in rows or []:
            key = self.clean(row.get(key_field))
            value = self.clean(row.get(value_field))
            if key or value:
                normalized_rows.append(f"- {key or '-'}: {value or '-'}")
        return "\n".join([f"*{title}*", *normalized_rows[:10]]) if normalized_rows else ""

    def truncate(self, value: str, length: int) -> str:
        value = value or ""
        return value if len(value) <= length else f"{value[:length - 1]}..."

