from __future__ import annotations

from datetime import UTC, datetime
from typing import List

from odmantic import EmbeddedModel, Field, Model


def utc_now() -> datetime:
    return datetime.now(UTC)


class SocialDetectedAd(EmbeddedModel):
    url: str
    author: str = ""
    content_text: str = ""
    metadata: str = ""
    likes: str = ""
    shares: str = ""
    views: str = ""
    topic: str = ""
    detected_at: datetime = Field(default_factory=utc_now)


class SocialHateSpeechDetectedPost(EmbeddedModel):
    url: str
    author: str = ""
    content_text: str = ""
    is_hate_speech: bool = False
    label: str = "unknown"
    detected_at: datetime | None = None
    likes: str | None = None
    shares: str | None = None
    views: str | None = None



class SocialAdDetectionResult(EmbeddedModel):
    profile_id: str
    date_time: datetime = Field(default_factory=utc_now)
    total_detected_ads: int = 0
    ads: List[SocialDetectedAd] = Field(default_factory=list)
    error: bool = False
    error_reason: str = ""
    session_expired: bool = False
    is_manual: bool = False


class SocialPostResult(EmbeddedModel):
    profile_id: str
    date_time: datetime = Field(default_factory=utc_now)
    post_url: str = ""
    post_text: str = ""
    image_url: str = ""
    error: bool = False
    error_reason: str = ""
    session_expired: bool = False
    is_manual: bool = False


class SocialHateSpeechResult(EmbeddedModel):
    profile_id: str
    date_time: datetime = Field(default_factory=utc_now)
    total_posts: int = 0
    hate_posts_count: int = 0
    posts: List[SocialHateSpeechDetectedPost] = Field(default_factory=list)
    error: bool = False
    error_reason: str = ""
    session_expired: bool = False
    is_manual: bool = False



class db_social_automation_result_model(Model):
    user_id: str = Field(index=True)
    ad_detection_results: List[SocialAdDetectionResult] = Field(default_factory=list)
    post_results: List[SocialPostResult] = Field(default_factory=list)
    hate_speech_results: List[SocialHateSpeechResult] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = {"collection": "social_automation_result"}
