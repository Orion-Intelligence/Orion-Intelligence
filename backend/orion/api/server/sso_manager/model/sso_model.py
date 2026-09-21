from pydantic import BaseModel, Field

from orion.api.server.sso_manager.constants.sso_constants import SSO_CONSTANTS


class SSOCodeExchangeRequest(BaseModel):
    code: str = Field(min_length=32, max_length=256)
    redirect_uri: str = Field(min_length=1, max_length=2048)


class SSOSessionRequest(BaseModel):
    session_token: str = Field(min_length=32, max_length=512)


class SSOMailPassphraseRequest(SSOSessionRequest):
    verifier: str | None = Field(default=None, pattern=SSO_CONSTANTS.S_MAIL_VERIFIER_PATTERN)
