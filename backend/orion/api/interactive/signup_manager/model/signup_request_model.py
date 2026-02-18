from typing import Optional

from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    password: str

class SupportRequest(BaseModel):
    email:str
    subject:str
    message:str