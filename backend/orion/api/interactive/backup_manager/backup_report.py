from __future__ import annotations

import json
from pathlib import Path

REPORT_NAME = "index.html"
TEMPLATE_PATH = Path(__file__).with_name("backup_report.html")
DATA_PLACEHOLDER = "__DATA__"


class BackupReport:

    @staticmethod
    def write(path: Path, data: dict | None = None) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        template = TEMPLATE_PATH.read_text(encoding="utf-8")
        payload = "null" if data is None else json.dumps(data, default=str).replace("</", "<\\/")
        path.write_text(template.replace(DATA_PLACEHOLDER, payload), encoding="utf-8")
