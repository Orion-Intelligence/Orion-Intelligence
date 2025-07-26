from time import sleep

from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS, ELASTIC_INDEX
from orion.services.mongo_manager.mongo_controller import mongo_controller


class migration_1_0_2_2:

    @staticmethod
    async def migrate(version):
        engine = mongo_controller.get_instance().get_engine()

        if engine is None:
            raise Exception("MongoDB is not connected. Migration cannot proceed.")

        await migration_1_0_2_2.update_version(engine, version)

    @staticmethod
    async def update_version(engine, version):
        await migration_1_0_2_2.update_leak_index()
        await migration_1_0_2_2.update_defacement_index()

    @staticmethod
    async def update_leak_index():
        sleep(5)
        migration_count = 0
        leak = ELASTIC_INDEX.S_LEAK_INDEX
        elastic = elastic_controller.get_instance()
        es_connection = elastic.get_connection()
        if not es_connection:
            raise Exception("Elasticsearch connection not initialized")
        query = {"query": {"match_all": {}}}
        search_result = await es_connection.search(
            index=leak,
            body=query,
            size=10000
        )
        hits = search_result.get("hits", {}).get("hits", [])
        if not hits:
            return True, "No documents to process"
        for hit in hits:
            doc_id = hit["_id"]
            original_data = hit["_source"]
            await es_connection.delete(index=leak, id=doc_id, ignore=[404])
            new_data = original_data.copy()
            new_data["m_hash"] = helper_controller.generate_data_hash(
                new_data["m_url"] + "_" + new_data["m_important_content"])
            entry = {
                ELASTIC_KEYS.S_DOCUMENT: leak,
                ELASTIC_KEYS.S_VALUE: new_data
            }
            success, error = await elastic.index_data(entry)
            migration_count = migration_count + 1
            if not success:
                return False, f"Re-indexing failed: {error}"
        return True, None

    @staticmethod
    async def update_defacement_index():
        migration_count = 0
        leak = ELASTIC_INDEX.S_DEFACEMENT_INDEX
        elastic = elastic_controller.get_instance()
        es_connection = elastic.get_connection()
        if not es_connection:
            raise Exception("Elasticsearch connection not initialized")
        query = {"query": {"match_all": {}}}
        search_result = await es_connection.search(
            index=leak,
            body=query,
            size=1000,
            scroll="2m"
        )
        hits = search_result.get("hits", {}).get("hits", [])
        scroll_id = search_result.get("_scroll_id")
        if not hits:
            return True, "No documents to process"
        while hits:
            for hit in hits:
                doc_id = hit["_id"]
                original_data = hit["_source"]
                await es_connection.delete(index=leak, id=doc_id, ignore=[404])
                new_data = original_data.copy()
                if "m_mirror_links" in new_data and new_data["m_mirror_links"] and len(new_data["m_mirror_links"]) > 0:
                    new_data["m_url"] = new_data["m_mirror_links"][0].replace(
                        "https://zone-xsec.com/view/defaced/~",
                        "https://zone-xsec.com/mirror/id"
                    )
                else:
                    new_data["m_url"] = "https://zone-xsec.com/mirror/id/default"
                new_data["m_hash"] = helper_controller.generate_data_hash(new_data["m_url"])
                entry = {
                    ELASTIC_KEYS.S_DOCUMENT: leak,
                    ELASTIC_KEYS.S_VALUE: new_data
                }
                migration_count = migration_count + 1
                success, error = await elastic.index_data(entry)
                if not success:
                    return False, f"Re-indexing failed: {error}"
            search_result = await es_connection.scroll(
                scroll_id=scroll_id,
                scroll="2m"
            )
            hits = search_result.get("hits", {}).get("hits", [])
            scroll_id = search_result.get("_scroll_id")
        await es_connection.clear_scroll(scroll_id=scroll_id)
        return True, None
