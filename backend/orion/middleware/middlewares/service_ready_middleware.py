from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from orion.management.managers.service_manager import service_manager


class service_ready_middleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        if not service_manager.get_instance().check_status():
            response = JSONResponse(status_code=503, content={"detail": "Service Not Ready"})
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)
