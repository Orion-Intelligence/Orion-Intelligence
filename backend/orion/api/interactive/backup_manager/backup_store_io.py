from __future__ import annotations

import asyncio
import io
import json
import shutil
import zipfile
from pathlib import Path

from bson import json_util
from elasticsearch import helpers as es_helpers

from orion.services.arango_manager.arango_controller import arango_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.log_manager.log_controller import log
from orion.constants.constant import CONSTANTS


class _ZipBuffer(io.RawIOBase):

    def __init__(self):
        self._chunks = []

    def writable(self) -> bool:
        return True

    def write(self, data) -> int:
        self._chunks.append(bytes(data))
        return len(data)

    def drain(self) -> bytes:
        data = b"".join(self._chunks)
        self._chunks.clear()
        return data


class BackupStoreIO:

    def __init__(self, owner):
        self._owner = owner

    @staticmethod
    def iter_zip(root: Path, arc_root: str):
        buffer = _ZipBuffer()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=1) as archive:
            for entry in sorted(root.rglob("*")):
                if not entry.is_file():
                    continue
                name = f"{arc_root}/{entry.relative_to(root).as_posix()}"
                with entry.open("rb") as source, archive.open(name, "w") as target:
                    while True:
                        chunk = source.read(1024 * 1024)
                        if not chunk:
                            break
                        target.write(chunk)
                        payload = buffer.drain()
                        if payload:
                            yield payload
                payload = buffer.drain()
                if payload:
                    yield payload
        payload = buffer.drain()
        if payload:
            yield payload

    @staticmethod
    def read_json_file(path: Path):
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return None

    @staticmethod
    def write_json_file(path: Path, payload) -> None:
        path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")

    async def backup_mongo(self, output_dir: Path, report=None) -> dict:
        output_dir.mkdir(parents=True, exist_ok=True)
        database = self._owner._engine.database
        collections = await database.list_collection_names()
        total = len(collections) or 1
        counts = {}
        for index, collection_name in enumerate(collections):
            counts[collection_name] = await self.dump_collection(database, collection_name, output_dir / f"{collection_name}.ndjson")
            if report is not None:
                await report((index + 1) / total)
        return counts

    async def dump_collection(self, database, collection_name: str, path: Path, query: dict | None = None) -> int:
        path.parent.mkdir(parents=True, exist_ok=True)
        handle = await asyncio.to_thread(path.open, "w", encoding="utf-8")
        written = 0
        try:
            batch = []
            cursor = database[collection_name].find(query or {}, batch_size=CONSTANTS.BACKUP_BATCH_SIZE)
            async for document in cursor:
                batch.append(document)
                if len(batch) >= CONSTANTS.BACKUP_BATCH_SIZE:
                    await asyncio.to_thread(self.write_json_lines, handle, batch)
                    written += len(batch)
                    batch = []
            if batch:
                await asyncio.to_thread(self.write_json_lines, handle, batch)
                written += len(batch)
            await asyncio.to_thread(handle.flush)
        finally:
            await asyncio.to_thread(handle.close)
        return written

    @staticmethod
    def write_json_lines(handle, documents) -> None:
        handle.write("".join(f"{json_util.dumps(document)}\n" for document in documents))

    @staticmethod
    def read_json_lines(handle, limit: int) -> list:
        documents = []
        for line in handle:
            line = line.strip()
            if line:
                documents.append(json_util.loads(line))
            if len(documents) >= limit:
                break
        return documents

    @staticmethod
    def read_json_dump(path: Path):
        return json_util.loads(path.read_text(encoding="utf-8"))

    @staticmethod
    def collect_sources(source_dir: Path) -> dict:
        sources = {}
        for suffix in ("*.json", "*.ndjson"):
            for file in sorted(source_dir.glob(suffix)):
                if file.name == CONSTANTS.BACKUP_MANIFEST_NAME or file.name.endswith(".meta.json"):
                    continue
                sources[file.stem] = file
        return sources

    def backup_arango(self, output_dir: Path) -> dict:
        output_dir.mkdir(parents=True, exist_ok=True)
        db = arango_controller.get_instance().get_db()
        if db is None:
            return {}
        counts = {}
        for collection_info in db.collections():
            collection_name = collection_info.get("name")
            if not collection_name or collection_name.startswith("_"):
                continue
            is_edge = collection_info.get("type") == "edge" or bool(collection_info.get("edge"))
            cursor = db.aql.execute(
                f"FOR doc IN `{collection_name}` RETURN doc",
                batch_size=CONSTANTS.BACKUP_BATCH_SIZE,
                stream=True,
            )
            written = 0
            with (output_dir / f"{collection_name}.ndjson").open("w", encoding="utf-8") as handle:
                for document in cursor:
                    handle.write(f"{json.dumps(document, default=str)}\n")
                    written += 1
            self.write_json_file(output_dir / f"{collection_name}.meta.json", {"edge": is_edge, "count": written})
            counts[collection_name] = {"count": written, "edge": is_edge}
        return counts

    async def backup_elastic(self, output_dir: Path) -> dict:
        output_dir.mkdir(parents=True, exist_ok=True)
        conn = elastic_controller.get_instance().get_connection()
        if conn is None:
            return {}
        indices = await conn.indices.get(index="*", expand_wildcards="open", ignore_unavailable=True)
        counts = {}
        for index_name, definition in indices.items():
            if self.is_excluded_index(index_name):
                log.g().i(f"BACKUP: skipping excluded Elasticsearch index {index_name}")
                continue
            await asyncio.to_thread(
                self.write_json_file,
                output_dir / f"{index_name}.meta.json",
                {
                    "mappings": (definition or {}).get("mappings") or {},
                    "settings": self.sanitize_index_settings((definition or {}).get("settings") or {}),
                },
            )
            path = output_dir / f"{index_name}.ndjson"
            written = 0
            with path.open("w", encoding="utf-8") as file:
                response = await conn.search(index=index_name, body={"query": {"match_all": {}}}, scroll="10m", size=500)
                scroll_id = response.get("_scroll_id")
                hits = response.get("hits", {}).get("hits", [])
                while hits:
                    await asyncio.to_thread(self.write_hits, file, hits)
                    written += len(hits)
                    response = await conn.scroll(scroll_id=scroll_id, scroll="10m")
                    scroll_id = response.get("_scroll_id")
                    hits = response.get("hits", {}).get("hits", [])
                if scroll_id:
                    await conn.clear_scroll(scroll_id=scroll_id)
            counts[index_name] = written
        return counts

    @staticmethod
    def is_excluded_index(index_name: str) -> bool:
        return index_name.startswith(".") or index_name in CONSTANTS.BACKUP_EXCLUDED_ELASTIC_INDICES

    @staticmethod
    def sanitize_index_settings(settings: dict) -> dict:
        index_settings = dict((settings.get("index") or {}))
        for key in CONSTANTS.BACKUP_UNSETTABLE_INDEX_SETTINGS:
            index_settings.pop(key, None)
        return {"index": index_settings} if index_settings else {}

    @staticmethod
    def write_hits(file, hits) -> None:
        for hit in hits:
            file.write(json.dumps(hit, default=str) + "\n")

    def copy_folder(self, source: Path, destination: Path):
        destination.mkdir(parents=True, exist_ok=True)
        if source.exists():
            shutil.copytree(source, destination, dirs_exist_ok=True)

    async def read_documents(self, path: Path):
        if path.suffix == ".json":
            documents = await asyncio.to_thread(self.read_json_dump, path)
            for start in range(0, len(documents), CONSTANTS.BACKUP_BATCH_SIZE):
                yield documents[start:start + CONSTANTS.BACKUP_BATCH_SIZE]
            return
        handle = await asyncio.to_thread(path.open, "r", encoding="utf-8")
        try:
            while True:
                batch = await asyncio.to_thread(self.read_json_lines, handle, CONSTANTS.BACKUP_BATCH_SIZE)
                if not batch:
                    return
                yield batch
        finally:
            await asyncio.to_thread(handle.close)

    async def restore_mongo(self, source_dir: Path):
        if not source_dir.exists():
            return
        database = self._owner._engine.database
        preserved = self._owner._preserved_collections()
        sources = self.collect_sources(source_dir)

        for collection_name in await database.list_collection_names():
            if collection_name in preserved or collection_name in sources:
                continue
            await database[collection_name].drop()
            log.g().i(f"RESTORE: dropped MongoDB collection absent from the backup: {collection_name}")

        for collection_name, file in sources.items():
            if collection_name in preserved:
                continue
            await database[collection_name].delete_many({})
            async for batch in self.read_documents(file):
                await database[collection_name].insert_many(batch, ordered=False)

    @staticmethod
    def iter_documents(path: Path):
        if path.suffix == ".json":
            documents = json.loads(path.read_text(encoding="utf-8"))
            for start in range(0, len(documents), CONSTANTS.BACKUP_BATCH_SIZE):
                yield documents[start:start + CONSTANTS.BACKUP_BATCH_SIZE]
            return
        with path.open("r", encoding="utf-8") as handle:
            batch = []
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                batch.append(json.loads(line))
                if len(batch) >= CONSTANTS.BACKUP_BATCH_SIZE:
                    yield batch
                    batch = []
            if batch:
                yield batch

    def restore_arango(self, source_dir: Path):
        if not source_dir.exists():
            return
        db = arango_controller.get_instance().get_db()
        if db is None:
            return
        sources = self.collect_sources(source_dir)

        for collection_info in db.collections():
            collection_name = collection_info.get("name")
            if not collection_name or collection_name.startswith("_") or collection_name in sources:
                continue
            db.delete_collection(collection_name)
            log.g().i(f"RESTORE: dropped ArangoDB collection absent from the backup: {collection_name}")

        for collection_name, file in sources.items():
            meta = self.read_json_file(source_dir / f"{collection_name}.meta.json") or {}
            is_edge = bool(meta.get("edge"))
            if db.has_collection(collection_name):
                properties = db.collection(collection_name).properties()
                existing_edge = properties.get("edge") or properties.get("type") == 3
                if bool(existing_edge) != is_edge:
                    db.delete_collection(collection_name)
                    db.create_collection(collection_name, edge=is_edge)
            else:
                db.create_collection(collection_name, edge=is_edge)
            collection = db.collection(collection_name)
            collection.truncate()
            for batch in self.iter_documents(file):
                collection.import_bulk(batch, on_duplicate="replace")

    async def restore_elastic(self, source_dir: Path):
        if not source_dir.exists():
            return
        conn = elastic_controller.get_instance().get_connection()
        if conn is None:
            return

        files = {file.stem: file for file in sorted(source_dir.glob("*.ndjson")) if not self.is_excluded_index(file.stem)}
        live = await conn.indices.get(index="*", expand_wildcards="open", ignore_unavailable=True)
        for index_name in live.keys():
            if self.is_excluded_index(index_name) or index_name in files:
                continue
            await conn.indices.delete(index=index_name, ignore_unavailable=True)
            log.g().i(f"RESTORE: dropped Elasticsearch index absent from the backup: {index_name}")

        for index_name, file in files.items():
            meta = await asyncio.to_thread(self.read_json_file, source_dir / f"{index_name}.meta.json")
            if await conn.indices.exists(index=index_name):
                await conn.indices.delete(index=index_name)
            body = {}
            if meta:
                if meta.get("mappings"):
                    body["mappings"] = meta["mappings"]
                if meta.get("settings"):
                    body["settings"] = meta["settings"]
            else:
                log.g().w(f"RESTORE: no index metadata for {index_name}, recreating with dynamic mappings")
            await conn.indices.create(index=index_name, **body)

            handle = await asyncio.to_thread(file.open, "r", encoding="utf-8")
            try:
                while True:
                    actions = await asyncio.to_thread(self.read_hits, handle, index_name, CONSTANTS.BACKUP_BATCH_SIZE)
                    if not actions:
                        break
                    await es_helpers.async_bulk(conn, actions)
            finally:
                await asyncio.to_thread(handle.close)

    @staticmethod
    def read_hits(handle, index_name: str, limit: int) -> list:
        actions = []
        for line in handle:
            line = line.strip()
            if line:
                hit = json.loads(line)
                actions.append({
                    "_op_type": "index",
                    "_index": index_name,
                    "_id": hit.get("_id"),
                    "_source": hit.get("_source", {}),
                })
            if len(actions) >= limit:
                break
        return actions

    def restore_folder(self, source: Path, destination: Path):
        if not source.exists():
            return
        shutil.rmtree(destination, ignore_errors=True)
        shutil.copytree(source, destination, dirs_exist_ok=True)
