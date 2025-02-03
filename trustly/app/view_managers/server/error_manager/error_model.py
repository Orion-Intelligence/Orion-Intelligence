from trustly.app.view_managers.server.error_manager.error_enums import ERROR_MODEL_CALLBACK
from trustly.app.view_managers.server.error_manager.error_session_controller import error_session_controller
from trustly.services.request_manager.request_handler import request_handler


class error_model(request_handler):
  # Private Variables
  __instance = None
  __m_session = None

  # Initializations
  def __init__(self):
    self.__m_session = error_session_controller()
    pass

  def __init_page(self, p_request):
    return self.__m_session.init_parameters(p_request)

  # External Request Handler
  def invoke_trigger(self, p_command, p_data):
    if p_command == ERROR_MODEL_CALLBACK.M_INIT:
      return self.__init_page(p_data)
