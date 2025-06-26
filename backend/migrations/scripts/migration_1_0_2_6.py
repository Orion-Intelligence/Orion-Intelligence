import asyncio
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX


class migration_1_0_2_6:

    @staticmethod
    async def migrate(version):
        index_hash_map = {
            ELASTIC_INDEX.S_LEAK_INDEX: migration_1_0_2_6.generate_hash_for_leak,
            ELASTIC_INDEX.S_GENERIC_INDEX: migration_1_0_2_6.generate_hash_for_generic,
            ELASTIC_INDEX.S_DEFACEMENT_INDEX: migration_1_0_2_6.generate_hash_for_defacement,
            ELASTIC_INDEX.S_CHATS_INDEX: migration_1_0_2_6.generate_hash_for_chats,
            ELASTIC_INDEX.S_EXPLOIT_INDEX: migration_1_0_2_6.generate_hash_for_exploit,
            ELASTIC_INDEX.S_CREDENTIAL_INDEX: migration_1_0_2_6.generate_hash_for_credential,
        }

        elastic = elastic_controller.get_instance()
        es = elastic.get_connection()

        for original_index, hash_func in index_hash_map.items():
            if not await es.indices.exists(index=original_index):
                continue

            # ⚠️ Unblock write if blocked
            await es.indices.put_settings(index=original_index, body={"index": {"blocks.write": False}})

            temp_index = f"{original_index}_temp"

            if await es.indices.exists(index=temp_index):
                await es.indices.delete(index=temp_index)

            await migration_1_0_2_6.create_new_index(temp_index, source_index=original_index)

            # ⚠️ Ensure temp index also writable
            await es.indices.put_settings(index=temp_index, body={"index": {"blocks.write": False}})

            reindexed = await migration_1_0_2_6.reindex_with_hash(original_index, temp_index, hash_func)

            if reindexed == 0:
                await es.indices.delete(index=temp_index)
                continue

            await migration_1_0_2_6.replace_index(original_index, temp_index)

    @staticmethod
    async def create_new_index(index_name, source_index):
        elastic = elastic_controller.get_instance()
        es = elastic.get_connection()

        mapping = await es.indices.get_mapping(index=source_index)
        settings = await es.indices.get_settings(index=source_index)

        source_mappings = mapping[source_index]["mappings"]
        source_settings = settings[source_index]["settings"]

        index_settings = {
            "number_of_shards": int(source_settings["index"].get("number_of_shards", 1)),
            "number_of_replicas": int(source_settings["index"].get("number_of_replicas", 0)),
            "max_result_window": int(source_settings["index"].get("max_result_window", 1000000)),
        }

        if "analysis" in source_settings["index"]:
            index_settings["analysis"] = source_settings["index"]["analysis"]

        body = {
            "settings": {"index": index_settings},
            "mappings": source_mappings,
        }

        await es.indices.create(index=index_name, body=body)

        for _ in range(10):
            if await es.indices.exists(index=index_name):
                return
            await asyncio.sleep(0.5)

        raise Exception(f"Index {index_name} was not ready after creation.")

    @staticmethod
    async def reindex_with_hash(source_index, dest_index, hash_func):
        elastic = elastic_controller.get_instance()
        es = elastic.get_connection()

        # ⚠️ Ensure destination index is writable
        await es.indices.put_settings(index=dest_index, body={"index": {"blocks.write": False}})

        scroll = "1m"
        size = 1000
        total_reindexed = 0

        result = await es.search(index=source_index, scroll=scroll, size=size, _source=True, body={"query": {"match_all": {}}})
        scroll_id = result.get("_scroll_id")
        docs = result["hits"]["hits"]

        while docs:
            for doc in docs:
                src = doc["_source"]
                m_hash = hash_func(src)
                if not m_hash:
                    continue

                src["m_hash"] = m_hash
                await es.index(index=dest_index, id=m_hash, body=src)
                total_reindexed += 1

            result = await es.scroll(scroll_id=scroll_id, scroll=scroll)
            scroll_id = result.get("_scroll_id")
            docs = result["hits"]["hits"]

        await es.clear_scroll(scroll_id=scroll_id)
        return total_reindexed

    @staticmethod
    async def replace_index(old_index, new_index):
        elastic = elastic_controller.get_instance()
        es = elastic.get_connection()

        await es.indices.put_settings(index=new_index, body={"settings": {"index.blocks.write": True}})

        if await es.indices.exists(index=old_index):
            await es.indices.delete(index=old_index)

        await es.indices.clone(index=new_index, target=old_index)

        for _ in range(10):
            if await es.indices.exists(index=old_index):
                break
            await asyncio.sleep(0.5)
        else:
            raise Exception(f"Cloned index '{old_index}' not available after cloning.")

        if await es.indices.exists(index=new_index):
            await es.indices.delete(index=new_index)
        await es.indices.put_settings(index=old_index, body={"settings": {"index.blocks.write": False}})

    @staticmethod
    def generate_hash_for_leak(doc):
        if doc.get("m_url") and doc.get("m_important_content"):
            return helper_controller.generate_data_hash(f"{doc['m_url']}_{doc['m_important_content']}")
        return None

    @staticmethod
    def generate_hash_for_generic(doc):
        if doc.get("m_url"):
            return helper_controller.generate_data_hash(doc["m_url"])
        return None

    @staticmethod
    def generate_hash_for_defacement(doc):
        if doc.get("m_url"):
            return helper_controller.generate_data_hash(doc["m_url"])
        return None

    @staticmethod
    def generate_hash_for_chats(doc):
        if doc.get("m_message_id"):
            return helper_controller.generate_data_hash(doc["m_message_id"])
        return None

    @staticmethod
    def generate_hash_for_exploit(doc):
        if doc.get("m_url") and doc.get("m_important_content"):
            return helper_controller.generate_data_hash(f"{doc['m_url']}_{doc['m_important_content']}")
        return None

    @staticmethod
    def generate_hash_for_credential(doc):
        if doc.get("u") and doc.get("fn"):
            return helper_controller.generate_data_hash(f"{doc['u']}_{str(doc['fn'])}")
        return None
