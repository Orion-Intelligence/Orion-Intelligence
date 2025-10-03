from typing import Optional
from pydantic import BaseModel, EmailStr

class PaymentParamModel(BaseModel):
    name: str
    phone: str
    email: EmailStr
    plan: Optional[str] = "monthly-highlighted"
