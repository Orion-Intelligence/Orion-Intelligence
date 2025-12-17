# orion/services/audit/auditlog_manager.py
import threading
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from odmantic import AIOEngine
from odmantic.query import desc

from orion.api.interactive.auditlog_manager.models.audit_log_param_model import audit_log_param_model
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_audit_log import db_audit_log
from orion.services.mongo_manager.shared_model.db_auth_models import user_role


class AuditLogManager:
    __instance = None
    __lock = threading.Lock()

    @staticmethod
    def get_instance():
        if AuditLogManager.__instance is None:
            with AuditLogManager.__lock:
                if AuditLogManager.__instance is None:
                    AuditLogManager.__instance = AuditLogManager()
        return AuditLogManager.__instance

    def __init__(self):
        self._engine: AIOEngine = mongo_controller.get_instance().get_engine()
        if AuditLogManager.__instance is not None:
            raise Exception("This class is a singleton!")
        AuditLogManager.__instance = self

    async def register(self, actor_id: str, event: str) -> str:
        log = db_audit_log(actor_id=actor_id, event=event)
        await self._engine.save(log)
        return str(log.id)

    @staticmethod
    def _parse_iso(s: Optional[str]) -> Optional[datetime]:
        if not s: return None
        v = s.strip()
        if v.endswith("Z"): v = v[:-1] + "+00:00"
        dt = datetime.fromisoformat(v)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

    async def get(self, param: audit_log_param_model, current_user) -> Dict[str, Any]:
        page_size = 100
        page = max(1, param.page)
        skip = (page - 1) * page_size

        start = end = None
        if getattr(param, "daterange", None):
            parts = [p.strip() for p in param.daterange.split(",")]
            if len(parts) == 2:
                start, end = self._parse_iso(parts[0]), self._parse_iso(parts[1])
            elif len(parts) == 1:
                start = self._parse_iso(parts[0])

        filters: List[Any] = []
        if start and end:
            filters.append((db_audit_log.ts >= start) & (db_audit_log.ts <= end))
        elif start:
            filters.append(db_audit_log.ts >= start)
        elif end:
            filters.append(db_audit_log.ts <= end)

        if getattr(current_user, "role", None) == user_role.MEMBER:
            filters.append(db_audit_log.actor_id == str(current_user.id))

        query = filters[0] if filters else {}

        sort_by = desc(db_audit_log.ts)

        if not getattr(param, "daterange", None):
            items = await self._engine.find(db_audit_log, query, sort=sort_by, skip=0, limit=page_size)
        else:
            items = await self._engine.find(db_audit_log, query, sort=sort_by, skip=skip, limit=page_size)

        return {"items": [{**i.model_dump(), "id": str(i.id)} for i in items], "page": page}

