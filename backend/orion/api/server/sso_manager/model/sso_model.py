from pydantic import BaseModel, Field


class SSOCodeExchangeRequest(BaseModel):
    code: str = Field(min_length=32, max_length=256)
    redirect_uri: str = Field(min_length=1, max_length=2048)


class SSOSessionRequest(BaseModel):
    session_token: str = Field(min_length=32, max_length=512)


class SSOMailPassphraseRequest(SSOSessionRequest):
    verifier: str | None = Field(default=None, pattern=r"^[A-Za-z0-9+/]{43}=$")
