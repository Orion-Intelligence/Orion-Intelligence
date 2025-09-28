# orion/services/encryption_manager/tenant_key_manager.py
from datetime import datetime, timezone
from cryptography.fernet import Fernet
from odmantic import AIOEngine

from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_tenant_key import db_tenant_key
from orion.services.encryption_manager.encryption_manager import encryption_manager

class TenantKeyManager:
    _instance = None

    @staticmethod
    def get_instance():
        if TenantKeyManager._instance is None:
            TenantKeyManager._instance = TenantKeyManager()
        return TenantKeyManager._instance

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

    async def get_or_create_dek(self, user_id: str) -> bytes:
        rec = await self._engine.find_one(db_tenant_key, db_tenant_key.userId == user_id)
        if rec:
            return self._unwrap(rec.wrapped_key)
        dek = self._new_dek()
        wrapped = self._wrap(dek)
        now = datetime.now(timezone.utc)
        await self._engine.save(db_tenant_key(userId=user_id, wrapped_key=wrapped, created_at=now, updated_at=now))
        return dek

    async def get_dek(self, user_id: str) -> bytes:
        rec = await self._engine.find_one(db_tenant_key, db_tenant_key.userId == user_id)
        if not rec:
            raise RuntimeError("Tenant key not found")
        return self._unwrap(rec.wrapped_key)
