from pydantic import BaseModel, ConfigDict

class shodan_scan_request(BaseModel):
    ip:str

    model_config = ConfigDict(json_schema_extra={"example": {"ip": "54.170.48.201"}})
