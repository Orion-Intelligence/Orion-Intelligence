from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model

try:
    from ._elastic_migration_guard import run_update_by_query_with_progress
except ImportError:
    from _elastic_migration_guard import run_update_by_query_with_progress


class migration_1_0_3_9:
    @staticmethod
    async def migrate(version):
        engine = mongo_controller.get_instance().get_engine()

        if engine is None:
            raise Exception("MongoDB is not connected. Migration cannot proceed.")

        es = elastic_controller.get_instance().get_connection()
        if es is None:
            await elastic_controller.get_instance().initialize()
            es = elastic_controller.get_instance().get_connection()

        await migration_1_0_3_9.remove_invalid_cvss_values(es)
        await migration_1_0_3_9.update_version(engine, version)

    @staticmethod
    async def remove_invalid_cvss_values(es):
        body = {
            "script": {
                "lang": "painless",
                "source": """
                if (!ctx._source.containsKey('m_cvss')) {
                    return;
                }

                def cvss = ctx._source.get('m_cvss');
                def values = cvss instanceof List ? cvss : [cvss];
                def cleaned = new ArrayList();

                for (def value : values) {
                    if (value == null) {
                        continue;
                    }
                    if (value instanceof Number) {
                        cleaned.add(value);
                        continue;
                    }
                    try {
                        cleaned.add(Double.parseDouble(value.toString()));
                    } catch (Exception ignored) {
                    }
                }

                if (cleaned.isEmpty()) {
                    ctx._source.remove('m_cvss');
                } else {
                    ctx._source.put('m_cvss', cleaned);
                }
            """,
            },
            "query": {"exists": {"field": "m_cvss"}},
        }
        await run_update_by_query_with_progress(es, ELASTIC_INDEX.S_EXPLOIT_INDEX, body, "1_0_3_9 m_cvss cleanup")

    @staticmethod
    async def update_version(engine, version):
        existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing_version_entry is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing_version_entry.value = str(version)
            await engine.save(existing_version_entry)
