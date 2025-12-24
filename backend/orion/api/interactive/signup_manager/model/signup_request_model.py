from typing import Optional

from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    password: str
