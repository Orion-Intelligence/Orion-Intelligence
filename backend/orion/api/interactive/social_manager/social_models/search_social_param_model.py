from typing import Annotated, Dict, List, Optional

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


class SocialForumRequest(BaseModel):
    query: str = Field(..., min_length=1)
    max_results: int = Field(default=50, ge=1, le=100)


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
    social_data_type: Optional[str] = None
    use_extension: bool = False
    max_posts: int = Field(default=10, ge=1, le=100)
    max_comments: int = Field(default=25, ge=1, le=100)
    max_followers: int = Field(default=1000, ge=1, le=5000)
    max_following: int = Field(default=1000, ge=1, le=5000)


class SocialPostsRequest(PlatformUsernameRequest):
    max_posts: int = Field(default=5, ge=1, le=100)
    max_comments: int = Field(default=10, ge=1, le=100)
    post_offset: int = Field(default=0, ge=0, le=1000)
    existing_posts_count: int = Field(default=0, ge=0, le=1000)
    existing_post_urls: List[str] = Field(default_factory=list)
    comment_offset: int = Field(default=0, ge=0, le=1000)
    social_data_type: Optional[str] = None
    hash_id: Optional[str] = None
    use_extension: bool = False


class SocialVideosRequest(PlatformUsernameRequest):
    max_videos: int = Field(default=5, ge=1, le=100)
    max_comments: int = Field(default=10, ge=1, le=100)
    comment_offset: int = Field(default=0, ge=0, le=1000)
    social_data_type: Optional[str] = None
    hash_id: Optional[str] = None
    use_extension: bool = False


class SocialShortsRequest(PlatformUsernameRequest):
    max_shorts: int = Field(default=5, ge=1, le=100)
    max_comments: int = Field(default=10, ge=1, le=100)
    comment_offset: int = Field(default=0, ge=0, le=1000)
    social_data_type: Optional[str] = None
    hash_id: Optional[str] = None
    use_extension: bool = False


class SocialFollowersRequest(PlatformUsernameRequest):
    max_followers: int = Field(default=50, ge=1, le=5000)


class SocialOnlineImages(PlatformUsernameRequest):
    max_images: int = Field(default=10, ge=1, le=100)
    max_followers: int = Field(default=50, ge=1, le=5000)
    use_extension: bool = False


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
