from __future__ import annotations

from typing import Any


class FakeCollection:
    def __init__(self, name: str):
        self.name = name
        self.documents: dict[str, dict[str, Any]] = {}
        self.inserts: list[dict[str, Any]] = []

    def has(self, key: str) -> bool:
        return key in self.documents

    def get(self, key: str) -> dict[str, Any] | None:
        return self.documents.get(key)

    def insert(self, document: dict[str, Any], overwrite: bool = False):
        self.inserts.append(document)
        key = document.get("_key")
        if key is not None:
            self.documents[key] = document
        return {"_key": key, "_id": f"{self.name}/{key}"}


class FakeArangoDb:
    def __init__(self):
        self.collections: dict[str, FakeCollection] = {}

    def collection(self, name: str) -> FakeCollection:
        return self.collections.setdefault(name, FakeCollection(name))
