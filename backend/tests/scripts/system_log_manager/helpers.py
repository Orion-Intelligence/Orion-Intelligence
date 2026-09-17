from __future__ import annotations

from pathlib import Path


def _write_log(root: Path, log_date: str) -> None:
    directory = root / log_date
    directory.mkdir(parents=True, exist_ok=True)
    day, month, year = reversed(log_date.split("-"))
    (directory / "log_1.log").write_text(
        f"INFO - {day}/{month}/{year} 12:00:00 : Entry for {log_date}\n",
        encoding="utf-8",
    )
