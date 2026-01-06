import json
from datetime import datetime, timezone
from pathlib import Path

from elastic_transport import ApiError
import motor.motor_asyncio
from odmantic import ObjectId
from elasticsearch import AsyncElasticsearch, helpers as es_helpers, NotFoundError

from orion.helper_manager.env_handler import env_handler
from orion.services.mongo_manager.mongo_enums import MONGO_CONNECTIONS
from orion.services.elastic_manager.elastic_enums import ELASTIC_CONNECTIONS
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account
from orion.services.session_manager.session_enums import admin_mock, admin_user, crawler_mock, crawler_user


class test_manager:
    __instance = None

    @staticmethod
    def get_instance():
        if test_manager.__instance is None:
            test_manager()
        return test_manager.__instance

    def __init__(self):
        if test_manager.__instance is not None:
            return
        test_manager.__instance = self

    async def apply_test_overrides(self):
        if env_handler.get_instance().env("TESTING_ENABLED", "0") != "1":
            return

        MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME = "orion-web_test"
        ELASTIC_CONNECTIONS.S_DATABASE_NAME = "orion-elastic-search_test"

        admin_mock["username"] = "admin_test_username"
        admin_user["password"] = db_user_account.hash_password(
            "Zq9M#rX@e7W^B0T+f(ysG!kJc1d2mC&N%hAUEP)6Y4n$R8VbHS")

        crawler_mock["username"] = "crawler_test_username"
        crawler_user["password"] = db_user_account.hash_password(
            "Zq9M#rX@e7W^B0T+f(ysG!kJc1d2mC&N%hAUEP)6Y4n$R8VbHS")

    def _fix(self, v):
        if isinstance(v, dict):
            if set(v.keys()) == {"$oid"}:
                return ObjectId(v["$oid"])
            if set(v.keys()) == {"$date"}:
                x = v["$date"]
                if isinstance(x, (int, float)):
                    return datetime.fromtimestamp(x / 1000, tz=timezone.utc)
                if isinstance(x, str):
                    return datetime.fromisoformat(x.replace("Z", "+00:00"))
            return {k: self._fix(x) for k, x in v.items()}
        if isinstance(v, list):
            return [self._fix(x) for x in v]
        return v

    async def reset_test_mongo_and_import_mocks(self):
        if env_handler.get_instance().env("TESTING_ENABLED", "0") != "1":
            return

        mongo_client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGO_CONNECTIONS.S_MONGO_DATABASE_IP,
            MONGO_CONNECTIONS.S_MONGO_DATABASE_PORT,
            username=MONGO_CONNECTIONS.S_MONGO_USERNAME,
            password=MONGO_CONNECTIONS.S_MONGO_PASSWORD, )
        db = mongo_client[MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME]

        cols = await db.list_collection_names()
        for c in cols:
            await db[c].delete_many({})

        mocks_dir = Path(__file__).resolve().parents[3] / "static" / "test" / "mocks" / "mongo"
        if mocks_dir.exists():
            for fp in sorted(mocks_dir.glob("*.json")):
                parts = fp.name.split(".")
                if len(parts) < 3:
                    continue
                collection = parts[-2]
                with fp.open("r", encoding="utf-8") as f:
                    payload = json.load(f)
                if isinstance(payload, list):
                    docs = payload
                elif isinstance(payload, dict) and isinstance(payload.get("data"), list):
                    docs = payload["data"]
                else:
                    docs = [payload]
                if docs:
                    await db[collection].insert_many(self._fix(docs), ordered=False)

    async def reset_test_elastic_and_import_mocks(self):
        if env_handler.get_instance().env("TESTING_ENABLED", "0") != "1":
            return

        es_host = ELASTIC_CONNECTIONS.S_DATABASE_IP or "localhost"
        es_port = int(ELASTIC_CONNECTIONS.S_DATABASE_PORT or 9400)
        es_user = ELASTIC_CONNECTIONS.S_ELASTIC_USERNAME
        es_pass = ELASTIC_CONNECTIONS.S_ELASTIC_PASSWORD

        if es_user and es_pass:
            es = AsyncElasticsearch(
                hosts=[{"host": es_host, "port": es_port, "scheme": "http"}], basic_auth=(es_user, es_pass), )
        else:
            es = AsyncElasticsearch(hosts=[{"host": es_host, "port": es_port, "scheme": "http"}])

        try:
            async def _delete_indices(indices):
                for idx in list(indices.keys()):
                    if idx.startswith("."):
                        continue
                    try:
                        await es.indices.delete(index=idx, ignore_unavailable=True)
                    except NotFoundError:
                        continue
                    except ApiError as e:
                        if getattr(e, "status_code", None) == 404:
                            continue
                        raise

            indices = await es.indices.get(index="*", ignore_unavailable=True)
            await _delete_indices(indices)

            await es.cluster.put_settings(
                persistent={"action.destructive_requires_name": False, "cluster.blocks.read_only_allow_delete": None, })

            try:
                ds = await es.indices.get_data_stream(name="*")
            except NotFoundError:
                ds = {"data_streams": []}
            except ApiError as e:
                if getattr(e, "status_code", None) == 404:
                    ds = {"data_streams": []}
                else:
                    raise

            for d in ds.get("data_streams", []):
                try:
                    await es.indices.delete_data_stream(name=d["name"])
                except NotFoundError:
                    continue
                except ApiError as e:
                    if getattr(e, "status_code", None) == 404:
                        continue
                    raise

            indices = await es.indices.get(index="*", expand_wildcards="all", ignore_unavailable=True)
            await _delete_indices(indices)

            try:
                await es.indices.refresh(index="*", ignore_unavailable=True)
            except ApiError as e:
                if getattr(e, "status_code", None) != 404:
                    raise

            await es.cluster.put_settings(persistent={"action.destructive_requires_name": True})

            mocks_dir = (Path(__file__).resolve().parents[3] / "static" / "test" / "mocks" / "elastic")
            if not mocks_dir.exists():
                return

            def _has_data(p: Path) -> bool:
                with p.open("r", encoding="utf-8") as f:
                    for line in f:
                        if line.strip():
                            return True
                return False

            for data_fp in sorted(mocks_dir.glob("*.data.ndjson")):
                if data_fp.stat().st_size == 0:
                    continue
                if not _has_data(data_fp):
                    continue

                idx = data_fp.name.replace(".data.ndjson", "")

                async def gen(fp=data_fp, default_index=idx):
                    with fp.open("r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if not line:
                                continue
                            d = json.loads(line)
                            _id = d.get("_id")
                            _index = d.get("_index") or default_index
                            src = d.get("_source", d)
                            a = {"_op_type": "index", "_index": _index, "_source": src}
                            if _id is not None:
                                a["_id"] = _id
                            yield a

                await es_helpers.async_bulk(
                    es, gen(), chunk_size=2000, request_timeout=120, raise_on_error=False, raise_on_exception=False, )

        finally:
            await es.close()
