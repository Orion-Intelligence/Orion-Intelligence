from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class SocialMediaProfileModel(BaseModel):
    platform: str = ""
    username: str = ""


class AdditionalIdentifierModel(BaseModel):
    type: str = ""
    value: str = ""


class RelatedEntityModel(BaseModel):
    name: str = ""
    socialMediaProfiles: List[SocialMediaProfileModel] = []
    webUrls: List[str] = []
    emails: List[str] = []
    phoneNumbers: List[str] = []
    additionalIdentifiers: List[AdditionalIdentifierModel] = []


class CreateCaseRequest(BaseModel):
    caseId: str
    caseType: str
    owner: str
    status: str
    priority: str
    intakeSource: str
    entityName: str
    socialMediaProfiles: List[SocialMediaProfileModel] = []
    webUrls: List[str] = []
    emails: List[str] = []
    phoneNumbers: List[str] = []
    additionalIdentifiers: List[AdditionalIdentifierModel] = []
    relatedEntities: List[RelatedEntityModel] = []
    linkedCaseId: Optional[str] = None
    linkedReason: Optional[str] = None


class CaseResponse(BaseModel):
    id: str
    caseId: str
    caseType: str
    owner: str
    createdDate: datetime
    modifiedDate: datetime
    status: str
    priority: str
    intakeSource: str
    entityName: str
    socialMediaProfiles: List[SocialMediaProfileModel] = []
    webUrls: List[str] = []
    emails: List[str] = []
    phoneNumbers: List[str] = []
    additionalIdentifiers: List[AdditionalIdentifierModel] = []
    relatedEntities: List[RelatedEntityModel] = []
    linkedCaseId: Optional[str] = None
    linkedReason: Optional[str] = None