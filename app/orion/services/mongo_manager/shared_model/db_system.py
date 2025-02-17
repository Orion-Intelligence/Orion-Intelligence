from odmantic import Model, Field
from typing import Optional


class db_system(Model):
    name: Optional[str] = Field(default_factory=list)
    logo: Optional[bytes] = None
    favicon: Optional[bytes] = None
    description: Optional[str] = None
