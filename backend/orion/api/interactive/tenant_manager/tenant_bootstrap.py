from bson import ObjectId
from cryptography.fernet import Fernet
from odmantic.exceptions import DuplicateKeyError

from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.shared_model.db_auth_models import (db_user_account, user_role, UserStatus, LicenseName, )
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from orion.services.mongo_manager.shared_model.db_tenant_model import (IocCategory, TenantStatus, db_tenant_model, )
from orion.services.session_manager.session_enums import admin_mock, crawler_mock


async def create_default_tenant(engine):
    from orion.services.encryption_manager.key_manager import KeyManager

    data = db_tenant_model(
        id=ObjectId(),
        name="default",
        is_default=True,
        status=TenantStatus.ACTIVE,
        licenses=["free"],
        phone="",
        country="",
        city="",
        postal_code="",
        verified=True,
        subscription=True,
        user_quota=-1,
        iocs=[], )

    dek = await KeyManager.get_instance().create_dek(str(data.id))
    enc = Fernet(dek)

    data.name = enc.encrypt((data.name or "").encode()).decode()
    data.phone = enc.encrypt((data.phone or "").encode()).decode()
    data.country = enc.encrypt((data.country or "").encode()).decode()
    data.city = enc.encrypt((data.city or "").encode()).decode()
    data.postal_code = enc.encrypt((data.postal_code or "").encode()).decode()
    data.licenses = [enc.encrypt(l.encode()).decode() for l in (data.licenses or [])]

    data.iocs = [IocCategory(
        ioc_id=enc.encrypt((ioc.ioc_id or "").encode()).decode(),
        name=enc.encrypt((ioc.name or "").encode()).decode(),
        values=[enc.encrypt(v.encode()).decode() for v in (ioc.values or [])], ) for ioc in (data.iocs or [])]

    data.status = TenantStatus.ACTIVE
    data.user_quota = -1
    data.verified = True
    data.licenses = [enc.encrypt(b"maintainer").decode(), enc.encrypt(b"enterprise").decode()]

    await engine.save(data)
    return data


async def create_default_users(engine, tenant_id):
    existing_admin = await engine.find_one(db_user_account, db_user_account.role == user_role.ADMIN)
    if existing_admin:
        return

    try:
        admin_user = db_user_account(
            username=admin_mock["username"],
            password=admin_mock["password"],
            role=user_role.ADMIN,
            status=UserStatus.ACTIVE,
            licenses=[LicenseName.ENTERPRISE, LicenseName.MAINTAINER],
            tenant_uuid=str(tenant_id), )
        await engine.save(admin_user)
        crawler_user = db_user_account(
            username=crawler_mock["username"],
            password=crawler_mock["password"],
            role=user_role.CRAWLER,
            status=UserStatus.ACTIVE,
            licenses=[LicenseName.ENTERPRISE],
            tenant_uuid=str(tenant_id), )
        await engine.save(crawler_user)
    except DuplicateKeyError:
        log.g().ex("⚠️ Duplicate admin user detected. Skipping insert.")


async def tenant_boostrap(engine):
    data = None
    try:
        data = await create_default_tenant(engine)
        await create_default_users(engine, data.id)
        return data
    except Exception:
        if data is not None:
            await engine.remove(db_user_account, db_user_account.tenant_uuid == str(data.id))
            await engine.remove(db_keys, db_keys.id == str(data.id))
            await engine.delete(data)
        raise
