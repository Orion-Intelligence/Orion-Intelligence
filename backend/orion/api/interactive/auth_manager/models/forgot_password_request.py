from pydantic import BaseModel


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPassword(BaseModel):
    token: str
    password: str
