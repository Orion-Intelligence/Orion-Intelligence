from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX


class migration_1_0_2_5:

    @staticmethod
    async def migrate(version):
        index_list = [
            ELASTIC_INDEX.S_DEFACEMENT_INDEX,
        ]

        for index_name in index_list:
            await migration_1_0_2_5.update_mapping(index_name)

    @staticmethod
    async def update_mapping(index_name):
        elastic = elastic_controller.get_instance()
        es_connection = elastic.get_connection()
        if not es_connection:
            raise Exception("Elasticsearch connection not initialized")

        new_mapping = {
            "properties": {
                "m_ip": {
                    "type": "ip"
                }
            }
        }

        await es_connection.indices.put_mapping(index=index_name, body=new_mapping)
        print(f"✅ Mapping updated for index: {index_name}")
