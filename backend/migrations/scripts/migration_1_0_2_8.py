import asyncio
import json
import hashlib
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX, ELASTIC_ENUMS


class migration_1_0_2_8:

    @staticmethod
    async def migrate(version):
        elastic = elastic_controller.get_instance()
        es = elastic.get_connection()

        index_name = ELASTIC_INDEX.S_STEALERLOGS_INDEX
        temp_index = f"{index_name}_temp"

        if await es.indices.exists(index=temp_index):
            print(f"[MIGRATION] Deleting existing temp index '{temp_index}'...")
            await es.indices.delete(index=temp_index)

        print(f"[MIGRATION] Creating temporary index '{temp_index}'...")
        await es.indices.create(index=temp_index, body=ELASTIC_ENUMS.mapping_stealer_log_model)

        await es.indices.put_settings(index=temp_index, body={"index": {"blocks.write": False}})

        if not await es.indices.exists(index=index_name):
            print(f"[MIGRATION] Index '{index_name}' does not exist. Skipping reindex.")
            return

        count = await migration_1_0_2_8.reindex_data(index_name, temp_index)
        print(f"[MIGRATION] Total successfully reindexed: {count['indexed']}, skipped: {count['skipped']}")

        if count["indexed"] > 0:
            print(f"[MIGRATION] Replacing old index '{index_name}' with '{temp_index}'...")
            await migration_1_0_2_8.replace_index(index_name, temp_index)

    @staticmethod
    async def reindex_data(source_index, dest_index):
        elastic = elastic_controller.get_instance()
        es = elastic.get_connection()

        scroll = "15m"
        size = 10000
        total_indexed = 0
        total_skipped = 0
        batch_count = 0

        try:
            result = await es.search(index=source_index, scroll=scroll, size=size, _source=True, body={"query": {"match_all": {}}})
        except Exception as e:
            print(f"[ERROR] Initial search failed: {e}")
            return {"indexed": 0, "skipped": 0}

        scroll_id = result.get("_scroll_id")
        docs = result["hits"]["hits"]

        while docs:
            bulk_lines = []

            for doc in docs:
                src = doc["_source"]
                log_value = src.get("log", "")
                if not isinstance(log_value, str) or len(log_value.encode("utf-8")) > 32766:
                    total_skipped += 1
                    continue

                m_hash = hashlib.sha256(log_value.encode("utf-8")).hexdigest()
                src["m_hash"] = m_hash

                bulk_lines.append(json.dumps({"index": {"_index": dest_index, "_id": m_hash}}))
                bulk_lines.append(json.dumps(src))

            if bulk_lines:
                bulk_body = "\n".join(bulk_lines) + "\n"
                response = await es.bulk(body=bulk_body)

                success_count = len([
                    item for item in response["items"]
                    if "index" in item and item["index"].get("status", 500) < 300
                ])
                total_indexed += success_count
                batch_count += 1
                print(f"[BATCH {batch_count}] Indexed: {success_count}, Skipped so far: {total_skipped}")

            try:
                result = await es.scroll(scroll_id=scroll_id, scroll=scroll)
                scroll_id = result.get("_scroll_id")
                docs = result["hits"]["hits"]
            except Exception as e:
                print(f"[ERROR] Scroll failed: {e}")
                break

        if scroll_id:
            try:
                await es.clear_scroll(scroll_id=scroll_id)
            except Exception:
                pass

        return {"indexed": total_indexed, "skipped": total_skipped}

    @staticmethod
    async def replace_index(old_index, new_index):
        elastic = elastic_controller.get_instance()
        es = elastic.get_connection()

        await es.indices.put_settings(index=new_index, body={"settings": {"index.blocks.write": True}})
        await es.indices.delete(index=old_index)
        await es.indices.clone(index=new_index, target=old_index)

        for _ in range(10):
            if await es.indices.exists(index=old_index):
                break
            await asyncio.sleep(0.5)

        await es.indices.delete(index=new_index)
        await es.indices.put_settings(index=old_index, body={"settings": {"index.blocks.write": False}})
