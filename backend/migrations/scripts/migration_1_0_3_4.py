from elastic_transport import ApiError

from orion.services.log_manager.log_controller import log
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys, db_system_model


class migration_1_0_3_4:
    INDEX_DATE_FIELDS = {
        ELASTIC_INDEX.S_LEAK_INDEX: ["m_leak_date"],
        ELASTIC_INDEX.S_DEFACEMENT_INDEX: ["m_leak_date"],
        ELASTIC_INDEX.S_EXPLOIT_INDEX: ["m_leak_date"],
        ELASTIC_INDEX.S_APT_INDEX: ["m_leak_date"],
        ELASTIC_INDEX.S_MALWARE_INDEX: ["m_leak_date"],
        ELASTIC_INDEX.S_CHATS_INDEX: ["m_message_date"],
        ELASTIC_INDEX.S_SOCIAL_INDEX: ["m_message_date"],
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

        for index, fields in migration_1_0_3_4.INDEX_DATE_FIELDS.items():
            await migration_1_0_3_4.migrate_index(es, index, fields)

        await migration_1_0_3_4.update_version(engine, version)

    @staticmethod
    async def migrate_index(es, index, fields):
        await es.indices.put_mapping(
            index=index,
            body={"properties": {"m_date": {"type": "date"}}},
            allow_no_indices=True,
            ignore_unavailable=True,
            request_timeout=220,
        )

        try:
            await es.update_by_query(
                index=index,
                body={
                    "script": {
                        "lang": "painless",
                        "source": """
                            def currentDate = ctx._source.get('m_date');
                            boolean hasMDate = currentDate != null && currentDate != '';

                            for (def field : params.fields) {
                                def legacyDate = ctx._source.get(field);
                                if (!hasMDate && legacyDate != null && legacyDate != '') {
                                    ctx._source.put('m_date', legacyDate);
                                    hasMDate = true;
                                }
                                ctx._source.remove(field);
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
        except ApiError as ex:
            status_code = getattr(ex, "status_code", None) or getattr(getattr(ex, "meta", None), "status", None)
            if status_code != 503:
                raise
            log.g().w(f"Skipping migration backfill for unavailable Elasticsearch index {index}: {str(ex)}")

    @staticmethod
    async def update_version(engine, version):
        existing_version_entry = await engine.find_one(db_system_model, db_system_model.key == AllowedKeys.VERSION)
        if existing_version_entry is None:
            await engine.save(db_system_model(key=AllowedKeys.VERSION, value=str(version)))
        else:
            existing_version_entry.value = str(version)
            await engine.save(existing_version_entry)
