from __future__ import annotations

import asyncio
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import HTTPException

from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.shared_model.db_backup_model import db_backup_model
from orion.constants.constant import CONSTANTS


class BackupRetention:

    def __init__(self, owner):
        self._owner = owner

    async def prune_old_backups(self) -> None:
        existing_backups = await self._owner._engine.find(db_backup_model, sort=db_backup_model.created_at.asc())
        for oldest in existing_backups[:max(0, len(existing_backups) - CONSTANTS.MAX_BACKUPS)]:
            await self._owner._remove_tree(self._owner.backup_root / oldest.filename)
            await self._owner._engine.delete(oldest)
            log.g().i(f"BACKUP: limit of {CONSTANTS.MAX_BACKUPS} reached, removed oldest backup {oldest.filename}")

    def _pending_tenant_rollback(self) -> str:
        marker = self._owner._io.read_json_file(self._owner.tenant_restore_marker) or {}
        return str(marker.get("rollback") or "")

    async def sweep_stale_rollbacks(self) -> None:
        if not self._owner.backup_root.is_dir() or self._owner.restore_marker.exists():
            return
        cutoff = datetime.now(timezone.utc) - timedelta(hours=CONSTANTS.RESTORE_ROLLBACK_MAX_AGE_HOURS)
        pending = self._pending_tenant_rollback()
        for entry in self._owner.backup_root.iterdir():
            if not entry.is_dir() or not entry.name.startswith(CONSTANTS.RESTORE_ROLLBACK_PREFIX) or entry.name == pending:
                continue
            try:
                modified_at = datetime.fromtimestamp(entry.stat().st_mtime, tz=timezone.utc)
            except OSError:
                continue
            if modified_at < cutoff:
                await self._owner._remove_tree(entry)
                log.g().i(f"BACKUP: removed abandoned rollback directory {entry.name}")

    async def require_free_space(self, target: Path, reference: Path | None = None) -> None:
        target.mkdir(parents=True, exist_ok=True)
        usage = await asyncio.to_thread(shutil.disk_usage, target)
        needed = 0
        if reference is not None and reference.is_dir():
            needed = int(await asyncio.to_thread(self.directory_size, reference) * CONSTANTS.BACKUP_DISK_HEADROOM)
        if usage.free <= needed:
            raise HTTPException(
                status_code=507,
                detail=f"Not enough disk space: {usage.free} bytes free, {needed} bytes required",
            )

    @staticmethod
    def directory_size(path: Path) -> int:
        total = 0
        for entry in path.rglob("*"):
            try:
                if entry.is_file():
                    total += entry.stat().st_size
            except OSError:
                continue
        return total

    async def sweep_orphaned_backups(self) -> None:
        if not self._owner.backup_root.is_dir() or self._owner.restore_marker.exists():
            return
        recorded = {backup.filename for backup in await self._owner._engine.find(db_backup_model)}
        cutoff = datetime.now(timezone.utc) - timedelta(hours=CONSTANTS.RESTORE_ROLLBACK_MAX_AGE_HOURS)
        pending = self._pending_tenant_rollback()
        for entry in self._owner.backup_root.iterdir():
            if not entry.is_dir() or entry.name in recorded or entry.name.startswith(CONSTANTS.RESTORE_ROLLBACK_PREFIX) or entry.name == pending:
                continue
            manifest = self._owner._io.read_json_file(entry / CONSTANTS.BACKUP_MANIFEST_NAME)
            if manifest and manifest.get("completed"):
                continue
            try:
                modified_at = datetime.fromtimestamp(entry.stat().st_mtime, tz=timezone.utc)
            except OSError:
                continue
            if modified_at < cutoff:
                await self._owner._remove_tree(entry)
                log.g().i(f"BACKUP: removed abandoned incomplete backup directory {entry.name}")
