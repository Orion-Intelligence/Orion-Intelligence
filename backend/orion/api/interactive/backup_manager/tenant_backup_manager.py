from __future__ import annotations

import asyncio
import shutil
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId, json_util
from bson.errors import InvalidId
from elasticsearch import helpers as es_helpers
from pymongo.errors import BulkWriteError
from fastapi import HTTPException

from orion.api.interactive.backup_manager.backup_report import REPORT_NAME, BackupReport
from orion.api.interactive.backup_manager.export_cipher import ExportCipher
from orion.api.interactive.backup_manager.maintenance_state import maintenance_state
from orion.api.interactive.backup_manager.models.tenant_partition_model import Ownership, TenantScope
from orion.api.interactive.backup_manager.tenant_partition import TenantPartitionRegistry
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.shared_model.db_backup_job_model import BackupJobStatus
from orion.services.mongo_manager.shared_model.db_backup_model import BackupType, db_backup_model
from orion.constants.constant import CONSTANTS


class TenantBackupManager:

    def __init__(self, owner):
        self._owner = owner

    @property
    def tenant_restore_marker(self) -> Path:
        return self._owner.backup_root / CONSTANTS.RESTORE_TENANT_MARKER_NAME

    async def start_tenant_restore(self, backup_id: str, tenant_id: str) -> dict:
        if self._owner.restore_marker.exists():
            raise HTTPException(status_code=409, detail="A previous restore was interrupted. Resolve it before running another restore.")
        if self.tenant_restore_marker.exists():
            raise HTTPException(status_code=409, detail="A previous tenant restore was interrupted. Resolve it before running another restore.")
        if not await self._owner._job_store.begin("restore", "Starting tenant restore"):
            raise HTTPException(status_code=409, detail="Another backup or restore is already running")
        self._owner._spawn(self._run_tenant_restore(backup_id, tenant_id))
        return await self._owner.job_status()

    async def _run_tenant_restore(self, backup_id: str, tenant_id: str) -> None:
        heartbeat = asyncio.create_task(self._owner._job_store.keep_alive())
        try:
            result = await self.restore_tenant_by_id(backup_id, tenant_id)
            await self._owner._job_store.finish(BackupJobStatus.DONE, self._outcome_message("Tenant restored successfully", result), result.get("filename", ""))
        except Exception as exc:
            log.g().e(f"TENANT RESTORE FAILED: {exc}")
            await self._owner._job_store.finish(BackupJobStatus.FAILED, str(getattr(exc, "detail", exc)))
        finally:
            await self._owner._stop_heartbeat(heartbeat)

    @staticmethod
    def _outcome_message(message: str, result: dict) -> str:
        skipped = sum(int(counts.get("skipped", 0)) for counts in (result.get("mongo") or {}).values())
        return f"{message} ({skipped} records belonged to another tenant and were left out, see the server log)" if skipped else message

    async def start_tenant_import(self, upload, owner_tenant_id: str | None = None) -> dict:
        if self._owner.restore_marker.exists():
            raise HTTPException(status_code=409, detail="A previous restore was interrupted. Resolve it before running another restore.")
        if self.tenant_restore_marker.exists():
            raise HTTPException(status_code=409, detail="A previous tenant restore was interrupted. Resolve it before running another restore.")
        if not await self._owner._job_store.begin("restore", "Staging tenant import"):
            raise HTTPException(status_code=409, detail="Another backup or restore is already running")
        heartbeat = asyncio.create_task(self._owner._job_store.keep_alive())
        stage_name = f"{CONSTANTS.IMPORT_TENANT_STAGE_PREFIX}{datetime.now(timezone.utc).strftime('%Y_%m_%d_%H_%M_%S')}_{uuid.uuid4().hex[:8]}"
        stage_dir = self._owner.backup_root / stage_name
        try:
            tenant_id, document = await self._stage_tenant_import(upload, stage_dir)
            if owner_tenant_id is not None:
                await self._ensure_import_allowed(owner_tenant_id, tenant_id, document)
            elif await self._is_secondary_tenant(tenant_id, document):
                raise HTTPException(status_code=403, detail="Secondary tenants are imported through their primary tenant")
        except Exception as exc:
            await self._owner._remove_tree(stage_dir)
            await self._owner._job_store.finish(BackupJobStatus.FAILED, str(getattr(exc, "detail", exc)))
            raise
        finally:
            await self._owner._stop_heartbeat(heartbeat)
        self._owner._spawn(self._run_tenant_import(stage_name, tenant_id))
        return await self._owner.job_status()

    async def _run_tenant_import(self, stage_name: str, tenant_id: str) -> None:
        heartbeat = asyncio.create_task(self._owner._job_store.keep_alive())
        try:
            result = await self.restore_tenant(stage_name, tenant_id, source="import")
            await self._owner._job_store.finish(BackupJobStatus.DONE, self._outcome_message("Tenant imported successfully", result), result.get("filename", ""))
        except Exception as exc:
            log.g().e(f"TENANT IMPORT FAILED: {exc}")
            await self._owner._job_store.finish(BackupJobStatus.FAILED, str(getattr(exc, "detail", exc)))
        finally:
            await self._owner._remove_tree(self._owner.backup_root / stage_name)
            await self._owner._stop_heartbeat(heartbeat)

    async def _stage_tenant_import(self, upload, stage_dir: Path) -> tuple[str, dict]:
        unpacked = stage_dir / "unpacked"
        await asyncio.to_thread(unpacked.mkdir, parents=True, exist_ok=True)
        upload_path = stage_dir / "upload.zip"
        archive_path = stage_dir / "import.zip"
        await self._save_upload(upload, upload_path)
        await asyncio.to_thread(self._unwrap_export, upload_path, archive_path)
        await asyncio.to_thread(self._extract_archive, archive_path, unpacked)
        archive_path.unlink(missing_ok=True)
        source = await asyncio.to_thread(self._locate_imported_tenant_dir, unpacked)
        if source is None:
            raise HTTPException(status_code=422, detail="Uploaded file is not a tenant export")
        document = await asyncio.to_thread(
            self._read_first_document,
            source / CONSTANTS.BACKUP_TENANT_MONGO_DIR / f"{CONSTANTS.BACKUP_TENANT_COLLECTION}.ndjson",
        )
        tenant_id = str((document or {}).get("_id") or "")
        try:
            ObjectId(tenant_id)
        except (InvalidId, TypeError) as exc:
            raise HTTPException(status_code=422, detail="Tenant identifier in the export is not a valid object id") from exc
        tenants_dir = stage_dir / CONSTANTS.BACKUP_TENANTS_DIR
        await asyncio.to_thread(tenants_dir.mkdir, parents=True, exist_ok=True)
        await asyncio.to_thread(shutil.move, str(source), str(tenants_dir / tenant_id))
        await self._owner._remove_tree(unpacked)
        return tenant_id, document or {}

    async def _is_secondary_tenant(self, tenant_id: str, document: dict | None = None) -> bool:
        parents = await self._tenant_parents(self._owner._engine.database)
        if parents.get(tenant_id):
            return True
        return bool((document or {}).get(CONSTANTS.BACKUP_TENANT_PARENT_FIELD))

    async def _ensure_import_allowed(self, owner_tenant_id: str, tenant_id: str, document: dict | None = None) -> None:
        if tenant_id == owner_tenant_id:
            return
        parents = await self._tenant_parents(self._owner._engine.database)
        if tenant_id in parents:
            if parents[tenant_id] == owner_tenant_id:
                return
        elif str((document or {}).get(CONSTANTS.BACKUP_TENANT_PARENT_FIELD) or "") == owner_tenant_id:
            return
        raise HTTPException(status_code=403, detail="This export does not belong to your tenant")

    @staticmethod
    async def _save_upload(upload, path: Path) -> None:
        with path.open("wb") as handle:
            while True:
                chunk = await upload.read(1024 * 1024)
                if not chunk:
                    break
                handle.write(chunk)
        await upload.close()

    @staticmethod
    def _unwrap_export(upload_path: Path, archive_path: Path) -> None:
        try:
            with zipfile.ZipFile(upload_path) as outer:
                member = next((entry for entry in outer.infolist() if entry.filename.rsplit("/", 1)[-1] == CONSTANTS.BACKUP_EXPORT_PAYLOAD_NAME), None)
                if member is None:
                    raise HTTPException(status_code=422, detail="Uploaded file is not a tenant export from this server")
                with outer.open(member) as handle:
                    ExportCipher.decrypt_to_file(handle, archive_path)
        except zipfile.BadZipFile as exc:
            raise HTTPException(status_code=422, detail="Uploaded file is not a valid zip archive") from exc
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=f"Uploaded file was rejected: {exc}") from exc
        upload_path.unlink(missing_ok=True)

    @staticmethod
    def _extract_archive(archive_path: Path, destination: Path) -> None:
        root = destination.resolve()
        try:
            with zipfile.ZipFile(archive_path) as archive:
                total = 0
                for member in archive.infolist():
                    target = (destination / member.filename).resolve()
                    if target != root and root not in target.parents:
                        raise HTTPException(status_code=422, detail="Uploaded archive contains an invalid path")
                    total += member.file_size
                free = shutil.disk_usage(destination).free
                if total > free / CONSTANTS.BACKUP_DISK_HEADROOM or total > archive_path.stat().st_size * CONSTANTS.BACKUP_IMPORT_MAX_INFLATION:
                    raise HTTPException(status_code=413, detail="Uploaded archive is too large to import")
                archive.extractall(destination)
        except zipfile.BadZipFile as exc:
            raise HTTPException(status_code=422, detail="Uploaded file is not a valid zip archive") from exc

    @classmethod
    def _locate_imported_tenant_dir(cls, unpacked: Path):
        if cls._is_tenant_dir(unpacked):
            return unpacked
        candidates = [entry for entry in sorted(unpacked.iterdir()) if entry.is_dir() and cls._is_tenant_dir(entry)]
        return candidates[0] if len(candidates) == 1 else None

    async def list_backups_for_tenant(self, tenant_id: str):
        backups = await self._owner._engine.find(db_backup_model, sort=db_backup_model.created_at.desc())
        entries = []
        for backup in backups:
            backup_dir = self._owner.backup_root / backup.filename
            tenant_dir = self._tenant_backup_dir(backup_dir / CONSTANTS.BACKUP_TENANTS_DIR, tenant_id)
            if not (tenant_dir / CONSTANTS.BACKUP_TENANT_MONGO_DIR).is_dir():
                continue
            manifest = self._owner.read_manifest(backup_dir) or {}
            summary = ((manifest.get("tenants") or {}).get("tenants") or {}).get(tenant_id) or {}
            entries.append({
                "id": str(backup.id),
                "filename": backup.filename,
                "backup_type": backup.backup_type.value if isinstance(backup.backup_type, BackupType) else backup.backup_type,
                "created_at": backup.created_at,
                "users": summary.get("users", 0),
                "documents": sum((summary.get("mongo") or {}).values()),
                "files": summary.get("files", 0),
            })
        return entries

    async def resolve_download(self, backup_id: str, tenant_id: str):
        backup = await self._owner._load_backup_by_id(backup_id)
        tenant_dir = self._tenant_backup_dir(self._owner.backup_root / backup.filename / CONSTANTS.BACKUP_TENANTS_DIR, tenant_id)
        if not (tenant_dir / CONSTANTS.BACKUP_TENANT_MONGO_DIR).is_dir():
            raise HTTPException(status_code=404, detail="Tenant not found in this backup")
        manifest = self._owner.read_manifest(self._owner.backup_root / backup.filename) or {}
        recorded = ((manifest.get("tenants") or {}).get("tenants") or {})
        tenants = []
        for directory in [tenant_dir, *self._child_tenant_dirs(tenant_dir)]:
            document = await asyncio.to_thread(
                self._read_first_document,
                directory / CONSTANTS.BACKUP_TENANT_MONGO_DIR / f"{CONSTANTS.BACKUP_TENANT_COLLECTION}.ndjson",
            ) or {}
            tenants.append({
                "tenant_id": directory.name,
                "slug": document.get("slug") or "",
                "parent_tenant_id": document.get(CONSTANTS.BACKUP_TENANT_PARENT_FIELD) or "",
                **(recorded.get(directory.name) or {}),
            })
        report = BackupReport.render_export({
            "backup": backup.filename,
            "created_at": manifest.get("created_at"),
            "exported_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "tenants": tenants,
        })
        return tenant_dir, f"{backup.filename}_{tenant_id}", report

    async def _latest_tenant_backup(self, tenant_id: str, owner_tenant_id: str | None = None) -> dict:
        backups = await self.list_backups_for_tenant(tenant_id)
        if not backups:
            raise HTTPException(status_code=404, detail="No backup contains this tenant yet")
        tenant_dir = self._tenant_backup_dir(self._owner.backup_root / backups[0]["filename"] / CONSTANTS.BACKUP_TENANTS_DIR, tenant_id)
        document = await asyncio.to_thread(
            self._read_first_document,
            tenant_dir / CONSTANTS.BACKUP_TENANT_MONGO_DIR / f"{CONSTANTS.BACKUP_TENANT_COLLECTION}.ndjson",
        ) or {}
        if owner_tenant_id is not None:
            await self._ensure_import_allowed(owner_tenant_id, tenant_id, document)
        elif await self._is_secondary_tenant(tenant_id, document):
            raise HTTPException(status_code=403, detail="Secondary tenants are exported through their primary tenant")
        return backups[0]

    async def resolve_latest_tenant_download(self, tenant_id: str, owner_tenant_id: str | None = None):
        backup = await self._latest_tenant_backup(tenant_id, owner_tenant_id)
        return await self.resolve_download(backup["id"], tenant_id)

    async def latest_tenant_export_info(self, tenant_id: str, owner_tenant_id: str | None = None) -> dict:
        backup = await self._latest_tenant_backup(tenant_id, owner_tenant_id)
        return {"backup_id": backup["id"], "filename": backup["filename"], "created_at": backup["created_at"]}

    async def list_backup_tenants(self, backup_id: str):
        backup = await self._owner._load_backup_by_id(backup_id)
        tenants_dir = self._owner.backup_root / backup.filename / CONSTANTS.BACKUP_TENANTS_DIR
        if not tenants_dir.is_dir():
            return []
        manifest = self._owner.read_manifest(self._owner.backup_root / backup.filename) or {}
        recorded = ((manifest.get("tenants") or {}).get("tenants") or {})
        entries = []
        for parent_dir in sorted(tenants_dir.iterdir()):
            if not parent_dir.is_dir():
                continue
            for tenant_dir in [parent_dir, *self._child_tenant_dirs(parent_dir)]:
                summary = recorded.get(tenant_dir.name) or {}
                document = await asyncio.to_thread(
                    self._read_first_document,
                    tenant_dir / CONSTANTS.BACKUP_TENANT_MONGO_DIR / f"{CONSTANTS.BACKUP_TENANT_COLLECTION}.ndjson",
                )
                entries.append({
                    "tenant_id": tenant_dir.name,
                    "name": (document or {}).get("name", ""),
                    "slug": (document or {}).get("slug", ""),
                    "users": summary.get("users", 0),
                    "documents": sum((summary.get("mongo") or {}).values()),
                    "files": summary.get("files", 0),
                })
        return entries

    async def restore_tenant_by_id(self, backup_id: str, tenant_id: str):
        backup = await self._owner._load_backup_by_id(backup_id)
        return await self.restore_tenant(backup.filename, tenant_id, source="ui")

    async def restore_tenant(self, filename: str, tenant_id: str, source: str = "cli"):
        backup_dir = self._owner.backup_root / filename
        tenant_dir = self._tenant_backup_dir(backup_dir / CONSTANTS.BACKUP_TENANTS_DIR, tenant_id)
        log.g().i(f"TENANT RESTORE STARTED: backup={filename} tenant={tenant_id} source={source}")

        if not tenant_dir.is_dir() or not (tenant_dir / CONSTANTS.BACKUP_TENANT_MONGO_DIR).is_dir():
            log.g().e(f"TENANT RESTORE FAILED: {tenant_id} is not present in {filename}")
            raise HTTPException(status_code=404, detail="Tenant not found in this backup")

        manifest = self._owner.read_manifest(backup_dir)
        if manifest is not None and not manifest.get("completed"):
            log.g().e(f"TENANT RESTORE FAILED: {filename} is an incomplete backup")
            raise HTTPException(status_code=422, detail="Backup is incomplete and cannot be restored")

        database = self._owner._engine.database
        scope = await self._tenant_restore_scope(database, tenant_id, tenant_dir)
        if scope.object_id is None:
            raise HTTPException(status_code=422, detail="Tenant identifier in the backup is not a valid object id")

        owned = self._owner._partition_registry.tenant_owned(await database.list_collection_names())
        targets = [(tenant_dir, scope)]
        live_tenants = await self._tenant_parents(database)
        for child_dir in self._child_tenant_dirs(tenant_dir):
            if not ObjectId.is_valid(child_dir.name):
                raise HTTPException(status_code=422, detail="Tenant identifier in the backup is not a valid object id")
            if child_dir.name not in live_tenants:
                log.g().w(f"TENANT RESTORE: skipped {child_dir.name}, it was deleted after the backup and is not resurrected")
                continue
            child_document = await asyncio.to_thread(
                self._read_first_document,
                child_dir / CONSTANTS.BACKUP_TENANT_MONGO_DIR / f"{CONSTANTS.BACKUP_TENANT_COLLECTION}.ndjson",
            ) or {}
            await self._ensure_import_allowed(tenant_id, child_dir.name, child_document)
            targets.append((child_dir, await self._tenant_restore_scope(database, child_dir.name, child_dir)))
        rollback_name = f"{CONSTANTS.RESTORE_TENANT_ROLLBACK_PREFIX}{tenant_id}_{datetime.now(timezone.utc).strftime('%Y_%m_%d_%H_%M_%S')}"
        rollback_dir = self._owner.backup_root / rollback_name
        fenced_ids = [target_scope.tenant_id for _, target_scope in targets]
        maintenance_state.get_instance().fence_tenants(fenced_ids)
        await self._quiesce_tenant_writers(targets)
        try:
            await self._owner._set_progress(10, "Creating tenant rollback point")
            for _, target_scope in targets:
                await self._export_tenant(rollback_dir / CONSTANTS.BACKUP_TENANTS_DIR / target_scope.tenant_id, target_scope, owned)
            log.g().i(f"TENANT RESTORE: rollback point created: {rollback_name}")
        except Exception as exc:
            maintenance_state.get_instance().release_tenants(fenced_ids)
            await self._owner._remove_tree(rollback_dir)
            log.g().e(f"TENANT RESTORE FAILED: could not create rollback point: {exc}")
            raise HTTPException(status_code=500, detail=f"Tenant restore aborted, could not create rollback point: {exc}") from exc

        await asyncio.to_thread(
            self._owner._io.write_json_file,
            self.tenant_restore_marker,
            {
                "backup": filename,
                "tenant": tenant_id,
                "rollback": rollback_name,
                "source": source,
                "started_at": datetime.now(timezone.utc),
            },
        )
        try:
            await self._owner._set_progress(45, "Restoring tenant data")
            report = await self._run_tenant_restore_engine(tenant_dir, scope)
            for child_dir, child_scope in targets[1:]:
                await self._run_tenant_restore_engine(child_dir, child_scope)
            await self._owner._set_progress(90, "Validating tenant restore")
            for _, target_scope in targets:
                valid, details = await self._validate_tenant_restore(target_scope)
                if not valid:
                    raise RuntimeError(f"validation failed: {details}")
            log.g().i(f"TENANT RESTORE: validation passed for {tenant_id}")
        except Exception as exc:
            log.g().e(f"TENANT RESTORE FAILED: {exc}. Rolling back tenant {tenant_id} from {rollback_name}")
            try:
                for _, target_scope in targets:
                    await self._run_tenant_restore_engine(rollback_dir / CONSTANTS.BACKUP_TENANTS_DIR / target_scope.tenant_id, target_scope)
                    valid, details = await self._validate_tenant_restore(target_scope)
                    if not valid:
                        raise RuntimeError(f"rollback validation failed: {details}")
                log.g().i(f"TENANT RESTORE: rollback succeeded, tenant {tenant_id} restored from {rollback_name}")
            except Exception as rollback_exc:
                log.g().c(
                    f"TENANT RESTORE CRITICAL: rollback FAILED after tenant restore failure. "
                    f"backup={filename} tenant={tenant_id} rollback={rollback_name} "
                    f"restore_error={exc} rollback_error={rollback_exc}"
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Tenant restore failed and rollback failed. Manual intervention required: {rollback_exc}",
                ) from rollback_exc

            self.tenant_restore_marker.unlink(missing_ok=True)
            maintenance_state.get_instance().release_tenants(fenced_ids)
            await self._owner._remove_tree(rollback_dir)
            for _, target_scope in targets:
                await self._owner._refresh_caches(target_scope.tenant_id)
            raise HTTPException(status_code=500, detail=f"Tenant restore failed and was rolled back: {exc}") from exc

        self.tenant_restore_marker.unlink(missing_ok=True)
        maintenance_state.get_instance().release_tenants(fenced_ids)
        await self._owner._remove_tree(rollback_dir)
        for _, target_scope in targets:
            await self._owner._refresh_caches(target_scope.tenant_id)
        sub_tenants = [target_scope.tenant_id for _, target_scope in targets[1:]]
        log.g().i(f"TENANT RESTORE SUCCESS: backup={filename} tenant={tenant_id} sub_tenants={sub_tenants} {report}")
        return {"status": "restored", "filename": filename, "tenant_id": tenant_id, "sub_tenants": sub_tenants, **report}

    async def _quiesce_tenant_writers(self, targets) -> None:
        try:
            from orion.api.interactive.extension_manager.extension_socket_manager import extension_socket_manager
            socket_manager = extension_socket_manager.get_instance()
            open_sockets = getattr(socket_manager, "_sockets", {})
            for _, target_scope in targets:
                for user_id in target_scope.user_ids:
                    if user_id in open_sockets:
                        await socket_manager.reset_sockets(user_id)
        except Exception as exc:
            log.g().w(f"TENANT RESTORE: could not close extension sockets: {exc}")
        await asyncio.sleep(CONSTANTS.RESTORE_QUIESCE_DRAIN_SECONDS)

    async def resolve_interrupted_tenant_restore(self) -> bool:
        marker = self._owner._io.read_json_file(self.tenant_restore_marker)
        if not marker:
            maintenance_state.get_instance().release_all_tenants()
            return False
        job = await self._owner._job_store.read()
        if job.get("status") == BackupJobStatus.RUNNING.value and job.get("operation") == "restore":
            log.g().w("TENANT RESTORE: a restore is still running in another worker, leaving its marker alone")
            return False
        tenant_id = str(marker.get("tenant") or "")
        rollback_name = str(marker.get("rollback") or "")
        backup_name = str(marker.get("backup") or "")
        log.g().c(
            f"TENANT RESTORE CRITICAL: an interrupted tenant restore was detected on startup. "
            f"backup={backup_name} tenant={tenant_id} rollback={rollback_name}. "
            f"Only that tenant is affected and the rest of the platform is untouched. Rolling it back automatically."
        )
        rollback_dir = self._owner.backup_root / rollback_name
        if not rollback_dir.is_dir():
            log.g().c(
                f"TENANT RESTORE CRITICAL: the rollback snapshot {rollback_name} for tenant {tenant_id} no longer exists, nothing can be rolled back. "
                f"Check the tenant and restore it from a backup if needed."
            )
            self.tenant_restore_marker.unlink(missing_ok=True)
            await self._owner._job_store.finish(
                BackupJobStatus.FAILED,
                f"Tenant restore was interrupted for {tenant_id} and its rollback snapshot is missing. Verify the tenant and restore it from a backup if needed.",
                backup_name,
            )
            return True
        snapshot_ids = [snapshot.name for snapshot in self._rollback_snapshots(rollback_dir)]
        maintenance_state.get_instance().fence_tenants(snapshot_ids)
        try:
            restored = await self._restore_from_rollback(rollback_dir)
        except Exception as exc:
            log.g().c(
                f"TENANT RESTORE CRITICAL: automatic rollback FAILED for tenant {tenant_id} from {rollback_name}: {exc}. "
                f"The rollback snapshot is kept in the backups folder for manual recovery."
            )
            await self._owner._job_store.finish(
                BackupJobStatus.FAILED,
                f"Tenant restore was interrupted for {tenant_id} and the automatic rollback failed. Manual recovery required.",
                backup_name,
            )
            return True
        self.tenant_restore_marker.unlink(missing_ok=True)
        maintenance_state.get_instance().release_tenants(snapshot_ids)
        await self._owner._remove_tree(rollback_dir)
        for restored_id in restored:
            await self._owner._refresh_caches(restored_id)
        log.g().i(f"TENANT RESTORE: interrupted restore of {tenant_id} was rolled back automatically from {rollback_name} ({restored})")
        await self._owner._job_store.finish(
            BackupJobStatus.FAILED,
            f"Tenant restore was interrupted for {tenant_id} and was rolled back automatically.",
            backup_name,
        )
        return True

    @classmethod
    def _rollback_snapshots(cls, rollback_dir: Path) -> list[Path]:
        tenants_dir = rollback_dir / CONSTANTS.BACKUP_TENANTS_DIR
        if not tenants_dir.is_dir():
            return []
        return [snapshot for snapshot in sorted(tenants_dir.iterdir()) if cls._is_tenant_dir(snapshot)]

    async def _restore_from_rollback(self, rollback_dir: Path) -> list[str]:
        if not (rollback_dir / CONSTANTS.BACKUP_TENANTS_DIR).is_dir():
            raise RuntimeError(f"rollback snapshot {rollback_dir.name} is missing")
        database = self._owner._engine.database
        restored = []
        for snapshot in self._rollback_snapshots(rollback_dir):
            scope = await self._tenant_restore_scope(database, snapshot.name, snapshot)
            await self._run_tenant_restore_engine(snapshot, scope)
            valid, details = await self._validate_tenant_restore(scope)
            if not valid:
                raise RuntimeError(f"rollback validation failed for {snapshot.name}: {details}")
            restored.append(snapshot.name)
        if not restored:
            raise RuntimeError(f"rollback snapshot {rollback_dir.name} has no tenant data")
        return restored

    async def _collect_ids(self, database, collection_name: str, query: dict) -> list[str]:
        ids = []
        cursor = database[collection_name].find(query, {"_id": 1}, batch_size=CONSTANTS.BACKUP_BATCH_SIZE)
        async for document in cursor:
            identifier = document.get("_id")
            if identifier is not None:
                ids.append(str(identifier))
        return ids

    @staticmethod
    def _is_tenant_dir(path: Path) -> bool:
        return (path / CONSTANTS.BACKUP_TENANT_MONGO_DIR).is_dir()

    @classmethod
    def _child_tenant_dirs(cls, tenant_dir: Path) -> list[Path]:
        children_dir = tenant_dir / CONSTANTS.BACKUP_TENANTS_DIR
        if not children_dir.is_dir():
            return []
        return [child for child in sorted(children_dir.iterdir()) if cls._is_tenant_dir(child)]

    @classmethod
    def _tenant_backup_dir(cls, tenants_dir: Path, tenant_id: str) -> Path:
        direct = tenants_dir / tenant_id
        if cls._is_tenant_dir(direct) or not tenants_dir.is_dir():
            return direct
        for parent_dir in sorted(tenants_dir.iterdir()):
            if not parent_dir.is_dir():
                continue
            nested = parent_dir / CONSTANTS.BACKUP_TENANTS_DIR / tenant_id
            if cls._is_tenant_dir(nested):
                return nested
        return direct

    async def _tenant_parents(self, database) -> dict:
        parents = {}
        cursor = database[CONSTANTS.BACKUP_TENANT_COLLECTION].find(
            {},
            {"_id": 1, CONSTANTS.BACKUP_TENANT_PARENT_FIELD: 1},
            batch_size=CONSTANTS.BACKUP_BATCH_SIZE,
        )
        async for document in cursor:
            parents[str(document.get("_id"))] = str(document.get(CONSTANTS.BACKUP_TENANT_PARENT_FIELD) or "")
        return parents

    async def _tenant_scope(self, database, tenant_id: str) -> TenantScope:
        user_ids = await self._collect_ids(
            database,
            CONSTANTS.BACKUP_TENANT_USER_COLLECTION,
            {CONSTANTS.BACKUP_TENANT_USER_FIELD: tenant_id},
        )
        return TenantScope(tenant_id=tenant_id, user_ids=user_ids)

    async def backup_tenants(self, output_dir: Path) -> dict:
        try:
            return await self._export_tenants(output_dir)
        except Exception as exc:
            log.g().e(f"BACKUP: per-tenant export failed, the global backup is unaffected: {exc}")
            return {"error": str(exc)}

    async def _export_tenants(self, output_dir: Path) -> dict:
        database = self._owner._engine.database
        collections = await database.list_collection_names()
        registry = self._owner._partition_registry
        owned = registry.tenant_owned(collections)
        tenant_ids = await self._collect_ids(database, CONSTANTS.BACKUP_TENANT_COLLECTION, {})

        parents = await self._tenant_parents(database)

        exported = {"layout": registry.describe(collections), "tenants": {}}
        for tenant_id in tenant_ids:
            scope = await self._tenant_scope(database, tenant_id)
            parent_id = parents.get(tenant_id) or ""
            base_dir = output_dir / parent_id / CONSTANTS.BACKUP_TENANTS_DIR if parent_id in parents else output_dir
            exported["tenants"][tenant_id] = await self._export_tenant(base_dir / tenant_id, scope, owned, exported["layout"])
        return exported

    async def _export_tenant(self, tenant_dir: Path, scope: TenantScope, owned: dict, layout: dict | None = None) -> dict:
        database = self._owner._engine.database
        counts = {}
        for collection_name, rule in owned.items():
            query = TenantPartitionRegistry.tenant_query(rule, scope)
            if query is None:
                continue
            counts[collection_name] = await self._owner._io.dump_collection(
                database,
                collection_name,
                tenant_dir / CONSTANTS.BACKUP_TENANT_MONGO_DIR / f"{collection_name}.ndjson",
                query,
            )
        elastic_counts = await self._backup_tenant_elastic(tenant_dir / CONSTANTS.BACKUP_TENANT_ELASTIC_DIR, scope.tenant_id)
        file_count = await asyncio.to_thread(
            self._backup_tenant_files, tenant_dir / CONSTANTS.BACKUP_TENANT_FILES_DIR, scope
        )
        log.g().i(
            f"BACKUP: tenant {scope.tenant_id} exported "
            f"({sum(counts.values())} documents, {file_count} files, {len(scope.user_ids)} users)"
        )
        summary = {
            "mongo": counts,
            "elastic": elastic_counts,
            "files": file_count,
            "users": len(scope.user_ids),
        }
        await asyncio.to_thread(
            BackupReport.write,
            tenant_dir / REPORT_NAME,
            {"tenant_id": scope.tenant_id, "mongo": counts, "elastic": elastic_counts,
             "tenants": {"layout": layout or {}, "tenants": {scope.tenant_id: summary}}},
        )
        return summary

    async def _backup_tenant_elastic(self, output_dir: Path, tenant_id: str) -> dict:
        conn = elastic_controller.get_instance().get_connection()
        if conn is None:
            return {}
        counts = {}
        for index_name in CONSTANTS.BACKUP_TENANT_ELASTIC_INDICES:
            if self._owner._io.is_excluded_index(index_name) or not await conn.indices.exists(index=index_name):
                continue
            output_dir.mkdir(parents=True, exist_ok=True)
            path = output_dir / f"{index_name}.ndjson"
            written = 0
            with path.open("w", encoding="utf-8") as file:
                response = await conn.search(
                    index=index_name,
                    body={"query": {"term": {CONSTANTS.BACKUP_TENANT_ELASTIC_FIELD: tenant_id}}},
                    scroll="10m",
                    size=500,
                )
                scroll_id = response.get("_scroll_id")
                hits = response.get("hits", {}).get("hits", [])
                while hits:
                    await asyncio.to_thread(self._owner._io.write_hits, file, hits)
                    written += len(hits)
                    response = await conn.scroll(scroll_id=scroll_id, scroll="10m")
                    scroll_id = response.get("_scroll_id")
                    hits = response.get("hits", {}).get("hits", [])
                if scroll_id:
                    await conn.clear_scroll(scroll_id=scroll_id)
            counts[index_name] = written
        return counts

    def _backup_tenant_files(self, output_dir: Path, scope: TenantScope) -> int:
        copied = 0
        for source, destination in self._tenant_file_pairs(scope, output_dir):
            if not source.exists():
                continue
            destination.parent.mkdir(parents=True, exist_ok=True)
            if source.is_dir():
                shutil.copytree(source, destination, dirs_exist_ok=True)
                copied += sum(1 for entry in destination.rglob("*") if entry.is_file())
            else:
                shutil.copy2(source, destination)
                copied += 1
        return copied

    @staticmethod
    def _tenant_file_pairs(scope: TenantScope, output_dir: Path):
        resource_root = CONSTANTS.BASE_DIR / "workspace" / "resource"
        pairs = [
            (resource_root / "system" / scope.tenant_id, output_dir / "system" / scope.tenant_id),
            (CONSTANTS.IMAGE_DIR / f"{scope.tenant_id}.png", output_dir / "tenant" / f"{scope.tenant_id}.png"),
        ]
        for user_id in scope.user_ids:
            pairs.append((CONSTANTS.S_SESSION_RESOURCE_DIR / user_id, output_dir / "session_data" / user_id))
            pairs.append((resource_root / "profile" / f"{user_id}.png", output_dir / "profile" / f"{user_id}.png"))
        return pairs

    @staticmethod
    def _read_first_document(path: Path):
        if not path.is_file():
            return None
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if line:
                    return json_util.loads(line)
        return None

    @staticmethod
    def _file_ids(path: Path, tenant_id: str) -> list[str]:
        if not path.is_file():
            return []
        ids = []
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                document = json_util.loads(line)
                identifier = document.get("_id")
                if identifier is None or not ObjectId.is_valid(str(identifier)):
                    continue
                if str(document.get(CONSTANTS.BACKUP_TENANT_USER_FIELD) or "") == tenant_id:
                    ids.append(str(identifier))
        return ids

    async def _tenant_restore_scope(self, database, tenant_id: str, tenant_dir: Path) -> TenantScope:
        live = await self._tenant_scope(database, tenant_id)
        stored = await asyncio.to_thread(
            self._file_ids,
            tenant_dir / CONSTANTS.BACKUP_TENANT_MONGO_DIR / f"{CONSTANTS.BACKUP_TENANT_USER_COLLECTION}.ndjson",
            tenant_id,
        )
        foreign = await self._collect_ids(
            database,
            CONSTANTS.BACKUP_TENANT_USER_COLLECTION,
            {"_id": {"$in": [ObjectId(user_id) for user_id in stored]}, CONSTANTS.BACKUP_TENANT_USER_FIELD: {"$ne": tenant_id}},
        )
        merged = [user_id for user_id in dict.fromkeys([*live.user_ids, *stored]) if user_id not in foreign]
        return TenantScope(tenant_id=tenant_id, user_ids=merged)

    async def _run_tenant_restore_engine(self, tenant_dir: Path, scope: TenantScope) -> dict:
        mongo = await self._restore_tenant_mongo(tenant_dir / CONSTANTS.BACKUP_TENANT_MONGO_DIR, scope)
        elastic = await self._restore_tenant_elastic(tenant_dir / CONSTANTS.BACKUP_TENANT_ELASTIC_DIR, scope.tenant_id)
        files = await asyncio.to_thread(
            self._restore_tenant_files, tenant_dir / CONSTANTS.BACKUP_TENANT_FILES_DIR, scope
        )
        return {"mongo": mongo, "elastic": elastic, "files": files}

    async def _restore_tenant_mongo(self, source_dir: Path, scope: TenantScope) -> dict:
        if not source_dir.is_dir():
            return {}
        database = self._owner._engine.database
        registry = self._owner._partition_registry
        restored = {}

        for collection_name, file in self._owner._io.collect_sources(source_dir).items():
            rule = registry.rule_for(collection_name)
            if not rule.is_tenant_owned:
                log.g().w(f"TENANT RESTORE: skipped {collection_name}, it is not owned by a tenant in the current layout")
                continue
            query = TenantPartitionRegistry.tenant_query(rule, scope)
            if query is None:
                log.g().w(f"TENANT RESTORE: skipped {collection_name}, no safe tenant filter could be built")
                continue

            live_sessions = {}
            if collection_name == CONSTANTS.BACKUP_TENANT_USER_COLLECTION:
                async for document in database[collection_name].find(query, {"current_session_id": 1}):
                    live_sessions[document["_id"]] = document.get("current_session_id")
            live_tenant = await database[collection_name].find_one(query) if collection_name == CONSTANTS.BACKUP_TENANT_COLLECTION else None

            removed = await database[collection_name].delete_many(query)
            written = 0
            skipped = 0
            async for batch in self._owner._io.read_documents(file):
                owned_batch = [document for document in batch if self._in_scope(rule, scope, document)]
                inserted, conflicts = await self._insert_tenant_batch(database, collection_name, owned_batch)
                written += inserted
                skipped += conflicts + len(batch) - len(owned_batch)
            for user_id, session_id in live_sessions.items():
                await database[collection_name].update_one({"_id": user_id}, {"$set": {"current_session_id": session_id}})
            if collection_name == CONSTANTS.BACKUP_TENANT_COLLECTION:
                if live_tenant:
                    pinned = {field: live_tenant[field] for field in CONSTANTS.BACKUP_TENANT_ADMIN_FIELDS if field in live_tenant}
                else:
                    restored_tenant = await database[collection_name].find_one(query) or {}
                    pinned = {"is_default": False, **({"is_primary": False} if restored_tenant.get(CONSTANTS.BACKUP_TENANT_PARENT_FIELD) else {})}
                await database[collection_name].update_one(query, {"$set": pinned})
            restored[collection_name] = {"removed": removed.deleted_count, "written": written, "skipped": skipped}
            if skipped:
                log.g().w(f"TENANT RESTORE: {skipped} documents in {collection_name} are owned by another tenant now and were left untouched")
        return restored

    @staticmethod
    def _in_scope(rule, scope: TenantScope, document: dict) -> bool:
        if rule.ownership == Ownership.DIRECT:
            if rule.as_object_id:
                return document.get("_id") == scope.object_id
            return str(document.get(rule.tenant_field) or "") == scope.tenant_id
        return str(document.get(rule.user_field) or "") in scope.user_ids

    async def _insert_tenant_batch(self, database, collection_name: str, batch: list) -> tuple:
        identifiers = [document.get("_id") for document in batch if document.get("_id") is not None]
        conflicts = set()
        if identifiers:
            cursor = database[collection_name].find({"_id": {"$in": identifiers}}, {"_id": 1})
            async for document in cursor:
                conflicts.add(document.get("_id"))
        payload = [document for document in batch if document.get("_id") not in conflicts]
        rejected = 0
        if payload:
            try:
                await database[collection_name].insert_many(payload, ordered=False)
            except BulkWriteError as exc:
                errors = [error for error in (exc.details or {}).get("writeErrors", []) if error.get("code") == 11000]
                if len(errors) != len((exc.details or {}).get("writeErrors", [])):
                    raise
                rejected = len(errors)
                for error in errors:
                    document = payload[error["index"]] if error.get("index", -1) < len(payload) else {}
                    log.g().w(f"TENANT RESTORE: {collection_name} document {document.get('_id')} ({document.get('username') or document.get('email') or ''}) clashes with a record of another tenant and was left out")
        return len(payload) - rejected, len(batch) - len(payload) + rejected

    async def _restore_tenant_elastic(self, source_dir: Path, tenant_id: str) -> dict:
        if not source_dir.is_dir():
            return {}
        conn = elastic_controller.get_instance().get_connection()
        if conn is None:
            return {}

        restored = {}
        for file in sorted(source_dir.glob("*.ndjson")):
            index_name = file.stem
            if self._owner._io.is_excluded_index(index_name):
                continue
            if index_name not in CONSTANTS.BACKUP_TENANT_ELASTIC_INDICES:
                log.g().w(f"TENANT RESTORE: skipped Elasticsearch index {index_name}, it is not tenant scoped")
                continue
            if not await conn.indices.exists(index=index_name):
                log.g().w(f"TENANT RESTORE: Elasticsearch index {index_name} does not exist, skipping")
                continue
            await conn.delete_by_query(
                index=index_name,
                body={"query": {"term": {CONSTANTS.BACKUP_TENANT_ELASTIC_FIELD: tenant_id}}},
                conflicts="proceed",
                refresh=True,
            )
            written = 0
            handle = await asyncio.to_thread(file.open, "r", encoding="utf-8")
            try:
                while True:
                    actions = await asyncio.to_thread(self._owner._io.read_hits, handle, index_name, CONSTANTS.BACKUP_BATCH_SIZE)
                    if not actions:
                        break
                    owned_actions = [
                        {**action, "_op_type": "create"}
                        for action in actions
                        if str((action.get("_source") or {}).get(CONSTANTS.BACKUP_TENANT_ELASTIC_FIELD) or "") == tenant_id
                    ]
                    if owned_actions:
                        inserted, _ = await es_helpers.async_bulk(conn, owned_actions, raise_on_error=False, stats_only=True)
                        written += inserted
                    if len(owned_actions) < len(actions):
                        log.g().w(f"TENANT RESTORE: {len(actions) - len(owned_actions)} documents in {index_name} belong to another tenant and were left untouched")
            finally:
                await asyncio.to_thread(handle.close)
            await conn.indices.refresh(index=index_name)
            restored[index_name] = written
        return restored

    def _restore_tenant_files(self, source_dir: Path, scope: TenantScope) -> int:
        if not source_dir.is_dir():
            return 0
        restored = 0
        for live_path, stored_path in self._tenant_file_pairs(scope, source_dir):
            if not stored_path.exists():
                continue
            live_path.parent.mkdir(parents=True, exist_ok=True)
            if stored_path.is_dir():
                shutil.rmtree(live_path, ignore_errors=True)
                shutil.copytree(stored_path, live_path, dirs_exist_ok=True)
                restored += sum(1 for entry in live_path.rglob("*") if entry.is_file())
            else:
                shutil.copy2(stored_path, live_path)
                restored += 1
        return restored

    async def _validate_tenant_restore(self, scope: TenantScope) -> tuple:
        try:
            found = await self._owner._engine.database[CONSTANTS.BACKUP_TENANT_COLLECTION].count_documents({"_id": scope.object_id})
        except Exception as exc:
            return False, f"MongoDB validation failed: {exc}"
        if not found:
            return False, f"tenant {scope.tenant_id} is missing after restore"
        tenant = await self._owner._engine.database[CONSTANTS.BACKUP_TENANT_COLLECTION].find_one({"_id": scope.object_id}, {"is_default": 1}) or {}
        owner_query = {"role": "admin"} if tenant.get("is_default") else {"licenses": "maintainer"}
        owners = await self._owner._engine.database[CONSTANTS.BACKUP_TENANT_USER_COLLECTION].count_documents({CONSTANTS.BACKUP_TENANT_USER_FIELD: scope.tenant_id, **owner_query})
        if not owners:
            return False, f"tenant {scope.tenant_id} would have no maintainer after restore"
        return True, "ok"
