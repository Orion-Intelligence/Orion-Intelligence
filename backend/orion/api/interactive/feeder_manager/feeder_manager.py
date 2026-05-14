from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId
from fastapi import HTTPException, UploadFile
from odmantic.query import asc

from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.feeder_manager.feeder_helper import FeederHelper
from orion.api.interactive.feeder_manager.models.feeder_models import (
    FeederCatalogResponse,
    FeederOwnerTransferRequest,
    FeederOwnerUser,
    FeederRuleOption,
    FeederScriptListResponse,
    FeederScriptStatusUpdateRequest,
    FeederValueDeleteRequest,
    FeederUploadResponse,
)
from orion.constants import constant
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, db_user_account, user_role
from orion.services.mongo_manager.shared_model.db_feeder_script_model import osint_feeder


class FeederManager:
    __instance = None

    def __init__(self):
        engine = mongo_controller.get_instance().get_engine()
        static_root = Path(__file__).resolve().parent.parent.parent.parent.parent / "static" / ".well-known"
        parser_root = static_root / "parser_files"
        self._engine = engine
        self._helper = FeederHelper(engine, parser_root)
        if FeederManager.__instance is not None:
            raise Exception("This class is a singleton!")
        FeederManager.__instance = self

    @staticmethod
    def get_instance():
        if FeederManager.__instance is None:
            FeederManager()
        return FeederManager.__instance

    async def get_catalog(self, current_user) -> FeederCatalogResponse:
        records = await self._engine.find(self._helper.model, self._helper.script_query(current_user))
        return FeederCatalogResponse(
            rules=[
                FeederRuleOption(
                    key=rule_key,
                    rule_type=str(rule_value.get("rule_type") or ""),
                    path=rule_value.get("path"),
                    values=self._helper.current_rule_values(records, rule_key, str(rule_value.get("rule_type") or "")),
                )
                for rule_key, rule_value in sorted(constant.url_rules.items())
            ]
        )

    async def list_scripts(self, current_user, rule_key: str | None = None, page: int = 1, limit: int = 1000, entry_type: str | None = None) -> FeederScriptListResponse:
        safe_page = max(1, int(page or 1))
        safe_limit = max(1, min(int(limit or 1000), 1000))
        safe_entry_type = entry_type if entry_type in {"values", "scripts"} else "all"
        query = self._helper.script_query(current_user, rule_key)
        records = await self._engine.find(
            self._helper.model,
            query,
            sort=asc(self._helper.model.feeder.index_date),
        )
        filtered_records = self._helper.filter_records(records, safe_entry_type)
        total = len(filtered_records)
        skip = (safe_page - 1) * safe_limit
        page_records = filtered_records[skip:skip + safe_limit]
        scripts = []
        for record in page_records:
            scripts.append(await self._helper.to_script_item(record))
        return FeederScriptListResponse(
            scripts=scripts,
            total=total,
            page=safe_page,
            limit=safe_limit,
            has_more=(skip + len(scripts)) < total,
        )

    async def upload_script(self, rule_key: str, mode: str, file: UploadFile | None, values_text: str | None, session_file: UploadFile | None, current_user) -> FeederUploadResponse:
        rule = constant.url_rules.get(rule_key)
        if not rule:
            raise HTTPException(status_code=400, detail="Invalid rule")
        rule_type = str(rule.get("rule_type") or "")

        if mode == "values":
            if rule_type not in {"shared", "generic"}:
                raise HTTPException(status_code=400, detail="Only shared or generic rules support URL value uploads")
            if rule_type == "shared":
                shared_records = await self._engine.find(
                    self._helper.model,
                    self._helper.script_query(current_user, rule_key),
                )
                if not self._helper.filter_records(shared_records, "scripts"):
                    raise HTTPException(status_code=400, detail="Upload the parser file before adding values")
            urls = self._helper.normalize_value_lines(values_text or "")
            for url in urls:
                self._helper.validate_rule_value(url, rule)
            await self._helper.replace_rule_values(rule_key, urls, current_user)
            await AuditLogManager.get_instance().register(
                str(current_user.tenant_uuid),
                str(current_user.id),
                "feeder_rule_values_updated",
            )
            return FeederUploadResponse(message="Rule values updated successfully", script=None)

        if mode != "file":
            raise HTTPException(status_code=400, detail="Invalid upload mode")
        if rule_type == "generic":
            raise HTTPException(status_code=400, detail="Generic rules only support URL value uploads")
        if session_file and not file:
            records = await self._engine.find(
                self._helper.model,
                self._helper.script_query(current_user, rule_key),
            )
            scripts = self._helper.filter_records(records, "scripts")
            if not scripts:
                raise HTTPException(status_code=400, detail="Upload the parser file before adding session")
            content = await session_file.read()
            if not content:
                raise HTTPException(status_code=400, detail="Uploaded session file is empty")
            target_path = self._helper.resolve_record_file_path(scripts[0])
            target_dir = target_path.parent if target_path.is_file() else self._helper.resolve_target_dir(*self._helper.rule_path_parts(rule.get("path")))
            script_name = target_path.name if target_path.is_file() else scripts[0].name
            (target_dir / self._helper.sanitize_support_file_name(script_name, session_file.filename or "session")).write_bytes(content)
            return FeederUploadResponse(message="Session file uploaded successfully", script=await self._helper.to_script_item(scripts[0]))
        if not file or not file.filename or not file.filename.lower().endswith(".py"):
            raise HTTPException(status_code=400, detail="Only Python files are allowed")

        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        if len(content) > self._helper.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size must be 50 KB or less")

        try:
            decoded = content.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=400, detail="Python file must be UTF-8 text") from exc

        category_key, subcategory_key = self._helper.rule_path_parts(rule.get("path"))
        self._helper.validate_rule_config_rule_type(decoded, rule_key)

        seed_url: str | None = None
        if rule_type == "unique":
            seed_url = self._helper.extract_seed_url(decoded)

        script = await self._helper.process_upload(
            rule_key=rule_key,
            category_key=category_key,
            subcategory_key=subcategory_key,
            file_name=file.filename,
            content=decoded,
            current_user=current_user,
            url=seed_url if rule_type == "unique" else None,
            session_file_name=session_file.filename if session_file else None,
            session_content=await session_file.read() if session_file else None,
        )
        return FeederUploadResponse(
            message="Feeder script uploaded successfully",
            script=script,
        )

    async def delete_script(self, script_id: str, current_user):
        record = await self._helper.get_script_record(script_id, current_user)
        target_path = self._helper.resolve_record_file_path(record)
        if target_path.is_file():
            target_path.unlink()

        await self._engine.delete(record)
        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            "feeder_script_deleted",
        )
        return {"message": "Feeder script deleted successfully"}

    async def delete_value(self, script_id: str, data: FeederValueDeleteRequest, current_user):
        record = await self._helper.get_script_record(script_id, current_user)
        if not (record.values or []):
            raise HTTPException(status_code=400, detail="Only value entries support value deletion")

        value = (data.value or "").strip()
        if not value:
            raise HTTPException(status_code=400, detail="Value is required")

        existing_values = list(record.values or [])
        if value not in [str(candidate.get("url") or "") for candidate in existing_values]:
            raise HTTPException(status_code=404, detail="Value not found")

        record.values = [candidate for candidate in existing_values if str(candidate.get("url") or "") != value]
        if record.values:
            await self._engine.save(record)
        else:
            await self._engine.delete(record)

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            "feeder_rule_value_deleted",
        )
        return {"message": "Value deleted successfully"}

    async def clear_scripts(self, rule_key: str, current_user):
        if not rule_key:
            raise HTTPException(status_code=400, detail="Rule is required")

        records = await self._engine.find(self._helper.model, self._helper.script_query(current_user, rule_key))
        for record in records:
            target_path = self._helper.resolve_record_file_path(record)
            if target_path.is_file():
                target_path.unlink()
            await self._engine.delete(record)

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            "feeder_rule_cleared",
        )
        return {"message": "All feeder entries for the selected rule were deleted successfully"}

    async def set_rule_enabled(self, rule_key: str, enabled: bool, current_user):
        if not rule_key:
            raise HTTPException(status_code=400, detail="Rule is required")

        query = self._helper.script_query(current_user, rule_key)
        records = self._helper.filter_records(
            await self._engine.find(self._helper.model, query),
            "scripts",
        )
        for record in records:
            if not record.feeder:
                continue
            record.feeder.index_status = enabled
            await self._engine.save(record)

        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            "feeder_rule_status_changed",
        )
        return {"message": f"All feeder entries for the selected rule were {'enabled' if enabled else 'disabled'} successfully"}

    async def toggle_script_enabled(self, script_id: str, current_user):
        record = await self._helper.get_script_record(script_id, current_user)
        if not record.feeder:
            raise HTTPException(status_code=404, detail="Script not found")
        if record.entry_kind == "values":
            raise HTTPException(status_code=400, detail="Value entries cannot be disabled")

        record.feeder.index_status = not bool(record.feeder.index_status)
        await self._engine.save(record)
        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            "feeder_script_status_changed",
        )
        return {
            "message": f"Script {'enabled' if record.feeder.index_status else 'disabled'} successfully",
            "script": await self._helper.to_script_item(record),
        }

    async def list_owner_users(self):
        users = await self._engine.find(
            db_user_account,
            {
                "role": {"$ne": user_role.CRAWLER.value},
                "$or": [
                    {"role": user_role.ADMIN.value},
                    {"licenses": {"$elemMatch": {"$eq": LicenseName.FEEDER.value}}},
                ],
            },
        )
        return [
            FeederOwnerUser(
                id=str(user.id),
                username=user.username,
                email=user.email,
                role=user.role.value,
                status=user.status.value if user.status else None,
                licenses=list(user.licenses or []),
            )
            for user in users
        ]

    async def transfer_script_owner(self, script_id: str, data: FeederOwnerTransferRequest, current_user):
        record = await self._helper.get_script_record(script_id, current_user)
        try:
            user_id = ObjectId(data.user_id)
        except Exception as exc:
            raise HTTPException(status_code=404, detail="User not found") from exc

        user = await self._engine.find_one(db_user_account, db_user_account.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.role == user_role.CRAWLER or user.status != UserStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Invalid feeder user")
        if user.role != user_role.ADMIN and LicenseName.FEEDER not in (user.licenses or []):
            raise HTTPException(status_code=400, detail="Invalid feeder user")

        record.feeder.author_id = str(user.id)
        record.feeder.author_name = user.username
        await self._engine.save(record)
        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid),
            str(current_user.id),
            "feeder_script_owner_changed",
        )
        return {"message": "Script owner updated successfully", "script": await self._helper.to_script_item(record)}

    async def update_script_status_by_name(self, data: FeederScriptStatusUpdateRequest):
        lookup_name = (data.name or "").strip()
        lookup_url = (data.url or "").strip()
        candidate_names = [lookup_name]
        if lookup_name and not lookup_name.lower().endswith(".py"):
            candidate_names.append(f"{lookup_name}.py")

        record = await self._engine.find_one(
            self._helper.model,
            (self._helper.model.name == lookup_name) & (self._helper.model.url == lookup_url),
        )
        if not record and len(candidate_names) > 1:
            record = await self._engine.find_one(
                self._helper.model,
                (self._helper.model.name == candidate_names[1]) & (self._helper.model.url == lookup_url),
            )
        if not record:
            for candidate_name in candidate_names:
                candidate_record = await self._engine.find_one(
                    self._helper.model,
                    self._helper.model.name == candidate_name,
                )
                if not candidate_record:
                    continue
                rule = constant.url_rules.get(candidate_record.rule_key or "") or {}
                if str(rule.get("rule_type") or "") in {"unique", "generic"}:
                    record = candidate_record
                    break
        if not record and lookup_url:
            value_records = await self._engine.find(self._helper.model, self._helper.model.rule_key != None)
            for candidate_record in value_records:
                if lookup_url not in [str(value.get("url") or "") for value in (candidate_record.values or [])]:
                    continue
                rule = constant.url_rules.get(candidate_record.rule_key or "") or {}
                if str(rule.get("rule_type") or "") in {"shared", "generic"}:
                    record = candidate_record
                    break
        if not record:
            raise HTTPException(status_code=404, detail="Script not found")

        if not record.feeder:
            record.feeder = osint_feeder()

        related_script_record = None
        if record.entry_kind == "values" and record.rule_key:
            related_script_record = await self._engine.find_one(
                self._helper.model,
                (self._helper.model.rule_key == record.rule_key) & (self._helper.model.entry_kind == "script"),
            )
            if related_script_record and not related_script_record.feeder:
                related_script_record.feeder = osint_feeder()

        now = datetime.now(timezone.utc)
        status = data.status.strip().lower()
        message = (data.message or "").strip() or None

        if status == "failure":
            if lookup_url and (record.values or []):
                for value in (record.values or []):
                    if str(value.get("url") or "") != lookup_url:
                        continue
                    value["status"] = "failure"
                    value["last_checked_at"] = now
                    value["last_failure_date"] = now
                    value["last_error"] = message
                    value["last_failure_message"] = message
                    break
            record.feeder.last_failure_date = now
            record.feeder.last_failure_message = message
            if related_script_record:
                related_script_record.feeder.last_failure_date = now
                related_script_record.feeder.last_failure_message = message
        elif status == "success":
            if lookup_url and (record.values or []):
                for value in (record.values or []):
                    if str(value.get("url") or "") != lookup_url:
                        continue
                    value["status"] = "success"
                    value["last_checked_at"] = now
                    value["last_success_date"] = now
                    value["last_success_message"] = message
                    value["last_error"] = None
                    break
            record.feeder.last_success_date = now
            record.feeder.last_success_message = message
            if related_script_record:
                related_script_record.feeder.last_success_date = now
                related_script_record.feeder.last_success_message = message
        else:
            raise HTTPException(status_code=400, detail="Status must be success or failure")

        await self._engine.save(record)
        if related_script_record:
            await self._engine.save(related_script_record)
        return {"message": f"Feeder script marked as {status} successfully"}
