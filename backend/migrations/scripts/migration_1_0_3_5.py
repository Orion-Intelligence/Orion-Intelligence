from elastic_transport import ApiError

from orion.services.log_manager.log_controller import log
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model

try:
    from ._elastic_migration_guard import short_elastic_error, should_skip_elastic_index_error
except ImportError:
    from _elastic_migration_guard import short_elastic_error, should_skip_elastic_index_error


class migration_1_0_3_5:
    INDEX_DATE_FIELDS = {
        ELASTIC_INDEX.S_LEAK_INDEX: [
            "m_date",
            "m_leak_date",
            "m_published_date",
            "m_first_seen",
            "m_last_seen",
            "m_update_date",
            "m_creation_date",
        ],
        ELASTIC_INDEX.S_DEFACEMENT_INDEX: [
            "m_date",
            "m_leak_date",
            "m_update_date",
            "m_creation_date",
        ],
        ELASTIC_INDEX.S_EXPLOIT_INDEX: [
            "m_date",
            "m_leak_date",
            "m_published_date",
            "m_update_date",
            "m_creation_date",
        ],
        ELASTIC_INDEX.S_APT_INDEX: [
            "m_date",
            "m_published_date",
            "m_last_updated",
            "m_update_date",
            "m_creation_date",
        ],
        ELASTIC_INDEX.S_MALWARE_INDEX: [
            "m_date",
            "m_first_seen",
            "m_last_seen",
            "m_update_date",
            "m_creation_date",
        ],
        ELASTIC_INDEX.S_CHATS_INDEX: [
            "m_date",
            "m_message_date",
            "m_forwarded_date",
            "m_update_date",
            "m_creation_date",
        ],
        ELASTIC_INDEX.S_SOCIAL_INDEX: [
            "m_date",
            "m_message_date",
            "m_published_date",
            "m_update_date",
            "m_creation_date",
        ],
    }

    @staticmethod
    async def migrate(version):
        engine = mongo_controller.get_instance().get_engine()

        if engine is None:
            raise Exception("MongoDB is not connected. Migration cannot proceed.")

        es = elastic_controller.get_instance().get_connection()
        if es is None:
            await elastic_controller.get_instance().initialize()
            es = elastic_controller.get_instance().get_connection()

        for index, fields in migration_1_0_3_5.INDEX_DATE_FIELDS.items():
            await migration_1_0_3_5.migrate_index(es, index, fields)

        await migration_1_0_3_5.update_version(engine, version)

    @staticmethod
    async def migrate_index(es, index, fields):
        try:
            await es.indices.put_mapping(
                index=index,
                body={"properties": {"m_date": {"type": "date"}}},
                allow_no_indices=True,
                ignore_unavailable=True,
                request_timeout=220,
            )
        except ApiError as ex:
            if not should_skip_elastic_index_error(ex):
                raise
            log.g().w(f"Skipping migration mapping for unavailable Elasticsearch index {index}: {short_elastic_error(ex)}")
            return

        for attempt in range(2):
            try:
                await es.update_by_query(
                    index=index,
                    body={
                        "script": {
                            "lang": "painless",
                            "source": """
                            def selectedDate = null;

                            for (def field : params.fields) {
                                if (!ctx._source.containsKey(field)) {
                                    continue;
                                }

                                def rawDate = ctx._source.get(field);
                                if (rawDate instanceof List) {
                                    for (def item : rawDate) {
                                        if (item == null) {
                                            continue;
                                        }

                                        def dateText = item.toString().trim();
                                        if (dateText.length() < 10) {
                                            continue;
                                        }

                                        dateText = dateText.substring(0, 10);
                                        if (dateText.substring(4, 5).equals("-") && dateText.substring(7, 8).equals("-")) {
                                            selectedDate = dateText;
                                            break;
                                        }
                                    }
                                } else if (rawDate != null) {
                                    def dateText = rawDate.toString().trim();
                                    if (dateText.length() >= 10) {
                                        dateText = dateText.substring(0, 10);
                                        if (dateText.substring(4, 5).equals("-") && dateText.substring(7, 8).equals("-")) {
                                            selectedDate = dateText;
                                        }
                                    }
                                }

                                if (selectedDate != null) {
                                    break;
                                }
                            }

                            if (selectedDate != null) {
                                ctx._source.put('m_date', selectedDate);
                            }
                        """,
                            "params": {"fields": fields},
                        },
                        "query": {
                            "bool": {
                                "should": [{"exists": {"field": field}} for field in fields],
                                "minimum_should_match": 1,
                            }
                        },
                    },
                    allow_no_indices=True,
                    conflicts="proceed",
                    ignore_unavailable=True,
                    refresh=True,
                    request_timeout=220,
                )
                break
            except ApiError as ex:
                if not should_skip_elastic_index_error(ex):
                    raise

                short_message = short_elastic_error(ex)
                if attempt == 0:
                    log.g().w(f"Retrying migration backfill for Elasticsearch index {index}: {short_message}")
                    continue

                log.g().w(f"Skipping migration backfill for unavailable Elasticsearch index {index}: {short_message}")
                break

    @staticmethod
    async def update_version(engine, version):
        existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing_version_entry is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing_version_entry.value = str(version)
            await engine.save(existing_version_entry)
