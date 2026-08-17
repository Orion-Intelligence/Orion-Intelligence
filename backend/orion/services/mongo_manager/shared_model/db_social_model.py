from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class social_scan_status(BaseModel):
    status: Optional[str] = None
    progress: int = 0
    step: Optional[str] = None
    cancel_requested: bool = False

    model_config = ConfigDict(extra="allow")


class social_meta(BaseModel):
    platform: Optional[str] = None
    username: Optional[str] = None
    url: Optional[str] = None
    target_type: Optional[str] = None
    entity_type: Optional[str] = None
    status: Optional[str] = None
    timestamp: Optional[str] = None
    description: Optional[str] = None
    avatar: Optional[str] = None

    model_config = ConfigDict(extra="allow")

class social_profile_details(BaseModel):
    real_name: Optional[str] = None
    bio: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    profile_url: Optional[str] = None
    total_posts: Optional[str] = None
    total_followers: Optional[str] = None
    total_following: Optional[str] = None
    total_likes: Optional[str] = None
    avatar: Optional[str] = None
    banner: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class social_post_comment(BaseModel):
    sender_name: Optional[str] = None
    date: Optional[str] = None
    likes: Optional[str] = None
    text: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class social_post_hate_speech(BaseModel):
    is_hate_speech: bool = False
    label: Optional[str] = None
    confidence: float = 0.0
    explanation: Optional[str] = None
    model: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class social_post(BaseModel):
    post_url: Optional[str] = None
    datetime: Optional[str] = None
    caption: Optional[str] = None
    author: Optional[str] = None
    likes: Optional[str] = None
    comments: Optional[str] = None
    shares: Optional[str] = None
    views: Optional[str] = None
    media_type: Optional[str] = None
    media_url: Optional[str] = None
    comment_details: List[social_post_comment] = Field(default_factory=list)
    hate_speech: Optional[social_post_hate_speech] = None

    model_config = ConfigDict(extra="allow")


class social_online_presence_hit(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    snippet: Optional[str] = None
    timestamp: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class social_stealer_log(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    user: Optional[str] = None
    login: Optional[str] = None
    credential: Optional[str] = None
    domain: Optional[str] = None
    source_domain: Optional[str] = None
    ip: Optional[str] = None
    host: Optional[str] = None
    url: Optional[str] = None
    date: Optional[str] = None
    timestamp: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    raw: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class social_wanted(BaseModel):
    name: Optional[str] = None
    caption: Optional[str] = None
    entity: Optional[str] = None
    id: Optional[str] = None
    schema: Optional[str] = None
    status: Optional[str] = None
    authority: Optional[str] = None
    program: Optional[str] = None
    topics: Optional[str] = None
    datasets: Optional[str] = None
    description: Optional[str] = None
    summary: Optional[str] = None
    notes: Optional[str] = None
    source_url: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class social_profile(BaseModel):
    meta: social_meta = Field(default_factory=social_meta)
    profile_details: Optional[social_profile_details] = None
    posts: List[social_post] = Field(default_factory=list)
    online_presence: List[social_online_presence_hit] = Field(default_factory=list)
    stealer_logs: List[social_stealer_log] = Field(default_factory=list)
    wanted: List[social_wanted] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")


class db_social_model(BaseModel):
    user_id: str
    profile_username: Optional[str] = None
    profiles: List[social_profile] = Field(default_factory=list)
    selected: List[str] = Field(default_factory=list)
    scan: social_scan_status = Field(default_factory=social_scan_status)
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(extra="allow")


SOCIAL_COLLECTION = "social"
