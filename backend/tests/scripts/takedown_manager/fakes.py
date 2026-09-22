from __future__ import annotations

from typing import Any


class FakeHttpResponse:
    def __init__(self, status_code: int = 200, json_data: Any = None, text: str = ""):
        self.status_code = status_code
        self._json = {} if json_data is None else json_data
        self.text = text

    def json(self):
        return self._json


class FakeTakedownCollection:
    def __init__(self, items=None, count=None):
        self.items = list(items or [])
        self._count = count if count is not None else len(self.items)
        self.queries: list[dict] = []
        self._skip = 0
        self._limit = None

    async def count_documents(self, query):
        self.queries.append(query)
        return self._count

    def find(self, query):
        self.queries.append(query)
        self._skip = 0
        self._limit = None
        return self

    def sort(self, field, direction):
        return self

    def skip(self, count):
        self._skip = count
        return self

    def limit(self, count):
        self._limit = count
        return self

    def __aiter__(self):
        end = (self._skip + self._limit) if self._limit is not None else None
        selected = self.items[self._skip:end]

        async def _gen():
            for item in selected:
                yield item

        return _gen()


class FakeElasticConnection:
    def __init__(self, raises: bool = False):
        self.raises = raises
        self.updates: list[dict] = []

    def get_instance(self):
        return self

    def get_connection(self):
        return self

    def options(self, **kwargs):
        return self

    async def update(self, index=None, id=None, doc=None, refresh=None):
        if self.raises:
            raise RuntimeError("elastic down")
        self.updates.append({"index": index, "id": id, "doc": doc, "refresh": refresh})
        return {"result": "updated"}


class FakeMailManager:
    def __init__(self):
        self.takedowns: list[dict] = []

    def get_instance(self):
        return self

    async def send_takedown_mail(self, **kwargs):
        self.takedowns.append(kwargs)
        return True
