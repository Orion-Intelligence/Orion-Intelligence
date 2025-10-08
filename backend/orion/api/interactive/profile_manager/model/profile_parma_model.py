from typing import Any, Dict, Optional
from pydantic import BaseModel

class ProfileParmaModel(BaseModel):
    companyName: str
    phone: str
    email: str
    country:str
    city:str
    postalCode:str
    taxId:str
    preferences: Optional[Dict[str, Any]] = {}
