from trustly.app.constants.strings import GENERAL_STRINGS
from trustly.app.view_managers.server.error_manager.error_enums import ERROR_CALLBACK, ERROR_MESSAGE_CALLBACK


class error_session_controller:

  # Helper Methods
  @staticmethod
  def init_parameters(p_data):
    m_error_code = p_data[1]

    m_context = {ERROR_CALLBACK.M_SECURE_SERVICE_NOTICE: "http", ERROR_CALLBACK.M_ERROR_CODE: m_error_code, ERROR_CALLBACK.M_ERROR_MESSAGE: GENERAL_STRINGS.S_GENERAL_EMPTY, }

    if m_error_code == 400:
      m_context[ERROR_CALLBACK.M_ERROR_MESSAGE] = ERROR_MESSAGE_CALLBACK.M_ERROR_400
    if m_error_code == 403:
      m_context[ERROR_CALLBACK.M_ERROR_MESSAGE] = ERROR_MESSAGE_CALLBACK.M_ERROR_403
    if m_error_code == 404:
      m_context[ERROR_CALLBACK.M_ERROR_MESSAGE] = ERROR_MESSAGE_CALLBACK.M_ERROR_404
    if m_error_code == 500:
      m_context[ERROR_CALLBACK.M_ERROR_MESSAGE] = ERROR_MESSAGE_CALLBACK.M_ERROR_500

    return m_context, True
