from django.shortcuts import render, redirect
from app.backend.constants.constant import CONSTANTS
from app.backend.view_managers.interactive.directory_manager.directory_enums import DIRECTORY_MODEL_COMMANDS
from app.backend.view_managers.interactive.directory_manager.directory_model import directory_model
from app.services.request_manager.request_handler import request_handler


class directory_view_model(request_handler):
  # Private Variables
  __instance = None
  __m_directory_model = None

  # Initializations
  @staticmethod
  def getInstance():
    if directory_view_model.__instance is None:
      directory_view_model()
    return directory_view_model.__instance

  def __init__(self):
    if directory_view_model.__instance is not None:
      pass
    else:
      directory_view_model.__instance = self
      self.__m_directory_model = directory_model()

  # External Request Callbacks
  def invoke_trigger(self, p_command, p_data):
    if p_command == DIRECTORY_MODEL_COMMANDS.M_FETCH_LIST:
      return self.__m_directory_model.invoke_trigger(DIRECTORY_MODEL_COMMANDS.M_FETCH_LIST, p_data)
    elif p_command == DIRECTORY_MODEL_COMMANDS.M_INIT:
      m_response, m_status = self.__m_directory_model.invoke_trigger(DIRECTORY_MODEL_COMMANDS.M_INIT, p_data)
      if m_status:
        return render(p_data, CONSTANTS.S_TEMPLATE_DIRECTORY_WEBSITE_PATH, m_response)
      else:
        return redirect('/directory/?page=1')
    else:
      m_response = None
    return m_response
