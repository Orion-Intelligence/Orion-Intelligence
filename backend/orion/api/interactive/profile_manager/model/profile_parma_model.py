from typing import Any, Dict, List, Optional
from orion.services.mongo_manager.shared_model.db_alert_model import AlertModel
from pydantic import BaseModel, Field

class AccountParmaModel(BaseModel):
    companyName: str
    phone: str
    email: str
    country:str
    city:str
    postalCode:str
    twofa_enabled:bool
    taxId:str
    preferences: Optional[Dict[str, Any]] = {}
    alerts: List[AlertModel] = Field(default_factory=list)