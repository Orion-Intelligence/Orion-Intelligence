from __future__ import annotations

import json
from html import escape
from pathlib import Path

REPORT_NAME = "index.html"
TEMPLATE_PATH = Path(__file__).with_name("backup_report.html")
EXPORT_TEMPLATE_PATH = Path(__file__).with_name("export_report.html")
DATA_PLACEHOLDER = "__DATA__"


class BackupReport:

    @staticmethod
    def write(path: Path, data: dict | None = None) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        template = TEMPLATE_PATH.read_text(encoding="utf-8")
        payload = "null" if data is None else json.dumps(data, default=str).replace("</", "<\\/")
        path.write_text(template.replace(DATA_PLACEHOLDER, payload), encoding="utf-8")

    @staticmethod
    def render_export(data: dict) -> str:
        def cell(value) -> str:
            return escape(str(value if value is not None else ""))

        def counts_table(title: str, counts: dict) -> str:
            if not counts:
                return ""
            rows = "".join(f"<tr><td>{cell(name)}</td><td>{cell(count)}</td></tr>" for name, count in sorted(counts.items()))
            return f"<table><thead><tr><th>{title}</th><th>Documents</th></tr></thead><tbody>{rows}</tbody></table>"

        meta = "".join(
            f"<div><b>{cell(label)}</b>{cell(value)}</div>"
            for label, value in (
                ("Backup", data.get("backup")),
                ("Backup taken", data.get("created_at")),
                ("Exported", data.get("exported_at")),
                ("Tenants", len(data.get("tenants") or [])),
            )
        )
        sections = []
        for tenant in data.get("tenants") or []:
            label = tenant.get("slug") or tenant.get("tenant_id")
            tag = "<span class=\"tag\">secondary</span>" if tenant.get("parent_tenant_id") else ""
            mongo = tenant.get("mongo") or {}
            elastic = tenant.get("elastic") or {}
            totals = (
                f"<div class=\"totals\"><span>Users <strong>{cell(tenant.get('users', 0))}</strong></span>"
                f"<span>Documents <strong>{cell(sum(mongo.values()))}</strong></span>"
                f"<span>Search documents <strong>{cell(sum(elastic.values()))}</strong></span>"
                f"<span>Files <strong>{cell(tenant.get('files', 0))}</strong></span></div>"
            )
            sections.append(
                f"<section><h2>{cell(label)}{tag}</h2><p>{cell(tenant.get('tenant_id'))}</p>{totals}"
                f"{counts_table('Collection', mongo)}{counts_table('Search index', elastic)}</section>"
            )
        template = EXPORT_TEMPLATE_PATH.read_text(encoding="utf-8")
        return template.replace("__META__", meta).replace("__SECTIONS__", "".join(sections))
