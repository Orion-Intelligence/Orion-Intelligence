from __future__ import annotations

from types import SimpleNamespace


class FakeScanCursor:
    def __init__(self, rows, raise_on_iter=False):
        self._rows = list(rows)
        self._raise = raise_on_iter

    def sort(self, *_args, **_kwargs):
        return self

    def __aiter__(self):
        self._iter = iter(self._rows)
        return self

    async def __anext__(self):
        if self._raise:
            raise RuntimeError("db down")
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


class FakeScanCollection:
    def __init__(self, find_one_result=None, find_rows=None, claim_result=None, raise_on_find=False):
        self.find_one_result = find_one_result
        self.find_one_results = None
        self.find_rows = list(find_rows or [])
        self.claim_result = claim_result
        self.raise_on_find = raise_on_find
        self.update_one_calls = []
        self.update_many_calls = []

    async def find_one(self, query, projection=None):
        if self.find_one_results is not None:
            return self.find_one_results.pop(0) if self.find_one_results else None
        return self.find_one_result

    def find(self, query, projection=None):
        return FakeScanCursor(self.find_rows, raise_on_iter=self.raise_on_find)

    async def update_one(self, query, update, upsert=False):
        self.update_one_calls.append((query, update, upsert))
        return SimpleNamespace(modified_count=1, upserted_id="x")

    async def update_many(self, query, update):
        self.update_many_calls.append((query, update))
        return SimpleNamespace(modified_count=1)

    async def find_one_and_update(self, query, update):
        self.update_one_calls.append(("find_one_and_update", query, update))
        return self.claim_result


class FakeScanEngine:
    def __init__(self, collection, user=None, raise_on_user=False):
        from orion.services.mongo_manager.shared_model.db_social_model import SOCIAL_COLLECTION

        self.database = {SOCIAL_COLLECTION: collection}
        self._user = user
        self._raise_on_user = raise_on_user

    async def find_one(self, _model, _query):
        if self._raise_on_user:
            raise RuntimeError("db error")
        return self._user


class FakeSocialModelInstance:
    def __init__(self, responses=None, decode_result=b"imgbytes"):
        self.responses = list(responses or [])
        self.decode_result = decode_result
        self.social_request_calls = []

    def decode_image_payload(self, image_base64):
        return self.decode_result

    async def social_request(self, payload, kind, headers):
        self.social_request_calls.append((payload, kind, headers))
        if self.responses:
            item = self.responses.pop(0)
            if isinstance(item, BaseException):
                raise item
            return item
        return 500, {}


class FakeLog:
    def __init__(self):
        self.messages = []

    def g(self):
        return self

    def ex(self, message):
        self.messages.append(message)

    def e(self, message):
        self.messages.append(message)
