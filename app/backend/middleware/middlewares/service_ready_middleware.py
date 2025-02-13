from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from backend.management.managers.service_manager import service_manager
from backend.route_managers.server.maintenance_manager.maintenance_view_model import maintenance_view_model

class service_ready_middleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        if not service_manager.get_instance().check_status():
            return await maintenance_view_model.getInstance().invoke_trigger(request)

        response: Response = await call_next(request)
        return response
