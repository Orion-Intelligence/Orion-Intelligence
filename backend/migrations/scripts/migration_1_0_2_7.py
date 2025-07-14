import asyncio
import json
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX

class migration_1_0_2_7:

    _hash_function_counters = {
        "leak": 0,
        "exploit": 0,
    }

    @staticmethod
    async def migrate(version):
        print(":::::::::::::::: Starting migration to version", version, flush=True)

        index_hash_map = {
            ELASTIC_INDEX.S_GENERIC_INDEX: migration_1_0_2_7.generate_hash_for_leak,
            ELASTIC_INDEX.S_EXPLOIT_INDEX: migration_1_0_2_7.generate_hash_for_exploit,
        }

        elastic = elastic_controller.get_instance()
        print(":::::::::::::::: Got elastic controller instance", flush=True)

        es = elastic.get_connection()
        print(":::::::::::::::: Got elasticsearch connection", flush=True)

        for original_index, hash_func in index_hash_map.items():
            print(f":::::::::::::::: Processing index: {original_index}", flush=True)

            if not await es.indices.exists(index=original_index):
                print(f":::::::::::::::: Index {original_index} does not exist. Skipping.", flush=True)
                continue

            print(f":::::::::::::::: Disabling write block for index: {original_index}", flush=True)
            await es.indices.put_settings(index=original_index, body={"index": {"blocks.write": False}})

            temp_index = f"{original_index}_temp"
            print(f":::::::::::::::: Temp index will be: {temp_index}", flush=True)

            if await es.indices.exists(index=temp_index):
                print(f":::::::::::::::: Deleting existing temp index {temp_index}", flush=True)
                await es.indices.delete(index=temp_index)

            await migration_1_0_2_7.create_new_index(temp_index, source_index=original_index)
            print(f":::::::::::::::: Created new temp index {temp_index}", flush=True)

            print(f":::::::::::::::: Disabling write block for temp index: {temp_index}", flush=True)
            await es.indices.put_settings(index=temp_index, body={"index": {"blocks.write": False}})

            print(f":::::::::::::::: Reindexing from {original_index} to {temp_index}", flush=True)
            reindexed = await migration_1_0_2_7.reindex_with_hash(original_index, temp_index, hash_func)
            print(f":::::::::::::::: Total reindexed documents: {reindexed}", flush=True)

            if reindexed == 0:
                print(f":::::::::::::::: No documents reindexed. Deleting temp index {temp_index}", flush=True)
                await es.indices.delete(index=temp_index)
                continue

            await migration_1_0_2_7.replace_index(original_index, temp_index)
            print(f":::::::::::::::: Replaced index {original_index} with {temp_index}", flush=True)

    @staticmethod
    async def create_new_index(index_name, source_index):
        print(f":::::::::::::::: Creating new index {index_name} from source index {source_index}", flush=True)

        elastic = elastic_controller.get_instance()
        print(":::::::::::::::: Got elastic controller for index creation", flush=True)

        es = elastic.get_connection()
        print(":::::::::::::::: Got elasticsearch connection for index creation", flush=True)

        mapping = await es.indices.get_mapping(index=source_index)
        print(f":::::::::::::::: Retrieved mapping for {source_index}", flush=True)

        settings = await es.indices.get_settings(index=source_index)
        print(f":::::::::::::::: Retrieved settings for {source_index}", flush=True)

        source_mappings = mapping[source_index]["mappings"]
        source_settings = settings[source_index]["settings"]

        index_settings = {
            "number_of_shards": int(source_settings["index"].get("number_of_shards", 1)),
            "number_of_replicas": int(source_settings["index"].get("number_of_replicas", 0)),
            "max_result_window": int(source_settings["index"].get("max_result_window", 1000000)),
        }

        if "analysis" in source_settings["index"]:
            index_settings["analysis"] = source_settings["index"]["analysis"]
            print(f":::::::::::::::: Copied analysis config", flush=True)

        body = {
            "settings": {"index": index_settings},
            "mappings": source_mappings,
        }

        print(f":::::::::::::::: Sending create index request for {index_name}", flush=True)
        await es.indices.create(index=index_name, body=body)

        for i in range(10):
            print(f":::::::::::::::: Checking if index {index_name} exists (attempt {i+1})", flush=True)
            if await es.indices.exists(index=index_name):
                print(f":::::::::::::::: Index {index_name} created successfully", flush=True)
                return
            await asyncio.sleep(0.5)

        raise Exception(f"Index {index_name} was not ready after creation.")

    @staticmethod
    async def reindex_with_hash(source_index, dest_index, hash_func):
        print(f":::::::::::::::: Reindexing documents from {source_index} to {dest_index}", flush=True)

        elastic = elastic_controller.get_instance()
        es = elastic.get_connection()

        scroll = "22m"
        size = 500
        total_reindexed = 0
        total_seen = 0

        print(f":::::::::::::::: Starting initial scroll", flush=True)
        try:
            result = await es.search(index=source_index, scroll=scroll, size=size, _source=True, body={"query": {"match_all": {}}})
        except Exception as e:
            print(f":::::::::::::::: Initial scroll failed: {e}", flush=True)
            return 0

        scroll_id = result.get("_scroll_id")
        docs = result["hits"]["hits"]

        while docs:
            print(f":::::::::::::::: Processing {len(docs)} documents", flush=True)
            bulk_lines = []

            for doc in docs:
                total_seen += 1
                src = doc["_source"]
                m_hash = hash_func(src)

                if not m_hash:
                    continue

                src["m_hash"] = m_hash
                bulk_lines.append(json.dumps({"index": {"_index": dest_index, "_id": m_hash}}))
                bulk_lines.append(json.dumps(src))

            if bulk_lines:
                bulk_body = "\n".join(bulk_lines) + "\n"
                response = await es.bulk(body=bulk_body)
                print(f":::::::::::::::: Sent bulk with {len(bulk_lines)//2} items", flush=True)

                successful = len([
                    item for item in response["items"]
                    if "index" in item and item["index"].get("status", 500) < 300
                ])
                total_reindexed += successful
                print(f":::::::::::::::: Bulk insert success: {successful}", flush=True)

            try:
                result = await es.scroll(scroll_id=scroll_id, scroll=scroll)
                scroll_id = result.get("_scroll_id")
                docs = result["hits"]["hits"]
                print(":::::::::::::::: Fetched next scroll page", flush=True)
            except Exception as e:
                print(f":::::::::::::::: Scroll failed: {e}", flush=True)
                break

        if scroll_id:
            try:
                await es.clear_scroll(scroll_id=scroll_id)
                print(":::::::::::::::: Cleared scroll context", flush=True)
            except Exception:
                print(":::::::::::::::: Failed to clear scroll context", flush=True)

        print(f":::::::::::::::: Reindex complete: {total_reindexed} documents", flush=True)
        return total_reindexed

    @staticmethod
    async def replace_index(old_index, new_index):
        print(f":::::::::::::::: Replacing {old_index} with {new_index}", flush=True)

        elastic = elastic_controller.get_instance()
        es = elastic.get_connection()

        print(f":::::::::::::::: Locking {new_index} for clone", flush=True)
        await es.indices.put_settings(index=new_index, body={"settings": {"index.blocks.write": True}})

        if await es.indices.exists(index=old_index):
            print(f":::::::::::::::: Deleting old index {old_index}", flush=True)
            await es.indices.delete(index=old_index)

        print(f":::::::::::::::: Cloning {new_index} -> {old_index}", flush=True)
        await es.indices.clone(index=new_index, target=old_index)

        for i in range(10):
            print(f":::::::::::::::: Verifying cloned index exists (attempt {i+1})", flush=True)
            if await es.indices.exists(index=old_index):
                break
            await asyncio.sleep(0.5)
        else:
            raise Exception(f"Cloned index '{old_index}' not available after cloning.")

        if await es.indices.exists(index=new_index):
            print(f":::::::::::::::: Deleting temp index {new_index}", flush=True)
            await es.indices.delete(index=new_index)

        await es.indices.put_settings(index=old_index, body={"settings": {"index.blocks.write": False}})
        print(f":::::::::::::::: Finished replacing {old_index}", flush=True)

    # Hash Generators
    @staticmethod
    def generate_hash_for_leak(doc):
        migration_1_0_2_7._hash_function_counters["leak"] += 1
        print(f":::::::::::::::: Generating leak hash", flush=True)
        return helper_controller.generate_data_hash(f"{doc['m_url']}_{doc['m_title']}") \
            if doc.get("m_url") and doc.get("m_title") else None

    @staticmethod
    def generate_hash_for_generic(doc):
        migration_1_0_2_7._hash_function_counters["generic"] += 1
        print(f":::::::::::::::: Generating generic hash", flush=True)
        return helper_controller.generate_data_hash(doc["m_url"]) if doc.get("m_url") else None

    @staticmethod
    def generate_hash_for_defacement(doc):
        migration_1_0_2_7._hash_function_counters["defacement"] += 1
        print(f":::::::::::::::: Generating defacement hash", flush=True)
        return helper_controller.generate_data_hash(doc["m_url"]) if doc.get("m_url") else None

    @staticmethod
    def generate_hash_for_chats(doc):
        migration_1_0_2_7._hash_function_counters["chats"] += 1
        print(f":::::::::::::::: Generating chat hash", flush=True)
        return helper_controller.generate_data_hash(doc["m_message_id"]) if doc.get("m_message_id") else None

    @staticmethod
    def generate_hash_for_exploit(doc):
        migration_1_0_2_7._hash_function_counters["exploit"] += 1
        print(f":::::::::::::::: Generating exploit hash", flush=True)
        return helper_controller.generate_data_hash(f"{doc['m_url']}_{doc['m_title']}") \
            if doc.get("m_url") and doc.get("m_title") else None

    @staticmethod
    def generate_hash_for_credential(doc):
        migration_1_0_2_7._hash_function_counters["credential"] += 1
        print(f":::::::::::::::: Generating credential hash", flush=True)
        return helper_controller.generate_data_hash(f"{doc['u']}_{str(doc['fn'])}") \
            if doc.get("u") and doc.get("fn") else None
