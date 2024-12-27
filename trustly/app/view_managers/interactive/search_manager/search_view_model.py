from django.http import HttpResponseRedirect
from django.shortcuts import render
from trustly.app.constants.constant import CONSTANTS
from trustly.app.view_managers.interactive.search_manager.search_enums import SEARCH_MODEL_COMMANDS
from trustly.app.view_managers.interactive.search_manager.search_model import search_model
from trustly.services.request_manager.request_handler import request_handler


class search_view_model(request_handler):
  # Private Variables
  __instance = None
  __m_search_model = None

  # Initializations
  @staticmethod
  def getInstance():
    if search_view_model.__instance is None:
      search_view_model()
    return search_view_model.__instance

  def __init__(self):
    if search_view_model.__instance is not None:
      pass
    else:
      search_view_model.__instance = self
      self.__m_search_model = search_model()

  # External Request Callbacks
  def invoke_trigger(self, p_command, p_data):
    if p_command == SEARCH_MODEL_COMMANDS.M_FETCH_RESULT:
      return self.__m_search_model.invoke_trigger(SEARCH_MODEL_COMMANDS.M_FETCH_RESULT, p_data)
    else:
      if p_command == SEARCH_MODEL_COMMANDS.M_INIT:
        m_status, m_response = self.__m_search_model.invoke_trigger(SEARCH_MODEL_COMMANDS.M_INIT, p_data)
        if m_status is True:
          return render(None, CONSTANTS.S_TEMPLATE_SEARCH_WEBSITE_PATH, m_response)
        else:
          return HttpResponseRedirect(redirect_to=CONSTANTS.S_TEMPLATE_PARENT)
      else:
        m_response = None

    return m_response
