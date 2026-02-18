from pydantic import BaseModel


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPassword(BaseModel):
    token: str
    password: str

class SupportRequest(BaseModel):
    mail:str
    subject:str
    message:str
