from typing import Any


class BasePayloadBuilder:
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
