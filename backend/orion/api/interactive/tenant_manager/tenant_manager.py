import re
import threading

from pathlib import Path
from typing import List

from orion.api.interactive.account_manager.models.user_model import user_model
from bson import ObjectId
from fastapi import HTTPException
from starlette import status
from cryptography.fernet import Fernet
from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from orion.services.mongo_manager.shared_model.db_tenant_model import IocCategory, db_tenant_model, TenantRequest, TenantStatus
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, db_user_account
from orion.services.encryption_manager.key_manager import KeyManager
from orion.constants.constant import CONSTANTS


class TenantManager:
  __instance = None
  __lock = threading.Lock()

  @staticmethod
  def get_instance():
    if TenantManager.__instance is None:
      with TenantManager.__lock:
        if TenantManager.__instance is None:
          TenantManager.__instance = TenantManager()
    return TenantManager.__instance

  def __init__(self):
    self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
    self.IMAGE_DIR = self.BASE_DIR / "static" / "resource" / "profile"
    self._engine = mongo_controller.get_instance().get_engine()

    if TenantManager.__instance is not None:
      raise Exception("This class is a singleton!")
    TenantManager.__instance = self

  @staticmethod
  async def _dek(tenant_id: str) -> bytes:
    return await KeyManager.get_instance().get_or_create_dek(tenant_id)

  async def create_tenant(self, data: db_tenant_model):
    try:
      dek = await KeyManager.get_instance().create_dek(str(data.id))
      enc = Fernet(dek)
      data.name = enc.encrypt((data.name or "").encode()).decode()
      data.phone = enc.encrypt((data.phone or "").encode()).decode()
      data.country = enc.encrypt((data.country or "").encode()).decode()
      data.city = enc.encrypt((data.city or "").encode()).decode()
      data.postal_code = enc.encrypt((data.postal_code or "").encode()).decode()
      data.licenses = [enc.encrypt(l.encode()).decode() for l in (data.licenses or [])]

      data.iocs = [IocCategory(
        ioc_id=enc.encrypt(ioc.ioc_id.encode()).decode(),
        name=enc.encrypt(ioc.name.encode()).decode(),
        values=[enc.encrypt(v.encode()).decode() for v in (ioc.values or [])]) for ioc in (data.iocs or [])]

      data.status = TenantStatus.ONBOARDING
      await self._engine.save(data)
    except Exception as _:
      await self._engine.remove(db_user_account, db_user_account.tenant_uuid == str(data.id))
      await self._engine.remove(db_keys, db_keys.id == str(data.id))
      await self._engine.delete(data)
      raise

  async def get_tenant(self, current_user) -> TenantRequest:
    tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(current_user.tenant_uuid))
    if not tenant:
      await AuditLogManager.get_instance().register(str(current_user.tenant_uuid), str(current_user.id), "failed to get tenant")
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found in get tenant")

    dek = await KeyManager.get_instance().get_profile_dek(str(tenant.id))
    enc = Fernet(dek)

    ioc_models = [IocCategory(
      ioc_id=enc.decrypt(ioc.ioc_id.encode()).decode(),
      name=enc.decrypt(ioc.name.encode()).decode(),
      values=[enc.decrypt(v.encode()).decode() for v in (ioc.values or [])]) for ioc in (tenant.iocs or [])]

    tenant_request = TenantRequest(
      id=str(current_user.tenant_uuid), name=enc.decrypt(tenant.name.encode()).decode(), iocs=ioc_models)

    return tenant_request

  async def update_tenant(self, data: TenantRequest, current_user):

    if current_user.role in ["admin"]:
      tenant_id = data.id
    elif current_user.licenses == ["maintainer"] and current_user.tenant_uuid == data.id:
      tenant_id = data.id
    else:
      tenant_id = current_user.tenant_uuid

    tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(tenant_id))
    if not tenant:
      await AuditLogManager.get_instance().register(str(current_user.tenant_uuid), str(current_user.id), "failed to update tenant")
      raise HTTPException(status_code=401, detail="Onboarding record not found for this user.")

    if tenant.is_default:
      raise HTTPException(status_code=401, detail="Default account cant be updated")

    dek = await KeyManager.get_instance().get_profile_dek(str(tenant.id))
    enc = Fernet(dek)

    tenant.name = enc.encrypt((data.name or "").encode()).decode()
    tenant.phone = enc.encrypt((data.phone or "").encode()).decode()
    tenant.country = enc.encrypt((data.country or "").encode()).decode()
    tenant.city = enc.encrypt((data.city or "").encode()).decode()
    tenant.postal_code = enc.encrypt((data.postal_code or "").encode()).decode()

    if data.verified is not None:
      tenant.verified = data.verified

    if data.user_quota is not None:
      if data.user_quota < 0:
        data.user_quota = 0
      tenant.user_quota = data.user_quota

    if data.status is not None:
      tenant.status = data.status

    if data.licenses is not None and len(data.licenses) > 0:
      tenant.licenses = [enc.encrypt(l.encode()).decode() for l in (data.licenses or [])]

    if data.iocs is not None and len(data.iocs) > 0:
      tenant.iocs = [IocCategory(
        ioc_id=enc.encrypt(ioc.ioc_id.encode()).decode(),
        name=enc.encrypt(ioc.name.encode()).decode(),
        values=[enc.encrypt(v.encode()).decode() for v in (ioc.values or [])]) for ioc in (data.iocs or [])]

    await self._engine.save(tenant)

    allowed_licenses = set(data.licenses or [])
    if "maintainer" in allowed_licenses and current_user.role not in ["admin"]:
      raise HTTPException(status_code=401, detail="Only admin can assign maintainer license")

    users = await self._engine.find(db_user_account, db_user_account.tenant_uuid == tenant_id)
    for u in users:
      if "maintainer" in (u.licenses or []):
        u.status = UserStatus.ACTIVE
        if set(allowed_licenses) == {"free"}:
          u.licenses = ["maintainer"]
        await self._engine.save(u)
      elif not set(u.licenses or []).issubset(allowed_licenses):
        u.status = UserStatus.DISABLE
        u.licenses = ["free"]
        await self._engine.save(u)

    active_count = await self._engine.count(db_user_account, (db_user_account.tenant_uuid == tenant_id) & (db_user_account.status == UserStatus.ACTIVE.value))

    if tenant.user_quota and active_count > tenant.user_quota:
      excess = active_count - tenant.user_quota
      extra_users = await self._engine.find(
        db_user_account,
        (db_user_account.tenant_uuid == tenant_id) & (db_user_account.status == UserStatus.ACTIVE.value) & (
            db_user_account.licenses != ["maintainer"]),
        limit=excess)
      for u in extra_users:
        u.status = UserStatus.DISABLE.value
        await self._engine.save(u)
    await AuditLogManager.get_instance().register(str(current_user.tenant_uuid), str(current_user.id),"tenant updated successfully")

    return {"message": "Tenant updated", "user": current_user.username, "company": tenant.name}

  async def get_all_tenant(self) -> List[db_tenant_model]:
    tenants = await self._engine.find(db_tenant_model, db_tenant_model.is_default == False)
    result = []
    for tenant in tenants:
      dek = await KeyManager.get_instance().get_profile_dek(ObjectId(tenant.id))
      enc = Fernet(dek)

      tenant.name = enc.decrypt(tenant.name.encode()).decode()
      tenant.phone = enc.decrypt(tenant.phone.encode()).decode()
      tenant.country = enc.decrypt(tenant.country.encode()).decode()
      tenant.city = enc.decrypt(tenant.city.encode()).decode()
      tenant.postal_code = enc.decrypt(tenant.postal_code.encode()).decode()
      tenant.licenses = [enc.decrypt(l.encode()).decode() for l in (tenant.licenses or [])]

      tenant.iocs = [IocCategory(
        ioc_id=enc.decrypt(ioc.ioc_id.encode()).decode(),
        name=enc.decrypt(ioc.name.encode()).decode(),
        values=[enc.decrypt(v.encode()).decode() for v in (ioc.values or [])]) for ioc in (tenant.iocs or [])]

      result.append(tenant)

    return result

  async def create_tenant_user(self, data: user_model, current_user):
    try:
      engine = mongo_controller.get_instance().get_engine()

      username = (data.username or "").strip()
      email = (data.email or "").strip().lower()
      password = (data.password or "").strip()

      username_pattern = r"^[A-Za-z0-9_-]{4,20}$"
      if not re.match(username_pattern, username):
        raise HTTPException(status_code=400, detail="Username already exist")


      email_pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
      if not re.match(email_pattern, email):
        raise HTTPException(status_code=400, detail="Invalid email format")

      existing_user = await engine.find_one(
        db_user_account, (db_user_account.username == username) | (db_user_account.email == email))
      existing_mail = await engine.find_one(db_user_account, (db_user_account.email == email))
      if existing_user or existing_mail:
        raise HTTPException(status_code=400, detail="Username or email already exists")

      if password.startswith("$2b$") and len(password) >= 60:
        hashed_password = password
      else:
        if len(password) > 256:
          raise HTTPException(status_code=400, detail="Password too long")
        try:
          hashed_password = CONSTANTS.S_AUTH_PWD_CONTEXT.hash(password)
        except Exception:
          raise HTTPException(status_code=400, detail="Invalid password")

      tenant_uuid = getattr(current_user, "tenant_uuid", None)
      if not tenant_uuid:
        raise HTTPException(status_code=400, detail="Invalid company association")

      tenant = await engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(tenant_uuid))
      if not tenant:
        raise HTTPException(status_code=400, detail="Tenant not found")

      users_count = await engine.count(db_user_account, db_user_account.tenant_uuid == tenant_uuid)

      if tenant.is_default == False and tenant.user_quota is not None and (users_count + 1) > tenant.user_quota:
        raise HTTPException(status_code=400, detail="User allocated quota exceeded")

      dek = await KeyManager.get_instance().get_profile_dek(str(tenant.id))
      enc = Fernet(dek)

      tenant_allowed = set(enc.decrypt(l.encode()).decode() for l in (tenant.licenses or []))

      requested = set(data.licenses or [])

      if requested and not requested.issubset(tenant_allowed):
        raise HTTPException(status_code=400, detail="User assigned license not allowed for this tenant")

      users_count = await engine.count(db_user_account, db_user_account.tenant_uuid == tenant_uuid)
      if tenant.is_default == False and tenant.user_quota and users_count >= tenant.user_quota:
        raise HTTPException(status_code=400, detail="User quota exceeded")

      user = db_user_account(
        username=username,
        email=email,
        password=hashed_password,
        role=data.role,
        status=data.status,
        subscription=data.subscription,
        licenses=data.licenses,
        tenant_uuid=tenant_uuid, )

      await engine.save(user)
      await AuditLogManager.get_instance().register(str(current_user.tenant_uuid), str(current_user.id), "tenent created successfully")

      return {"message": "User created successfully", "username": username, "email": email, "tenant_uuid": tenant_uuid, "allowed_licenses": list(
        tenant_allowed), }

    except HTTPException as e:
      raise e
    except Exception as e:
      raise HTTPException(status_code=400, detail=str(e) or "Error creating user")
