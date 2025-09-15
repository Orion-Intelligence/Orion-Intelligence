from pydantic import BaseModel, EmailStr, validator
import re

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password:str