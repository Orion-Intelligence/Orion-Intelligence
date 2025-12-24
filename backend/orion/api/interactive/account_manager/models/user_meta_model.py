from typing import Optional, Dict, Any

from pydantic import BaseModel


class user_meta_model(BaseModel):
    username: str
    email: Optional[str] = None
    password: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    twofa_enabled: Optional[bool] = None
