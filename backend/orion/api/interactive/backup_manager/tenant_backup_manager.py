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
from fastapi import HTTPException

from orion.api.interactive.backup_manager.backup_report import REPORT_NAME, BackupReport
from orion.api.interactive.backup_manager.models.tenant_partition_model import TenantScope
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
            log.g().i("TENANT RESTORE: request ignored, another backup or restore is already running")
            return await self._owner.job_status()
        self._owner._spawn(self._run_tenant_restore(backup_id, tenant_id))
        return await self._owner.job_status()

    async def _run_tenant_restore(self, backup_id: str, tenant_id: str) -> None:
        heartbeat = asyncio.create_task(self._owner._job_store.keep_alive())
        try:
            result = await self.restore_tenant_by_id(backup_id, tenant_id)
            await self._owner._job_store.finish(BackupJobStatus.DONE, "Tenant restored successfully", result.get("filename", ""))
        except Exception as exc:
            log.g().e(f"TENANT RESTORE FAILED: {exc}")
            await self._owner._job_store.finish(BackupJobStatus.FAILED, str(getattr(exc, "detail", exc)))
        finally:
            await self._owner._stop_heartbeat(heartbeat)

    async def start_tenant_import(self, upload, owner_tenant_id: str | None = None) -> dict:
        if self._owner.restore_marker.exists():
            raise HTTPException(status_code=409, detail="A previous restore was interrupted. Resolve it before running another restore.")
        if self.tenant_restore_marker.exists():
            raise HTTPException(status_code=409, detail="A previous tenant restore was interrupted. Resolve it before running another restore.")
        stage_name = f"{CONSTANTS.IMPORT_TENANT_STAGE_PREFIX}{datetime.now(timezone.utc).strftime('%Y_%m_%d_%H_%M_%S')}_{uuid.uuid4().hex[:8]}"
        stage_dir = self._owner.backup_root / stage_name
        try:
            tenant_id = await self._stage_tenant_import(upload, stage_dir)
            if owner_tenant_id is not None:
                await self._ensure_import_allowed(owner_tenant_id, tenant_id)
        except Exception:
            await self._owner._remove_tree(stage_dir)
            raise
        if not await self._owner._job_store.begin("restore", "Starting tenant import"):
            log.g().i("TENANT IMPORT: request ignored, another backup or restore is already running")
            await self._owner._remove_tree(stage_dir)
            return await self._owner.job_status()
        self._owner._spawn(self._run_tenant_import(stage_name, tenant_id))
        return await self._owner.job_status()

    async def _run_tenant_import(self, stage_name: str, tenant_id: str) -> None:
        heartbeat = asyncio.create_task(self._owner._job_store.keep_alive())
        try:
            result = await self.restore_tenant(stage_name, tenant_id, source="import")
            await self._owner._job_store.finish(BackupJobStatus.DONE, "Tenant imported successfully", result.get("filename", ""))
        except Exception as exc:
            log.g().e(f"TENANT IMPORT FAILED: {exc}")
            await self._owner._job_store.finish(BackupJobStatus.FAILED, str(getattr(exc, "detail", exc)))
        finally:
            await self._owner._remove_tree(self._owner.backup_root / stage_name)
            await self._owner._stop_heartbeat(heartbeat)

    async def _stage_tenant_import(self, upload, stage_dir: Path) -> str:
        unpacked = stage_dir / "unpacked"
        await asyncio.to_thread(unpacked.mkdir, parents=True, exist_ok=True)
        archive_path = stage_dir / "import.zip"
        await self._save_upload(upload, archive_path)
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
        return tenant_id

    async def _ensure_import_allowed(self, owner_tenant_id: str, tenant_id: str) -> None:
        if tenant_id == owner_tenant_id:
            return
        parents = await self._tenant_parents(self._owner._engine.database)
        if parents.get(tenant_id) == owner_tenant_id:
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
    def _extract_archive(archive_path: Path, destination: Path) -> None:
        root = destination.resolve()
        try:
            with zipfile.ZipFile(archive_path) as archive:
                for member in archive.infolist():
                    target = (destination / member.filename).resolve()
                    if target != root and root not in target.parents:
                        raise HTTPException(status_code=422, detail="Uploaded archive contains an invalid path")
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
        block = manifest.get("tenants") or {}
        summary = (block.get("tenants") or {}).get(tenant_id) or {}
        await asyncio.to_thread(
            BackupReport.write,
            tenant_dir / REPORT_NAME,
            {"tenant_id": tenant_id, "created_at": manifest.get("created_at"),
             "mongo": summary.get("mongo") or {}, "elastic": summary.get("elastic") or {},
             "tenants": {"layout": block.get("layout") or {}, "tenants": {tenant_id: summary}}},
        )
        return tenant_dir, f"{backup.filename}_{tenant_id}"

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
        for child_dir in self._child_tenant_dirs(tenant_dir):
            targets.append((child_dir, await self._tenant_restore_scope(database, child_dir.name, child_dir)))
        rollback_name = f"{CONSTANTS.RESTORE_TENANT_ROLLBACK_PREFIX}{tenant_id}_{datetime.now(timezone.utc).strftime('%Y_%m_%d_%H_%M_%S')}"
        rollback_dir = self._owner.backup_root / rollback_name
        try:
            await self._owner._set_progress(10, "Creating tenant rollback point")
            for _, target_scope in targets:
                await self._export_tenant(rollback_dir / CONSTANTS.BACKUP_TENANTS_DIR / target_scope.tenant_id, target_scope, owned)
            log.g().i(f"TENANT RESTORE: rollback point created: {rollback_name}")
        except Exception as exc:
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
            await self._owner._remove_tree(rollback_dir)
            for _, target_scope in targets:
                await self._owner._refresh_caches(target_scope.tenant_id)
            raise HTTPException(status_code=500, detail=f"Tenant restore failed and was rolled back: {exc}") from exc

        self.tenant_restore_marker.unlink(missing_ok=True)
        await self._owner._remove_tree(rollback_dir)
        for _, target_scope in targets:
            await self._owner._refresh_caches(target_scope.tenant_id)
        sub_tenants = [target_scope.tenant_id for _, target_scope in targets[1:]]
        log.g().i(f"TENANT RESTORE SUCCESS: backup={filename} tenant={tenant_id} sub_tenants={sub_tenants} {report}")
        return {"status": "restored", "filename": filename, "tenant_id": tenant_id, "sub_tenants": sub_tenants, **report}

    async def resolve_interrupted_tenant_restore(self) -> bool:
        marker = self._owner._io.read_json_file(self.tenant_restore_marker)
        if not marker:
            return False
        log.g().c(
            f"TENANT RESTORE CRITICAL: an interrupted tenant restore was detected on startup. "
            f"backup={marker.get('backup')} tenant={marker.get('tenant')} rollback={marker.get('rollback')}. "
            f"Only that tenant is affected and the rest of the platform is untouched. "
            f"Recover with: python restore_tenant.py {marker.get('rollback')} {marker.get('tenant')}"
        )
        await self._owner._job_store.finish(
            BackupJobStatus.FAILED,
            f"Tenant restore was interrupted for {marker.get('tenant')}. Manual recovery required.",
            str(marker.get("backup") or ""),
        )
        return True

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
    def _file_ids(path: Path) -> list[str]:
        if not path.is_file():
            return []
        ids = []
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                identifier = json_util.loads(line).get("_id")
                if identifier is not None:
                    ids.append(str(identifier))
        return ids

    async def _tenant_restore_scope(self, database, tenant_id: str, tenant_dir: Path) -> TenantScope:
        live = await self._tenant_scope(database, tenant_id)
        stored = await asyncio.to_thread(
            self._file_ids,
            tenant_dir / CONSTANTS.BACKUP_TENANT_MONGO_DIR / f"{CONSTANTS.BACKUP_TENANT_USER_COLLECTION}.ndjson",
        )
        merged = list(dict.fromkeys([*live.user_ids, *stored]))
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

            removed = await database[collection_name].delete_many(query)
            written = 0
            skipped = 0
            async for batch in self._owner._io.read_documents(file):
                inserted, conflicts = await self._insert_tenant_batch(database, collection_name, batch)
                written += inserted
                skipped += conflicts
            restored[collection_name] = {"removed": removed.deleted_count, "written": written, "skipped": skipped}
            if skipped:
                log.g().w(f"TENANT RESTORE: {skipped} documents in {collection_name} are owned by another tenant now and were left untouched")
        return restored

    async def _insert_tenant_batch(self, database, collection_name: str, batch: list) -> tuple:
        identifiers = [document.get("_id") for document in batch if document.get("_id") is not None]
        conflicts = set()
        if identifiers:
            cursor = database[collection_name].find({"_id": {"$in": identifiers}}, {"_id": 1})
            async for document in cursor:
                conflicts.add(document.get("_id"))
        payload = [document for document in batch if document.get("_id") not in conflicts]
        if payload:
            await database[collection_name].insert_many(payload, ordered=False)
        return len(payload), len(batch) - len(payload)

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
                    await es_helpers.async_bulk(conn, actions)
                    written += len(actions)
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
        return True, "ok"
