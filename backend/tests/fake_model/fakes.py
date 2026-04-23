from __future__ import annotations

from typing import Any

from orion.services.redis_manager.redis_enums import REDIS_COMMANDS


class FakeDoc:
    def __init__(self, **data: Any):
        normalized: dict[str, Any] = {str(key): value for key, value in data.items()}
        object.__setattr__(self, "_data", normalized)

    def __getattr__(self, name: str) -> Any:
        try:
            return self._data[name]
        except KeyError as exc:
            raise AttributeError(name) from exc

    def __setattr__(self, name: str, value: Any) -> None:
        self._data[name] = value

    def dict(self) -> dict[str, Any]:
        return self._data.copy()


class FakeAuditManager:
    def __init__(self):
        self.calls = []

    async def register(self, tenant_id: str, user_id: str, action: str):
        self.calls.append((tenant_id, user_id, action))


class FakeMongoEngine:
    def __init__(self, records=None, find_one_results=None):
        if records is None:
            self.records = []
        elif isinstance(records, (list, tuple)):
            self.records = list(records)
        else:
            self.records = [records]
        self.find_one_results = list(find_one_results or [])
        self.saved = []
        self.deleted = []
        self.removed = []
        self.count_result = 0

    async def find_one(self, *_args, **_kwargs):
        if self.find_one_results:
            return self.find_one_results.pop(0)
        return self.records[0] if self.records else None

    async def find(self, *_args, **_kwargs):
        return list(self.records)

    async def save(self, model):
        self.saved.append(model)
        if self.records:
            self.records[0] = model
        else:
            self.records.append(model)
        return model

    async def delete(self, model):
        self.deleted.append(model)
        if model in self.records:
            self.records.remove(model)
        return True

    async def remove(self, *args, **kwargs):
        self.removed.append((args, kwargs))
        return True

    async def count(self, *args, **kwargs):
        return self.count_result


class FakeElastic:
    def __init__(self):
        self.index_calls = []
        self.dump_index_calls = []
        self.search_calls = []
        self.search_query_calls = []
        self.search_consolidated_calls = []
        self.get_calls = []
        self.get_doc_calls = []
        self.delete_calls = []
        self.search_result = {}
        self.search_query_result = (True, {})
        self.search_consolidated_result = {}
        self.get_result = {}
        self.get_doc_result = []

    async def index_data(self, payload, bypass_empty_embedding=False):
        self.index_calls.append((payload, bypass_empty_embedding))
        return True

    async def index_dump(self, payload):
        self.dump_index_calls.append(payload)
        return True

    async def search_data(self, *args, **kwargs):
        self.search_calls.append((args, kwargs))
        return self.search_result

    async def search_query(self, document, data_filter):
        self.search_query_calls.append((document, data_filter))
        return self.search_query_result

    async def search_consolidated_ranked_query(self, indices, query, indices_boost=None):
        self.search_consolidated_calls.append((indices, query, indices_boost))
        return self.search_consolidated_result

    async def get_data(self, *args, **kwargs):
        self.get_calls.append((args, kwargs))
        return self.get_result

    async def get_doc(self, index, doc_id):
        self.get_doc_calls.append((index, doc_id))
        return self.get_doc_result

    async def delete_data(self, *args, **kwargs):
        self.delete_calls.append((args, kwargs))
        return True


FakeEngine = FakeMongoEngine


class FakeRedis:
    def __init__(self):
        self.calls = []
        self.values = {}

    async def invoke_trigger(self, command, payload):
        self.calls.append((command, payload))

        if command == REDIS_COMMANDS.S_GET_STRING:
            return self.values.get(payload[0])

        if command == REDIS_COMMANDS.S_SET_STRING:
            self.values[payload[0]] = payload[1]
            return True

        return None
