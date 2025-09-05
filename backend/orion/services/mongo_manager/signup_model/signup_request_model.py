from pydantic import BaseModel, EmailStr, validator
import re

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password:str

    @validator("email")
    def validate_company_email(cls, v):
        blocked_domains = {
            "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", 
            "live.com", "aol.com", "protonmail.com", "icloud.com"
        }
        domain = v.split("@")[-1].lower()
        if domain in blocked_domains:
            raise ValueError("Personal email addresses are not allowed. Please use your company email.")
        return v
    
    @validator("password")
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v