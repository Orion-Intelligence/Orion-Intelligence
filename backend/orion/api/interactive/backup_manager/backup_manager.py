from __future__ import annotations

import asyncio
import json
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

from bson import ObjectId
from bson import json_util
from bson.errors import InvalidId
from elasticsearch import helpers as es_helpers
from fastapi import HTTPException

from orion.api.interactive.backup_manager.backup_job_store import BackupJobStore
from orion.api.interactive.backup_manager.backup_report import REPORT_NAME, BackupReport
from orion.api.interactive.backup_manager.backup_retention import BackupRetention
from orion.api.interactive.backup_manager.backup_store_io import BackupStoreIO
from orion.api.interactive.backup_manager.maintenance_state import maintenance_state
from orion.api.interactive.backup_manager.tenant_backup_manager import TenantBackupManager
from orion.api.interactive.backup_manager.tenant_partition import TenantPartitionRegistry
from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_backup_job_model import BackupJobStatus, db_backup_job_model
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
        self.backup_root = CONSTANTS.BASE_DIR / "backups"
        self.maintenance_flag = CONSTANTS.MAINTENANCE_FLAG

    @property
    def restore_marker(self) -> Path:
        return self.backup_root / CONSTANTS.RESTORE_MARKER_NAME

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
    def _partition_registry(self) -> TenantPartitionRegistry:
        registry = getattr(self, "_partition_registry_instance", None)
        if registry is None:
            registry = TenantPartitionRegistry(preserved=self._preserved_collections())
            self._partition_registry_instance = registry
        return registry

    @_partition_registry.setter
    def _partition_registry(self, value):
        self._partition_registry_instance = value

    @property
    def _retention(self) -> BackupRetention:
        instance = getattr(self, "_retention_instance", None)
        if instance is None:
            instance = BackupRetention(self)
            self._retention_instance = instance
        return instance

    @_retention.setter
    def _retention(self, value):
        self._retention_instance = value

    @property
    def _io(self) -> BackupStoreIO:
        instance = getattr(self, "_io_instance", None)
        if instance is None:
            instance = BackupStoreIO(self)
            self._io_instance = instance
        return instance

    @_io.setter
    def _io(self, value):
        self._io_instance = value

    @property
    def _tenant(self) -> TenantBackupManager:
        instance = getattr(self, "_tenant_instance", None)
        if instance is None:
            instance = TenantBackupManager(self)
            self._tenant_instance = instance
        return instance

    @_tenant.setter
    def _tenant(self, value):
        self._tenant_instance = value

    @property
    def tenant_restore_marker(self) -> Path:
        return self._tenant.tenant_restore_marker

    async def start_tenant_restore(self, backup_id: str, tenant_id: str) -> dict:
        return await self._tenant.start_tenant_restore(backup_id, tenant_id)

    async def list_backup_tenants(self, backup_id: str):
        return await self._tenant.list_backup_tenants(backup_id)

    async def list_backups_for_tenant(self, tenant_id: str):
        return await self._tenant.list_backups_for_tenant(tenant_id)

    async def resolve_download(self, backup_id: str):
        backup = await self._load_backup_by_id(backup_id)
        backup_dir = self.backup_root / backup.filename
        if not backup_dir.is_dir():
            raise HTTPException(status_code=404, detail="Backup files are no longer on disk")
        await asyncio.to_thread(BackupReport.write, backup_dir / REPORT_NAME, self.read_manifest(backup_dir))
        return backup_dir, backup.filename

    async def resolve_tenant_download(self, backup_id: str, tenant_id: str):
        return await self._tenant.resolve_download(backup_id, tenant_id)

    async def restore_tenant(self, filename: str, tenant_id: str, source: str = "cli"):
        return await self._tenant.restore_tenant(filename, tenant_id, source)

    async def resolve_interrupted_tenant_restore(self) -> bool:
        return await self._tenant.resolve_interrupted_tenant_restore()

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
        status = await self._job_store.read()
        if self.restore_marker.exists():
            status["interrupted_restore"] = self._io.read_json_file(self.restore_marker) or {}
        if self.tenant_restore_marker.exists():
            status["interrupted_tenant_restore"] = self._io.read_json_file(self.tenant_restore_marker) or {}
        return status

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

    @staticmethod
    async def _remove_tree(path: Path) -> None:
        await asyncio.to_thread(shutil.rmtree, path, ignore_errors=True)

    async def start_backup(self, backup_type: BackupType) -> dict:
        if self.restore_marker.exists():
            raise HTTPException(status_code=409, detail="A previous restore was interrupted. Resolve it before running a backup.")
        if not await self._job_store.begin("backup", "Starting backup"):
            log.g().i("BACKUP: request ignored, another backup or restore is already running")
            return await self.job_status()
        self._spawn(self._run_backup(backup_type))
        return await self.job_status()

    async def run_backup_now(self, backup_type: BackupType) -> bool:
        if self.restore_marker.exists():
            log.g().e("BACKUP: scheduled run skipped, a previous restore was interrupted")
            return False
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
        if self.restore_marker.exists():
            raise HTTPException(status_code=409, detail="A previous restore was interrupted. Resolve it before running another restore.")
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
        created_at = datetime.now(timezone.utc)
        folder_name = created_at.strftime("%Y_%m_%d_%H_%M_%S")
        backup_dir = self.backup_root / folder_name
        log.g().i(f"BACKUP STARTED: {folder_name} type={backup_type.value}")

        await self._retention.sweep_stale_rollbacks()
        await self._retention.sweep_orphaned_backups()
        await self._retention.require_free_space(backup_dir.parent)

        try:
            await self._perform_backup(backup_dir, window=(0, 90))
        except Exception as exc:
            await self._remove_tree(backup_dir)
            raise HTTPException(status_code=500, detail=f"Backup failed: {exc}") from exc

        backup = db_backup_model(filename=folder_name, backup_type=backup_type, created_at=created_at)
        await self._engine.save(backup)
        log.g().i(f"BACKUP SUCCESS: {folder_name}")

        await self._retention.prune_old_backups()
        return {
            "id": str(backup.id),
            "filename": backup.filename,
            "backup_type": backup.backup_type.value,
            "created_at": backup.created_at,
        }

    async def _perform_backup(self, backup_dir: Path, window: tuple = (0, 90)):
        progress_base, progress_span = window
        total_steps = 6

        async def step(done: int, message: str, fraction: float = 0.0) -> None:
            position = min(1.0, (done + fraction) / total_steps)
            await self._set_progress(int(progress_base + progress_span * position), message)

        backup_dir.mkdir(parents=True, exist_ok=True)
        manifest = {"version": CONSTANTS.BACKUP_MANIFEST_VERSION, "completed": False, "created_at": datetime.now(timezone.utc)}

        await step(0, "Exporting MongoDB")
        manifest["mongo"] = await self._io.backup_mongo(backup_dir / "mongo", lambda fraction: step(0, "Exporting MongoDB", fraction))
        await step(1, "Exporting ArangoDB")
        manifest["arango"] = await asyncio.to_thread(self._io.backup_arango, backup_dir / "arango")
        await step(2, "Exporting Elasticsearch")
        manifest["elastic"] = await self._io.backup_elastic(backup_dir / "elastic")
        await step(3, "Copying logs")
        await asyncio.to_thread(self._io.copy_folder, CONSTANTS.BASE_DIR / "workspace" / "logs", backup_dir / "logs")
        await step(4, "Copying resources")
        await asyncio.to_thread(self._io.copy_folder, CONSTANTS.BASE_DIR / "static" / "resource", backup_dir / "resource")
        await asyncio.to_thread(self._io.copy_folder, CONSTANTS.S_SESSION_RESOURCE_DIR, backup_dir / "session_data")
        await step(5, "Exporting tenants")
        manifest["tenants"] = await self._tenant.backup_tenants(backup_dir / CONSTANTS.BACKUP_TENANTS_DIR)
        await step(6, "Finalizing")

        manifest["completed"] = True
        await asyncio.to_thread(self._io.write_json_file, backup_dir / CONSTANTS.BACKUP_MANIFEST_NAME, manifest)
        await asyncio.to_thread(BackupReport.write, backup_dir / REPORT_NAME, manifest)
        return manifest

    def read_manifest(self, backup_dir: Path):
        return self._io.read_json_file(backup_dir / CONSTANTS.BACKUP_MANIFEST_NAME)

    async def _load_backup_by_id(self, backup_id: str):
        try:
            backup_object_id = ObjectId(backup_id)
        except (InvalidId, TypeError) as exc:
            raise HTTPException(status_code=404, detail="Backup not found") from exc
        backup = await self._engine.find_one(db_backup_model, db_backup_model.id == backup_object_id)
        if backup is None:
            raise HTTPException(status_code=404, detail="Backup not found")
        return backup

    async def delete_backup(self, backup_id: str):
        backup = await self._load_backup_by_id(backup_id)
        await self._remove_tree(self.backup_root / backup.filename)
        await self._engine.delete(backup)
        return {"status": "deleted"}

    async def restore_backup_by_id(self, backup_id: str):
        backup = await self._load_backup_by_id(backup_id)
        return await self.restore_backup(backup.filename, source="ui")

    async def _quiesce_writers(self) -> None:
        quiesced = 0
        try:
            from orion.api.interactive.extension_manager.extension_socket_manager import extension_socket_manager
            socket_manager = extension_socket_manager.get_instance()
            for user_key in list(getattr(socket_manager, "_sockets", {}).keys()):
                await socket_manager.reset_sockets(user_key)
                quiesced += 1
        except Exception as exc:
            log.g().w(f"RESTORE: could not close extension sockets: {exc}")

        try:
            from orion.api.interactive.social_manager.social_scanner import social_scanner
            scanner = social_scanner.get_instance()
            for scan in list(getattr(scanner, "_scans", {}).values()):
                task = getattr(scan, "task", None)
                if task is not None and not task.done():
                    task.cancel()
                    quiesced += 1
        except Exception as exc:
            log.g().w(f"RESTORE: could not cancel social scans: {exc}")

        if quiesced:
            await asyncio.sleep(CONSTANTS.RESTORE_QUIESCE_DRAIN_SECONDS)
        log.g().i(f"RESTORE: in-flight writers quiesced ({quiesced} cancelled or closed)")

    async def restore_backup(self, filename: str, source: str = "cli"):
        backup_dir = self.backup_root / filename
        log.g().i(f"RESTORE STARTED: backup={filename} source={source}")

        if not backup_dir.is_dir() or not (backup_dir / "mongo").is_dir() or not any((backup_dir / "mongo").iterdir()):
            log.g().e(f"RESTORE FAILED: backup verification failed for {filename}")
            raise HTTPException(status_code=404, detail="Backup not found or missing required data")

        manifest = self.read_manifest(backup_dir)
        if manifest is None:
            log.g().w(f"RESTORE: {filename} has no manifest, restoring without count verification")
        elif not manifest.get("completed"):
            log.g().e(f"RESTORE FAILED: {filename} is an incomplete backup")
            raise HTTPException(status_code=422, detail="Backup is incomplete and cannot be restored")
        log.g().i(f"RESTORE: backup verified: {filename}")

        self.maintenance_flag.parent.mkdir(parents=True, exist_ok=True)
        self.maintenance_flag.touch()
        maintenance_state.get_instance().invalidate()
        log.g().i("RESTORE: maintenance mode enabled")
        await self._quiesce_writers()

        rollback_name = f"{CONSTANTS.RESTORE_ROLLBACK_PREFIX}{datetime.now(timezone.utc).strftime('%Y_%m_%d_%H_%M_%S')}"
        rollback_dir = self.backup_root / rollback_name
        try:
            await self._retention.require_free_space(self.backup_root, backup_dir)
            await self._perform_backup(rollback_dir, window=(5, 35))
            log.g().i(f"RESTORE: rollback point created: {rollback_name}")
        except Exception as exc:
            await self._remove_tree(rollback_dir)
            self.maintenance_flag.unlink(missing_ok=True)
            maintenance_state.get_instance().invalidate()
            log.g().e(f"RESTORE FAILED: could not create rollback point: {exc}")
            raise HTTPException(status_code=500, detail=f"Restore aborted, could not create rollback point: {exc}") from exc

        await asyncio.to_thread(
            self._io.write_json_file,
            self.restore_marker,
            {"backup": filename, "rollback": rollback_name, "source": source, "started_at": datetime.now(timezone.utc)},
        )

        try:
            await self._set_progress(45, "Restoring data")
            await self._run_restore_engine(backup_dir)
            log.g().i(f"RESTORE: restore steps completed for {filename}")
            await self._set_progress(90, "Validating restore")
            valid, details = await self._validate_restore(manifest)
            if not valid:
                raise RuntimeError(f"validation failed: {details}")
            log.g().i(f"RESTORE: validation passed for {filename}")
        except Exception as exc:
            log.g().e(f"RESTORE FAILED: {exc}. Rolling back to {rollback_name}")
            try:
                await self._run_restore_engine(rollback_dir)
                valid, details = await self._validate_restore(self.read_manifest(rollback_dir))
                if not valid:
                    raise RuntimeError(f"rollback validation failed: {details}")
                log.g().i(f"RESTORE: rollback succeeded, previous state restored from {rollback_name}")
            except Exception as rollback_exc:
                log.g().c(
                    f"RESTORE CRITICAL: rollback FAILED after restore failure. "
                    f"backup={filename} rollback={rollback_name} restore_error={exc} rollback_error={rollback_exc}"
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Restore failed and rollback failed. Manual intervention required: {rollback_exc}",
                ) from rollback_exc

            self.restore_marker.unlink(missing_ok=True)
            await self._remove_tree(rollback_dir)
            await self._refresh_caches()
            log.g().i("RESTORE: starting site after rollback")
            self.maintenance_flag.unlink(missing_ok=True)
            maintenance_state.get_instance().invalidate()
            log.g().i("RESTORE: maintenance mode disabled")
            raise HTTPException(status_code=500, detail=f"Restore failed and was rolled back: {exc}") from exc

        self.restore_marker.unlink(missing_ok=True)
        await self._remove_tree(rollback_dir)
        await self._refresh_caches()
        log.g().i("RESTORE: starting site")
        self.maintenance_flag.unlink(missing_ok=True)
        maintenance_state.get_instance().invalidate()
        log.g().i(f"RESTORE SUCCESS: {filename}. Maintenance mode disabled.")
        return {"status": "restored", "filename": filename}

    async def _refresh_caches(self, tenant_id: str | None = None) -> None:
        try:
            from orion.api.server.config_manager.config_controller import config_controller
            await config_controller.getInstance().load_config(force_db=True, tenant_id=tenant_id)
            log.g().i("RESTORE: config cache reloaded from the restored database")
        except Exception as exc:
            log.g().e(f"RESTORE: config cache reload failed: {exc}")

    async def resolve_interrupted_restore(self) -> bool:
        marker = self._io.read_json_file(self.restore_marker)
        if not marker:
            return False
        self.maintenance_flag.parent.mkdir(parents=True, exist_ok=True)
        self.maintenance_flag.touch()
        maintenance_state.get_instance().invalidate()
        log.g().c(
            f"RESTORE CRITICAL: an interrupted restore was detected on startup. "
            f"backup={marker.get('backup')} rollback={marker.get('rollback')}. "
            f"The databases are in a partially restored state and the site is held in maintenance mode. "
            f"Recover with: python restore_backup.py {marker.get('rollback')}"
        )
        await self._job_store.finish(
            BackupJobStatus.FAILED,
            "Restore was interrupted and the databases are partially restored. Manual recovery required.",
            str(marker.get("backup") or ""),
        )
        return True

    async def _run_restore_engine(self, source_dir: Path):
        await self._io.restore_mongo(source_dir / "mongo")
        await asyncio.to_thread(self._io.restore_arango, source_dir / "arango")
        await self._io.restore_elastic(source_dir / "elastic")
        await asyncio.to_thread(self._io.restore_folder, source_dir / "resource", CONSTANTS.BASE_DIR / "static" / "resource")
        await asyncio.to_thread(self._io.restore_folder, source_dir / "session_data", CONSTANTS.S_SESSION_RESOURCE_DIR)

    async def _validate_restore(self, manifest=None):
        try:
            collection_names = await self._engine.database.list_collection_names()
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

        if not manifest:
            return True, "ok"

        preserved = self._preserved_collections()
        for collection_name, expected in (manifest.get("mongo") or {}).items():
            if collection_name in preserved:
                continue
            if collection_name not in collection_names:
                return False, f"MongoDB collection {collection_name} is missing after restore"
            actual = await self._engine.database[collection_name].count_documents({})
            if actual != expected:
                return False, f"MongoDB collection {collection_name} has {actual} documents, expected {expected}"
        return True, "ok"

    def _preserved_collections(self) -> set:
        return {
            self._engine.get_collection(db_backup_model).name,
            self._engine.get_collection(db_backup_job_model).name,
        }
