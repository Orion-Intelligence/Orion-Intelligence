from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model

try:
    from ._elastic_migration_guard import run_update_by_query_with_progress
except ImportError:
    from _elastic_migration_guard import run_update_by_query_with_progress


class migration_1_0_3_11:
    PLATFORM_LIST_INDICES = [
        ELASTIC_INDEX.S_EXPLOIT_INDEX,
        ELASTIC_INDEX.S_APT_INDEX,
        ELASTIC_INDEX.S_MALWARE_INDEX,
        ELASTIC_INDEX.S_SOCIAL_INDEX,
    ]

    @staticmethod
    async def migrate(version):
        engine = mongo_controller.get_instance().get_engine()

        if engine is None:
            raise Exception("MongoDB is not connected. Migration cannot proceed.")

        es = elastic_controller.get_instance().get_connection()
        if es is None:
            await elastic_controller.get_instance().initialize()
            es = elastic_controller.get_instance().get_connection()

        for index in migration_1_0_3_11.PLATFORM_LIST_INDICES:
            await migration_1_0_3_11.migrate_index(es, index)

        await migration_1_0_3_11.update_version(engine, version)

    @staticmethod
    async def migrate_index(es, index):
        body = {
            "script": {
                "lang": "painless",
                "source": """
                if (!ctx._source.containsKey('m_platform')) {
                    return;
                }

                def platform = ctx._source.get('m_platform');
                if (platform == null) {
                    ctx._source.remove('m_platform');
                    return;
                }

                def values = platform instanceof List ? platform : [platform];
                def cleaned = new ArrayList();
                for (def value : values) {
                    if (value == null) {
                        continue;
                    }
                    def text = value.toString().trim();
                    if (text.length() > 0) {
                        cleaned.add(text);
                    }
                }

                if (cleaned.isEmpty()) {
                    ctx._source.remove('m_platform');
                } else {
                    ctx._source.put('m_platform', cleaned);
                }
            """,
            },
            "query": {"exists": {"field": "m_platform"}},
        }
        await run_update_by_query_with_progress(es, index, body, "1_0_3_11 m_platform cleanup")

    @staticmethod
    async def update_version(engine, version):
        existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing_version_entry is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing_version_entry.value = str(version)
            await engine.save(existing_version_entry)
