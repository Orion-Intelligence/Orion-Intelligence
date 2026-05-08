from datetime import datetime, timezone
from typing import List, Optional
from odmantic import Model, Field
from pydantic import BaseModel


class SocialMediaProfile(BaseModel):
    platform: str = ""
    username: str = ""


class AdditionalIdentifier(BaseModel):
    type: str = ""
    value: str = ""


class RelatedEntity(BaseModel):
    name: str = ""
    socialMediaProfiles: List[SocialMediaProfile] = []
    webUrls: List[str] = []
    emails: List[str] = []
    phoneNumbers: List[str] = []
    additionalIdentifiers: List[AdditionalIdentifier] = []


class db_case_model(Model):
    caseId: str = Field(unique=True)
    caseType: str = ""
    owner: str = ""
    createdDate: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    modifiedDate: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "open"
    priority: str = "low"
    intakeSource: str = ""
    entityName: str = ""
    socialMediaProfiles: List[SocialMediaProfile] = []
    webUrls: List[str] = []
    emails: List[str] = []
    phoneNumbers: List[str] = []
    additionalIdentifiers: List[AdditionalIdentifier] = []
    relatedEntities: List[RelatedEntity] = []
    linkedCaseId: Optional[str] = None
    linkedReason: Optional[str] = None
    tenant_uuid: str = ""

    model_config = {"collection": "cases"}