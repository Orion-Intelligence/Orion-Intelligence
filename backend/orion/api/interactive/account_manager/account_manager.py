import re
from typing import List
from pathlib import Path

from bson import ObjectId
from cryptography.fernet import Fernet
from fastapi import HTTPException
from fastapi.responses import Response

from orion.api.interactive.account_manager.models.node_callback_model import NodeCallbackModel
from orion.api.interactive.account_manager.models.user_meta_model import user_meta_model
from orion.api.interactive.account_manager.models.user_param_model import user_param_model
from orion.api.interactive.account_manager.models.user_model import user_model
from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.tenant_manager.models.tenant_param_model import tenant_param_model
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_alert_model import db_alert_model
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, UserStatus, LicenseName, user_role
from orion.services.encryption_manager.key_manager import KeyManager
from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from orion.services.mongo_manager.shared_model.db_tenant_model import TenantStatus, db_tenant_model


class AccountManager:
  __instance = None

  def __init__(self):
    self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
    self.IMAGE_DIR = self.BASE_DIR / "static" / "resource" / "profile"
    self._engine = mongo_controller.get_instance().get_engine()

    self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
    self.TENANT_DIR = self.BASE_DIR / "static" / "resource" / "tenant"
    self.TENANT_DIR.mkdir(parents=True, exist_ok=True)
    if AccountManager.__instance is not None:
      raise Exception("This class is a singleton!")
    AccountManager.__instance = self

  @staticmethod
  def get_instance():
    if AccountManager.__instance is None:
      if AccountManager.__instance is None:
        AccountManager.__instance = AccountManager()
    return AccountManager.__instance

  async def get_all_users(self, current_user) -> List[user_param_model]:
    if current_user.role == "admin" or LicenseName.MAINTAINER in (current_user.licenses or []):
      tenant_uuid = current_user.tenant_uuid
      users = await self._engine.find(
        db_user_account, (db_user_account.tenant_uuid == tenant_uuid) & (db_user_account.role != user_role.CRAWLER))
      return [user_param_model(**u.dict()) for u in users]
    return []

  async def create_user(self, data: user_model, current_user):
    try:
      engine = mongo_controller.get_instance().get_engine()

      if current_user.role == user_role.ADMIN:
        if data.role != user_role.ANALYST:
          raise HTTPException(status_code=403, detail="Not allowed")
      elif user_role.MEMBER == current_user.role and LicenseName.MAINTAINER in (current_user.licenses or []):
        if data.role not in [user_role.MEMBER, user_role.ANALYST]:
          raise HTTPException(status_code=403, detail="Not allowed")
      else:
        raise HTTPException(status_code=403, detail="Not allowed")

      username = (data.username or "").strip()
      email = (data.email or "").strip().lower()
      password = (data.password or "").strip()

      username_pattern = r"^[A-Za-z0-9_-]{4,20}$"
      if not re.match(username_pattern, username):
        raise HTTPException(status_code=400, detail="Username already exist")

      email_pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
      if not re.match(email_pattern, email):
        raise HTTPException(status_code=400, detail="Invalid email format")

      existing_user = await engine.find_one(db_user_account, db_user_account.username == username)
      existing_mail = await engine.find_one(db_user_account, db_user_account.email == email)
      if existing_user or existing_mail:
        raise HTTPException(status_code=400, detail="Username or email already exists")

      if password.startswith("$2b$") and len(password) >= 60:
        hashed_password = password
      else:
        if len(password) > 256:
          raise HTTPException(status_code=400, detail="Password too long")
        hashed_password = CONSTANTS.S_AUTH_PWD_CONTEXT.hash(password)

      user = db_user_account(
        username=username,
        email=email,
        password=hashed_password,
        tenant_uuid=current_user.tenant_uuid,
        role=data.role,
        status=data.status,
        subscription=data.subscription,
        licenses=data.licenses, )

      await engine.save(user)
      await KeyManager.get_instance().create_user_dek(user.id)

      return {"message": "User created successfully", "username": username, "email": email}

    except Exception as e:
      raise HTTPException(status_code=400, detail=str(e) or "Error creating user")

  async def delete_user(self, user, current_user):
    user = await self._engine.find_one(db_user_account, db_user_account.username == user.username)
    if not user:
      raise HTTPException(status_code=401, detail="User not found")

    if user.role in ["admin"]:
      raise HTTPException(status_code=401, detail="This user type cannot be deleted")

    if current_user.licenses.__contains__(LicenseName.MAINTAINER):
      if user.tenant_uuid != current_user.tenant_uuid:
        raise HTTPException(
          status_code=401,
          detail="Maintainer can only delete non-maintainer users from the same tenant")
    else:
      raise HTTPException(status_code=401, detail="You are not allowed to delete users")

    await self._engine.remove(db_keys, db_keys.auth_id == str(user.id))

    image_path = self.IMAGE_DIR / f"{user.id}.enc"
    if image_path.exists():
      image_path.unlink()

    await self._engine.delete(user)
    await AuditLogManager.get_instance().register(
      str(user.tenant_uuid), str(current_user.id), "User deleted")

    return {"message": "User deleted successfully"}

  async def update_user(self, request: tenant_param_model, current_user):
    user = await self._engine.find_one(db_user_account, db_user_account.username == request.username)
    if not user:
      await AuditLogManager.get_instance().register(
        str(current_user.tenant_uuid), str(current_user.id), "User update failed")
      raise HTTPException(status_code=401, detail="User not found")

    if current_user.licenses.__contains__(LicenseName.MAINTAINER) and str(user.tenant_uuid) == str(
        current_user.tenant_uuid):
      pass
    else:
      await AuditLogManager.get_instance().register(
        str(current_user.tenant_uuid), str(current_user.id), "User update denied")
      raise HTTPException(status_code=401, detail="You are not allowed to update this user")

    if user.role in ["admin", "crawl"]:
      await AuditLogManager.get_instance().register(
        str(user.tenant_uuid), str(current_user.id), "User update denied")
      raise HTTPException(status_code=401, detail="This user type cannot be updated")

    if request.status.value == "disable":
      user.status = UserStatus.DISABLE.value
    else:
      tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(user.tenant_uuid))
      active_count = await self._engine.count(
        db_user_account,
        (db_user_account.tenant_uuid == str(user.tenant_uuid)) & (db_user_account.status == UserStatus.ACTIVE.value))
      if tenant and (not tenant.is_default) and tenant.user_quota is not None and active_count >= tenant.user_quota:
        raise HTTPException(status_code=400, detail="User quota exceeded")
      user.status = UserStatus.ACTIVE.value

    user.licenses = request.licenses
    await self._engine.save(user)

    await AuditLogManager.get_instance().register(
      str(user.tenant_uuid), str(current_user.id), "User updated")

    return {"message": "User updated successfully", "id": str(user.id)}

  async def update_current_user(self, request: user_meta_model, current_user):
    user = await self._engine.find_one(db_user_account, db_user_account.username == current_user.username)
    if not user:
      raise HTTPException(status_code=401, detail="User not found")

    if request.username is not None:
      user.username = request.username
    if request.email is not None:
      user.email = request.email
    if request.preferences is not None:
      user.preferences = request.preferences
    if request.twofa_enabled is not None:
      user.twofa_enabled = request.twofa_enabled

    await self._engine.save(user)
    await AuditLogManager.get_instance().register(
      str(user.tenant_uuid), str(user.id), "Self profile updated")

    return {"message": "User updated successfully"}

  async def getProfileImage(self, userId: str):
    file_path = Path(self.TENANT_DIR) / f"{userId}.png"
    default_path = Path(self.TENANT_DIR) / "default.png"

    is_default = not file_path.is_file()
    target_path = default_path if is_default else file_path

    with open(target_path, "rb") as f:
      data = f.read()

    return Response(
      content=data,
      media_type="image/png",
      headers={"X-Default-Image": "true" if is_default else "false", "Access-Control-Expose-Headers": "X-Default-Image"})

  def safe_decrypt(self, enc: Fernet, value: str | None) -> str:
    if not value:
      return ""
    try:
      return enc.decrypt(value.encode()).decode()
    except Exception:
      return ""

  async def get_node(self, current_user) -> NodeCallbackModel:
    user = current_user
    tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(user.tenant_uuid))
    alerts = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == str(user.tenant_uuid))

    dek = await KeyManager.get_instance().get_or_create_dek(str(tenant.id))
    enc = Fernet(dek)

    assigned_quota = tenant.user_quota
    total_user = await self._engine.count(db_user_account, (db_user_account.tenant_uuid == str(user.tenant_uuid)))

    raw_alerts = alerts.alerts if alerts and alerts.alerts else []
    alerts_list = AlertManager.getInstance().filter_alerts_by_license(raw_alerts, user)

    tenant_image_file = self.TENANT_DIR / f"{str(tenant.id)}.png"
    tenant_image_path = "/api/s/static/tenant/" + (str(tenant.id) if tenant_image_file.is_file() else "default")

    user_image_file = self.IMAGE_DIR / f"{str(user.id)}.png"
    user_image_path = "/api/s/static/user/" + (str(user.id) if user_image_file.is_file() else "default")

    node = NodeCallbackModel.model_validate(
      {"user": {"email": user.email, "twofa_enabled": user.twofa_enabled, "username": user.username, "role": user.role, "status": user.status, "subscription": user.subscription, "verificationDate": user.account_verify_at.isoformat() if user.account_verify_at else None, "license": [
        license.value for license in
        user.licenses], "image": user_image_path, }, "tenant": {"hasOnboarding": tenant.status == TenantStatus.ONBOARDING, "id": str(
        tenant.id), "isDefault": str(tenant.is_default), "name": self.safe_decrypt(
        enc,
        tenant.name), "phone": self.safe_decrypt(enc, tenant.phone), "country": self.safe_decrypt(
        enc,
        tenant.country), "city": self.safe_decrypt(enc, tenant.city), "postalCode": self.safe_decrypt(
        enc,
        tenant.postal_code), "taxId": self.safe_decrypt(enc, tenant.id), "userId": "", "licenses": [
        self.safe_decrypt(enc, l) for l in (tenant.licenses or [])], "assignedQuota": str(
        assigned_quota), "quotaExceeded": bool(
        not tenant.is_default and tenant.user_quota is not None and assigned_quota < total_user), "image": tenant_image_path, }, "alerts": alerts_list, })

    return node
