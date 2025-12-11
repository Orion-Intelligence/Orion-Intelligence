from pathlib import Path

from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from typing import Any, Optional
from starlette_admin.contrib.odmantic import ModelView
from starlette.requests import Request


class TenantAdminView(ModelView):
    def __init__(self, model, engine, **kwargs):
        super().__init__(model, **kwargs)
        self._engine = engine
        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
        self.IMAGE_DIR = self.BASE_DIR / "static" / "resource" / "company-profile-images"

    async def delete(self, request: Request, pks: list[Any]) -> Optional[int]:
        tenants = await self.find_by_pks(request, pks)

        for tenant in tenants:
            users = await self._engine.find(
                db_user_account,
                db_user_account.company_uuid == str(tenant.id),
            )
            for user in users:
                await self._engine.remove(
                    db_keys,
                    db_keys.auth_id == str(user.id),
                )
                image_path = self.IMAGE_DIR / f"{user.id}.enc"
                if image_path.exists():
                    image_path.unlink()
                await self._engine.delete(user)

            tenant_keys = await self._engine.find(
                db_keys,
                db_keys.tenant_id == str(tenant.id),
            )
            for key in tenant_keys:
                await self._engine.delete(key)

        return await super().delete(request, pks)

