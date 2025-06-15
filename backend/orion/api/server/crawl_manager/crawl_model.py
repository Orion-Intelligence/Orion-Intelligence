import base64
import os
from datetime import datetime, timezone

import httpx
import requests
from fastapi.responses import FileResponse
from starlette.responses import JSONResponse

from orion.api.server.crawl_manager.class_model.chat_model import chat_data_model
from orion.api.server.crawl_manager.class_model.defacement_model import DefacementDataModel
from orion.api.server.crawl_manager.class_model.dump_model import DumpModel
from orion.api.server.crawl_manager.class_model.exploit_model import ExploitDataModel
from orion.api.server.crawl_manager.class_model.file_model import ScreenshotPayload
from orion.api.server.crawl_manager.class_model.general_model import GeneralDataModel
from orion.api.server.crawl_manager.class_model.leak_model import LeakDataModel
from orion.api.server.crawl_manager.class_model.nlp_data_model import nlp_data_model
from orion.api.server.crawl_manager.crawl_enums import CRAWL_PATHS, CRAWL_CALLBACK_RESPONSES
from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_request_generator import elastic_request_generator
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_dump_model import db_dump_record_model
from orion.services.mongo_manager.shared_model.db_url_data_model import db_url_data_model
from orion.shared_models.crawl_models.CTITextRequest import CTITextRequest


class crawl_model:
    __instance = None

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

    async def _update_or_create_model(self, base_url: str, new_content_type: list, new_index_type: list,
                                      network_type: str, is_leak_update: bool, name: str = None):
        normalized_url = base_url
        if network_type != "telegram":
            normalized_url = helper_controller.get_base_url(base_url).rstrip('/')

        general_model = await self._engine.find_one(db_url_data_model, db_url_data_model.url == normalized_url)
        if not new_content_type:
            new_content_type = "general"

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
                geneic_model_last_update=datetime.now(timezone.utc) if not is_leak_update else None
            )

        await self._engine.save(general_model)
        return JSONResponse(content={"message": CRAWL_CALLBACK_RESPONSES.M_WEBSITE_INDEXED}, status_code=200)

    @staticmethod
    async def make_cti_request(text: str):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/cti_classifier/classify",
                json={"text": text}
            )
            return response.json()

    @staticmethod
    async def parse_chat(model: nlp_data_model):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://trusted-micros-api:8010/nlp/parse",
                    json={"data": model.data},
                    timeout=10
                )
                return response.json()
        except Exception as ex:
            return {"error": str(ex)}

    @staticmethod
    async def parse_summarize_ai(model: nlp_data_model):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://168.231.86.34:8010/nlp/summarize/ai",
                    json={"data": model.data},
                    timeout=200
                )
                return response.json()
        except Exception as ex:
            return {"error": str(ex)}

    @staticmethod
    async def parse_chat_ai(model: nlp_data_model):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://168.231.86.34:8010/nlp/parse/ai",
                    json={"data": model.data},
                    timeout=10
                )
                return response.json()
        except Exception as ex:
            return {"error": str(ex)}

    async def invoke_chat_index(self, chat_index: chat_data_model):
        m_data = elastic_request_generator().index_query_chat(chat_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data)

        return await self._update_or_create_model(
            base_url=chat_index.m_source_channel_url,
            new_content_type=["channel"],
            name=chat_index.m_channel_name,
            new_index_type=["chat"],
            network_type=chat_index.m_network,
            is_leak_update=False
        )

    async def init_general(self, general_index: GeneralDataModel):
        m_data = elastic_request_generator().index_query_general(general_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data)
        return await self._update_or_create_model(
            base_url=general_index.m_base_url,
            new_content_type=general_index.m_content_type,
            new_index_type=['general'],
            network_type=general_index.m_network,
            is_leak_update=False
        )

    async def init_exploit(self, exploit_index: ExploitDataModel):
        m_data = elastic_request_generator().index_query_exploit(exploit_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data)
        return await self._update_or_create_model(
            base_url=exploit_index.base_url,
            new_content_type=['exploit'],
            new_index_type=['exploit'],
            network_type=exploit_index.m_network,
            is_leak_update=True
        )

    async def init_leak(self, leak_index: LeakDataModel):
        m_data = elastic_request_generator().index_query_leak(leak_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data)
        return await self._update_or_create_model(
            base_url=leak_index.base_url,
            new_content_type=['leaks'],
            new_index_type=['leak'],
            network_type=leak_index.m_network,
            is_leak_update=True
        )

    async def init_defacement(self, defacement_index: DefacementDataModel):
        m_data = elastic_request_generator().index_query_defacement(defacement_index.model_dump())
        await elastic_controller.get_instance().index_data(m_data)
        return await self._update_or_create_model(
            base_url=defacement_index.base_url,
            new_content_type=['defacement'],
            new_index_type=['defacement'],
            network_type=defacement_index.m_network,
            is_leak_update=True
        )

    @staticmethod
    async def fetch_parser():
        if os.path.exists(CRAWL_PATHS.M_PARSER_FILE_PATH):
            return FileResponse(CRAWL_PATHS.M_PARSER_FILE_PATH, media_type="application/zip",
                                filename="parser_files.zip")
        else:
            return JSONResponse(content={"detail": "File not found"}, status_code=404)

    @staticmethod
    async def fetch_feeder(index_type):
        if os.path.exists(CRAWL_PATHS.M_FEEDER_FILE_PATH):
            return FileResponse(CRAWL_PATHS.M_FEEDER_FILE_PATH + f"crawl_data_{index_type}.txt",
                                media_type="text/plain", filename="crawl_data_leak.txt")
        else:
            return JSONResponse(content={"detail": "File not found"}, status_code=404)

    @staticmethod
    async def get_screenshot_file(filename: str):
        try:
            file_path = os.path.join(CRAWL_PATHS.M_SCREENSHOT, filename)
            if not os.path.exists(file_path):
                return {"error": "File not found"}
            return FileResponse(path=file_path, filename=filename, media_type="image/webp")
        except Exception as e:
            # Log the exception details for debugging purposes
            import logging
            logging.error(f"Error retrieving screenshot file '{filename}': {str(e)}", exc_info=True)
            # Return a generic error message to the user
            return {"error": "An internal error occurred while retrieving the screenshot."}

    @staticmethod
    async def invoke_file_upload(payload: ScreenshotPayload):
        try:
            os.makedirs(CRAWL_PATHS.M_SCREENSHOT, exist_ok=True)
            file_path = os.path.join(CRAWL_PATHS.M_SCREENSHOT, payload.filename)
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(payload.data))
            return {
                "message": f"Screenshot saved successfully at {file_path}",
                "filename": payload.filename
            }
        except Exception as e:
            return {
                "error": f"Failed to save screenshot: {str(e)}"
            }

    async def index_dump_record(self, dump_model: DumpModel):
        try:
            batch_id = dump_model.id

            for index, url in enumerate(dump_model.leak_url):
                record_id = f"{batch_id}_{index}"

                dump_record = db_dump_record_model(
                    id=record_id,
                    parsed_status=False,
                    leak_url=url,
                    source=dump_model.source,
                    group=dump_model.group,
                    link=dump_model.link
                )
                await self._engine.save(dump_record)

            return JSONResponse(content={"message": "Dump records saved successfully"}, status_code=200)

        except Exception as e:
            return JSONResponse(content={"error": f"Failed to save dump records: {str(e)}"}, status_code=500)

    @staticmethod
    async def fetch_cti_label(payload: CTITextRequest):
        url = "http://trusted-micros-api:8010/cti_classifier/classify"
        payload = {
            "data": payload.data
        }

        response = requests.post(url, json=payload)
        response.raise_for_status()

        return response.json()["result"]
