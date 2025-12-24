from typing import Any, Optional

from bson import ObjectId
from starlette_admin.contrib.odmantic import ModelView
from starlette.requests import Request
from starlette_admin.exceptions import ActionFailed

from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model


class TenantKeyAdminView(ModelView):
    def __init__(self, model, engine, **kwargs):
        super().__init__(model, **kwargs)
        self._engine = engine

    async def delete(self, request: Request, pks: list[Any]) -> Optional[int]:
        keys = await self.find_by_pks(request, pks)

        for key in keys:
            tenant = await self._engine.find_one(
                db_tenant_model, db_tenant_model.id == ObjectId(key.auth_id))
            if tenant:
                raise ActionFailed("Cannot delete key as tenant exists.")

        return await super().delete(request, pks)
