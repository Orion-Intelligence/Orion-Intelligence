from django.shortcuts import render

from app.backend.constants.constant import CONSTANTS
from app.backend.view_managers.server.maintenance_manager.maintenance_enums import MAINTENANCE_MODEL_CALLBACK
from app.backend.view_managers.server.maintenance_manager.maintenance_model import maintenance_model
from app.services.request_manager.request_handler import request_handler


class maintenance_view_model(request_handler):
  # Private Variables
  __instance = None
  __m_maintenance_model = None

  # Initializations
  @staticmethod
  def getInstance():
    if maintenance_view_model.__instance is None:
      maintenance_view_model()
    return maintenance_view_model.__instance

  def __init__(self):
    if maintenance_view_model.__instance is not None:
      pass
    else:
      maintenance_view_model.__instance = self
      self.__m_maintenance_model = maintenance_model()

  # External Request Callbacks
  def invoke_trigger(self, p_command, p_data):
    if p_command == MAINTENANCE_MODEL_CALLBACK.M_INIT:
      m_response, m_status = self.__m_maintenance_model.invoke_trigger(MAINTENANCE_MODEL_CALLBACK.M_INIT, p_data)
      return render(None, CONSTANTS.S_TEMPLATE_MAINTENANCE_WEBSITE_PATH, m_response, status=500)
