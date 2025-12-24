import re
import traceback

from fastapi import Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import RedirectResponse, JSONResponse
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR, HTTP_422_UNPROCESSABLE_ENTITY
from passlib.exc import PasswordSizeError
from starlette_admin.exceptions import FormValidationError

from configs import config
from orion.shared_models.expection_handlers.expection_handlers_models import ErrorResponseModel, ValidationErrorDetail, ValidationErrorResponseModel


def clean_traceback(exc: Exception):
    error_trace = traceback.format_exception(type(exc), exc, exc.__traceback__)
    cleaned_trace = [re.sub(r"\s*\^+\s*", "", line.strip()) for line in error_trace if line.strip()]
    return cleaned_trace[::-1]


async def global_exception_handler(_: Request, exc: Exception):
    status_code = exc.status_code if isinstance(exc, HTTPException) else HTTP_500_INTERNAL_SERVER_ERROR

    if config.DEBUG:
        error_response = ErrorResponseModel(
            error=str(exc), traceback=clean_traceback(exc))
        return JSONResponse(status_code=status_code, content=error_response.model_dump())

    return RedirectResponse(url=f"/{status_code}")


async def validation_exception_handler(_: Request, exc: RequestValidationError):
    if config.DEBUG:
        errors = [ValidationErrorDetail(
            field=".".join(str(loc) for loc in error["loc"][1:]), message=error["msg"], type=error["type"]) for error in
            exc.errors()]
        error_response = ValidationErrorResponseModel(
            validation_errors=errors, traceback=clean_traceback(exc))
        return JSONResponse(status_code=HTTP_422_UNPROCESSABLE_ENTITY, content=error_response.model_dump())

    return RedirectResponse(url=f"/{HTTP_422_UNPROCESSABLE_ENTITY}")


async def password_size_exception_handler(_: Request, exc: PasswordSizeError):
    return JSONResponse(status_code=HTTP_422_UNPROCESSABLE_ENTITY, content={"detail": "Password too long"})


async def value_error_exception_handler(_: Request, exc: ValueError):
    return JSONResponse(status_code=HTTP_422_UNPROCESSABLE_ENTITY, content={"detail": str(exc)})


async def form_validation_exception_handler(_: Request, exc: FormValidationError):
    return JSONResponse(status_code=HTTP_422_UNPROCESSABLE_ENTITY, content={"detail": exc.messages})
