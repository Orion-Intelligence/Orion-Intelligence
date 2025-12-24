from dataclasses import dataclass
from typing import Optional, Dict


@dataclass
class ResponseModel:
    success: bool
    message: str
    data: Optional[Dict] = None
    error_code: Optional[int] = None
