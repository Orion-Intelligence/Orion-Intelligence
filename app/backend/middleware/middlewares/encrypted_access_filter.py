from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from backend.view_managers.server.error_manager.error_enums import ERROR_MODEL_CALLBACK
from backend.services.block_manager.block_controller import block_controller
from backend.services.block_manager.block_enums import BLOCK_COMMAND
from backend.view_managers.server.error_manager.error_view_model import error_view_model
from backend.view_managers.server.maintenance_manager.maintenance_view_model import maintenance_view_model

class encrypted_access_filter(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        allowed_paths = ['feeder', 'parser', 'feeder_publish', 'feeder_unique', 'update_status', 'crawl_index']
        resolved_path = request.url.path.strip("/").split("/")[-1]

        if resolved_path in allowed_paths:
            is_verified = await block_controller.getInstance().invoke_trigger(BLOCK_COMMAND.S_VERIFY_REQUEST, request)

            if not is_verified:
                if resolved_path == "cms":
                  return await maintenance_view_model.getInstance().invoke_trigger(request)
                return await error_view_model.getInstance().invoke_trigger(ERROR_MODEL_CALLBACK.M_INIT, [request, 404])

        response: Response = await call_next(request)
        return response
