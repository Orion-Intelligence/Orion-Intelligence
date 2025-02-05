from backend.view_managers.server.maintenance_manager.shared_model.maintenance_callback_model import maintenance_callback_model

class maintenance_session_controller:

  # External Request Callbacks
  @staticmethod
  async def init_callback():
    return maintenance_callback_model()