import redis

from app.services.redis_manager.redis_enums import REDIS_CONNECTIONS, REDIS_COMMANDS


class redis_controller:
  __redis = None

  def __init__(self):
    self.__redis = redis.StrictRedis(port=REDIS_CONNECTIONS.S_DATABASE_PORT, host=REDIS_CONNECTIONS.S_DATABASE_IP, password=REDIS_CONNECTIONS.S_DATABASE_PASSWORD, decode_responses=True)

  @classmethod
  def destroy_instance(cls):
      cls.__instance = None

  def close_connection(self):
    self.__redis.close()

  def __del__(self):
    self.close_connection()

  def __set_bool(self, p_key, p_val):
    self.__redis.set(p_key, int(p_val))

  def __get_bool(self, p_key, p_val=None):
    if not self.__redis.exists(p_key):
      if p_val is not None:
        self.__set_bool(p_key, p_val)
      else:
        return None
    return bool(int(self.__redis.get(p_key)))

  def __set_int(self, p_key, p_val, expiry=None):
    self.__redis.set(p_key, p_val, expiry)

  def __get_int(self, p_key, p_val, expiry=None):
    if not self.__redis.exists(p_key):
      self.__set_int(p_key, p_val, expiry)
    return self.__redis.get(p_key)

  def __set_float(self, p_key, p_val, expiry=None):
    self.__redis.set(p_key, p_val, expiry)

  def __get_float(self, p_key, p_val, expiry=None):
    if not self.__redis.exists(p_key):
      self.__set_float(p_key, p_val, expiry)
    return float(self.__redis.get(p_key))

  def __set_string(self, p_key, p_val, expiry=None):
    self.__redis.set(p_key, p_val, expiry)

  def __get_string(self, p_key, p_val=None, expiry=None):
    if not self.__redis.exists(p_key):
      if p_val is not None:
        self.__set_string(p_key, p_val)
        self.__redis.expire(p_key, expiry)
      else:
        return None
    return self.__redis.get(p_key)

  def __set_list(self, p_key, p_val, expiry=None):
    self.__redis.sadd(p_key, p_val)
    if expiry is not None:
      self.__redis.expire(p_key, expiry)

  def __get_list(self, p_key, p_val, expiry=None):
    if not self.__redis.exists(p_key) and p_val is not None:
      self.__set_list(p_key, p_val, expiry)
    return self.__redis.smembers(p_key)

  def __get_keys(self):
    return self.__redis.keys()

  # New flushall function
  def __flush_all(self):
    self.__redis.flushall()

  # New acquire lock function
  def __acquire_lock(self, p_key, timeout=None, blocking_timeout=None):
    lock = self.__redis.lock(p_key, timeout=timeout, blocking_timeout=blocking_timeout)
    if lock.acquire(blocking=False):
      return True
    return False

  # New release lock function
  def __release_lock(self, p_key):
    lock = self.__redis.lock(p_key)
    if lock.locked():
      lock.release()

  def invoke_trigger(self, p_commands, p_data=None):
    if p_commands == REDIS_COMMANDS.S_GET_INT:
      return self.__get_int(p_data[0], p_data[1], p_data[2])
    elif p_commands == REDIS_COMMANDS.S_SET_INT:
      return self.__set_int(p_data[0], p_data[1], p_data[2])
    elif p_commands == REDIS_COMMANDS.S_GET_BOOL:
      return self.__get_bool(p_data[0], p_data[1])
    elif p_commands == REDIS_COMMANDS.S_SET_BOOL:
      return self.__set_bool(p_data[0], p_data[1])
    elif p_commands == REDIS_COMMANDS.S_GET_STRING:
      return self.__get_string(p_data[0], p_data[1], p_data[2])
    elif p_commands == REDIS_COMMANDS.S_SET_STRING:
      return self.__set_string(p_data[0], p_data[1], p_data[2])
    elif p_commands == REDIS_COMMANDS.S_SET_LIST:
      return self.__set_list(p_data[0], p_data[1], p_data[2])
    elif p_commands == REDIS_COMMANDS.S_GET_LIST:
      return self.__get_list(p_data[0], p_data[1], p_data[2])
    elif p_commands == REDIS_COMMANDS.S_GET_KEYS:
      return self.__get_keys()
    elif p_commands == REDIS_COMMANDS.S_GET_FLOAT:
      return self.__get_float(p_data[0], p_data[1], p_data[2])
    elif p_commands == REDIS_COMMANDS.S_SET_FLOAT:
      return self.__set_float(p_data[0], p_data[1], p_data[2])
    elif p_commands == REDIS_COMMANDS.S_FLUSH_ALL:
      self.__flush_all()
    elif p_commands == REDIS_COMMANDS.S_ACQUIRE_LOCK:
      return self.__acquire_lock(p_data[0], p_data[1], p_data[2])
    elif p_commands == REDIS_COMMANDS.S_RELEASE_LOCK:
      self.__release_lock(p_data[0])
