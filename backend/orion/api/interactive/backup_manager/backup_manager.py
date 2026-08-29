from __future__ import annotations

import asyncio
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId
from bson import json_util
from bson.errors import InvalidId
from elasticsearch import helpers as es_helpers
from fastapi import HTTPException

from interface import BASE_DIR
from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_backup_model import BackupType, db_backup_model
from orion.constants.constant import CONSTANTS


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
        self.backup_root = BASE_DIR / "backups"
        self.maintenance_flag = BASE_DIR / "static" / ".maintenance"
        self._job = {"operation": "", "status": "idle", "progress": 0, "message": "", "filename": ""}

    def job_status(self) -> dict:
        return dict(self._job)

    def _begin_job(self, operation: str, message: str) -> bool:
        if self._job.get("status") == "running":
            return False
        self._job = {"operation": operation, "status": "running", "progress": 0, "message": message, "filename": ""}
        return True

    def _set_progress(self, progress: int, message: str) -> None:
        if self._job.get("status") == "running":
            self._job["progress"] = progress
            self._job["message"] = message

    def _end_job(self, status: str, message: str, filename: str = "") -> None:
        self._job = {
            "operation": self._job.get("operation", ""),
            "status": status,
            "progress": 100 if status == "done" else self._job.get("progress", 0),
            "message": message,
            "filename": filename,
        }

    async def start_backup(self, backup_type: BackupType) -> dict:
        if not self._begin_job("backup", "Starting backup"):
            return self.job_status()
        asyncio.create_task(self._run_backup(backup_type))
        return self.job_status()

    async def _run_backup(self, backup_type: BackupType) -> None:
        try:
            result = await self.create_backup(backup_type)
            self._end_job("done", "Backup completed successfully", result.get("filename", ""))
        except Exception as exc:
            log.g().e(f"BACKUP FAILED: {exc}")
            self._end_job("failed", str(getattr(exc, "detail", exc)))

    async def start_restore(self, backup_id: str) -> dict:
        if not self._begin_job("restore", "Starting restore"):
            return self.job_status()
        asyncio.create_task(self._run_restore(backup_id))
        return self.job_status()

    async def _run_restore(self, backup_id: str) -> None:
        try:
            result = await self.restore_backup_by_id(backup_id)
            self._end_job("done", "Backup restored successfully", result.get("filename", ""))
        except Exception as exc:
            log.g().e(f"RESTORE FAILED: {exc}")
            self._end_job("failed", str(getattr(exc, "detail", exc)))

    async def list_backups(self):
        backups = await self._engine.find(db_backup_model, sort=db_backup_model.created_at.desc())
        return [
            {
                "id": str(backup.id),
                "filename": backup.filename,
                "backup_type": backup.backup_type.value if isinstance(backup.backup_type, BackupType) else backup.backup_type,
                "created_at": backup.created_at,
            }
            for backup in backups
        ]

    async def create_backup(self, backup_type: BackupType):
        existing_backups = await self._engine.find(db_backup_model, sort=db_backup_model.created_at.asc())
        for oldest in existing_backups[:max(0, len(existing_backups) - CONSTANTS.MAX_BACKUPS + 1)]:
            shutil.rmtree(self.backup_root / oldest.filename, ignore_errors=True)
            await self._engine.delete(oldest)
            log.g().i(f"BACKUP: limit of {CONSTANTS.MAX_BACKUPS} reached, removed oldest backup {oldest.filename}")

        created_at = datetime.now(timezone.utc)
        folder_name = created_at.strftime("%Y_%m_%d_%H_%M_%S")
        backup_dir = self.backup_root / folder_name

        try:
            await self._perform_backup(backup_dir)
        except Exception as exc:
            shutil.rmtree(backup_dir, ignore_errors=True)
            raise HTTPException(status_code=500, detail=f"Backup failed: {exc}") from exc

        backup = db_backup_model(filename=folder_name, backup_type=backup_type, created_at=created_at)
        await self._engine.save(backup)
        return {
            "id": str(backup.id),
            "filename": backup.filename,
            "backup_type": backup.backup_type.value,
            "created_at": backup.created_at,
        }

    async def _perform_backup(self, backup_dir: Path, progress_base: int = 0, progress_span: int = 90):
        def step(done: int, message: str) -> None:
            self._set_progress(progress_base + (progress_span * done // 5), message)

        backup_dir.mkdir(parents=True, exist_ok=True)
        step(0, "Exporting MongoDB")
        await self._backup_mongo(backup_dir / "mongo")
        step(1, "Exporting ArangoDB")
        await asyncio.to_thread(self._backup_arango, backup_dir / "arango")
        step(2, "Exporting Elasticsearch")
        await self._backup_elastic(backup_dir / "elastic")
        step(3, "Copying logs")
        await asyncio.to_thread(self._copy_folder, BASE_DIR / "orion" / "logs", backup_dir / "logs")
        step(4, "Copying resources")
        await asyncio.to_thread(self._copy_folder, BASE_DIR / "static" / "resource", backup_dir / "resource")
        step(5, "Finalizing")
        if not (BASE_DIR / "static" / "resource").exists():
            await asyncio.to_thread(self._copy_folder, BASE_DIR / "static" / "resource", backup_dir / "resource")

    async def delete_backup(self, backup_id: str):
        try:
            backup_object_id = ObjectId(backup_id)
        except (InvalidId, TypeError) as exc:
            raise HTTPException(status_code=404, detail="Backup not found") from exc
        backup = await self._engine.find_one(db_backup_model, db_backup_model.id == backup_object_id)
        if backup is None:
            raise HTTPException(status_code=404, detail="Backup not found")
        shutil.rmtree(self.backup_root / backup.filename, ignore_errors=True)
        await self._engine.delete(backup)
        return {"status": "deleted"}

    async def restore_backup_by_id(self, backup_id: str):
        try:
            backup_object_id = ObjectId(backup_id)
        except (InvalidId, TypeError) as exc:
            raise HTTPException(status_code=404, detail="Backup not found") from exc
        backup = await self._engine.find_one(db_backup_model, db_backup_model.id == backup_object_id)
        if backup is None:
            raise HTTPException(status_code=404, detail="Backup not found")
        return await self.restore_backup(backup.filename, source="ui")

    async def restore_backup(self, filename: str, source: str = "cli"):
        backup_dir = self.backup_root / filename
        log.g().i(f"RESTORE STARTED: backup={filename} source={source}")

        if not backup_dir.is_dir() or not (backup_dir / "mongo").is_dir() or not any((backup_dir / "mongo").iterdir()):
            log.g().e(f"RESTORE FAILED: backup verification failed for {filename}")
            raise HTTPException(status_code=404, detail="Backup not found or missing required data")
        log.g().i(f"RESTORE: backup verified: {filename}")

        self.maintenance_flag.parent.mkdir(parents=True, exist_ok=True)
        self.maintenance_flag.touch()
        log.g().i("RESTORE: maintenance mode enabled")

        rollback_name = f"rollback_{datetime.now(timezone.utc).strftime('%Y_%m_%d_%H_%M_%S')}"
        rollback_dir = self.backup_root / rollback_name
        try:
            await self._perform_backup(rollback_dir, progress_base=5, progress_span=35)
            log.g().i(f"RESTORE: rollback point created: {rollback_name}")
        except Exception as exc:
            shutil.rmtree(rollback_dir, ignore_errors=True)
            self.maintenance_flag.unlink(missing_ok=True)
            log.g().e(f"RESTORE FAILED: could not create rollback point: {exc}")
            raise HTTPException(status_code=500, detail=f"Restore aborted, could not create rollback point: {exc}") from exc

        try:
            self._set_progress(45, "Restoring data")
            await self._run_restore_engine(backup_dir)
            log.g().i(f"RESTORE: restore steps completed for {filename}")
            self._set_progress(90, "Validating restore")
            valid, details = await self._validate_restore()
            if not valid:
                raise RuntimeError(f"validation failed: {details}")
            log.g().i(f"RESTORE: validation passed for {filename}")
        except Exception as exc:
            log.g().e(f"RESTORE FAILED: {exc}. Rolling back to {rollback_name}")
            try:
                await self._run_restore_engine(rollback_dir)
                valid, details = await self._validate_restore()
                if not valid:
                    raise RuntimeError(f"rollback validation failed: {details}")
                log.g().i(f"RESTORE: rollback succeeded, previous state restored from {rollback_name}")
            except Exception as rollback_exc:
                log.g().e(
                    f"RESTORE CRITICAL: rollback FAILED after restore failure. "
                    f"backup={filename} rollback={rollback_name} restore_error={exc} rollback_error={rollback_exc}"
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Restore failed and rollback failed. Manual intervention required: {rollback_exc}",
                ) from rollback_exc

            shutil.rmtree(rollback_dir, ignore_errors=True)
            log.g().i("RESTORE: starting site after rollback")
            self.maintenance_flag.unlink(missing_ok=True)
            log.g().i("RESTORE: maintenance mode disabled")
            raise HTTPException(status_code=500, detail=f"Restore failed and was rolled back: {exc}") from exc

        shutil.rmtree(rollback_dir, ignore_errors=True)
        log.g().i("RESTORE: starting site")
        self.maintenance_flag.unlink(missing_ok=True)
        log.g().i(f"RESTORE SUCCESS: {filename}. Maintenance mode disabled.")
        return {"status": "restored", "filename": filename}

    async def _run_restore_engine(self, source_dir: Path):
        await self._restore_mongo(source_dir / "mongo")
        await asyncio.to_thread(self._restore_arango, source_dir / "arango")
        await self._restore_elastic(source_dir / "elastic")
        await asyncio.to_thread(self._restore_folder, source_dir / "logs", BASE_DIR / "orion" / "logs")
        await asyncio.to_thread(self._restore_folder, source_dir / "resource", BASE_DIR / "static" / "resource")

    async def _validate_restore(self):
        try:
            await self._engine.database.list_collection_names()
        except Exception as exc:
            return False, f"MongoDB validation failed: {exc}"
        try:
            db = arango_controller.get_instance().get_db()
            if db is not None:
                db.collections()
        except Exception as exc:
            return False, f"ArangoDB validation failed: {exc}"
        try:
            conn = elastic_controller.get_instance().get_connection()
            if conn is not None:
                await conn.info()
        except Exception as exc:
            return False, f"Elasticsearch validation failed: {exc}"
        return True, "ok"

    async def _backup_mongo(self, output_dir: Path):
        output_dir.mkdir(parents=True, exist_ok=True)
        database = self._engine.database
        collections = await database.list_collection_names()
        for collection_name in collections:
            documents = await database[collection_name].find({}).to_list(length=None)
            (output_dir / f"{collection_name}.json").write_text(json_util.dumps(documents, indent=2), encoding="utf-8")

    def _backup_arango(self, output_dir: Path):
        output_dir.mkdir(parents=True, exist_ok=True)
        db = arango_controller.get_instance().get_db()
        if db is None:
            return
        for collection_info in db.collections():
            collection_name = collection_info.get("name")
            if not collection_name or collection_name.startswith("_"):
                continue
            cursor = db.aql.execute(f"FOR doc IN `{collection_name}` RETURN doc")
            documents = [document for document in cursor]
            (output_dir / f"{collection_name}.json").write_text(json.dumps(documents, indent=2, default=str), encoding="utf-8")

    async def _backup_elastic(self, output_dir: Path):
        output_dir.mkdir(parents=True, exist_ok=True)
        conn = elastic_controller.get_instance().get_connection()
        if conn is None:
            return
        indices = await conn.indices.get(index="*", expand_wildcards="open", ignore_unavailable=True)
        for index_name in indices.keys():
            if index_name.startswith("."):
                continue
            path = output_dir / f"{index_name}.ndjson"
            with path.open("w", encoding="utf-8") as file:
                response = await conn.search(index=index_name, body={"query": {"match_all": {}}}, scroll="2m", size=500)
                scroll_id = response.get("_scroll_id")
                hits = response.get("hits", {}).get("hits", [])
                while hits:
                    for hit in hits:
                        file.write(json.dumps(hit, default=str) + "\n")
                    response = await conn.scroll(scroll_id=scroll_id, scroll="2m")
                    scroll_id = response.get("_scroll_id")
                    hits = response.get("hits", {}).get("hits", [])
                if scroll_id:
                    await conn.clear_scroll(scroll_id=scroll_id)

    def _copy_folder(self, source: Path, destination: Path):
        destination.mkdir(parents=True, exist_ok=True)
        if source.exists():
            shutil.copytree(source, destination, dirs_exist_ok=True)

    async def _restore_mongo(self, source_dir: Path):
        if not source_dir.exists():
            return
        database = self._engine.database
        catalog_collection = self._engine.get_collection(db_backup_model).name
        for file in source_dir.glob("*.json"):
            collection_name = file.stem
            if collection_name == catalog_collection:
                continue
            documents = json_util.loads(file.read_text(encoding="utf-8"))
            await database[collection_name].delete_many({})
            if documents:
                await database[collection_name].insert_many(documents)

    def _restore_arango(self, source_dir: Path):
        if not source_dir.exists():
            return
        db = arango_controller.get_instance().get_db()
        if db is None:
            return
        for file in source_dir.glob("*.json"):
            collection_name = file.stem
            documents = json.loads(file.read_text(encoding="utf-8"))
            if not db.has_collection(collection_name):
                db.create_collection(collection_name)
            collection = db.collection(collection_name)
            collection.truncate()
            if documents:
                collection.import_bulk(documents, on_duplicate="replace")

    async def _restore_elastic(self, source_dir: Path):
        if not source_dir.exists():
            return
        conn = elastic_controller.get_instance().get_connection()
        if conn is None:
            return
        for file in source_dir.glob("*.ndjson"):
            index_name = file.stem
            if await conn.indices.exists(index=index_name):
                await conn.indices.delete(index=index_name)
            await conn.indices.create(index=index_name)

            actions = []
            with file.open("r", encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if not line:
                        continue
                    hit = json.loads(line)
                    actions.append({
                        "_op_type": "index",
                        "_index": index_name,
                        "_id": hit.get("_id"),
                        "_source": hit.get("_source", {}),
                    })
            if actions:
                await es_helpers.async_bulk(conn, actions)

    def _restore_folder(self, source: Path, destination: Path):
        if not source.exists():
            return
        shutil.rmtree(destination, ignore_errors=True)
        shutil.copytree(source, destination, dirs_exist_ok=True)
