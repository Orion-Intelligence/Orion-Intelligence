from backend.route_managers.server.maintenance_manager.maintenance_session_controller import maintenance_session_controller


class maintenance_model:
  # Private Variables
  __instance = None
  __m_session = None

  # Initializations
  def __init__(self):
    self.__m_session = maintenance_session_controller()
    pass

  # External Request Handler
  async def invoke_trigger(self):
    return await self.__m_session.init_callback()

