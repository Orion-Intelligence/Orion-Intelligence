from elastic_transport import ApiError

from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model


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
        try:
            await es.update_by_query(
                index=ELASTIC_INDEX.S_EXPLOIT_INDEX,
                body={
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
                },
                allow_no_indices=True,
                conflicts="proceed",
                ignore_unavailable=True,
                refresh=True,
                request_timeout=220,
            )
        except ApiError as ex:
            status_code = getattr(ex, "status_code", None) or getattr(getattr(ex, "meta", None), "status", None)
            if status_code != 503:
                raise
            log.g().w(f"Skipping invalid CVSS cleanup for unavailable Elasticsearch index {ELASTIC_INDEX.S_EXPLOIT_INDEX}: {str(ex)}")

    @staticmethod
    async def update_version(engine, version):
        existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing_version_entry is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing_version_entry.value = str(version)
            await engine.save(existing_version_entry)
