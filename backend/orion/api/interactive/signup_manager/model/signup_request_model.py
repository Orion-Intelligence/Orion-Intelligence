from pydantic import BaseModel, EmailStr
from typing import Any, Optional

class SignupRequest(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    password: str


    