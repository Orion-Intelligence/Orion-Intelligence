from pydantic import BaseModel, ConfigDict

class IPScanRequest(BaseModel):
    ip: str

    model_config = ConfigDict(
        json_schema_extra={"example": {"ip": "8.8.8.8"}})
