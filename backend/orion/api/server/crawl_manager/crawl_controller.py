from orion.api.server.crawl_manager.class_model import entity_model
from orion.api.server.crawl_manager.class_model.chat_model import chat_data_model
from orion.api.server.crawl_manager.class_model.defacement_model import DefacementDataModel
from orion.api.server.crawl_manager.class_model.dump_model import DumpModel
from orion.api.server.crawl_manager.class_model.exploit_model import ExploitDataModel
from orion.api.server.crawl_manager.class_model.general_model import GeneralDataModel
from orion.api.server.crawl_manager.class_model.leak_model import LeakDataModel
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.api.server.entity_manager.entity_manager import entity_manager


class crawl_controller:
    # Private Variables
    __instance = None
    __crawl_model = None

    # Initializations
    @staticmethod
    def getInstance():
        if crawl_controller.__instance is None:
            crawl_controller()
        return crawl_controller.__instance

    def __init__(self):
        if crawl_controller.__instance is not None:
            pass
        else:
            crawl_controller.__instance = self
            self.__crawl_model = crawl_model()

    async def invoke_defacement_index(self, leak_index: DefacementDataModel):
        return await self.__crawl_model.init_defacement(leak_index)

    async def invoke_leak_index(self, leak_index: LeakDataModel):
        return await self.__crawl_model.init_leak(leak_index)

    async def invoke_exploit_index(self, exploit_index: ExploitDataModel):
        return await self.__crawl_model.init_exploit(exploit_index)

    async def invoke_generic_index(self, leak_index: GeneralDataModel):
        return await self.__crawl_model.init_general(leak_index)

    async def parse_chat(self, model):
        return await self.__crawl_model.parse_chat(model)

    async def parse_chat_ai(self, model):
        return await self.__crawl_model.parse_chat_ai(model)

    async def parse_summarize_ai(self, model):
        return await self.__crawl_model.parse_summarize_ai(model)

    async def invoke_chat_index(self, leak_index: chat_data_model):
        return await self.__crawl_model.invoke_chat_index(leak_index)

    @staticmethod
    async def invoke_entity_index(entity: entity_model):
        return await entity_manager.get_instance().create_or_update_entity_nodes(entity)

    async def invoke_dump_index(self, dump_index: DumpModel):
        return await self.__crawl_model.index_dump_record(dump_index)

    async def invoke_fetch_parser(self):
        return await self.__crawl_model.fetch_parser()

    async def invoke_fetch_feeder(self, index_type):
        return await self.__crawl_model.fetch_feeder(index_type)
