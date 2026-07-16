from __future__ import annotations

import json
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException

from orion.api.interactive.case_manager.case_config import CASE_STATUS_FLOW
from orion.api.server.config_manager.config_controller import config_controller
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model
from orion.api.interactive.case_manager.models.case_models import CaseStatusBoardConfig, CaseStatusBoardItem
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model

STATUS_BOARD_META_KEY = "CASE_STATUS_TRACKING_BOARD"

def default_status_board_config() -> CaseStatusBoardConfig:
    statuses = [
        CaseStatusBoardItem(
            value=getattr(status, "value", str(status)),
            label=getattr(status, "value", str(status)).replace("_", " ").replace("-", " ").title(),
            enabled=True,
            skippable=False,
            custom=False,
            order=index,
        )
        for index, status in enumerate(CASE_STATUS_FLOW)
    ]
    return CaseStatusBoardConfig(statuses=statuses)


def normalize_status_board_config(raw_config: Optional[dict | str]) -> CaseStatusBoardConfig:
    if not raw_config:
        return default_status_board_config()
    if isinstance(raw_config, str):
        try:
            raw_config = json.loads(raw_config)
        except json.JSONDecodeError:
            return default_status_board_config()
    try:
        config = CaseStatusBoardConfig.model_validate(raw_config)
    except ValueError:
        return default_status_board_config()

    built_ins = {getattr(status, "value", str(status)) for status in CASE_STATUS_FLOW}
    normalized = []
    for index, item in enumerate(config.statuses):
        normalized.append(
            CaseStatusBoardItem(
                value=item.value,
                label=item.label or (item.value).replace("_", " ").replace("-", " ").title(),
                enabled=item.enabled,
                skippable=item.skippable,
                custom=item.value not in built_ins,
                order=index,
            )
        )
    return CaseStatusBoardConfig(supportsOrdering=config.supportsOrdering, statuses=normalized)


class StatusBoardConfigManager:
    @staticmethod
    def _user_uses_tenant_config(current_user) -> bool:
        tenant_uuid = getattr(current_user, "tenant_uuid", None)
        return bool(tenant_uuid and str(tenant_uuid) not in {"", "-1", "None"})

    @classmethod
    async def get_effective_config(self, current_user) -> CaseStatusBoardConfig:
        if self._user_uses_tenant_config(current_user):
            tenant = await mongo_controller.get_instance().get_engine().find_one(db_tenant_model,db_tenant_model.id == ObjectId(str(current_user.tenant_uuid)))
            if tenant.is_default:
                return await self.get_system_config()        
        return normalize_status_board_config(getattr(tenant, "case_status_tracking_board", None))

    @staticmethod
    async def get_system_config() -> CaseStatusBoardConfig:
        raw_meta = await config_controller.getInstance().get_cached("meta_info", "")
        try:
            meta_info = json.loads(raw_meta) if raw_meta else {}
        except (TypeError, ValueError):
            meta_info = {}
        return normalize_status_board_config(meta_info.get(STATUS_BOARD_META_KEY))

    @staticmethod
    async def save_system_config(config: CaseStatusBoardConfig) -> CaseStatusBoardConfig:
        normalized = normalize_status_board_config(config.model_dump())
        engine = mongo_controller.get_instance().get_engine()
        record = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.META_INFO)
        meta_info = {}
        if record and record.value:
            try:
                meta_info = json.loads(record.value)
            except (TypeError, ValueError):
                meta_info = {}
        meta_info[STATUS_BOARD_META_KEY] = normalized.model_dump()
        if record:
            record.value = json.dumps(meta_info)
            await engine.save(record)
        else:
            await engine.save(db_system_model(key=AllowedKeys.META_INFO, value=json.dumps(meta_info)))
        await config_controller.getInstance().load_config(force_db=True)
        return normalized

    @staticmethod
    async def save_tenant_config(tenant_id: str, config: CaseStatusBoardConfig) -> CaseStatusBoardConfig:
        normalized = normalize_status_board_config(config.model_dump())
        engine = mongo_controller.get_instance().get_engine()
        tenant = await engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(str(tenant_id)))
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        tenant.case_status_tracking_board = normalized.model_dump()
        await engine.save(tenant)
        return normalized

    @staticmethod
    def active_status_values(config: CaseStatusBoardConfig) -> list[str]:
        return [status.value for status in config.statuses if status.enabled]
