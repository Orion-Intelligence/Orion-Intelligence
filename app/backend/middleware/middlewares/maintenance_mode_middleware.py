from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from backend.route_managers.server.maintenance_manager.maintenance_view_model import maintenance_view_model
from backend.services.state_manager.states import APP_STATUS


class maintenance_mode_middleware(BaseHTTPMiddleware):
  async def dispatch(self, request: Request, call_next):
    if APP_STATUS.S_MAINTAINANCE:
      return await maintenance_view_model.getInstance().invoke_trigger(request)

    response: Response = await call_next(request)
    return response
