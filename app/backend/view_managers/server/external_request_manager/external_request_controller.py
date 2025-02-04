import aiohttp
import asyncio
from threading import Thread, Semaphore
from queue import Queue
from django.http import HttpResponse
from app.services.mongo_manager.mongo_controller import mongo_controller
from app.services.mongo_manager.mongo_enums import MONGODB_CRUD
from app.services.mongo_manager.mongo_enums import MONGO_COMMANDS
from app.backend.view_managers.server.external_request_manager.external_request_enums import EXTERNAL_REQUEST_COMMANDS, EXTERNAL_REQUEST_PARAM
from app.services.request_manager.request_handler import request_handler
from app.backend.view_managers.interactive.search_manager.search_enums import API_RESPONSE

class external_request_controller(request_handler):
  __instance = None
  __pending_requests = {}
  __queue = None
  __semaphore = Semaphore(1)
  __max_queue_size = 10

  __loop = None
  __thread = None

  @staticmethod
  def start_background_loop():
    if external_request_controller.__loop is None:
      external_request_controller.__loop = asyncio.new_event_loop()
      external_request_controller.__thread = Thread(target=external_request_controller.__loop.run_forever)
      external_request_controller.__thread.daemon = True
      external_request_controller.__thread.start()

  @staticmethod
  def init_queue():
    if external_request_controller.__queue is None:
      external_request_controller.__queue = Queue(maxsize=external_request_controller.__max_queue_size)

  @staticmethod
  def getInstance():
    if external_request_controller.__instance is None:
      external_request_controller.start_background_loop()
      external_request_controller.init_queue()
      external_request_controller()
    return external_request_controller.__instance

  def __init__(self):
    if external_request_controller.__instance is not None:
      pass
    else:
      Thread(target=external_request_controller.__process_queue, daemon=True).start()
      external_request_controller.__instance = self

  @staticmethod
  def __update_module_status(p_data):
    m_request_type = p_data.GET[EXTERNAL_REQUEST_PARAM.M_REQUEST]
    if m_request_type == "m_cronjob" or m_request_type == "m_crawler":
      mongo_controller.getInstance().invoke_trigger(MONGODB_CRUD.S_UPDATE, [MONGO_COMMANDS.M_UPDATE_STATUS, [m_request_type], [None]])
      return HttpResponse("success")
    return HttpResponse("failed")

  @staticmethod
  async def __fetch_runtime_parser_async(p_data, response_dict):
    url = "http://trusted-crawler-api:8000/runtime/parse"
    param = {"query": p_data}
    try:
      async with aiohttp.ClientSession() as session:
        async with session.post(url, json=param) as response:
          if response.status == 200:
            response_dict[tuple(sorted(p_data.items()))] = await response.json()
    except Exception:
      response_dict[tuple(sorted(p_data.items()))] = []
    finally:
      external_request_controller.__semaphore.release()

  @staticmethod
  def __process_queue():
    while True:
      p_data = external_request_controller.__queue.get()
      if p_data is not None:
        asyncio.run_coroutine_threadsafe(
          external_request_controller.__fetch_runtime_parser_async(p_data, external_request_controller.__pending_requests),
          external_request_controller.__loop
        )

  @staticmethod
  def __fetch_runtime_parser(p_data, p_dynamic_crawl_trigger):
    query = tuple(sorted(p_data.items()))
    if query in external_request_controller.__pending_requests:
      if external_request_controller.__pending_requests[query] is None:
        return API_RESPONSE.M_PENDING, []
      elif p_dynamic_crawl_trigger != "1":
        return API_RESPONSE.M_SUCCESS, external_request_controller.__pending_requests[query]

    external_request_controller.__pending_requests[query] = None

    if not external_request_controller.__queue.full():
      try:
        external_request_controller.__queue.put_nowait(p_data)
      except Exception as e:
        external_request_controller.__pending_requests[query] = []
    else:
      external_request_controller.__pending_requests[query] = []
    return API_RESPONSE.M_PENDING, []

  def invoke_trigger(self, p_command, p_data):
    if p_command == EXTERNAL_REQUEST_COMMANDS.M_UPDATE_MODULE_STATUS:
      return self.__update_module_status(p_data)
    if p_command == EXTERNAL_REQUEST_COMMANDS.M_RUNTIME_PARSER:
      return self.__fetch_runtime_parser(p_data[0], p_data[1])
