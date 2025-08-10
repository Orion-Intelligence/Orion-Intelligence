from pydantic import BaseModel


class DomainScanRequest(BaseModel):
    domain: str
