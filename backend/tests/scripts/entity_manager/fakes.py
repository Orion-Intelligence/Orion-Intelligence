from __future__ import annotations

from typing import Any


class _FakeArangoCollection:
    def __init__(self, name: str, docs: dict[str, Any] | None = None, insert_error: Exception | None = None):
        self.name = name
        self.docs = dict(docs or {})
        self.inserted: list[tuple[dict[str, Any], bool]] = []
        self.insert_error = insert_error

    def has(self, key: str) -> bool:
        return key in self.docs

    def get(self, key: str):
        return self.docs.get(key)

    def insert(self, document: dict[str, Any], overwrite: bool = False):
        if self.insert_error is not None:
            raise self.insert_error
        self.inserted.append((dict(document), overwrite))
        key = document.get("_key")
        if key is not None:
            self.docs[key] = dict(document)
        return {"_key": key}


class _FakeAql:
    def __init__(self, results: list | None = None, sequence: list[list] | None = None, error: Exception | None = None):
        self.constant = results
        self.sequence = list(sequence) if sequence is not None else None
        self.error = error
        self.calls: list[tuple[str, dict]] = []

    def execute(self, query_str: str, bind_vars: dict | None = None):
        self.calls.append((query_str, dict(bind_vars or {})))
        if self.error is not None:
            raise self.error
        if self.sequence is not None:
            return list(self.sequence.pop(0)) if self.sequence else []
        return list(self.constant or [])


class _FakeArangoDB:
    def __init__(self, collections: dict[str, _FakeArangoCollection] | None = None, aql: _FakeAql | None = None):
        self._collections = dict(collections or {})
        self.aql = aql or _FakeAql()

    def collection(self, name: str) -> _FakeArangoCollection:
        if name not in self._collections:
            self._collections[name] = _FakeArangoCollection(name)
        return self._collections[name]


class _FakeExplodingArangoDB:
    def __init__(self, exc: Exception | None = None):
        self.exc = exc or RuntimeError("collection boom")

    def collection(self, name: str):
        raise self.exc


class _FakeArango:
    def __init__(self, db: Any, graph: Any = None):
        self._db = db
        self._graph = graph

    def get_db(self):
        return self._db

    def get_graph(self):
        return self._graph


class _FakeArangoProvider:
    def __init__(self, arango: _FakeArango):
        self._arango = arango
        self.calls = 0

    def get_instance(self):
        self.calls += 1
        return self._arango


class _FakeRedisLock:
    def __init__(self, controller: "_FakeRedisController", key: str):
        self.controller = controller
        self.key = key

    async def __aenter__(self):
        self.controller.entered.append(self.key)
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False


class _FakeRedisController:
    def __init__(self):
        self.entered: list[str] = []
        self.lock_calls: list[tuple[str, Any, Any]] = []

    def lock(self, key: str, timeout: Any = None, blocking_timeout: Any = None):
        self.lock_calls.append((key, timeout, blocking_timeout))
        return _FakeRedisLock(self, key)


class _FakeRedisProvider:
    def __init__(self, controller: _FakeRedisController):
        self._controller = controller

    def getInstance(self):
        return self._controller


class _FakeLogGuard:
    def __init__(self, sink: list[str]):
        self._sink = sink

    def e(self, message: str):
        self._sink.append(message)


class _FakeLog:
    def __init__(self):
        self.errors: list[str] = []

    def g(self):
        return _FakeLogGuard(self.errors)


class _FakeArangoLockTimeout(Exception):
    def __init__(self, message: str = "timeout waiting to lock key foo", error_code: int = 1200):
        super().__init__(message)
        self.error_code = error_code


class _FakeCountingOperation:
    def __init__(self, failures: int, exc: Exception, result: Any = "done"):
        self.failures = failures
        self.exc = exc
        self.result = result
        self.attempts = 0

    def __call__(self):
        self.attempts += 1
        if self.attempts <= self.failures:
            raise self.exc
        return self.result
