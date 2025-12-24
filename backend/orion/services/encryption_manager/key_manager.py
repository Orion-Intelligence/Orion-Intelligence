from datetime import datetime, timezone

from cryptography.fernet import Fernet
from odmantic import AIOEngine

from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from orion.services.encryption_manager.encryption_manager import encryption_manager
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model


class KeyManager:
    _instance = None

    @staticmethod
    def get_instance():
        if KeyManager._instance is None:
            KeyManager._instance = KeyManager()
        return KeyManager._instance

    def __init__(self):
        self._engine: AIOEngine = mongo_controller.get_instance().get_engine()
        mk = CONSTANTS.S_ENCRYPTION_KEY
        self._master = encryption_manager.create(mk)

    @staticmethod
    def _new_dek() -> bytes:
        return Fernet.generate_key()

    def _wrap(self, dek: bytes) -> str:
        return self._master.encrypt(dek.decode())

    def _unwrap(self, wrapped: str) -> bytes:
        return self._master.decrypt(wrapped).encode()

    async def get_or_create_dek(self, tenant_id: str) -> bytes:
        rec = await self._engine.find_one(db_keys, db_keys.auth_id == tenant_id)
        if rec:
            return self._unwrap(rec.wrapped_key)

        existing = await self._engine.find_one(
            db_tenant_model, db_tenant_model.id == str(tenant_id))
        if not existing:
            raise Exception("Tenant does not exist.")

        dek = self._new_dek()
        wrapped = self._wrap(dek)
        now = datetime.now(timezone.utc)
        await self._engine.save(db_keys(auth_id=tenant_id, wrapped_key=wrapped, created_at=now, updated_at=now))
        return dek

    async def create_dek(self, tenant_id: str) -> bytes:
        dek = self._new_dek()
        wrapped = self._wrap(dek)
        now = datetime.now(timezone.utc)
        await self._engine.save(db_keys(auth_id=tenant_id, wrapped_key=wrapped, created_at=now, updated_at=now))
        return dek

    async def create_user_dek(self, user_id: str) -> bytes:
        existing = await self._engine.find_one(
            db_keys, db_keys.auth_id == str(user_id))

        if existing:
            raise Exception("user key already exists.")

        dek = self._new_dek()
        wrapped = self._wrap(dek)
        now = datetime.now(timezone.utc)
        await self._engine.save(db_keys(auth_id=str(user_id), wrapped_key=wrapped, created_at=now, updated_at=now))
        return dek

    async def get_profile_dek(self, tenant_id: str) -> bytes:
        rec = await self._engine.find_one(db_keys, db_keys.auth_id == str(tenant_id))
        if not rec:
            await self._engine.remove(db_tenant_model, db_tenant_model.id == str(tenant_id))
            return b""
        return self._unwrap(rec.wrapped_key)

    async def get_user_dek(self, user_id: str) -> bytes:
        rec = await self._engine.find_one(
            db_keys, db_keys.auth_id == str(user_id))
        if not rec:
            raise RuntimeError("User key not found")
        return self._unwrap(rec.wrapped_key)
