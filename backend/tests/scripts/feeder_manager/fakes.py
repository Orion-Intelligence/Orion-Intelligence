from __future__ import annotations

from typing import Any


class FeederFindEngine:
    def __init__(self, find_results=None, find_one_results=None):
        self.find_results = list(find_results or [])
        self.find_one_results = list(find_one_results or [])
        self.find_calls = []
        self.find_one_calls = []
        self.saved = []
        self.deleted = []

    async def find(self, model, query=None, **kwargs):
        self.find_calls.append((model, query, kwargs))
        if self.find_results:
            return self.find_results.pop(0)
        return []

    async def find_one(self, model, query=None, **kwargs):
        self.find_one_calls.append((model, query, kwargs))
        if self.find_one_results:
            return self.find_one_results.pop(0)
        return None

    async def save(self, record: Any):
        self.saved.append(record)
        return record

    async def delete(self, record: Any):
        self.deleted.append(record)
        return True
