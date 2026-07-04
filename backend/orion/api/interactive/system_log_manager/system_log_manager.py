import os
import re
import shutil
import stat
import threading
from datetime import datetime
from pathlib import Path


class SystemLogManager:
    __instance = None
    __lock = threading.Lock()

    READ_CHUNK_SIZE = 64 * 1024
    LOG_ROOT = Path(__file__).resolve().parents[3] / "logs"
    LOG_DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
    LOG_FILE_PATTERN = re.compile(r"^log_\d+\.log$")
    LOG_LINE_PATTERN = re.compile(r"^(?:\[APP-LOG\]\s*)?(?P<type>[A-Z]+) - (?P<timestamp>\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}) : (?P<message>.*)$")
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
        safe_limit = max(1, min(int(limit or 100), 100))
        files = self._log_files(safe_date or None)
        entries = []
        start = (safe_page - 1) * safe_limit
        end = start + safe_limit
        total = 0
        has_more = False
        for path in files:
            for index, line in self._iter_log_lines_reverse(path):
                item = self._parse_log_line(path, line, index)
                if not item or (safe_type and item["type"] != safe_type):
                    continue
                if total >= end:
                    has_more = True
                    break
                if start <= total < end:
                    entries.append(item)
                total += 1
            if has_more:
                break

        visible_total = total + 1 if has_more else total

        return {
            "entries": entries,
            "total": visible_total,
            "page": safe_page,
            "limit": safe_limit,
            "page_count": safe_page + 1 if has_more else ((visible_total + safe_limit - 1) // safe_limit if visible_total else 0),
            "available_dates": sorted({self._log_date(path) for path in self._log_files()}, reverse=True),
            "files": [self._log_file_item(path) for path in files[:safe_limit]],
            "generated_at": datetime.now().isoformat(),
            "log_roots": [str(root.resolve()) for root in self._log_roots()],
        }

    def _iter_log_lines_reverse(self, path: Path):
        try:
            with path.open("rb") as file:
                file.seek(0, 2)
                position = file.tell()
                buffer = b""
                line_number = 0
                while position > 0:
                    read_size = min(self.READ_CHUNK_SIZE, position)
                    position -= read_size
                    file.seek(position)
                    buffer = file.read(read_size) + buffer
                    lines = buffer.split(b"\n")
                    buffer = lines[0]
                    for raw_line in reversed(lines[1:]):
                        if not raw_line:
                            continue
                        line_number += 1
                        yield line_number, raw_line.rstrip(b"\r").decode("utf-8", errors="replace")
                if buffer:
                    line_number += 1
                    yield line_number, buffer.rstrip(b"\r").decode("utf-8", errors="replace")
        except OSError:
            return

    def delete(self, log_date: str, file_name: str) -> bool:
        path = self._safe_log_file(log_date, file_name)
        if not path:
            return False
        path.unlink()
        self._remove_empty_dir(path.parent)
        return True

    def flush(self) -> dict:
        deleted = 0
        failed = []
        for root in self._log_roots():
            try:
                date_dirs = [item for item in root.iterdir() if item.is_dir() and self._valid_log_date(item.name)]
            except OSError as exc:
                failed.append(f"{root}: {exc}")
                continue
            for path in date_dirs:
                try:
                    deleted += sum(1 for item in path.rglob("*") if item.is_file())
                    shutil.rmtree(path, onerror=self._make_writable_and_retry)
                except OSError as exc:
                    failed.append(f"{path}: {exc}")
                    continue
            self._remove_empty_dir(root)
        return {"success": not failed, "deleted": deleted, "failed": failed}

    def _valid_log_date(self, log_date: str) -> bool:
        if not self.LOG_DATE_PATTERN.fullmatch(log_date or ""):
            return False
        try:
            datetime.strptime(log_date, "%Y-%m-%d")
            return True
        except ValueError:
            return False

    def _log_files(self, log_date: str | None = None) -> list[Path]:
        files: list[Path] = []
        seen: set[Path] = set()
        for root in self._log_roots():
            date_dirs = [root / log_date] if log_date else [path for path in root.iterdir() if path.is_dir()]
            for date_dir in date_dirs:
                if not self._valid_log_date(date_dir.name) or not date_dir.is_dir():
                    continue
                for path in date_dir.rglob("*.log"):
                    if not path.is_file() or not self.LOG_FILE_PATTERN.fullmatch(path.name):
                        continue
                    resolved = path.resolve()
                    if resolved in seen:
                        continue
                    seen.add(resolved)
                    files.append(path)
        return sorted(files, key=self._log_file_sort_key, reverse=True)

    def _log_roots(self) -> list[Path]:
        candidates = [
            self.LOG_ROOT,
            Path("/app/crawler_logs"),
            Path.cwd() / "orion" / "logs",
            Path.cwd() / "logs",
            Path.cwd() / "backend" / "orion" / "logs",
            Path.cwd().parent / "Orion-Crawler" / "app" / "logs",
        ]
        roots = []
        seen: set[Path] = set()
        for root in candidates:
            if not root.exists():
                continue
            resolved = root.resolve()
            if resolved in seen:
                continue
            seen.add(resolved)
            roots.append(root)
        return roots

    def _log_file_sort_key(self, path: Path) -> tuple[str, float, int]:
        match = re.search(r"\d+", path.stem)
        return self._log_date(path), path.stat().st_mtime, int(match.group(0)) if match else 0

    def _log_file_item(self, path: Path) -> dict:
        stat = path.stat()
        return {
            "date": self._log_date(path),
            "file": self._log_file_name(path),
            "source_path": str(path.resolve()),
            "size": stat.st_size,
            "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        }

    def _log_date(self, path: Path) -> str:
        for parent in [path.parent, *path.parents]:
            if self._valid_log_date(parent.name):
                return parent.name
        return path.parent.name

    def _log_file_name(self, path: Path) -> str:
        log_date = self._log_date(path)
        for parent in path.parents:
            if parent.name == log_date:
                return path.relative_to(parent).as_posix()
        return path.name

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
            "id": f"{self._log_date(path)}:{self._log_file_name(path)}:{line_number}",
            "date": self._log_date(path),
            "file": self._log_file_name(path),
            "line": line_number,
            "type": log_type,
            "timestamp": match.group("timestamp"),
            "message": message,
            "caller": caller,
            "raw": line,
            "source_path": str(path.resolve()),
        }

    def _safe_log_file(self, log_date: str, file_name: str) -> Path | None:
        if not self._valid_log_date(log_date) or not file_name or ".." in Path(file_name).parts or not self.LOG_FILE_PATTERN.fullmatch(Path(file_name).name):
            return None
        for root in self._log_roots():
            path = root / log_date / file_name
            if path.is_file() and root.resolve() in path.resolve().parents:
                return path
        return None

    @staticmethod
    def _remove_empty_dir(path: Path) -> None:
        try:
            path.rmdir()
        except OSError:
            pass

    @staticmethod
    def _make_writable_and_retry(function, path, _exc_info) -> None:
        target = Path(path)
        os.chmod(target.parent, stat.S_IRWXU)
        os.chmod(target, stat.S_IRWXU)
        function(path)
