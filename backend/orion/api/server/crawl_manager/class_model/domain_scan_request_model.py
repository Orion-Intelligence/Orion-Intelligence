from pydantic import BaseModel, ConfigDict


class DomainScanRequest(BaseModel):
    domain: str
    scanType: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "domain": "www.bbc.com",
                "scanType": "basic"
            }
        }
    )

