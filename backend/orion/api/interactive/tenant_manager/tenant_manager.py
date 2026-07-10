import re
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from bson import ObjectId
from fastapi import HTTPException
from starlette import status
from cryptography.fernet import Fernet

from orion.api.interactive.account_manager.account_manager import AccountManager
from orion.api.interactive.account_manager.models.user_model import user_model
from orion.helper_manager.helper_controller import helper_controller
from orion.services.mongo_manager.shared_model.db_alert_model import db_alert_model, visible_alerts
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from orion.services.mongo_manager.shared_model.db_tenant_model import IocCategory, db_tenant_model, TenantRequest, TenantStatus
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, db_user_account, LicenseName
from orion.services.permission_manager.permission_models import UserPermission
from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.mail_manager.mail_enums import MailSubject, MailUrlHeading
from orion.helper_manager.env_handler import env_handler
from orion.services.mail_manager.mail_manager import mail_manager
from orion.constants import constant


class TenantManager:
    __instance = None
    __lock = threading.Lock()
    SIGNUP_USERNAME_PATTERN = r"^[A-Za-z][A-Za-z0-9_-]{7,19}$"
    TENANT_USERNAME_PATTERN = r"^[A-Za-z0-9_-]{4,20}$"
    EMAIL_PATTERN = r"^[\w\.-]+@[\w\.-]+\.\w+$"

    @staticmethod
    def get_instance():
        if TenantManager.__instance is None:
            with TenantManager.__lock:
                if TenantManager.__instance is None:
                    TenantManager.__instance = TenantManager()
        return TenantManager.__instance

    def __init__(self):
        from orion.services.mongo_manager.mongo_controller import mongo_controller
        self.BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
        self.IMAGE_DIR = self.BASE_DIR / "static" / "resource" / "profile"
        self._engine = mongo_controller.get_instance().get_engine()

        if TenantManager.__instance is not None:
            raise Exception("This class is a singleton!")
        TenantManager.__instance = self

    @staticmethod
    async def _dek(tenant_id: str) -> bytes:
        return await KeyManager.get_instance().get_or_create_dek(tenant_id)

    @staticmethod
    def get_email_domain(email: str) -> str:
        return email.split("@")[1].lower()

    @staticmethod
    def get_company_from_email(email: str) -> str:
        parts = email.split("@")
        if len(parts) < 2:
            return ""
        return parts[1].split(".")[0]

    @staticmethod
    def validate_signup_username(username: str):
        if not re.match(TenantManager.SIGNUP_USERNAME_PATTERN, username):
            raise HTTPException(status_code=422, detail="Username already exist")

    @staticmethod
    def validate_tenant_username(username: str):
        if not re.match(TenantManager.TENANT_USERNAME_PATTERN, username):
            raise HTTPException(status_code=400, detail="Username already exist")

    @staticmethod
    def validate_signup_email(email: str):
        if not re.match(TenantManager.EMAIL_PATTERN, email):
            raise HTTPException(status_code=422, detail="Invalid email format")

    @staticmethod
    def validate_tenant_email(email: str, role: str):
        if not re.match(TenantManager.EMAIL_PATTERN, email) and role not in ["demo"]:
            raise HTTPException(status_code=400, detail="Invalid email format")

    @staticmethod
    def validate_company_email(email: str, detail: str = "Please enter your company email (Gmail, Yahoo, etc. not allowed)."):
        helper_controller.validate_company_email_domain(email, detail=detail)

    @staticmethod
    def has_case_management_permission(permissions) -> bool:
        return UserPermission.CASE_MANAGEMENT.value in {
            permission.value if hasattr(permission, "value") else permission
            for permission in (permissions or [])
        }

    async def get_admin_visible_alert_tenants(self, tenant_ids: Optional[List[str]] = None) -> List[db_tenant_model]:
        query = (db_tenant_model.is_default == False) & (db_tenant_model.alerts_visible_to_admin == True)
        tenants = await self._engine.find(db_tenant_model, query)
        if tenant_ids is None:
            return tenants
        allowed_ids = set(tenant_ids)
        return [tenant for tenant in tenants if str(tenant.id) in allowed_ids]

    async def get_alert_allowed_tenant_options(self) -> List[dict]:
        tenants = await self.get_admin_visible_alert_tenants()
        result = []
        for tenant in tenants:
            tenant_id = str(tenant.id)
            dek = await KeyManager.get_instance().get_profile_dek(tenant_id)
            enc = Fernet(dek)
            result.append({
                "id": tenant_id,
                "name": enc.decrypt(tenant.name.encode()).decode(),
                "email": enc.decrypt(tenant.email.encode()).decode(),
            })
        return result

    async def validate_alert_access_assignment(self, data, current_user) -> tuple[bool, List[str]]:
        requested_all = data.alerts_allowed_all or False #bool(getattr(data, "alerts_allowed_all", False))
        requested_ids = data.alerts_allowed_tenant_ids or [] #list(getattr(data, "alerts_allowed_tenant_ids", None) or [])
        has_requested_access = requested_all or bool(requested_ids)

        if has_requested_access and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admin can assign alert access")

        if not self.has_case_management_permission(getattr(data, "permissions", None)):
            return False, []

        if requested_all:
            return True, []

        visible_tenants = await self.get_admin_visible_alert_tenants(requested_ids)
        visible_ids = {str(tenant.id) for tenant in visible_tenants}
        filtered_ids = []
        seen_ids = set()
        for tenant_id in requested_ids:
            if tenant_id in visible_ids and tenant_id not in seen_ids:
                filtered_ids.append(tenant_id)
                seen_ids.add(tenant_id)
        return False, filtered_ids

    async def resolve_visible_alert_tenant_ids_for_user(self, current_user) -> List[str]:
        if current_user.role == "admin":
            return [str(tenant.id) for tenant in await self.get_admin_visible_alert_tenants()]

        user = await self._engine.find_one(db_user_account, db_user_account.id == current_user.id)
        if not user:
            user = await self._engine.find_one(db_user_account, db_user_account.username == current_user.username)
        if not user or not self.has_case_management_permission(getattr(user, "permissions", None)):
            return []

        if getattr(user, "alerts_allowed_all", False):
            return [str(tenant.id) for tenant in await self.get_admin_visible_alert_tenants()]

        assigned_ids = list(getattr(user, "alerts_allowed_tenant_ids", None) or [])
        if not assigned_ids:
            return []

        return [str(tenant.id) for tenant in await self.get_admin_visible_alert_tenants(assigned_ids)]

    async def remove_tenant_from_user_alert_access(self, tenant_id: str):
        users = await self._engine.find(db_user_account, db_user_account.alerts_allowed_tenant_ids == tenant_id)
        for user in users:
            user.alerts_allowed_tenant_ids = [
                assigned_id for assigned_id in (getattr(user, "alerts_allowed_tenant_ids", None) or [])
                if assigned_id != tenant_id
            ]
            await self._engine.save(user)

    async def build_tenant_alert_summary(self, tenants: List[db_tenant_model]) -> List[dict]:
        from orion.api.interactive.alert_manager.alert_manager import AlertManager

        result = []
        for tenant in tenants:
            tenant_id = str(tenant.id)
            dek = await KeyManager.get_instance().get_profile_dek(tenant_id)
            enc = Fernet(dek)
            tenant_data = {
                "id": tenant_id,
                "name": enc.decrypt(tenant.name.encode()).decode(),
                "email": enc.decrypt(tenant.email.encode()).decode(),
                "is_active": tenant.status == TenantStatus.ACTIVE
            }

            result.append({
                "tenant": tenant_data,
                "alert_summary": await AlertManager.getInstance().get_alert_summary(tenant_id)
            })

        return result


    @staticmethod
    async def encrypt_tenant(data):
        dek = await KeyManager.get_instance().create_dek(str(data.id))
        enc = Fernet(dek)
        data.name = enc.encrypt((data.name or "").encode()).decode()
        data.phone = enc.encrypt((data.phone or "").encode()).decode()
        data.country = enc.encrypt((data.country or "").encode()).decode()
        data.city = enc.encrypt((data.city or "").encode()).decode()
        data.postal_code = enc.encrypt((data.postal_code or "").encode()).decode()
        data.licenses = [enc.encrypt(l.encode()).decode() for l in (data.licenses or [])]
        data.email = enc.encrypt((data.email or "").encode()).decode()
        data.accounts_mail_password = enc.encrypt((data.accounts_mail_password or "").encode()).decode()
        data.accounts_mail = enc.encrypt((data.accounts_mail or "").encode()).decode()
        data.accounts_smtp_server = enc.encrypt((data.accounts_smtp_server or "").encode()).decode()
        data.accounts_smtp_port = enc.encrypt((data.accounts_smtp_port or "").encode()).decode()

        data.iocs = [IocCategory(
            ioc_id=enc.encrypt(ioc.ioc_id.encode()).decode(),
            name=enc.encrypt(ioc.name.encode()).decode(),
            values=[enc.encrypt(v.encode()).decode() for v in (ioc.values or [])]) for ioc in (data.iocs or [])]
        return enc

    async def create_tenant(self, data: db_tenant_model):
        try:
            await self.encrypt_tenant(data)
            data.status = TenantStatus.ONBOARDING
            await self._engine.save(data)
        except Exception as _:
            await self._engine.remove(db_user_account, db_user_account.tenant_uuid == str(data.id))
            await self._engine.remove(db_keys, db_keys.id == str(data.id))
            await self._engine.delete(data)
            raise

    async def get_tenant(self, current_user) -> TenantRequest:
        from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
        tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(current_user.tenant_uuid))
        if not tenant:
            await AuditLogManager.get_instance().register(
                str(current_user.tenant_uuid), str(current_user.id), "failed to get tenant")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found in get tenant")

        dek = await KeyManager.get_instance().get_profile_dek(str(tenant.id))
        enc = Fernet(dek)

        ioc_models = [IocCategory(
            ioc_id=enc.decrypt(ioc.ioc_id.encode()).decode(),
            name=enc.decrypt(ioc.name.encode()).decode(),
            values=[enc.decrypt(v.encode()).decode() for v in (ioc.values or [])]) for ioc in (tenant.iocs or [])]

        tenant_request = TenantRequest(
            id=str(current_user.tenant_uuid), name=enc.decrypt(tenant.name.encode()).decode(), iocs=ioc_models,
            phone=enc.decrypt(tenant.phone.encode()).decode() if tenant.phone else "",
            country=enc.decrypt(tenant.country.encode()).decode() if tenant.country else "",
            city=enc.decrypt(tenant.city.encode()).decode() if tenant.city else "",
            postal_code=enc.decrypt(tenant.postal_code.encode()).decode() if tenant.postal_code else "",
            profile_visibility_enabled=getattr(tenant, "profile_visibility_enabled", True),
            event_management_enabled=getattr(tenant, "event_management_enabled", False),
            alerts_visible_to_admin=getattr(tenant, "alerts_visible_to_admin", True),
            alert_run_time=getattr(tenant, "alert_run_time", None),
            accounts_mail_password=None,
            accounts_mail=enc.decrypt(getattr(tenant, "accounts_mail", "").encode()).decode() if getattr(tenant, "accounts_mail", "") else "",
            accounts_smtp_server=enc.decrypt(getattr(tenant, "accounts_smtp_server", "").encode()).decode() if getattr(tenant, "accounts_smtp_server", "") else "",
            accounts_smtp_port=enc.decrypt(getattr(tenant, "accounts_smtp_port", "").encode()).decode() if getattr(tenant, "accounts_smtp_port", "") else "")

        return tenant_request

    async def update_tenant(self, data: TenantRequest, current_user):
        from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager

        if current_user.role in ["admin"]:
            tenant_id = data.id
        elif current_user.licenses == ["maintainer"] and current_user.tenant_uuid == data.id:
            tenant_id = data.id
        else:
            tenant_id = current_user.tenant_uuid

        tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(tenant_id))
        if not tenant:
            await AuditLogManager.get_instance().register(
                str(current_user.tenant_uuid), str(current_user.id), "failed to update tenant")
            raise HTTPException(status_code=401, detail="Onboarding record not found for this user.")

        if tenant.is_default:
            raise HTTPException(status_code=401, detail="Default account cant be updated")

        previous_alerts_visible_to_admin = getattr(tenant, "alerts_visible_to_admin", True)

        if data.password_reset_required is not None:
            maintainer = await self._engine.find_one(db_user_account,(db_user_account.tenant_uuid == tenant_id) & (db_user_account.licenses == LicenseName.MAINTAINER))
            maintainer.password_reset_required = data.password_reset_required
            await self._engine.save(maintainer)

        dek = await KeyManager.get_instance().get_profile_dek(str(tenant.id))
        enc = Fernet(dek)

        if any((value or "").strip() for value in [
            data.accounts_mail_password,
            data.accounts_mail,
            data.accounts_smtp_server,
            data.accounts_smtp_port
        ]):
            await mail_manager.get_instance().send_test_mail(config={
                "ACCOUNTS_MAIL_PASSWORD": data.accounts_mail_password,
                "ACCOUNTS_MAIL": data.accounts_mail,
                "ACCOUNTS_SMTP_SERVER": data.accounts_smtp_server,
                "ACCOUNTS_SMTP_PORT": data.accounts_smtp_port,
            })

        tenant.name = enc.encrypt((data.name or "").encode()).decode()
        tenant.phone = enc.encrypt((data.phone or "").encode()).decode()
        tenant.country = enc.encrypt((data.country or "").encode()).decode()
        tenant.city = enc.encrypt((data.city or "").encode()).decode()
        tenant.postal_code = enc.encrypt((data.postal_code or "").encode()).decode()
        if data.accounts_mail_password is not None:
            tenant.accounts_mail_password = enc.encrypt((data.accounts_mail_password or "").encode()).decode()
        if data.accounts_mail is not None:
            tenant.accounts_mail = enc.encrypt((data.accounts_mail or "").encode()).decode()
        if data.accounts_smtp_server is not None:
            tenant.accounts_smtp_server = enc.encrypt((data.accounts_smtp_server or "").encode()).decode()
        if data.accounts_smtp_port is not None:
            tenant.accounts_smtp_port = enc.encrypt((data.accounts_smtp_port or "").encode()).decode()

        is_admin = current_user.role in ["admin"]

        if is_admin and data.verified is not None:
            tenant.verified = data.verified

        if is_admin and data.user_quota is not None:
            if data.user_quota < 0:
                data.user_quota = 0
            tenant.user_quota = data.user_quota

        if is_admin and data.status is not None:
            tenant.status = data.status
        elif (
            data.status == TenantStatus.ACTIVE
            and tenant.status == TenantStatus.ONBOARDING
            and str(tenant.id) == str(current_user.tenant_uuid)
        ):
            tenant.status = TenantStatus.ACTIVE

        if is_admin and data.licenses is not None and len(data.licenses) > 0:
            if LicenseName.FEEDER.value in data.licenses:
                raise HTTPException(status_code=400, detail="Feeder license cannot be assigned to tenant")
            tenant.licenses = [enc.encrypt(l.encode()).decode() for l in (data.licenses or [])]

        if data.profile_visibility_enabled is not None:
            tenant.profile_visibility_enabled = data.profile_visibility_enabled

        if data.event_management_enabled is not None:
            tenant.event_management_enabled = data.event_management_enabled

        if data.alerts_visible_to_admin is not None:
            tenant.alerts_visible_to_admin = data.alerts_visible_to_admin

        if "alert_run_time" in data.model_fields_set:
            tenant.alert_run_time = data.alert_run_time

        if data.iocs is not None:
            tenant.iocs = [IocCategory(
                ioc_id=enc.encrypt(ioc.ioc_id.encode()).decode(),
                name=enc.encrypt(ioc.name.encode()).decode(),
                values=[enc.encrypt(v.encode()).decode() for v in (ioc.values or [])]) for ioc in (data.iocs or [])]

        await self._engine.save(tenant)

        if previous_alerts_visible_to_admin is not False and getattr(tenant, "alerts_visible_to_admin", True) is False:
            await self.remove_tenant_from_user_alert_access(str(tenant.id))

        allowed_licenses = set(data.licenses or [])
        if "maintainer" in allowed_licenses and not is_admin:
            raise HTTPException(status_code=401, detail="Only admin can assign maintainer license")

        if is_admin:
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

        active_count = await self._engine.count(
            db_user_account,
            (db_user_account.tenant_uuid == tenant_id) & (db_user_account.status == UserStatus.ACTIVE.value))

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
        await AuditLogManager.get_instance().register(
            str(current_user.tenant_uuid), str(current_user.id), "tenant updated successfully")

        tenant_data = tenant.model_dump()
        tenant_data["id"] = str(tenant.id)

        tenant_data["name"] = enc.decrypt((tenant_data.get("name") or "").encode()).decode() if tenant_data.get(
            "name") else ""
        tenant_data["phone"] = enc.decrypt((tenant_data.get("phone") or "").encode()).decode() if tenant_data.get(
            "phone") else ""
        tenant_data["country"] = enc.decrypt((tenant_data.get("country") or "").encode()).decode() if tenant_data.get(
            "country") else ""
        tenant_data["city"] = enc.decrypt((tenant_data.get("city") or "").encode()).decode() if tenant_data.get(
            "city") else ""
        tenant_data["postal_code"] = enc.decrypt(
            (tenant_data.get("postal_code") or "").encode()).decode() if tenant_data.get("postal_code") else ""
        tenant_data["licenses"] = [enc.decrypt(x.encode()).decode() for x in (tenant_data.get("licenses") or [])]
        tenant_data["accounts_mail_password"] = None
        tenant_data["accounts_mail"] = enc.decrypt((tenant_data.get("accounts_mail") or "").encode()).decode() if tenant_data.get("accounts_mail") else ""
        tenant_data["accounts_smtp_server"] = enc.decrypt((tenant_data.get("accounts_smtp_server") or "").encode()).decode() if tenant_data.get("accounts_smtp_server") else ""
        tenant_data["accounts_smtp_port"] = enc.decrypt((tenant_data.get("accounts_smtp_port") or "").encode()).decode() if tenant_data.get("accounts_smtp_port") else ""
        tenant_data["iocs"] = [{**ioc, "ioc_id": enc.decrypt((ioc.get("ioc_id") or "").encode()).decode() if ioc.get(
            "ioc_id") else "", "name": enc.decrypt((ioc.get("name") or "").encode()).decode() if ioc.get(
            "name") else "", "values": [enc.decrypt(v.encode()).decode() for v in (ioc.get("values") or [])], } for ioc
            in (tenant_data.get("iocs") or [])]

        alert_doc = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == str(tenant.id))
        alerts_data = []
        if alert_doc:
            alerts_data = [alert.model_dump() for alert in visible_alerts(alert_doc.alerts)]

        return {"message": "Tenant updated", "user": current_user.username, "company": tenant_data[
            "name"], "tenant": tenant_data, "alerts": alerts_data}

    async def get_all_tenant(self) -> List[dict]:
        tenants = await self._engine.find(db_tenant_model, db_tenant_model.is_default == False)
        maintainers = await self._engine.find(db_user_account, db_user_account.licenses == LicenseName.MAINTAINER)
        maintainer_by_tenant_id = {str(maintainer.tenant_uuid): maintainer for maintainer in maintainers}
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
            if tenant.email:
                tenant.email = enc.decrypt(tenant.email.encode()).decode()
            else:
                tenant.email = ""
            tenant.accounts_mail_password = None
            tenant.accounts_mail = enc.decrypt(tenant.accounts_mail.encode()).decode() if getattr(tenant, "accounts_mail", "") else ""
            tenant.accounts_smtp_server = enc.decrypt(tenant.accounts_smtp_server.encode()).decode() if getattr(tenant, "accounts_smtp_server", "") else ""
            tenant.accounts_smtp_port = enc.decrypt(tenant.accounts_smtp_port.encode()).decode() if getattr(tenant, "accounts_smtp_port", "") else ""

            tenant.iocs = [IocCategory(
                ioc_id=enc.decrypt(ioc.ioc_id.encode()).decode(),
                name=enc.decrypt(ioc.name.encode()).decode(),
                values=[enc.decrypt(v.encode()).decode() for v in (ioc.values or [])]) for ioc in (tenant.iocs or [])]

            tenant_data = tenant.model_dump()
            tenant_data["id"] = str(tenant.id)
            maintainer = maintainer_by_tenant_id.get(str(tenant.id))
            tenant_data["password_reset_required"] = getattr(maintainer, "password_reset_required", False)
            result.append(tenant_data)

        return result

    async def get_visible_tenant_alerts_summary(self, current_user) -> List[dict]:
        tenant_ids = await self.resolve_visible_alert_tenant_ids_for_user(current_user)
        if not tenant_ids:
            return []
        tenants = await self.get_admin_visible_alert_tenants(tenant_ids)
        return await self.build_tenant_alert_summary(tenants)

    async def get_visible_tenant_alerts(self, tenant_id: str, current_user, page: int = 1, limit: int = 20, alert_type: str | None = None, paginate: bool = False):
        visible_tenant_ids = set(await self.resolve_visible_alert_tenant_ids_for_user(current_user))
        if tenant_id not in visible_tenant_ids:
            raise HTTPException(status_code=404, detail="Tenant alerts not available")

        try:
            tenant_object_id = ObjectId(tenant_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Tenant alerts not available")

        tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == tenant_object_id)
        if not tenant or getattr(tenant, "is_default", False) or getattr(tenant, "alerts_visible_to_admin", True) is False:
            raise HTTPException(status_code=404, detail="Tenant alerts not available")

        alerts_data = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == tenant_id)
        if not alerts_data:
            if paginate:
                return {
                    "items": [],
                    "total": 0,
                    "page": page,
                    "limit": limit,
                    "has_more": False
                }
            return []

        alerts = visible_alerts(alerts_data.alerts)
        if alert_type:
            normalized_type = alert_type.strip().lower()
            alerts = [alert for alert in alerts if (alert.type or "").strip().lower() == normalized_type]

        if not paginate:
            return alerts

        sorted_alerts = sorted(
            alerts,
            key=lambda alert: alert.last_seen or alert.first_seen or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True)
        total = len(sorted_alerts)
        start = (page - 1) * limit
        end = start + limit

        return {
            "items": sorted_alerts[start:end],
            "total": total,
            "page": page,
            "limit": limit,
            "has_more": end < total,
        }

    async def get_admin_tenant_alerts(self, tenant_id: str, page: int = 1, limit: int = 20, alert_type: str | None = None, paginate: bool = False):
        tenant = await self._engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(tenant_id))
        if not tenant or getattr(tenant, "is_default", False) or getattr(tenant, "alerts_visible_to_admin", True) is False:
            raise HTTPException(status_code=404, detail="Tenant alerts not available")

        alerts_data = await self._engine.find_one(db_alert_model, db_alert_model.tenant_id == tenant_id)
        if not alerts_data:
            if paginate:
                return {
                    "items": [],
                    "total": 0,
                    "page": page,
                    "limit": limit,
                    "has_more": False
                }
            return []

        alerts = visible_alerts(alerts_data.alerts)
        if alert_type:
            normalized_type = alert_type.strip().lower()
            alerts = [alert for alert in alerts if (alert.type or "").strip().lower() == normalized_type]

        if not paginate:
            return alerts

        sorted_alerts = sorted(
            alerts,
            key=lambda alert: alert.last_seen or alert.first_seen or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True)
        total = len(sorted_alerts)
        start = (page - 1) * limit
        end = start + limit

        return {
            "items": sorted_alerts[start:end],
            "total": total,
            "page": page,
            "limit": limit,
            "has_more": end < total,
        }

    async def create_tenant_user(self, data: user_model, current_user):
        from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
        from orion.services.mongo_manager.mongo_controller import mongo_controller
        try:
            engine = mongo_controller.get_instance().get_engine()

            if LicenseName.MAINTAINER in (data.licenses or []):
                raise HTTPException(status_code=403, detail="Role denied")

            username, email, password = helper_controller.extract_user_mail_fields(data)

            TenantManager.validate_tenant_username(username)
            TenantManager.validate_tenant_email(email, data.role)
            TenantManager.validate_company_email(
                email,
                detail="Please enter user company email (Gmail, Yahoo, etc. not allowed)."
            )

            existing_user = await engine.find_one(db_user_account, (db_user_account.username == username) | (db_user_account.email == email))
            existing_mail = await engine.find_one(db_user_account, (db_user_account.email == email))

            hashed_password = await AccountManager.get_instance().create_tenant_user(existing_user, existing_mail, password)

            tenant_uuid = getattr(current_user, "tenant_uuid", None)
            if not tenant_uuid:
                raise HTTPException(status_code=400, detail="Invalid company association")

            tenant = await engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(tenant_uuid))
            if not tenant:
                raise HTTPException(status_code=400, detail="Tenant not found")

            users_count = await engine.count(db_user_account, db_user_account.tenant_uuid == tenant_uuid)

            if tenant.is_default == False and tenant.user_quota is not None and (users_count + 1) > tenant.user_quota:
                raise HTTPException(status_code=400, detail="User allocated quota exceeded")

            if data.role in ["demo"] and current_user.role not in ["admin"]:
                await AuditLogManager.get_instance().register(
                    str(tenant_uuid), str(current_user.id), "User creation denied")
                raise HTTPException(status_code=401, detail="You are not allowed to manage this user")

            dek = await KeyManager.get_instance().get_profile_dek(str(tenant.id))
            enc = Fernet(dek)

            tenant_allowed = set(enc.decrypt(l.encode()).decode() for l in (tenant.licenses or []))

            requested = set(data.licenses or [])

            if requested and not requested.issubset(tenant_allowed) and not current_user.role in ["admin"]:
                raise HTTPException(status_code=400, detail="User assigned license not allowed for this tenant")

            alerts_allowed_all, alerts_allowed_tenant_ids = await self.validate_alert_access_assignment(data, current_user)

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
                permissions=data.permissions,
                alerts_allowed_all=alerts_allowed_all,
                alerts_allowed_tenant_ids=alerts_allowed_tenant_ids,
                tenant_uuid=tenant_uuid,
                password_reset_required=False, )
            
            await mail_manager.get_instance().validate_mail_configuration(tenant_id=tenant_uuid)
            await engine.save(user)
            await AuditLogManager.get_instance().register(
                str(current_user.tenant_uuid), str(current_user.id), "tenant created successfully")

            APP_URL = env_handler.get_instance().env("APP_URL")
            login_url = f"{APP_URL}/login"
            if constant.mail_template is not None:
                html_content = constant.mail_template.render(
                    username=user.username,
                    email=user.email,
                    password=password,
                    subject=MailSubject.ACCOUNT_CREATED.value,
                    lurlHeading=MailUrlHeading.ACCOUNT_CREATED.value,
                    url=login_url)
            else:
                html_content = (
                    f"{MailSubject.ACCOUNT_CREATED.value}\n\n"
                    f"Username: {user.username}\n"
                    f"Email: {user.email}\n"
                    f"Password: {password}\n"
                    f"Login URL: {login_url}"
                )
            await mail_manager.get_instance().send_verification_mail(
                to=user.email, subject=MailSubject.ACCOUNT_CREATED.value, body=html_content, tenant_id=tenant_uuid)

            return {"message": "User created successfully", "username": username, "email": email, "tenant_uuid": tenant_uuid, "allowed_licenses": list(
                tenant_allowed), }

        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error creating user {str(e)}")
