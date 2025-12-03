from typing import Optional, Any

from odmantic import ObjectId
from starlette_admin.exceptions import ActionFailed
from starlette_admin.contrib.odmantic import ModelView
from starlette.requests import Request

from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, LicenseName
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model


class UserAdminView(ModelView):
    def __init__(self, model, engine, **kwargs):
        super().__init__(model, **kwargs)
        self._engine = engine

    async def delete(self, request: Request, pks: list[Any]) -> Optional[int]:
        print("delete hook called", flush=True)
        objs = await self.find_by_pks(request, pks)

        for obj in objs:
            if isinstance(obj, db_user_account) and getattr(obj, "role", None) == "admin":
                raise ActionFailed("Cannot delete admin user.")
            if isinstance(obj, db_user_account) and LicenseName.MAINTAINER in obj.licenses:
                tenant = await self._engine.find_one(
                    db_tenant_model,
                    db_tenant_model.id == ObjectId(obj.company_uuid),
                )
                if tenant is not None:
                    raise ActionFailed(
                        "Cannot delete maintainer user while a tenant exists with the same company_uuid."
                    )

        return await super().delete(request, pks)
