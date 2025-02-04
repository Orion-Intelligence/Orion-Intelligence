from app.backend.view_managers.server.error_manager.error_enums import ERROR_MESSAGE_CALLBACK
from app.backend.view_managers.server.error_manager.shared_model.error_callback_model import error_callback_model
from app.backend.view_managers.server.error_manager.shared_model.error_param_model import error_param_model


class error_session_controller:

  # Helper Methods
  @staticmethod
  async def init_callback(params: error_param_model) -> error_callback_model:
    m_error_code = params.error_code

    error_messages = {
      400: ERROR_MESSAGE_CALLBACK.M_ERROR_400,
      403: ERROR_MESSAGE_CALLBACK.M_ERROR_403,
      404: ERROR_MESSAGE_CALLBACK.M_ERROR_404,
      500: ERROR_MESSAGE_CALLBACK.M_ERROR_500
    }

    error_message = error_messages.get(m_error_code, "Unknown Error")

    return error_callback_model(
      mErrorCode=m_error_code,
      mErrorMessage=error_message
    )