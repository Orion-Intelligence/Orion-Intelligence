from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account
from orion.services.mongo_manager.shared_model.db_tenant_key import db_tenant_key
from typing import Any, Optional
from starlette_admin.contrib.odmantic import ModelView
from starlette.requests import Request


class TenantAdminView(ModelView):
    def __init__(self, model, engine, **kwargs):
        super().__init__(model, **kwargs)
        self._engine = engine

    async def delete(self, request: Request, pks: list[Any]) -> Optional[int]:

        tenants = await self.find_by_pks(request, pks)

        for tenant in tenants:
            users = await self._engine.find(
                db_user_account,
                db_user_account.company_uuid == str(tenant.id),
            )
            for user in users:
                await self._engine.delete(user)

            tenant_keys = await self._engine.find(
                db_tenant_key,
                db_tenant_key.tenant_id == str(tenant.id),
            )
            for key in tenant_keys:
                await self._engine.delete(key)

        return await super().delete(request, pks)
