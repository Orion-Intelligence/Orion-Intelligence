from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse

from orion.management.managers.service_manager import service_manager


class service_ready_middleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        if not service_manager.get_instance().check_status():
            return JSONResponse(status_code=503, content={"detail": "Service Not Ready"})

        response: Response = await call_next(request)
        return response
