from pydantic import BaseModel, ConfigDict
from typing import Optional

class DomainScanRequest(BaseModel):
    domain: str
    scanType: Optional[str]
    checkLive: Optional[bool] = False


    model_config = ConfigDict(
        json_schema_extra={"example": {"domain": "www.bbc.com", "scanType": "basic","checkLive": False}})


class UrlVulnerabilityScanRequest(BaseModel):
    domain: str

    model_config = ConfigDict(
        json_schema_extra={"example": {"domain": "example.com"}})
