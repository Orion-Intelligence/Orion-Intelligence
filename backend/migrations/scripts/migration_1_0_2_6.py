import asyncio
import json
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX


class migration_1_0_2_6:

    _hash_function_counters = {
        "leak": 0,
        "generic": 0,
        "defacement": 0,
        "chats": 0,
        "exploit": 0,
        "credential": 0,
    }

    @staticmethod
    async def migrate(version):
        print(f"[migrate] Starting migration for version: {version}", flush=True)

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
            print(f"[migrate] Processing index: {original_index}", flush=True)

            if not await es.indices.exists(index=original_index):
                print(f"[migrate] Skipping missing index: {original_index}", flush=True)
                continue

            await es.indices.put_settings(index=original_index, body={"index": {"blocks.write": False}})
            temp_index = f"{original_index}_temp"

            if await es.indices.exists(index=temp_index):
                print(f"[migrate] Deleting existing temp index: {temp_index}", flush=True)
                await es.indices.delete(index=temp_index)

            await migration_1_0_2_6.create_new_index(temp_index, source_index=original_index)
            await es.indices.put_settings(index=temp_index, body={"index": {"blocks.write": False}})

            reindexed = await migration_1_0_2_6.reindex_with_hash(original_index, temp_index, hash_func)
            print(f"[migrate] Reindexed {reindexed} documents from {original_index} to {temp_index}", flush=True)

            if reindexed == 0:
                print(f"[migrate] No documents reindexed. Removing temp index: {temp_index}", flush=True)
                await es.indices.delete(index=temp_index)
                continue

            await migration_1_0_2_6.replace_index(original_index, temp_index)
            print(f"[migrate] Replaced index: {original_index} with {temp_index}", flush=True)

    @staticmethod
    async def create_new_index(index_name, source_index):
        print(f"[create_new_index] Creating index: {index_name} from {source_index}", flush=True)
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

        for i in range(10):
            print(f"[create_new_index] Waiting for index creation attempt {i + 1}/10...", flush=True)
            if await es.indices.exists(index=index_name):
                print(f"[create_new_index] Index {index_name} is ready.", flush=True)
                return
            await asyncio.sleep(0.5)

        raise Exception(f"[create_new_index] Index {index_name} was not ready after creation.")

    @staticmethod
    async def reindex_with_hash(source_index, dest_index, hash_func):
        print(f"[reindex_with_hash] Reindexing from {source_index} to {dest_index}", flush=True)
        elastic = elastic_controller.get_instance()
        es = elastic.get_connection()

        scroll = "2m"
        size = 10000
        total_reindexed = 0
        total_seen = 0

        try:
            result = await es.search(index=source_index, scroll=scroll, size=size, _source=True, body={"query": {"match_all": {}}})
        except Exception as e:
            print(f"[reindex_with_hash] Initial search failed: {str(e)}", flush=True)
            return 0

        scroll_id = result.get("_scroll_id")
        docs = result["hits"]["hits"]

        while docs:
            print(f"[reindex_with_hash] Retrieved {len(docs)} documents from scroll", flush=True)
            bulk_lines = []

            for doc in docs:
                total_seen += 1
                src = doc["_source"]
                m_hash = hash_func(src)

                if not m_hash:
                    print(f"[reindex_with_hash] Skipping doc #{total_seen} with no hash", flush=True)
                    continue

                src["m_hash"] = m_hash
                bulk_lines.append(json.dumps({"index": {"_index": dest_index, "_id": m_hash}}))
                bulk_lines.append(json.dumps(src))

            if bulk_lines:
                bulk_body = "\n".join(bulk_lines) + "\n"
                response = await es.bulk(body=bulk_body)

                if response.get("errors"):
                    print("[reindex_with_hash] ⚠️ Bulk operation had errors", flush=True)

                successful = len([
                    item for item in response["items"]
                    if "index" in item and item["index"].get("status", 500) < 300
                ])
                total_reindexed += successful
                print(f"[reindex_with_hash] Indexed batch: {successful} documents (Total so far: {total_reindexed})", flush=True)

            try:
                result = await es.scroll(scroll_id=scroll_id, scroll=scroll)
                scroll_id = result.get("_scroll_id")
                docs = result["hits"]["hits"]
            except Exception as e:
                print(f"[reindex_with_hash] Scroll failed: {str(e)}", flush=True)
                break

        if scroll_id:
            try:
                await es.clear_scroll(scroll_id=scroll_id)
            except Exception as e:
                print(f"[reindex_with_hash] Failed to clear scroll: {str(e)}", flush=True)

        print(f"[reindex_with_hash] Done reindexing {total_reindexed} documents (from {total_seen} total seen)", flush=True)
        return total_reindexed

    @staticmethod
    async def replace_index(old_index, new_index):
        print(f"[replace_index] Replacing {old_index} with {new_index}", flush=True)
        elastic = elastic_controller.get_instance()
        es = elastic.get_connection()

        await es.indices.put_settings(index=new_index, body={"settings": {"index.blocks.write": True}})

        if await es.indices.exists(index=old_index):
            print(f"[replace_index] Deleting old index: {old_index}", flush=True)
            await es.indices.delete(index=old_index)

        await es.indices.clone(index=new_index, target=old_index)

        for i in range(10):
            print(f"[replace_index] Waiting for cloned index availability attempt {i + 1}/10", flush=True)
            if await es.indices.exists(index=old_index):
                break
            await asyncio.sleep(0.5)
        else:
            raise Exception(f"[replace_index] Cloned index '{old_index}' not available after cloning.")

        if await es.indices.exists(index=new_index):
            await es.indices.delete(index=new_index)

        await es.indices.put_settings(index=old_index, body={"settings": {"index.blocks.write": False}})
        print(f"[replace_index] Replacement complete: {new_index} → {old_index}", flush=True)

    @staticmethod
    def generate_hash_for_leak(doc):
        migration_1_0_2_6._hash_function_counters["leak"] += 1
        count = migration_1_0_2_6._hash_function_counters["leak"]
        print(f"[generate_hash_for_leak] Called for doc #{count}", flush=True)
        return helper_controller.generate_data_hash(f"{doc['m_url']}_{doc['m_important_content']}") \
            if doc.get("m_url") and doc.get("m_important_content") else None

    @staticmethod
    def generate_hash_for_generic(doc):
        migration_1_0_2_6._hash_function_counters["generic"] += 1
        count = migration_1_0_2_6._hash_function_counters["generic"]
        print(f"[generate_hash_for_generic] Called for doc #{count}", flush=True)
        return helper_controller.generate_data_hash(doc["m_url"]) if doc.get("m_url") else None

    @staticmethod
    def generate_hash_for_defacement(doc):
        migration_1_0_2_6._hash_function_counters["defacement"] += 1
        count = migration_1_0_2_6._hash_function_counters["defacement"]
        print(f"[generate_hash_for_defacement] Called for doc #{count}", flush=True)
        return helper_controller.generate_data_hash(doc["m_url"]) if doc.get("m_url") else None

    @staticmethod
    def generate_hash_for_chats(doc):
        migration_1_0_2_6._hash_function_counters["chats"] += 1
        count = migration_1_0_2_6._hash_function_counters["chats"]
        print(f"[generate_hash_for_chats] Called for doc #{count}", flush=True)
        return helper_controller.generate_data_hash(doc["m_message_id"]) if doc.get("m_message_id") else None

    @staticmethod
    def generate_hash_for_exploit(doc):
        migration_1_0_2_6._hash_function_counters["exploit"] += 1
        count = migration_1_0_2_6._hash_function_counters["exploit"]
        print(f"[generate_hash_for_exploit] Called for doc #{count}", flush=True)
        return helper_controller.generate_data_hash(f"{doc['m_url']}_{doc['m_important_content']}") \
            if doc.get("m_url") and doc.get("m_important_content") else None

    @staticmethod
    def generate_hash_for_credential(doc):
        migration_1_0_2_6._hash_function_counters["credential"] += 1
        count = migration_1_0_2_6._hash_function_counters["credential"]
        print(f"[generate_hash_for_credential] Called for doc #{count}", flush=True)
        return helper_controller.generate_data_hash(f"{doc['u']}_{str(doc['fn'])}") \
            if doc.get("u") and doc.get("fn") else None
