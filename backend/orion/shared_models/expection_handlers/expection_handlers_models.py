from pydantic import BaseModel
from typing import List, Optional


class TracebackModel(BaseModel):
    traceback: List[str]


class ErrorResponseModel(TracebackModel):
    error: str


class ValidationErrorDetail(BaseModel):
    field: str
    message: str
    type: str


class ValidationErrorResponseModel(TracebackModel):
    validation_errors: List[ValidationErrorDetail]
