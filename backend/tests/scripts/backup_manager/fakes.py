from __future__ import annotations

from types import SimpleNamespace

from pymongo.errors import BulkWriteError

from orion.services.mongo_manager.shared_model.db_backup_job_model import db_backup_job_model
from orion.services.mongo_manager.shared_model.db_backup_model import db_backup_model


class _FakeCollection:
    def __init__(self):
        self.deleted = 0
        self.dropped = 0
        self.inserted: list = []

    async def delete_many(self, _query):
        self.deleted += 1

    async def drop(self):
        self.dropped += 1

    async def insert_many(self, documents, ordered=True):
        self.inserted.extend(documents)


class _FakeDatabase:
    def __init__(self):
        self.collections: dict[str, _FakeCollection] = {}

    def __getitem__(self, name):
        return self.collections.setdefault(name, _FakeCollection())

    async def list_collection_names(self):
        return list(self.collections.keys())


class _FakeEngineWithDatabase:
    def __init__(self):
        self.database = _FakeDatabase()

    @staticmethod
    def get_collection(_model):
        return SimpleNamespace(name="db_backup_model")


class _FakeCursor:
    def __init__(self, documents):
        self._documents = list(documents)

    def __aiter__(self):
        return self._iterate()

    async def _iterate(self):
        for document in self._documents:
            yield document


class _FakeStreamingCollection:
    def __init__(self, documents=None):
        self.documents = list(documents or [])
        self.deleted = 0
        self.dropped = 0
        self.inserted_batches: list[list] = []

    def find(self, _query, batch_size=None):
        return _FakeCursor(self.documents)

    async def delete_many(self, _query):
        self.deleted += 1

    async def drop(self):
        self.dropped += 1

    async def insert_many(self, documents, ordered=True):
        self.inserted_batches.append(list(documents))


class _FakeStreamingDatabase:
    def __init__(self, collections):
        self.collections = collections

    def __getitem__(self, name):
        return self.collections.setdefault(name, _FakeStreamingCollection())

    async def list_collection_names(self):
        return list(self.collections.keys())


class _FakeStreamingEngine:
    COLLECTION_NAMES = {db_backup_model: "db_backup_model", db_backup_job_model: "backup_jobs"}

    def __init__(self, collections):
        self.database = _FakeStreamingDatabase(collections)

    def get_collection(self, model):
        return SimpleNamespace(name=self.COLLECTION_NAMES[model])


def _matches(document, query):
    for key, expected in (query or {}).items():
        value = document.get(key)
        if isinstance(expected, dict):
            if "$in" in expected and value not in expected["$in"]:
                return False
            if "$ne" in expected and value == expected["$ne"]:
                return False
        elif value != expected:
            return False
    return True


class _FakeTenantCollection:
    def __init__(self, documents=None):
        self.documents = [dict(document) for document in (documents or [])]

    def find(self, query=None, projection=None, batch_size=None):
        matched = [dict(document) for document in self.documents if _matches(document, query)]
        if projection:
            keys = set(projection) | {"_id"}
            matched = [{key: value for key, value in document.items() if key in keys} for document in matched]
        return _FakeCursor(matched)

    async def find_one(self, query=None, projection=None):
        async for document in self.find(query, projection):
            return document
        return None

    async def count_documents(self, query=None):
        return sum(1 for document in self.documents if _matches(document, query))

    async def delete_many(self, query):
        kept = [document for document in self.documents if not _matches(document, query)]
        removed = len(self.documents) - len(kept)
        self.documents = kept
        return SimpleNamespace(deleted_count=removed)

    async def insert_many(self, documents, ordered=True):
        write_errors = []
        for index, document in enumerate(documents):
            if any(existing.get("_id") == document.get("_id") for existing in self.documents):
                raise RuntimeError(f"duplicate key error on _id {document.get('_id')}")
            if document.get("username") is not None and any(existing.get("username") == document.get("username") for existing in self.documents):
                write_errors.append({"index": index, "code": 11000, "errmsg": f"E11000 duplicate key error username {document.get('username')}"})
                continue
            self.documents.append(dict(document))
        if write_errors:
            raise BulkWriteError({"writeErrors": write_errors, "nInserted": len(documents) - len(write_errors)})

    async def update_one(self, query, update):
        for document in self.documents:
            if _matches(document, query):
                document.update(update.get("$set", {}))
                return SimpleNamespace(modified_count=1)
        return SimpleNamespace(modified_count=0)

    async def replace_one(self, query, replacement, upsert=False):
        for index, document in enumerate(self.documents):
            if _matches(document, query):
                self.documents[index] = dict(replacement)
                return SimpleNamespace(modified_count=1)
        if upsert:
            self.documents.append(dict(replacement))
        return SimpleNamespace(modified_count=0)

    async def drop(self):
        self.documents = []


class _FakeTenantDatabase:
    def __init__(self, collections):
        self.collections = collections

    def __getitem__(self, name):
        return self.collections.setdefault(name, _FakeTenantCollection())

    async def list_collection_names(self):
        return list(self.collections.keys())


class _FakeTenantEngine:
    COLLECTION_NAMES = {db_backup_model: "db_backup_model", db_backup_job_model: "backup_jobs"}

    def __init__(self, collections):
        self.database = _FakeTenantDatabase(collections)

    def get_collection(self, model):
        return SimpleNamespace(name=self.COLLECTION_NAMES[model])


class _FakeIndices:
    def __init__(self, definitions):
        self.definitions = dict(definitions)
        self.created: dict[str, dict] = {}
        self.deleted: list[str] = []

    async def get(self, index=None, expand_wildcards=None, ignore_unavailable=None):
        return dict(self.definitions)

    async def exists(self, index):
        return index in self.definitions

    async def delete(self, index, ignore_unavailable=None):
        self.deleted.append(index)
        self.definitions.pop(index, None)

    async def create(self, index, **body):
        self.created[index] = body
        self.definitions[index] = body


class _FakeElasticConnection:
    def __init__(self, definitions=None, hits=None):
        self.indices = _FakeIndices(definitions or {})
        self._hits = dict(hits or {})
        self.bulked: list = []

    @staticmethod
    async def info():
        return {"version": {"number": "8.19.2"}}

    async def search(self, index=None, body=None, scroll=None, size=None):
        return {"_scroll_id": f"scroll-{index}", "hits": {"hits": self._hits.get(index, [])}}

    @staticmethod
    async def scroll(scroll_id=None, scroll=None):
        return {"_scroll_id": scroll_id, "hits": {"hits": []}}

    @staticmethod
    async def clear_scroll(scroll_id=None):
        return None


class _FakeArangoCollection:
    def __init__(self, name, edge=False, documents=None):
        self.name = name
        self.edge = edge
        self.documents = list(documents or [])
        self.truncated = 0
        self.imported: list[list] = []

    def properties(self):
        return {"edge": self.edge, "type": 3 if self.edge else 2}

    def truncate(self):
        self.truncated += 1

    def import_bulk(self, documents, on_duplicate=None):
        self.imported.append(list(documents))


class _FakeAql:
    def __init__(self, db):
        self.db = db

    def execute(self, query, batch_size=None, stream=None):
        name = query.split("`")[1]
        return iter(self.db.store[name].documents)


class _FakeArangoDatabase:
    def __init__(self, collections=None):
        self.store = {collection.name: collection for collection in (collections or [])}
        self.created: list[tuple] = []
        self.deleted: list[str] = []
        self.aql = _FakeAql(self)

    def collections(self):
        return [{"name": name, "type": "edge" if collection.edge else "document"} for name, collection in self.store.items()]

    def has_collection(self, name):
        return name in self.store

    def create_collection(self, name, edge=False):
        self.created.append((name, edge))
        self.store[name] = _FakeArangoCollection(name, edge=edge)
        return self.store[name]

    def delete_collection(self, name):
        self.deleted.append(name)
        self.store.pop(name, None)

    def collection(self, name):
        return self.store[name]
