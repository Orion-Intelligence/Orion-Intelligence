from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_alert_model import db_alert_model
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model


class migration_1_0_3_13:

    @staticmethod
    async def migrate(version):
        engine = mongo_controller.get_instance().get_engine()

        if engine is None:
            raise Exception("MongoDB is not connected. Migration cannot proceed.")

        await migration_1_0_3_13.migrate_alerts(engine)
        await migration_1_0_3_13.update_version(engine, version)

    @staticmethod
    async def migrate_alerts(engine):
        documents = await engine.find(db_alert_model)
        for document in documents:
            changed = False

            for alert in document.alerts:
                if not hasattr(alert, "licenses"):
                    alert.licenses = []
                    changed = True
                if not hasattr(alert, "raw_findings"):
                    alert.raw_findings = {}
                    changed = True
                if not hasattr(alert, "risk"):
                    alert.risk = ""
                    changed = True
                if not hasattr(alert, "is_deleted"):
                    alert.is_deleted = False
                    changed = True

            if changed:
                await engine.save(document)

    @staticmethod
    async def update_version(engine, version):
        existing = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing.value = str(version)
            await engine.save(existing)