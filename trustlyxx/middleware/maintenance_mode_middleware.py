from app.backend.view_managers.server.maintenance_manager.maintenance_enums import MAINTENANCE_MODEL_CALLBACK
from app.backend.view_managers.server.maintenance_manager.maintenance_view_model import maintenance_view_model
from app.services.state_manager.states import APP_STATUS
from django.utils.deprecation import MiddlewareMixin


class maintenance_mode_middleware(MiddlewareMixin):
  @staticmethod
  def process_request(request):
    if APP_STATUS.S_MAINTAINANCE is True:
      return maintenance_view_model.getInstance().invoke_trigger(MAINTENANCE_MODEL_CALLBACK.M_INIT, request)
