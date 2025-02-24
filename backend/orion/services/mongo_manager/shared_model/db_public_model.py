from odmantic import Model, Field
from datetime import datetime
from typing import List, Optional

class Company(Model):
    name: str
    description: str
    founded_year: int
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = Field(default_factory=list)
    logo: Optional[str] = None
