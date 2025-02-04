from app.backend.helper_manager.env_handler import env_handler

production_mode = env_handler.get_instance().env("PRODUCTION", "0") == "1"
maintainance_mode = env_handler.get_instance().env("MAINTAINANCE", "0") == "1"

class APP_STATUS:
  S_DEVELOPER = not production_mode
  S_MAINTAINANCE = maintainance_mode
