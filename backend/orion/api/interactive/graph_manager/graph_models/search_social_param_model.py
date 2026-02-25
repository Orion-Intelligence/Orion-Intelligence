from typing import Optional, Dict, List, Annotated
from pydantic import BaseModel, Field, StringConstraints, model_validator


class search_social_param_model(BaseModel):
    q: Optional[str] = ""
    must: Optional[bool] = False
    daterange: Annotated[
        str,
        StringConstraints(pattern=r"^$|^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$")
    ] = ""
    page: Optional[int] = 1
    content: Optional[str] = "all"
    category: Optional[str] = "all"
    network: str = "all"
    matchtype: Optional[str] = "or"
    platform: Optional[str] = ""
    entity_filter: Optional[Dict[str, List[str]]] = Field(
        default=None, examples=[{"m_country": ["pakistan"]}]
    )


class SocialReconRequest(BaseModel):
    query: str = Field(..., min_length=1)


class SearchEngineMetaRequest(BaseModel):
    username: str = Field(..., min_length=1)


class PlatformUsernameRequest(BaseModel):
    platform: str = Field(..., min_length=1)
    username: str = Field(..., min_length=1)

    @model_validator(mode="before")
    @classmethod
    def lower_platform(cls, values):
        if isinstance(values, dict) and "platform" in values:
            values["platform"] = values["platform"].lower()
        return values


class SocialProfileRequest(PlatformUsernameRequest):
    platform: str = Field(..., min_length=1, examples=["tiktok"])
    username: str = Field(..., min_length=1, examples=["@msmannan00"])


class SocialPostRequest(PlatformUsernameRequest):
    platform: str = Field(..., min_length=1, examples=["tiktok"])
    username: str = Field(..., min_length=1, examples=["@msmannan00"])


class SocialFollowersRequest(PlatformUsernameRequest):
    max_followers: int = Field(default=50, ge=1, le=5000)


class SocialOnlineImages(PlatformUsernameRequest):
    max_followers: int = Field(default=50, ge=1, le=5000)


class SocialFollowingRequest(PlatformUsernameRequest):
    max_following: int = Field(default=50, ge=1, le=5000)


class SocialMetadataRequest(BaseModel):
    tokens: List[str] = Field(..., min_length=1)
    username: str = Field(..., min_length=1)
    platform: Optional[str] = Field(default=None, min_length=1)

    @model_validator(mode="before")
    @classmethod
    def lower_platform(cls, values):
        if isinstance(values, dict) and "platform" in values and values["platform"]:
            values["platform"] = values["platform"].lower()
        return values
