from elastic_transport import ApiError

from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model


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
        for attempt in range(2):
            try:
                await es.update_by_query(
                    index=index,
                    body={
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
                    },
                    allow_no_indices=True,
                    conflicts="proceed",
                    ignore_unavailable=True,
                    refresh=True,
                    request_timeout=220,
                )
                break
            except ApiError as ex:
                if not migration_1_0_3_11.should_skip_index_error(ex):
                    raise

                short_message = str(ex)[:500]
                if attempt == 0:
                    log.g().w(f"Retrying m_platform list migration for Elasticsearch index {index}: {short_message}")
                    continue

                log.g().w(f"Skipping m_platform list migration for unavailable Elasticsearch index {index}: {short_message}")
                break

    @staticmethod
    def should_skip_index_error(ex):
        status_code = getattr(ex, "status_code", None) or getattr(getattr(ex, "meta", None), "status", None)
        if status_code == 503:
            return True
        if status_code != 404:
            return False

        message = str(ex).lower()
        return any(marker in message for marker in (
            "index_not_found_exception",
            "no search context found",
            "no such index",
            "search_context_missing_exception",
        ))

    @staticmethod
    async def update_version(engine, version):
        existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing_version_entry is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing_version_entry.value = str(version)
            await engine.save(existing_version_entry)
