import base64
import hashlib
import os
import asyncio
import json
import secrets
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse, urlunparse
from zipfile import ZIP_DEFLATED, ZipFile
from bloom_filter2 import BloomFilter
import httpx
import requests
from cryptography.fernet import Fernet
from fastapi import Request, HTTPException
from fastapi.responses import FileResponse, Response
from starlette.responses import JSONResponse
from orion.api.server.crawl_manager.class_model import *
from orion.helper_manager.helper_controller import helper_controller
from orion.helper_manager.env_handler import env_handler
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_KEYS, ELASTIC_INDEX
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_dump_model import db_dump_record_model
from orion.services.mongo_manager.shared_model.db_feeder_script_model import db_feeder_script_model
from orion.services.mongo_manager.shared_model.db_url_data_model import db_url_data_model
from orion.api.server.crawl_manager.class_model.CTITextRequest import CTITextRequest
from orion.constants.constant import CONSTANTS
from orion.constants import constant




class crawl_model:
    __instance = None
    __swarm_bloom = None

    @staticmethod
    def getInstance():
        if crawl_model.__instance is None:
            crawl_model()
        return crawl_model.__instance

    def __init__(self):
        self._engine = mongo_controller.get_instance().get_engine()
        if crawl_model.__instance is not None:
            pass
        else:
            crawl_model.__instance = self

    @staticmethod
    def _normalize_swarm_route_url(raw_url: str | None) -> str | None:
        if raw_url is None:
            return None

        text: str = raw_url.strip()
        if not text:
            return None

        parsed = urlparse(text)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            return None

        normalized = parsed._replace(
            scheme=parsed.scheme.lower(),
            netloc=parsed.netloc.lower(),
            params="",
            query="",
            fragment="",
        )
        normalized_url = str(urlunparse(normalized))
        return normalized_url.rstrip("/")

    @staticmethod
    def _extract_swarm_route_url(payload: dict) -> str | None:
        for key in ("m_url", "m_base_url", "url"):
            value = payload.get(key) or ""
            if value.strip():
                return value
        return None

    @classmethod
    def _get_swarm_bloom(cls) -> BloomFilter:
        if cls.__swarm_bloom is None:
            bloom_dir = env_handler.get_instance().env("BLOOM_DIR") or "/tmp"
            os.makedirs(bloom_dir, exist_ok=True)
            cls.__swarm_bloom = BloomFilter(
                max_elements=10_000_000,
                error_rate=0.01,
                filename=os.path.join(bloom_dir, "swarm_routes.bloom"),
            )
        return cls.__swarm_bloom

    async def _update_or_create_model(self,
            base_url: str,
            new_content_type: list,
            new_index_type: list,
            network_type: str,
            is_leak_update: bool,
            name: str = None):
        normalized_url = base_url
        if network_type != "telegram":
            normalized_url = helper_controller.get_base_url(base_url).rstrip('/')

        if base_url.__contains__("twitter") or base_url.__contains__("reddit") or base_url.__contains__("forum"):
            normalized_url = base_url

        general_model = await self._engine.find_one(db_url_data_model, db_url_data_model.url == normalized_url)
        if not new_content_type:
            new_content_type = ["general"]

        if general_model:
            general_model.content_type = list(set((general_model.content_type or []) + new_content_type))
            general_model.index_type = list(set((general_model.index_type or []) + new_index_type))
            if name:
                general_model.name = name
            if is_leak_update:
                general_model.leak_model_last_update = datetime.now(timezone.utc)
            else:
                general_model.geneic_model_last_update = datetime.now(timezone.utc)
        else:
            general_model = db_url_data_model(
                url=normalized_url,
                content_type=list(set(new_content_type)),
                index_type=list(set(new_index_type)),
                network_type=network_type,
                name=name,
                leak_model_last_update=datetime.now(timezone.utc) if is_leak_update else None,
                geneic_model_last_update=datetime.now(timezone.utc) if not is_leak_update else None)

        await self._engine.save(general_model)
        return JSONResponse(content={"message": CRAWL_CALLBACK_RESPONSES.M_WEBSITE_INDEXED}, status_code=200)

    @staticmethod
    async def make_cti_request(text: str):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/cti_classifier/classify", json={"text": text})
            return response.json()

    @staticmethod
    async def parse_chat(model: nlp_data_model):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://trusted-micros-api:8010/nlp/parse", json={"data": model.data}, timeout=10)
                return response.json()
        except Exception:
            return {"error": "Failed to parse chat"}

    @staticmethod
    async def parse_summarize_ai(model: nlp_data_model, user_id: str = "system"):
        try:
            base_url = (env_handler.get_instance().env("DARKNEXUS_API_BASE") or "http://trusted-nexus-api:8030").strip().rstrip("/")

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{base_url}/nlp/summarize/ai/{user_id}", json={"data": model.data}, timeout=120)
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": "Something happened while calling nlp/summarize/ai"})
                return response.json()
        except Exception:
            return JSONResponse(
                status_code=500, content={"detail": "Something happened while calling nlp/summarize/ai"})

    @staticmethod
    async def scan_domain(model, user_id: str = "system"):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://trusted-micros-api:8010/urlscan/domain/{user_id}", json=model.model_dump(), timeout=120)
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": "Something happened while calling urlscan/domain"})
                return response.json()
        except Exception:
            return JSONResponse(
                status_code=500, content={"detail": "Something happened while calling urlscan/domain"})

    @staticmethod
    async def scan_ip(model, user_id: str = "system"):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://trusted-micros-api:8010/urlscan/ip/{user_id}",
                    json=model.model_dump(),
                    timeout=120
                )

                if response.status_code != 200:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": "Something happened while calling urlscan/ip"}
                    )

                return response.json()

        except Exception:
            return JSONResponse(
                status_code=500,
                content={"detail": "Something happened while calling urlscan/ip"}
            )

    @staticmethod
    async def scrape_social(model, user_id: str = "system"):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://trusted-micros-api:8010/social/scrape/{user_id}", json=model.model_dump(), timeout=120)
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": "Something happened while calling social/scrape"})
                return response.json()
        except Exception:
            return JSONResponse(
                status_code=500, content={"detail": "Something happened while calling social/scrape"})

    @staticmethod
    async def ioc_extract(model, user_id: str = "system"):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://trusted-micros-api:8010/ioc/extract/{user_id}", json=model.model_dump(), timeout=120)
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": "Something happened while calling /ioc/extract"})
                return response.json()
        except Exception:
            return JSONResponse(
                status_code=500, content={"detail": "Something happened while calling /ioc/extract"})

    @staticmethod
    async def parse_chat_ai(model, user_id: str = "system"):
        try:
            base_url = (env_handler.get_instance().env("DARKNEXUS_API_BASE") or "http://trusted-nexus-api:8030").strip().rstrip("/")

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{base_url}/nlp/chat/report/{user_id}", json=model.model_dump(), timeout=120)
                response.raise_for_status()
                return response.json()
        except Exception:
            return {"error": "Failed to generate chat report"}

    @staticmethod
    async def parse_nexus_chat_ai(model: ReportChatRequest, user_id: str = "system"):
        try:
            base_url = (env_handler.get_instance().env("DARKNEXUS_API_BASE") or "http://trusted-nexus-api:8030").strip().rstrip("/")
            has_report = bool((model.report or "").strip())
            endpoint = f"{base_url}/nlp/chat/report/{user_id}" if has_report else f"{base_url}/api/chat/{user_id}"
            nexus_payload = model.model_dump() if has_report else {"prompt": model.message}

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    endpoint, json=nexus_payload, timeout=120)
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": "Something happened while calling api/chat"})
                return response.json()
        except Exception:
            return JSONResponse(
                status_code=500, content={"detail": "Something happened while calling api/chat"})

    @staticmethod
    async def invoke_stealerlog_index(credential_index: LogBatchModel):
        m_data = elastic_request_generator().index_query_stealerlog(credential_index.model_dump())

        if not m_data:
            return {"parsed": "empty unqiue"}

        await elastic_controller.get_instance().index_dump(m_data)
        return {"parsed": "true"}

    async def invoke_social_index(self, social_index: social_data_model):

        m_bybass_embedding = social_index.cards_data[0].m_platform == "pastebin"
        m_data = elastic_request_generator().index_query_social(social_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data, m_bybass_embedding)

        return await self._update_or_create_model(
            base_url=social_index.seed_url,
            new_content_type=["social"],
            name=social_index.seed_url,
            new_index_type=[helper_controller.get_base_url(social_index.seed_url).replace("https://", "").replace(
                ".com",
                "").rstrip('/')],
            network_type=social_index.m_network,
            is_leak_update=False)

    async def invoke_sanctions_index(self, sanctions_index):
        if hasattr(sanctions_index, "model_dump"):
            payload = sanctions_index.model_dump(by_alias=True)
        else:
            payload = sanctions_index

        m_data = elastic_request_generator().index_query_sanctions(payload)
        if not m_data:
            return {"message": "no valid sanctions records to index"}

        await elastic_controller.get_instance().index_data(m_data, bypass_empty_embedding=True)
        return {"message": "sanctions indexed successfully", "indexed": len(m_data)}

    async def invoke_chat_index(self, chat_index: chat_data_model):
        m_data = elastic_request_generator().index_query_chat(chat_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data)

        return await self._update_or_create_model(
            base_url=chat_index.m_source_channel_url,
            new_content_type=["channel"],
            name=chat_index.m_channel_name,
            new_index_type=["chat"],
            network_type=chat_index.m_network,
            is_leak_update=False)

    async def invoke_generic_index(self, general_index: GeneralDataModel):
        m_data = elastic_request_generator().index_query_general(general_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data)
        return await self._update_or_create_model(
            base_url=general_index.m_base_url,
            new_content_type=general_index.m_content_type,
            new_index_type=['general'],
            network_type=general_index.m_network,
            is_leak_update=False)

    async def invoke_exploit_index(self, exploit_index: ExploitDataModel):
        m_data = elastic_request_generator().index_query_exploit(exploit_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data)
        return await self._update_or_create_model(
            base_url=exploit_index.base_url,
            new_content_type=['exploit'],
            new_index_type=['exploit'],
            network_type=exploit_index.m_network,
            is_leak_update=True)

    async def init_stealerlogs(self, leak_index: LeakDataModel):
        m_data = elastic_request_generator().index_query_stealerlog(leak_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data)
        return await self._update_or_create_model(
            base_url=leak_index.base_url,
            new_content_type=['stealer'],
            new_index_type=['stealer'],
            network_type=leak_index.m_network,
            is_leak_update=True)

    async def invoke_leak_index(self, leak_index: LeakDataModel):
        m_data = elastic_request_generator().index_query_leak(leak_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data)
        return await self._update_or_create_model(
            base_url=leak_index.base_url,
            new_content_type=['leaks'],
            new_index_type=['leak'],
            network_type=leak_index.m_network,
            is_leak_update=True)

    async def invoke_news_index(self, leak_index: LeakDataModel):
        m_data = elastic_request_generator().index_query_leak(leak_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data)
        return await self._update_or_create_model(
            base_url=leak_index.base_url,
            new_content_type=['news'],
            new_index_type=['leak'],
            network_type=leak_index.m_network,
            is_leak_update=True)

    async def invoke_tracking_index(self, leak_index: LeakDataModel):
        m_data = elastic_request_generator().index_query_leak(leak_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data)
        return await self._update_or_create_model(
            base_url=leak_index.base_url,
            new_content_type=['news', 'tracking'],
            new_index_type=['leak'],
            network_type=leak_index.m_network,
            is_leak_update=True)

    async def invoke_defacement_index(self, defacement_index: DefacementDataModel):
        m_data = elastic_request_generator().index_query_defacement(defacement_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data, True)
        return await self._update_or_create_model(
            base_url=defacement_index.base_url,
            new_content_type=['defacement'],
            new_index_type=['defacement'],
            network_type=defacement_index.m_network,
            is_leak_update=True)

    @staticmethod
    async def invoke_fetch_parser():
        parser_root = Path(CRAWL_PATHS.M_PARSER_FILE_PATH).with_name("parser_files")
        if not parser_root.exists():
            return JSONResponse(content={"detail": "File not found"}, status_code=404)
        payload = await crawl_model.getInstance()._build_parser_payload(parser_root)
        return Response(
            content=payload,
            media_type="application/zip",
            headers={"Content-Disposition": 'attachment; filename="parser_files.zip"'},
        )

    @staticmethod
    async def invoke_fetch_feeder(index_type):
        rule = constant.url_rules.get(index_type)
        if not rule:
            return JSONResponse(content={"detail": "File not found"}, status_code=404)
        payload = await crawl_model.getInstance()._build_feeder_file_content(index_type, str(rule.get("rule_type") or ""))
        return Response(
            content=payload,
            media_type="text/plain",
            headers={"Content-Disposition": f'attachment; filename="crawl_data_{index_type}.txt"'},
        )

    @staticmethod
    async def get_screenshot_file(filename: str):
        try:
            file_path = os.path.join(CRAWL_PATHS.M_SCREENSHOT, filename)
            if not os.path.exists(file_path):
                return {"error": "File not found"}
            return FileResponse(path=file_path, filename=filename, media_type="image/webp")
        except Exception:
            return {"error": "Failed to retrieve screenshot"}

    @staticmethod
    async def invoke_file_upload(payload: ScreenshotPayload):
        try:
            os.makedirs(CRAWL_PATHS.M_SCREENSHOT, exist_ok=True)
            file_path = os.path.join(CRAWL_PATHS.M_SCREENSHOT, payload.filename)
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(payload.data))
            return {"message": f"Screenshot saved successfully at {file_path}", "filename": payload.filename}
        except Exception:
            return {"error": "Failed to save screenshot"}

    def _decrypt_parser_file(self, parser_root: Path, source_path: Path, raw: bytes) -> bytes:
        if not raw.startswith(b"gAAAAA"):
            return raw

        try:
            decrypted = Fernet(CONSTANTS.S_ENCRYPTION_KEY.encode()).decrypt(raw)
        except Exception as exc:
            relative_path = source_path.relative_to(parser_root).as_posix()
            raise HTTPException(status_code=500, detail=f"Unable to decrypt parser file: {relative_path}") from exc

        return decrypted

    async def _build_feeder_file_content(self, rule_key: str, rule_type: str) -> bytes:
        engine = mongo_controller.get_instance().get_engine()
        entries: list[dict] = []
        if rule_type in {"shared", "generic"}:
            records = await engine.find(
                db_feeder_script_model,
                {
                    "rule_key": rule_key,
                    "feeder.index_status": True,
                },
            )
            for record in records:
                for value in (record.values or []):
                    url = value.get("url")
                    if not url:
                        continue
                    entries.append({
                        "url": url,
                        "file": f"_{rule_key}" if rule_type == "shared" else None,
                    })
        else:
            records = await engine.find(
                db_feeder_script_model,
                {
                    "rule_key": rule_key,
                    "url": {"$ne": None},
                    "feeder.index_status": True,
                },
            )
            for record in records:
                if not record.url:
                    continue
                entries.append({"url": record.url, "file": Path(record.name).stem})

        payload = "\n".join(json.dumps(entry, ensure_ascii=True) for entry in entries)
        return (f"{payload}\n" if payload else "").encode("utf-8")

    async def _build_parser_payload(self, parser_root: Path) -> bytes:
        zip_buffer = BytesIO()
        with ZipFile(zip_buffer, "w", compression=ZIP_DEFLATED) as archive:
            for source_path in sorted(path for path in parser_root.rglob("*") if path.is_file()):
                archive.writestr(
                    source_path.relative_to(parser_root).as_posix(),
                    self._decrypt_parser_file(parser_root, source_path, source_path.read_bytes()),
                )
            for rule_key, rule_value in sorted(constant.url_rules.items()):
                archive.writestr(
                    f"feeder/crawl_data_{rule_key}.txt",
                    await self._build_feeder_file_content(rule_key, str(rule_value.get("rule_type") or "")),
                )
        return zip_buffer.getvalue()

    async def index_log_record(self, log_model: LogModel):
        timestamp = datetime.now(timezone.utc).isoformat()

        for log in log_model.logs:
            log_hash = hashlib.sha256(log.encode("utf-8")).hexdigest()

            doc = {"log": log, "log_hash": log_hash, "timestamp": timestamp}

            await self._engine.save(
                {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_STEALERLOGS_INDEX, ELASTIC_KEYS.S_VALUE: doc})

        return JSONResponse(content={"message": "Logs indexed successfully"}, status_code=200)

    async def invoke_dump_index(self, dump_model: DumpModel):
        try:
            batch_id = dump_model.id
            if not dump_model.status:
                dump_model.status = False

            for index, url in enumerate(dump_model.leak_url):
                record_id = f"{batch_id}_{index}"

                dump_record = db_dump_record_model(
                    id=record_id,
                    parsed_status=dump_model.status,
                    leak_url=url,
                    source=dump_model.source,
                    group=dump_model.group,
                    link=dump_model.link)
                await self._engine.save(dump_record)

            return JSONResponse(content={"message": "Dump records saved successfully"}, status_code=200)

        except Exception:
            return JSONResponse(content={"error": "Failed to save dump records"}, status_code=500)

    @staticmethod
    async def fetch_cti_label(payload: CTITextRequest):
        url = "http://trusted-micros-api:8010/cti_classifier/classify"
        payload = {"data": payload.data}

        response = requests.post(url, json=payload)
        response.raise_for_status()

        return response.json()["result"]

    @staticmethod
    def _get_swarm_proxy_url(_request: Request) -> str:
        swarm_url = env_handler.get_instance().env("SWARM_URL")
        swarm_urls = [swarm_url]

        if swarm_url:
            stripped_value = swarm_url.strip()
            if stripped_value.startswith("["):
                try:
                    swarm_urls = json.loads(stripped_value)
                except json.JSONDecodeError:
                    swarm_urls = [item.strip() for item in stripped_value.split(",") if item.strip()]
            elif "," in stripped_value:
                swarm_urls = [item.strip() for item in stripped_value.split(",") if item.strip()]
            else:
                swarm_urls = [stripped_value]

        available_swarm_urls = [url.rstrip("/") for url in swarm_urls if url]
        if not available_swarm_urls:
            raise ValueError("SWARM_URL is not configured")

        target_base_url = secrets.choice(available_swarm_urls)
        return f"{target_base_url}/user-dumps"

    @staticmethod
    async def _post_swarm_payload(target_url: str, payload: dict):
        async with httpx.AsyncClient(timeout=120) as client:
            await client.post(target_url, json=payload)

    async def proxy_swarm_index(self, request: Request):
        payload = await request.json()
        normalized_url = self._normalize_swarm_route_url(self._extract_swarm_route_url(payload))

        if normalized_url:
            bloom = self._get_swarm_bloom()
            if normalized_url in bloom:
                return JSONResponse(content={"status": "duplicate_ignored"}, status_code=200)
            bloom.add(normalized_url)

        target_url = self._get_swarm_proxy_url(request)
        asyncio.create_task(self._post_swarm_payload(target_url, payload))
        return JSONResponse(content={"status": "accepted"}, status_code=202)
