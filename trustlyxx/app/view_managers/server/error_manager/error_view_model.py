from starlette.responses import Response

from app.backend.constants.constant import CONSTANTS
from app.backend.view_managers.server.error_manager.error_model import error_model
from fastapi import Request
from fastapi.templating import Jinja2Templates

from app.backend.view_managers.server.error_manager.shared_model.error_param_model import error_param_model


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
        response = await self.__m_error_model.init_page(param)

        return self.templates.TemplateResponse(
            CONSTANTS.S_TEMPLATE_ERROR_WEBSITE_PATH,
            {
                "request": request,
                "vars": response
            }
        )