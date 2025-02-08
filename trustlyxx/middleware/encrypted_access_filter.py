from django.utils.deprecation import MiddlewareMixin

from app.backend.view_managers.server.error_manager.error_enums import ERROR_MODEL_CALLBACK
from app.services.block_manager.block_controller import block_controller
from app.services.block_manager.block_enums import BLOCK_COMMAND
from django.urls import resolve
from app.backend.view_managers.server.error_manager.error_view_model import error_view_model
from app.backend.view_managers.server.maintenance_manager.maintenance_view_model import maintenance_view_model
from app.backend.view_managers.server.maintenance_manager.maintenance_enums import MAINTENANCE_MODEL_CALLBACK


class EncryptedAccessFilter(MiddlewareMixin):
  @staticmethod
  def process_request(request):
    allowed_paths = ['feeder', 'parser', 'feeder_publish', 'feeder_unique', 'update_status', 'crawl_index', 'cms']
    resolved_path = resolve(request.path_info).url_name

    if resolved_path in allowed_paths:
      if not block_controller.get_instance().invoke_trigger(BLOCK_COMMAND.S_VERIFY_REQUEST, request):
        if resolved_path == 'cms':
          return maintenance_view_model.getInstance().invoke_trigger(MAINTENANCE_MODEL_CALLBACK.M_INIT, request)
        return error_view_model.getInstance().invoke_trigger(ERROR_MODEL_CALLBACK.M_INIT, [request, 404])
