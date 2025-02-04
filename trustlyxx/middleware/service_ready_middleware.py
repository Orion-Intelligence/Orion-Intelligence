import requests

from app.backend.view_managers.server.maintenance_manager.maintenance_enums import MAINTENANCE_MODEL_CALLBACK
from app.backend.view_managers.server.maintenance_manager.maintenance_view_model import maintenance_view_model


class service_ready_middleware:
  def __init__(self, get_response):
    self.get_response = get_response

  def __call__(self, request):
    try:
      es_response = requests.get('http://elasticsearch:9400/_cluster/health', timeout=5)
      if es_response.status_code != 200:
        return maintenance_view_model.getInstance().invoke_trigger(MAINTENANCE_MODEL_CALLBACK.M_INIT, request)
    except requests.RequestException:
      return maintenance_view_model.getInstance().invoke_trigger(MAINTENANCE_MODEL_CALLBACK.M_INIT, request)

    return self.get_response(request)
