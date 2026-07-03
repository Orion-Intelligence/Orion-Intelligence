import re
import threading
from datetime import datetime
from pathlib import Path


class SystemLogManager:
    __instance = None
    __lock = threading.Lock()

    LOG_ROOT = Path(__file__).resolve().parents[3] / "logs"
    LOG_DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
    LOG_FILE_PATTERN = re.compile(r"^log_\d+\.log$")
    LOG_LINE_PATTERN = re.compile(r"^(?P<type>[A-Z]+) - (?P<timestamp>\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}) : (?P<message>.*)$")
    VISIBLE_LOG_TYPES = {"INFO", "WARNING", "ERROR"}

    @staticmethod
    def get_instance():
        if SystemLogManager.__instance is None:
            with SystemLogManager.__lock:
                if SystemLogManager.__instance is None:
                    SystemLogManager.__instance = SystemLogManager()
        return SystemLogManager.__instance

    def __init__(self):
        if SystemLogManager.__instance is not None:
            raise Exception("This class is a singleton!")
        SystemLogManager.__instance = self

    def get(self, log_type: str | None = None, date: str | None = None, page: int = 1, limit: int = 200) -> dict:
        safe_type = (log_type or "").strip().upper()
        if safe_type and safe_type not in self.VISIBLE_LOG_TYPES:
            raise ValueError("Invalid log type")
        safe_date = (date or "").strip()
        if safe_date and not self._valid_log_date(safe_date):
            raise ValueError("Invalid log date")

        safe_page = max(1, int(page or 1))
        safe_limit = max(1, min(int(limit or 200), 500))
        files = self._log_files(safe_date or None)
        entries = []
        for path in files:
            try:
                lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
            except OSError:
                continue
            for index, line in reversed(list(enumerate(lines, start=1))):
                item = self._parse_log_line(path, line, index)
                if not item or (safe_type and item["type"] != safe_type):
                    continue
                entries.append(item)

        total = len(entries)
        start = (safe_page - 1) * safe_limit
        return {
            "entries": entries[start:start + safe_limit],
            "total": total,
            "page": safe_page,
            "limit": safe_limit,
            "page_count": (total + safe_limit - 1) // safe_limit if total else 0,
            "available_dates": sorted({path.parent.name for path in self._log_files()}, reverse=True),
            "files": [self._log_file_item(path) for path in files],
        }

    def delete(self, log_date: str, file_name: str) -> bool:
        path = self._safe_log_file(log_date, file_name)
        if not path:
            return False
        path.unlink()
        self._remove_empty_dir(path.parent)
        return True

    def flush(self) -> dict:
        deleted = 0
        for path in self._log_files():
            try:
                path.unlink()
                deleted += 1
                self._remove_empty_dir(path.parent)
            except OSError:
                continue
        return {"success": True, "deleted": deleted}

    def _valid_log_date(self, log_date: str) -> bool:
        if not self.LOG_DATE_PATTERN.fullmatch(log_date or ""):
            return False
        try:
            datetime.strptime(log_date, "%Y-%m-%d")
            return True
        except ValueError:
            return False

    def _log_files(self, log_date: str | None = None) -> list[Path]:
        if not self.LOG_ROOT.exists():
            return []
        date_dirs = [self.LOG_ROOT / log_date] if log_date else [path for path in self.LOG_ROOT.iterdir() if path.is_dir()]
        files: list[Path] = []
        for date_dir in sorted(date_dirs, reverse=True):
            if not self._valid_log_date(date_dir.name) or not date_dir.is_dir():
                continue
            files.extend(sorted((path for path in date_dir.iterdir() if path.is_file() and self.LOG_FILE_PATTERN.fullmatch(path.name)), reverse=True))
        return files

    def _log_file_item(self, path: Path) -> dict:
        stat = path.stat()
        return {
            "date": path.parent.name,
            "file": path.name,
            "size": stat.st_size,
            "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        }

    def _parse_log_line(self, path: Path, line: str, line_number: int) -> dict | None:
        match = self.LOG_LINE_PATTERN.match(line)
        if not match:
            return None
        log_type = match.group("type")
        if log_type not in self.VISIBLE_LOG_TYPES:
            return None
        message = match.group("message")
        caller = ""
        separator = " - Function "
        if separator in message:
            message, caller = message.rsplit(" - ", 1)
        return {
            "id": f"{path.parent.name}:{path.name}:{line_number}",
            "date": path.parent.name,
            "file": path.name,
            "line": line_number,
            "type": log_type,
            "timestamp": match.group("timestamp"),
            "message": message,
            "caller": caller,
            "raw": line,
        }

    def _safe_log_file(self, log_date: str, file_name: str) -> Path | None:
        if not self._valid_log_date(log_date) or not self.LOG_FILE_PATTERN.fullmatch(file_name or ""):
            return None
        path = self.LOG_ROOT / log_date / file_name
        if not path.is_file() or self.LOG_ROOT.resolve() not in path.resolve().parents:
            return None
        return path

    @staticmethod
    def _remove_empty_dir(path: Path) -> None:
        try:
            path.rmdir()
        except OSError:
            pass
