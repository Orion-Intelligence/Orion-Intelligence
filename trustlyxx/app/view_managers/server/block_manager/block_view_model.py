from django.shortcuts import render

from app.backend.constants.constant import CONSTANTS
from app.backend.view_managers.server.block_manager.block_enums import BLOCK_MODEL_CALLBACK
from app.services.request_manager.request_handler import request_handler


class block_view_model(request_handler):
  # Private Variables
  __instance = None

  # Initializations
  @staticmethod
  def getInstance():
    if block_view_model.__instance is None:
      block_view_model()
    return block_view_model.__instance

  def __init__(self):
    if block_view_model.__instance is not None:
      pass
    else:
      block_view_model.__instance = self

  # External Request Callbacks
  def invoke_trigger(self, p_command, p_data):
    if p_command == BLOCK_MODEL_CALLBACK.M_INIT:
      return render(None, CONSTANTS.S_TEMPLATE_NOTICE_WEBSITE_PATH)
