from pathlib import Path
from typing import Optional, Any

from odmantic import ObjectId
from starlette_admin.exceptions import ActionFailed, FormValidationError
from starlette_admin.contrib.odmantic import ModelView
from starlette.requests import Request

from orion.services.mongo_manager.shared_model.db_auth_models import (db_user_account, LicenseName, user_role, )
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model
from orion.services.mongo_manager.shared_model.db_keys import db_keys


class UserAdminView(ModelView):
    def __init__(self, model, engine, **kwargs):
        super().__init__(model, **kwargs)
        self._engine = engine
        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
        self.IMAGE_DIR = self.BASE_DIR / "static" / "resource" / "tenant"

    async def before_edit(self, request: Request, data: dict, obj: Any):
        if obj.tenant_uuid and "tenant_uuid" in data and data["tenant_uuid"] != str(obj.tenant_uuid):
            raise FormValidationError({"tenant_uuid": "tenant_uuid cannot be changed"})

    async def delete(self, request: Request, pks: list[Any]) -> Optional[int]:
        objs = await self.find_by_pks(request, pks)

        for obj in objs:
            if obj.role == user_role.ADMIN:
                raise ActionFailed("Cannot delete admin user.")

            if obj.role == user_role.CRAWLER:
                other = await self._engine.find_one(
                    db_user_account, (db_user_account.role == user_role.CRAWLER) & (db_user_account.id != obj.id), )
                if other is None:
                    raise ActionFailed("Cannot delete the last crawler user.")

            if LicenseName.MAINTAINER in obj.licenses:
                tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(obj.tenant_uuid), )
                if tenant is not None:
                    raise ActionFailed("Cannot delete maintainer user while a tenant exists with the same tenant_uuid.")

            await self._engine.remove(db_keys, db_keys.auth_id == str(obj.id), )

            image_path = self.IMAGE_DIR / f"{obj.id}.enc"
            if image_path.exists():
                image_path.unlink()

        return await super().delete(request, pks)
