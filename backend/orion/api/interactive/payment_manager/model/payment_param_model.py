from typing import Optional

from pydantic import BaseModel


class PaymentParamModel(BaseModel):
    name: str
    phone: str
    email: str
    plan: Optional[str] = "monthly-highlighted"
