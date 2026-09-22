from __future__ import annotations

import asyncio
from types import SimpleNamespace

from elastic_transport import ApiError


def _run(coro):
    return asyncio.run(coro)


class FakeApiError(ApiError):
    def __init__(self, message="", status_code=None):
        self.message = message
        self.status_code = status_code

    def __str__(self):
        return self.message


class FakeIndices:
    def __init__(self, existing=None, mapping_result=None, create_error=None, exists_error=None):
        self.existing = set(existing or [])
        self.created = {}
        self.settings = {}
        self.put_mappings = []
        self.mapping_result = mapping_result or {}
        self.create_error = create_error
        self.exists_error = exists_error
        self.refreshed = []

    async def exists(self, index=None, request_timeout=None):
        if self.exists_error is not None:
            raise self.exists_error
        return index in self.existing

    async def create(self, index=None, body=None, request_timeout=None):
        if self.create_error is not None:
            raise self.create_error
        self.created[index] = body
        self.existing.add(index)

    async def put_settings(self, index=None, body=None, request_timeout=None):
        self.settings[index] = body

    async def put_mapping(self, index=None, body=None):
        self.put_mappings.append((index, body))

    async def get_mapping(self, index=None):
        return SimpleNamespace(body=self.mapping_result)

    async def refresh(self, index=None, ignore_unavailable=None):
        self.refreshed.append(index)


class FakeES:
    def __init__(self, existing=None, mapping_result=None, create_error=None,
                 search_result=None, search_error=None, get_result=None,
                 exists_docs=None, exists_error=None, bulk_result=None,
                 bulk_error=None, mget_result=None, search_sequence=None):
        self.indices = FakeIndices(existing=existing, mapping_result=mapping_result, create_error=create_error)
        self.search_result = search_result if search_result is not None else {"hits": {"hits": []}}
        self.search_error = search_error
        self.search_sequence = list(search_sequence) if search_sequence is not None else None
        self.get_result = get_result if get_result is not None else {"_source": {"a": 1}}
        self.exists_docs = set(exists_docs or [])
        self.exists_error = exists_error
        self.bulk_result = bulk_result if bulk_result is not None else {"errors": False}
        self.bulk_error = bulk_error
        self.mget_result = mget_result if mget_result is not None else {"docs": []}
        self.search_calls = []
        self.update_calls = []
        self.bulk_calls = []
        self.delete_by_query_calls = []
        self.mget_calls = []
        self.get_calls = []

    def options(self, request_timeout=None):
        return self

    async def search(self, index=None, body=None, **kwargs):
        self.search_calls.append((index, body, kwargs))
        if self.search_sequence is not None:
            item = self.search_sequence.pop(0)
            if isinstance(item, Exception):
                raise item
            return item
        if self.search_error is not None:
            raise self.search_error
        return self.search_result

    async def get(self, index=None, id=None):
        self.get_calls.append((index, id))
        if self.get_result is None:
            raise RuntimeError("missing")
        return self.get_result

    async def exists(self, index=None, id=None):
        if self.exists_error is not None:
            raise self.exists_error
        return id in self.exists_docs

    async def update(self, index=None, id=None, body=None, retry_on_conflict=None):
        self.update_calls.append((index, id, body))
        return {"result": "updated"}

    async def bulk(self, body=None, refresh=None):
        self.bulk_calls.append((body, refresh))
        if self.bulk_error is not None:
            raise self.bulk_error
        return self.bulk_result

    async def mget(self, index=None, body=None):
        self.mget_calls.append((index, body))
        return self.mget_result

    async def delete_by_query(self, index=None, body=None, conflicts=None):
        self.delete_by_query_calls.append((index, body, conflicts))
        return {"deleted": 0}


def _make_controller(core=None, dump=None):
    from orion.services.elastic_manager.elastic_controller import elastic_controller

    controller = object.__new__(elastic_controller)
    setattr(controller, "_elastic_controller__m_core_connection", core if core is not None else FakeES())
    setattr(controller, "_elastic_controller__m_dump_connection", dump if dump is not None else FakeES())
    return controller


def _core(controller):
    return getattr(controller, "_elastic_controller__m_core_connection")


def _dump(controller):
    return getattr(controller, "_elastic_controller__m_dump_connection")
