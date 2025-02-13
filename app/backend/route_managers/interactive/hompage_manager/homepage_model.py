from backend.route_managers.interactive.hompage_manager.homepage_session_controller import homepage_session_controller


class homepage_model:
  # Private Variables
  __instance = None
  __m_session = None

  # Initializations
  def __init__(self):
    self.__m_session = homepage_session_controller()
    pass

  async def init_page(self):
    m_context = await self.__m_session.init_callback()

    return m_context
