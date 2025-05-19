from orion.api.interactive.dump_manager.dump_shared_model.dump_callback_model import dump_callback_model, dump_callback_link
from orion.api.interactive.dump_manager.dump_shared_model.dump_param_model import dump_param_model
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_dump_model import db_dump_record_model
from datetime import datetime, timedelta


class dump_model:

    # Private Variables
    __instance = None

    @staticmethod
    def getInstance():
        if dump_model.__instance is None:
            dump_model.__instance = dump_model()
        return dump_model.__instance

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()

    async def fetch_filtered_dumps(self, params: dump_param_model):
        query = {}

        if params.source != "all":
            query["source"] = params.source

        if params.group != "all":
            query["group"] = params.group

        if params.parsed_status != "all":
            query["parsed_status"] = params.parsed_status

        if params.mDateRange:
            try:
                start_str, end_str = [s.strip() for s in params.mDateRange.split(",")]
                start_date = datetime.strptime(start_str, "%Y-%m-%d")
                end_date = datetime.strptime(end_str, "%Y-%m-%d") + timedelta(days=1)

                query["created_at"] = {
                    "$gte": start_date,
                    "$lt": end_date
                }

                print(">>> Date range filter:", query["created_at"], flush=True)

            except Exception as e:
                print(">>> Date parsing error:", e, flush=True)

        total_count = await self._engine.count(db_dump_record_model, query)
        data = await self._engine.find(
            db_dump_record_model,
            query,
            skip=(params.page - 1) * 100,
            limit=100
        )
        return data, total_count

    async def invoke_dump(self, param: dump_param_model):
        results, total_count = await self.fetch_filtered_dumps(param)
        return dump_callback_model(
            total_count=total_count,
            page=param.page,
            mDumpCallbackLinks=[dump_callback_link.from_odmantic(doc) for doc in results]
        )
