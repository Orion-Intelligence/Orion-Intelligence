from pathlib import Path
from typing import Any, Optional

from starlette.requests import Request
from starlette_admin.contrib.odmantic import ModelView
from starlette_admin.exceptions import ActionFailed, FormValidationError

from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model


class TenantAdminView(ModelView):
    def __init__(self, model, engine, **kwargs):
        super().__init__(model, **kwargs)
        self._engine = engine
        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
        self.IMAGE_DIR = self.BASE_DIR / "static" / "resource" / "tenant"

    async def before_create(self, request: Request, data: dict, obj: Any):
        if data.get("is_default") is True:
            existing = await self._engine.find_one(
                db_tenant_model, db_tenant_model.is_default == True)
            if existing:
                raise FormValidationError({"is_default": "Only one default tenant is allowed"})

    async def before_edit(self, request: Request, data: dict, obj: Any):
        current = await self._engine.find_one(db_tenant_model, db_tenant_model.id == obj.id)
        if not current:
            return

        if "is_default" in data and current.is_default:
            raise FormValidationError({"is_default": "Default tenant cannot be changed"})

        if data.get("is_default") is True:
            existing = await self._engine.find_one(
                db_tenant_model, (db_tenant_model.is_default == True) & (db_tenant_model.id != obj.id), )
            if existing:
                raise FormValidationError({"is_default": "Only one default tenant is allowed"})

    async def delete(self, request: Request, pks: list[Any]) -> Optional[int]:
        tenants = await self.find_by_pks(request, pks)

        for tenant in tenants:
            if getattr(tenant, "is_default", False):
                raise ActionFailed("Default tenant cannot be deleted")

            users = await self._engine.find(db_user_account)
            for user in users:
                if str(tenant.id) != str(user.tenant_uuid):
                    continue

                image_path = self.IMAGE_DIR / f"{user.id}.enc"
                if image_path.exists():
                    image_path.unlink()

                await self._engine.delete(user)

            tenant_keys = await self._engine.find(db_keys, db_keys.auth_id == str(tenant.id))
            for key in tenant_keys:
                await self._engine.delete(key)

        return await super().delete(request, pks)
