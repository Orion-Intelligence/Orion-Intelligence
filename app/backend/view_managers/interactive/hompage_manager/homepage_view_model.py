from django.shortcuts import render

from app.backend.constants.constant import CONSTANTS
from app.backend.view_managers.interactive.hompage_manager.homepage_enums import HOMEPAGE_MODEL_COMMANDS
from app.backend.view_managers.interactive.hompage_manager.homepage_model import homepage_model
from app.services.request_manager.request_handler import request_handler


class homepage_view_model(request_handler):
  # Private Variables
  __instance = None
  __m_homepage_model = None

  # Initializations
  @staticmethod
  def getInstance():
    if homepage_view_model.__instance is None:
      homepage_view_model()
    return homepage_view_model.__instance

  def __init__(self):
    if homepage_view_model.__instance is not None:
      pass
    else:
      homepage_view_model.__instance = self
      self.__m_homepage_model = homepage_model()

  # External Request Callbacks
  def invoke_trigger(self, p_command, p_data):
    if p_command == HOMEPAGE_MODEL_COMMANDS.M_INIT:
      m_response, m_status = self.__m_homepage_model.invoke_trigger(HOMEPAGE_MODEL_COMMANDS.M_INIT, p_data)
      return render(p_data, CONSTANTS.S_TEMPLATE_INDEX_PATH, m_response)
    else:
      m_response = None
    return m_response
