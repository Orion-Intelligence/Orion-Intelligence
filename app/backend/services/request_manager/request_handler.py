from abc import abstractmethod


class request_handler:

  @abstractmethod
  def invoke_trigger(self, p_command, p_data):
    pass
