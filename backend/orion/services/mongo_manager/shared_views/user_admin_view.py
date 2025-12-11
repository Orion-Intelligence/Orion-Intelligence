from pathlib import Path
from typing import Optional, Any

from odmantic import ObjectId
from starlette_admin.exceptions import ActionFailed
from starlette_admin.contrib.odmantic import ModelView
from starlette.requests import Request

from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, LicenseName
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model
from orion.services.mongo_manager.shared_model.db_keys import db_keys


class UserAdminView(ModelView):
    def __init__(self, model, engine, **kwargs):
        super().__init__(model, **kwargs)
        self._engine = engine
        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
        self.IMAGE_DIR = self.BASE_DIR / "static" / "resource" / "company-profile-images"

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

            if isinstance(obj, db_user_account):
                await self._engine.remove(
                    db_keys,
                    db_keys.auth_id == str(obj.id),
                )

                image_path = self.IMAGE_DIR / f"{obj.id}.enc"
                if image_path.exists():
                    image_path.unlink()

        return await super().delete(request, pks)
