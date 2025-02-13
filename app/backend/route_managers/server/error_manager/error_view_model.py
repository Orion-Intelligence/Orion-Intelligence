from starlette.responses import Response

from backend.constants.constant import CONSTANTS
from backend.helper_manager.helper_controller import helper_controller
from backend.route_managers.server.error_manager.error_model import error_model
from fastapi import Request
from fastapi.templating import Jinja2Templates

from backend.route_managers.server.error_manager.shared_model.error_param_model import error_param_model


class error_view_model:
    __instance = None
    __m_error_model = None

    @staticmethod
    def getInstance():
        if error_view_model.__instance is None:
            error_view_model()
        return error_view_model.__instance

    def __init__(self):
        if error_view_model.__instance is not None:
            return
        else:
            error_view_model.__instance = self
            self.__m_error_model = error_model()
            self.templates = Jinja2Templates(directory="templates")

    async def invoke_trigger(self, request: Request, param: error_param_model) -> Response:
        response = await self.__m_error_model.invoke_trigger(param)
        return self.templates.TemplateResponse(CONSTANTS.S_TEMPLATE_ERROR_WEBSITE_PATH, helper_controller.create_template_context(request, response))