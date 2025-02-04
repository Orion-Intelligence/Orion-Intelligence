import os
from dotenv import load_dotenv


class env_handler:
  __instance = None
  _env_vars = {}

  @staticmethod
  def get_instance():
    if env_handler.__instance is None:
      env_handler.__instance = env_handler()
    return env_handler.__instance

  def __init__(self):
    if env_handler.__instance is not None:
      raise Exception("This class is a singleton!")
    else:
      load_dotenv()

  def env(self, key, default=None):
    if key not in self._env_vars:
      value = os.getenv(key, default)
      self._env_vars[key] = value
    else:
      value = self._env_vars[key]
    return value
