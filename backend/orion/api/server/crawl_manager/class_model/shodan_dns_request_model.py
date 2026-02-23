from pydantic import BaseModel, ConfigDict

class shodan_dns_request(BaseModel):
    domain:str

    model_config = ConfigDict(json_schema_extra={"example": {"domain": "bbc.com"}})
