# Local Imports
import base64
import time
from cryptography.fernet import Fernet
from backend.services.block_manager.block_enums import BLOCK_PARAM, BLOCK_COMMAND
from backend.helper_manager.env_handler import env_handler


class block_controller:
  # Local Variables
  __instance = None
  __m_fernet = None

  # Initializations
  @staticmethod
  def getInstance():
    if block_controller.__instance is None:
      block_controller()
    return block_controller.__instance

  def __init__(self):
    block_controller.__instance = self
    self.__m_fernet = Fernet(base64.urlsafe_b64encode(str.encode(env_handler.get_instance().env('S_FERNET_KEY'))))

  def __on_verify(self, p_request):
    try:
      m_secret_token = p_request.headers.get(BLOCK_PARAM.M_SECRET_TOKEN)
      if m_secret_token is not None:
        m_decoded_str = self.__m_fernet.decrypt(m_secret_token.encode()).decode("utf-8").split("----")

        m_secret_key = m_decoded_str[0]
        m_secret_time = int(m_decoded_str[1])

        if m_secret_key.startswith(env_handler.get_instance().env('S_APP_BLOCK_KEY')):
          m_time = m_secret_time
          if (time.time() - m_time - 60) < 30:
            return True
          else:
            return False
        return True
      return False

    except Exception as ex:
      return False

  def invoke_trigger(self, p_commands, p_data=None):
    if p_commands == BLOCK_COMMAND.S_VERIFY_REQUEST:
      return self.__on_verify(p_data)
