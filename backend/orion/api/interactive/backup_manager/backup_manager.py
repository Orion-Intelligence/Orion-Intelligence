from __future__ import annotations

import asyncio
import shutil
from datetime import datetime, time, timezone
from pathlib import Path

from fastapi import HTTPException

from interface import BASE_DIR
from orion.api.server.config_manager.config_controller import config_controller
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.mongo_enums import MONGO_CONNECTIONS
from orion.services.mongo_manager.shared_model.db_backup_model import BackupType, db_backup_model


class BackupManager:
    __instance = None

    @staticmethod
    def get_instance():
        if BackupManager.__instance is None:
            BackupManager()
        return BackupManager.__instance

    def __init__(self):
        if BackupManager.__instance is not None:
            return
        BackupManager.__instance = self
        self._engine = mongo_controller.get_instance().get_engine()
        self.backup_dir = BASE_DIR / "build" / "backups"

    async def is_backup_schedule_enabled(self) -> bool:
        value = await config_controller.getInstance().get_cached("backup_schedule", "0")
        return str(value).lower() in ("1", "true")

    async def create_backup(self, backup_type: BackupType) -> db_backup_model:
        backup_time = datetime.now(timezone.utc)
        filename = f"backup_{backup_time.strftime('%Y-%m-%d_%H-%M-%S')}"
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        backup_path = self.backup_dir / filename

        command = [
            "mongodump",
            "--host",
            str(MONGO_CONNECTIONS.S_MONGO_DATABASE_IP),
            "--port",
            str(MONGO_CONNECTIONS.S_MONGO_DATABASE_PORT),
            "--db",
            str(MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME),
            "--out",
            str(backup_path),
        ]
        if MONGO_CONNECTIONS.S_MONGO_USERNAME:
            command.extend(["--username", str(MONGO_CONNECTIONS.S_MONGO_USERNAME), "--authenticationDatabase", "admin"])
        if MONGO_CONNECTIONS.S_MONGO_PASSWORD:
            command.extend(["--password", str(MONGO_CONNECTIONS.S_MONGO_PASSWORD)])

        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        except FileNotFoundError as ex:
            log.g().e("MongoDB backup failed: mongodump is not installed in the API container")
            raise HTTPException(status_code=500, detail="mongodump is not installed in the API container") from ex
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            if backup_path.exists():
                shutil.rmtree(backup_path, ignore_errors=True)
            error_text = stderr.decode().strip() or stdout.decode().strip() or "MongoDB backup failed"
            log.g().e(f"MongoDB backup failed: {error_text}")
            raise HTTPException(status_code=500, detail="MongoDB backup failed")

        if not backup_path.exists() or not any(backup_path.rglob("*")):
            if backup_path.exists():
                shutil.rmtree(backup_path, ignore_errors=True)
            log.g().e("MongoDB backup failed: mongodump completed without creating backup files")
            raise HTTPException(status_code=500, detail="MongoDB backup did not create backup files")

        await self.remove_same_day_backups(backup_time, keep_path=backup_path)
        record = db_backup_model(filename=filename, backup_datetime=backup_time, backup_type=backup_type)
        await self._engine.save(record)
        return record

    async def remove_same_day_backups(self, backup_time: datetime, keep_path: Path):
        backup_date = backup_time.date()
        for path in self.backup_dir.glob(f"backup_{backup_date.isoformat()}_*"):
            if path != keep_path:
                shutil.rmtree(path, ignore_errors=True)

        day_start = datetime.combine(backup_date, time.min, tzinfo=timezone.utc)
        day_end = datetime.combine(backup_date, time.max, tzinfo=timezone.utc)
        records = await self._engine.find(db_backup_model, (db_backup_model.backup_datetime >= day_start) & (db_backup_model.backup_datetime <= day_end))
        for record in records:
            await self._engine.delete(record)
