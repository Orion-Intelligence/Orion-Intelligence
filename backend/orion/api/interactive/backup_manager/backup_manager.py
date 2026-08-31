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
from orion.api.interactive.backup_manager.backup_job_store import BackupJobStore
from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_backup_job_model import BackupJobStatus
from orion.services.mongo_manager.shared_model.db_backup_model import BackupType, db_backup_model
from orion.constants.constant import CONSTANTS


class BackupManager:
    __instance = None
    _tasks: set = set()

    @staticmethod
    def get_instance():
        if BackupManager.__instance is None:
            BackupManager()
        return BackupManager.__instance

    def __init__(self):
        if BackupManager.__instance is not None:
            return
        BackupManager.__instance = self
        self.backup_root = BASE_DIR / "backups"
        self.maintenance_flag = BASE_DIR / "static" / ".maintenance"
        self._progress_window = (0, 90)

    @property
    def _engine(self):
        engine = getattr(self, "_engine_instance", None)
        if engine is None:
            engine = mongo_controller.get_instance().get_engine()
            self._engine_instance = engine
        return engine

    @_engine.setter
    def _engine(self, value):
        self._engine_instance = value

    @property
    def _job_store(self) -> BackupJobStore:
        store = getattr(self, "_job_store_instance", None)
        if store is None:
            store = BackupJobStore.get_instance()
            self._job_store_instance = store
        return store

    @_job_store.setter
    def _job_store(self, value):
        self._job_store_instance = value

    async def job_status(self) -> dict:
        return await self._job_store.read()

    async def _set_progress(self, progress: int, message: str) -> None:
        await self._job_store.progress(progress, message)

    def _spawn(self, coroutine) -> None:
        task = asyncio.create_task(coroutine)
        BackupManager._tasks.add(task)
        task.add_done_callback(BackupManager._tasks.discard)

    @staticmethod
    async def _stop_heartbeat(heartbeat) -> None:
        heartbeat.cancel()
        try:
            await heartbeat
        except asyncio.CancelledError:
            pass

    async def start_backup(self, backup_type: BackupType) -> dict:
        if not await self._job_store.begin("backup", "Starting backup"):
            log.g().i("BACKUP: request ignored, another backup or restore is already running")
            return await self.job_status()
        self._spawn(self._run_backup(backup_type))
        return await self.job_status()

    async def run_backup_now(self, backup_type: BackupType) -> bool:
        if not await self._job_store.begin("backup", "Starting backup"):
            log.g().i("BACKUP: scheduled run skipped, another backup or restore is already running")
            return False
        await self._run_backup(backup_type)
        return True

    async def _run_backup(self, backup_type: BackupType) -> None:
        heartbeat = asyncio.create_task(self._job_store.keep_alive())
        try:
            result = await self.create_backup(backup_type)
            await self._job_store.finish(BackupJobStatus.DONE, "Backup completed successfully", result.get("filename", ""))
        except Exception as exc:
            log.g().e(f"BACKUP FAILED: {exc}")
            await self._job_store.finish(BackupJobStatus.FAILED, str(getattr(exc, "detail", exc)))
        finally:
            await self._stop_heartbeat(heartbeat)

    async def start_restore(self, backup_id: str) -> dict:
        if not await self._job_store.begin("restore", "Starting restore"):
            log.g().i("RESTORE: request ignored, another backup or restore is already running")
            return await self.job_status()
        self._spawn(self._run_restore(backup_id))
        return await self.job_status()

    async def _run_restore(self, backup_id: str) -> None:
        heartbeat = asyncio.create_task(self._job_store.keep_alive())
        try:
            result = await self.restore_backup_by_id(backup_id)
            await self._job_store.finish(BackupJobStatus.DONE, "Backup restored successfully", result.get("filename", ""))
        except Exception as exc:
            log.g().e(f"RESTORE FAILED: {exc}")
            await self._job_store.finish(BackupJobStatus.FAILED, str(getattr(exc, "detail", exc)))
        finally:
            await self._stop_heartbeat(heartbeat)

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
        log.g().i(f"BACKUP STARTED: {folder_name} type={backup_type.value}")

        try:
            await self._perform_backup(backup_dir)
        except Exception as exc:
            shutil.rmtree(backup_dir, ignore_errors=True)
            raise HTTPException(status_code=500, detail=f"Backup failed: {exc}") from exc

        backup = db_backup_model(filename=folder_name, backup_type=backup_type, created_at=created_at)
        await self._engine.save(backup)
        log.g().i(f"BACKUP SUCCESS: {folder_name}")
        return {
            "id": str(backup.id),
            "filename": backup.filename,
            "backup_type": backup.backup_type.value,
            "created_at": backup.created_at,
        }

    async def _perform_backup(self, backup_dir: Path):
        progress_base, progress_span = getattr(self, "_progress_window", (0, 90))
        total_steps = 5

        async def step(done: int, message: str, fraction: float = 0.0) -> None:
            position = min(1.0, (done + fraction) / total_steps)
            await self._set_progress(int(progress_base + progress_span * position), message)

        backup_dir.mkdir(parents=True, exist_ok=True)
        await step(0, "Exporting MongoDB")
        await self._backup_mongo(backup_dir / "mongo", lambda fraction: step(0, "Exporting MongoDB", fraction))
        await step(1, "Exporting ArangoDB")
        await asyncio.to_thread(self._backup_arango, backup_dir / "arango")
        await step(2, "Exporting Elasticsearch")
        await self._backup_elastic(backup_dir / "elastic")
        await step(3, "Copying logs")
        await asyncio.to_thread(self._copy_folder, BASE_DIR / "workspace" / "logs", backup_dir / "logs")
        await step(4, "Copying resources")
        await asyncio.to_thread(self._copy_folder, BASE_DIR / "static" / "resource", backup_dir / "resource")
        await step(5, "Finalizing")

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
            self._progress_window = (5, 35)
            await self._perform_backup(rollback_dir)
            log.g().i(f"RESTORE: rollback point created: {rollback_name}")
        except Exception as exc:
            shutil.rmtree(rollback_dir, ignore_errors=True)
            self.maintenance_flag.unlink(missing_ok=True)
            log.g().e(f"RESTORE FAILED: could not create rollback point: {exc}")
            raise HTTPException(status_code=500, detail=f"Restore aborted, could not create rollback point: {exc}") from exc

        try:
            await self._set_progress(45, "Restoring data")
            await self._run_restore_engine(backup_dir)
            log.g().i(f"RESTORE: restore steps completed for {filename}")
            await self._set_progress(90, "Validating restore")
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
        await asyncio.to_thread(self._copy_folder, source_dir / "logs", BASE_DIR / "workspace" / "logs")
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

    async def _backup_mongo(self, output_dir: Path, report=None):
        output_dir.mkdir(parents=True, exist_ok=True)
        database = self._engine.database
        collections = await database.list_collection_names()
        total = len(collections) or 1
        for index, collection_name in enumerate(collections):
            await self._dump_collection(database, collection_name, output_dir / f"{collection_name}.ndjson")
            if report is not None:
                await report((index + 1) / total)

    async def _dump_collection(self, database, collection_name: str, path: Path) -> None:
        handle = await asyncio.to_thread(path.open, "w", encoding="utf-8")
        try:
            batch = []
            cursor = database[collection_name].find({}, batch_size=CONSTANTS.BACKUP_BATCH_SIZE)
            async for document in cursor:
                batch.append(document)
                if len(batch) >= CONSTANTS.BACKUP_BATCH_SIZE:
                    await asyncio.to_thread(self._write_json_lines, handle, batch)
                    batch = []
            if batch:
                await asyncio.to_thread(self._write_json_lines, handle, batch)
        finally:
            await asyncio.to_thread(handle.close)

    @staticmethod
    def _write_json_lines(handle, documents) -> None:
        handle.write("".join(f"{json_util.dumps(document)}\n" for document in documents))

    @staticmethod
    def _read_json_lines(handle, limit: int) -> list:
        documents = []
        for line in handle:
            line = line.strip()
            if line:
                documents.append(json_util.loads(line))
            if len(documents) >= limit:
                break
        return documents

    @staticmethod
    def _read_json_dump(path: Path):
        return json_util.loads(path.read_text(encoding="utf-8"))

    @staticmethod
    def _collect_sources(source_dir: Path) -> dict:
        sources = {}
        for suffix in ("*.json", "*.ndjson"):
            for file in sorted(source_dir.glob(suffix)):
                sources[file.stem] = file
        return sources

    def _backup_arango(self, output_dir: Path):
        output_dir.mkdir(parents=True, exist_ok=True)
        db = arango_controller.get_instance().get_db()
        if db is None:
            return
        for collection_info in db.collections():
            collection_name = collection_info.get("name")
            if not collection_name or collection_name.startswith("_"):
                continue
            cursor = db.aql.execute(
                f"FOR doc IN `{collection_name}` RETURN doc",
                batch_size=CONSTANTS.BACKUP_BATCH_SIZE,
                stream=True,
            )
            with (output_dir / f"{collection_name}.ndjson").open("w", encoding="utf-8") as handle:
                for document in cursor:
                    handle.write(f"{json.dumps(document, default=str)}\n")

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
                    await asyncio.to_thread(self._write_hits, file, hits)
                    response = await conn.scroll(scroll_id=scroll_id, scroll="2m")
                    scroll_id = response.get("_scroll_id")
                    hits = response.get("hits", {}).get("hits", [])
                if scroll_id:
                    await conn.clear_scroll(scroll_id=scroll_id)

    @staticmethod
    def _write_hits(file, hits) -> None:
        for hit in hits:
            file.write(json.dumps(hit, default=str) + "\n")

    def _copy_folder(self, source: Path, destination: Path):
        destination.mkdir(parents=True, exist_ok=True)
        if source.exists():
            shutil.copytree(source, destination, dirs_exist_ok=True)

    async def _read_documents(self, path: Path):
        if path.suffix == ".json":
            documents = await asyncio.to_thread(self._read_json_dump, path)
            for start in range(0, len(documents), CONSTANTS.BACKUP_BATCH_SIZE):
                yield documents[start:start + CONSTANTS.BACKUP_BATCH_SIZE]
            return
        handle = await asyncio.to_thread(path.open, "r", encoding="utf-8")
        try:
            while True:
                batch = await asyncio.to_thread(self._read_json_lines, handle, CONSTANTS.BACKUP_BATCH_SIZE)
                if not batch:
                    return
                yield batch
        finally:
            await asyncio.to_thread(handle.close)

    async def _restore_mongo(self, source_dir: Path):
        if not source_dir.exists():
            return
        database = self._engine.database
        catalog_collection = self._engine.get_collection(db_backup_model).name
        for collection_name, file in self._collect_sources(source_dir).items():
            if collection_name == catalog_collection:
                continue
            await database[collection_name].delete_many({})
            async for batch in self._read_documents(file):
                await database[collection_name].insert_many(batch)

    @staticmethod
    def _iter_documents(path: Path):
        if path.suffix == ".json":
            documents = json.loads(path.read_text(encoding="utf-8"))
            for start in range(0, len(documents), CONSTANTS.BACKUP_BATCH_SIZE):
                yield documents[start:start + CONSTANTS.BACKUP_BATCH_SIZE]
            return
        with path.open("r", encoding="utf-8") as handle:
            batch = []
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                batch.append(json.loads(line))
                if len(batch) >= CONSTANTS.BACKUP_BATCH_SIZE:
                    yield batch
                    batch = []
            if batch:
                yield batch

    def _restore_arango(self, source_dir: Path):
        if not source_dir.exists():
            return
        db = arango_controller.get_instance().get_db()
        if db is None:
            return
        for collection_name, file in self._collect_sources(source_dir).items():
            if not db.has_collection(collection_name):
                db.create_collection(collection_name)
            collection = db.collection(collection_name)
            collection.truncate()
            for batch in self._iter_documents(file):
                collection.import_bulk(batch, on_duplicate="replace")

    async def _restore_elastic(self, source_dir: Path):
        if not source_dir.exists():
            return
        conn = elastic_controller.get_instance().get_connection()
        if conn is None:
            return
        for file in sorted(source_dir.glob("*.ndjson")):
            index_name = file.stem
            if await conn.indices.exists(index=index_name):
                await conn.indices.delete(index=index_name)
            await conn.indices.create(index=index_name)

            handle = await asyncio.to_thread(file.open, "r", encoding="utf-8")
            try:
                while True:
                    actions = await asyncio.to_thread(self._read_hits, handle, index_name, CONSTANTS.BACKUP_BATCH_SIZE)
                    if not actions:
                        break
                    await es_helpers.async_bulk(conn, actions)
            finally:
                await asyncio.to_thread(handle.close)

    @staticmethod
    def _read_hits(handle, index_name: str, limit: int) -> list:
        actions = []
        for line in handle:
            line = line.strip()
            if line:
                hit = json.loads(line)
                actions.append({
                    "_op_type": "index",
                    "_index": index_name,
                    "_id": hit.get("_id"),
                    "_source": hit.get("_source", {}),
                })
            if len(actions) >= limit:
                break
        return actions

    def _restore_folder(self, source: Path, destination: Path):
        if not source.exists():
            return
        shutil.rmtree(destination, ignore_errors=True)
        shutil.copytree(source, destination, dirs_exist_ok=True)
