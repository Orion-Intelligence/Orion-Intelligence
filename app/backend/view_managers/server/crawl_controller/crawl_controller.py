import json
import os
import zipfile
import io
from starlette.responses import StreamingResponse
from backend.services.elastic_manager.elastic_controller import elastic_controller
from backend.services.elastic_manager.elastic_enums import ELASTIC_REQUEST_COMMANDS, ELASTIC_INDEX
from backend.services.mongo_manager.mongo_controller import mongo_controller
from backend.view_managers.server.crawl_controller.crawl_enums import CRAWL_COMMANDS, CRAWL_ERROR_CALLBACK
from fastapi.responses import FileResponse

from backend.view_managers.server.crawl_controller.crawl_session_controller import crawl_session_controller


class crawl_controller:
  # Private Variables
  __instance = None
  __m_session = None

  # Initializations
  @staticmethod
  def getInstance():
    if crawl_controller.__instance is None:
      crawl_controller()
    return crawl_controller.__instance

  def __init__(self):
    if crawl_controller.__instance is not None:
      pass
    else:
      crawl_controller.__instance = self
      self.__m_session = crawl_session_controller()

  async def __handle_request(self, request):
    body = await request.json()
    m_status, m_crawl_model = self.__m_session.init_parameters(body)
    if m_status is False:
      m_context = [False, CRAWL_ERROR_CALLBACK.M_INVALID_PARAM]
      return json.dumps(m_context)
    else:
      m_leak_index = None
      m_generic_index = None
      m_crawl_model.m_data = json.loads(m_crawl_model.m_data)
      if "m_generic_model" in m_crawl_model.m_data:
        m_generic_index = json.loads(m_crawl_model.m_data['m_generic_model'])
      if "m_leak_data_model" in m_crawl_model.m_data:
        m_leak_index = json.loads(m_crawl_model.m_data['m_leak_data_model'])

      m_context = {}
      if m_leak_index and len(m_leak_index["cards_data"]):
        m_response_leak, m_data_leak = await elastic_controller.get_instance().invoke_trigger(m_crawl_model.m_command, [ELASTIC_REQUEST_COMMANDS.S_INDEX_LEAK, [m_leak_index, ELASTIC_INDEX.S_LEAK_INDEX]])
        await mongo_controller.getInstance().update_url_status([m_leak_index["base_url"], True, len(m_leak_index["cards_data"]) > 0, m_leak_index["content_type"], m_leak_index["m_network"]])
        m_context = [m_response_leak, m_data_leak]
      if m_generic_index:
        m_response_generic, m_data_generic = await elastic_controller.get_instance().invoke_trigger(m_crawl_model.m_command, [ELASTIC_REQUEST_COMMANDS.S_INDEX_GENERAL, [m_generic_index, ELASTIC_INDEX.S_GENERIC_INDEX]])
        await mongo_controller.getInstance().update_url_status([m_generic_index["m_base_url"], True, None, m_generic_index["m_content_type"], m_generic_index["m_network"]])
        m_context = [m_response_generic, m_data_generic]

      return json.dumps(m_context)

  # External Request Callbacks
  async def invoke_trigger(self, p_command, request=None):

    static_folder = "static"

    if p_command == CRAWL_COMMANDS.M_INIT:
      return await self.__handle_request(request)

    if p_command == CRAWL_COMMANDS.M_FETCH_FEEDER:
      file_path = os.path.join(static_folder, 'trustly', '.well-known', 'feeder', "crawl_data.txt")

      return FileResponse(file_path, media_type="text/plain", filename="crawl_data.txt")

    if p_command == CRAWL_COMMANDS.M_FETCH_FEEDER_UNIQUE:
      file_path = os.path.join(static_folder, 'trustly', '.well-known', 'feeder', "crawl_data_unique.txt")

      return FileResponse(file_path, media_type="text/plain", filename="crawl_data_unique.txt")

    if p_command == CRAWL_COMMANDS.M_FETCH_PARSER:

      parser_folder = os.path.join(static_folder, 'backend', '.well-known', 'parser')

      zip_buffer = io.BytesIO()

      with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:

        for root, dirs, files in os.walk(parser_folder):

          for file_name in files:
            file_path = os.path.join(root, file_name)

            arcname = os.path.relpath(file_path, start=parser_folder)

            zip_file.write(file_path, arcname=arcname)

      zip_buffer.seek(0)

      return StreamingResponse(zip_buffer, media_type="application/zip", headers={"Content-Disposition": "attachment; filename=parser_files.zip"})

    return {"error": "Invalid command"}
