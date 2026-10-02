from __future__ import annotations

from cryptography.fernet import Fernet
from orion.services.encryption_manager.key_manager import KeyManager
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model
from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model, normalize_tenant_slug
from orion.services.orion_mail_client.orion_mail_client import orion_mail_client


class migration_1_0_3_19:

    @staticmethod
    async def migrate(version):
        engine = mongo_controller.get_instance().get_engine()
        if engine is None:
            raise Exception("MongoDB is not connected. Migration cannot proceed.")

        await migration_1_0_3_19.create_tenant_report_mailboxes(engine)
        await migration_1_0_3_19.update_version(engine, version)

    @staticmethod
    async def create_tenant_report_mailboxes(engine):
        tenants = await engine.find(db_tenant_model)
        for tenant in tenants:
            if getattr(tenant, "report_mailbox_address", None) and getattr(tenant, "report_mailbox_id", None):
                log.g().i(f"MIGRATION 1_0_3_19: Tenant {tenant.id} already has report mailbox {tenant.report_mailbox_address}")
                continue

            slug = getattr(tenant, "slug", None)
            tenant_name = "tenant"
            try:
                dek = await KeyManager.get_instance().get_profile_dek(str(tenant.id))
                enc = Fernet(dek)
                if tenant.name:
                    tenant_name = enc.decrypt(tenant.name.encode()).decode()
            except Exception:
                pass

            if not slug:
                slug = normalize_tenant_slug(tenant_name) or f"tenant-{str(tenant.id)[:8]}"
                tenant.slug = slug

            try:
                mailbox_data = await orion_mail_client.get_instance().create_tenant_mailbox(tenant_id=str(tenant.id), tenant_slug=slug, tenant_name=tenant_name)
                tenant.report_mailbox_address = mailbox_data.get("mailbox_address")
                tenant.report_mailbox_id = mailbox_data.get("mailbox_id")
                await engine.save(tenant)
                log.g().i(f"MIGRATION 1_0_3_19: Created report mailbox {tenant.report_mailbox_address} for tenant {tenant.id}")
            except Exception as exc:
                log.g().w(f"MIGRATION 1_0_3_19: Could not create report mailbox for tenant {tenant.id} via Orion Mail: {exc}")
                default_address = f"{slug}_report@mail.orionintelligence.org"
                tenant.report_mailbox_address = tenant.report_mailbox_address or default_address
                await engine.save(tenant)

    @staticmethod
    async def update_version(engine, version):
        existing = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing.value = str(version)
            await engine.save(existing)
