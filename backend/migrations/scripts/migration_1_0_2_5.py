from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX


class migration_1_0_2_5:

  @staticmethod
  async def migrate(version):
    original_index = ELASTIC_INDEX.S_DEFACEMENT_INDEX
    temp_index = f"{original_index}_temp"

    await migration_1_0_2_5.create_new_index(temp_index)
    await migration_1_0_2_5.reindex_data(original_index, temp_index)
    await migration_1_0_2_5.replace_index(original_index, temp_index)

  @staticmethod
  async def create_new_index(index_name):
    elastic = elastic_controller.get_instance()
    es_connection = elastic.get_connection()

    if not es_connection:
      raise Exception("Elasticsearch connection not initialized")

    new_mapping = {"mappings": {"properties": {"m_ip": {"type": "ip"}}}}

    await es_connection.indices.create(index=index_name, body=new_mapping)

  @staticmethod
  async def reindex_data(source_index, destination_index):
    elastic = elastic_controller.get_instance()
    es_connection = elastic.get_connection()

    reindex_body = {"source": {"index": source_index}, "dest": {"index": destination_index}}

    await es_connection.reindex(body=reindex_body, wait_for_completion=True)

  @staticmethod
  async def replace_index(old_index, new_index):
    elastic = elastic_controller.get_instance()
    es_connection = elastic.get_connection()

    await es_connection.indices.delete(index=old_index)
    await es_connection.indices.create(
      index=old_index, body={"mappings": {"properties": {"m_ip": {"type": "ip"}}}})

    await migration_1_0_2_5.reindex_data(new_index, old_index)
    await es_connection.indices.delete(index=new_index)
