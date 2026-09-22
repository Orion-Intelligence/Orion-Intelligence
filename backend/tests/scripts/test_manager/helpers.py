from __future__ import annotations

import asyncio
from types import SimpleNamespace


def _run(coro):
    return asyncio.run(coro)


class _NullLogger:
    def i(self, *_a):
        return None

    def w(self, *_a):
        return None

    def e(self, *_a):
        return None


def null_log():
    logger = _NullLogger()
    return SimpleNamespace(g=staticmethod(lambda: logger))


def env_handler_stub(enabled: bool):
    value = "1" if enabled else "0"
    return SimpleNamespace(get_instance=staticmethod(lambda: SimpleNamespace(env=lambda _k, _d=None: value)))


class _FakeResolved:
    def __init__(self, root):
        self._root = root

    @property
    def parents(self):
        return {3: self._root}


class _FakePath:
    def __init__(self, root):
        self._root = root

    def resolve(self):
        return _FakeResolved(self._root)


def patch_path(monkeypatch, tm_module, root):
    monkeypatch.setattr(tm_module, "Path", lambda _f, _r=root: _FakePath(_r))


class FakeMongoCollection:
    def __init__(self, name):
        self.name = name
        self.inserted = []
        self.deleted = []

    async def insert_many(self, docs, ordered=False):
        self.inserted.append(list(docs))

    async def delete_many(self, query):
        self.deleted.append(query)

    async def find_one(self, query):
        if self.name != "db_user_account":
            return None
        role = query.get("role")
        return {"role": role, "username": "seed", "password": "seed", "extra": 1}


class FakeMongoDB:
    def __init__(self):
        self.collections = {}
        self.dropped = []

    def __getitem__(self, name):
        return self.collections.setdefault(name, FakeMongoCollection(name))

    async def list_collection_names(self):
        return ["existing_collection", "boom_collection"]

    async def drop_collection(self, name):
        if name == "boom_collection":
            raise RuntimeError("cannot drop")
        self.dropped.append(name)


class FakeMotorClient:
    def __init__(self, *args, **kwargs):
        self.db = FakeMongoDB()

    def __getitem__(self, _name):
        return self.db


class FakeIndices:
    def __init__(self):
        self.deleted = []
        self.created = {}

    async def get(self, index=None, expand_wildcards=None, ignore_unavailable=None):
        return {"leak_model": {}, ".hidden_system": {}}

    async def delete(self, index=None, ignore_unavailable=None):
        self.deleted.append(index)

    async def get_data_stream(self, name=None):
        return {"data_streams": [{"name": "ds-1"}]}

    async def delete_data_stream(self, name=None):
        self.deleted.append(name)

    async def refresh(self, index=None, ignore_unavailable=None):
        return None

    async def create(self, index=None, body=None):
        self.created[index] = body


class FakeCluster:
    def __init__(self):
        self.settings = []

    async def put_settings(self, persistent=None):
        self.settings.append(persistent)


class FakeElasticClient:
    instances = []

    def __init__(self, *args, **kwargs):
        self.kwargs = kwargs
        self.indices = FakeIndices()
        self.cluster = FakeCluster()
        self.closed = False
        FakeElasticClient.instances.append(self)

    async def close(self):
        self.closed = True


class FakeArangoCollection:
    def __init__(self, name, truncate_error=False):
        self.name = name
        self.truncate_error = truncate_error
        self.imported = []

    def truncate(self):
        if self.truncate_error:
            raise RuntimeError("truncate failed")

    def import_bulk(self, docs, on_duplicate=None):
        self.imported.append((list(docs), on_duplicate))


class FakeArangoDB:
    def __init__(self, has_collections=False, truncate_error=False):
        self.has_collections = has_collections
        self.created = []
        self.collections = {
            "cti_vertices": FakeArangoCollection("cti_vertices", truncate_error=truncate_error),
            "cti_edges": FakeArangoCollection("cti_edges"),
        }

    def has_collection(self, name):
        return self.has_collections

    def create_collection(self, name, edge=False):
        self.created.append((name, edge))
        self.collections.setdefault(name, FakeArangoCollection(name))

    def collection(self, name):
        return self.collections[name]


class FakeArangoClient:
    def __init__(self, hosts=None):
        self.hosts = hosts

    def db(self, name, username=None, password=None):
        return FakeArangoClient.current_db
