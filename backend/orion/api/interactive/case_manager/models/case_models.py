from datetime import datetime
from typing import List
from typing import Optional

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field
from pydantic import field_validator
from pydantic import model_validator

from orion.services.mongo_manager.shared_model.db_case_model import ArtifactType
from orion.services.mongo_manager.shared_model.db_case_model import CaseLinkRelationship
from orion.services.mongo_manager.shared_model.db_case_model import CaseStatus
from orion.services.mongo_manager.shared_model.db_case_model import CaseTag
from orion.services.mongo_manager.shared_model.db_case_model import CaseType
from orion.services.mongo_manager.shared_model.db_case_model import ClosureReason
from orion.services.mongo_manager.shared_model.db_case_model import EntityRelationship
from orion.services.mongo_manager.shared_model.db_case_model import EntityRole
from orion.services.mongo_manager.shared_model.db_case_model import EntityType
from orion.services.mongo_manager.shared_model.db_case_model import IdentifierType
from orion.services.mongo_manager.shared_model.db_case_model import IntakeSource
from orion.services.mongo_manager.shared_model.db_case_model import Priority
from orion.services.mongo_manager.shared_model.db_case_model import Severity
from orion.services.mongo_manager.shared_model.db_case_model import SocialPlatform
from orion.services.mongo_manager.shared_model.db_case_model import SourceType
from orion.services.mongo_manager.shared_model.db_case_model import TaskStatus


class CaseRequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SocialMediaProfileModel(CaseRequestModel):
    platform: SocialPlatform
    username: str
    profileUrl: str = ""
    displayName: str = ""


class AdditionalIdentifierModel(CaseRequestModel):
    type: IdentifierType
    value: str
    issuer: str = ""
    verified: bool = False


class CaseEntityModel(CaseRequestModel):
    entityId: str
    type: EntityType
    value: str
    displayName: str = ""
    role: EntityRole = Field(default=EntityRole.RELATED)
    relationshipToCase: EntityRelationship = Field(default=EntityRelationship.RELATED_TO)
    confidence: float = 1.0
    source: SourceType = Field(default=SourceType.MANUAL)
    identifiers: List[AdditionalIdentifierModel] = Field(default_factory=list)
    socialProfiles: List[SocialMediaProfileModel] = Field(default_factory=list)
    tags: List[CaseTag] = Field(default_factory=list)

    @field_validator("entityId", "value")
    @classmethod
    def validate_required_entity_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Entity ID and value are required")
        return value


class CaseArtifactModel(CaseRequestModel):
    artifactId: str = ""
    type: ArtifactType = Field(default=ArtifactType.EVIDENCE)
    title: str = ""
    description: str = ""
    source: SourceType = Field(default=SourceType.MANUAL)
    url: str = ""
    fileName: str = ""
    fileType: str = ""
    entityIds: List[str] = Field(default_factory=list)
    tags: List[CaseTag] = Field(default_factory=list)
    capturedAt: Optional[datetime] = None


class CaseCommentModel(CaseRequestModel):
    commentId: str = ""
    body: str
    entityIds: List[str] = Field(default_factory=list)
    artifactIds: List[str] = Field(default_factory=list)


class CaseTaskModel(CaseRequestModel):
    taskId: str = ""
    title: str
    description: str = ""
    status: TaskStatus = Field(default=TaskStatus.OPEN)
    priority: Priority = Field(default=Priority.MEDIUM)
    assignedTo: str = ""
    dueAt: Optional[datetime] = None
    entityIds: List[str] = Field(default_factory=list)
    artifactIds: List[str] = Field(default_factory=list)


class CaseLinkModel(CaseRequestModel):
    targetCaseId: str
    relationship: CaseLinkRelationship = Field(default=CaseLinkRelationship.RELATED)
    reason: str


class CaseClosureModel(CaseRequestModel):
    reason: ClosureReason
    summary: str = ""
    resolution: str = ""


class CreateCaseRequest(CaseRequestModel):
    caseId: str
    title: str
    description: str = ""
    caseType: CaseType = Field(default=CaseType.OTHER)
    status: CaseStatus = Field(default=CaseStatus.NEW)
    severity: Severity = Field(default=Severity.LOW)
    priority: Priority = Field(default=Priority.LOW)
    intakeSource: IntakeSource = Field(default=IntakeSource.MANUAL)
    tags: List[CaseTag] = Field(default_factory=list)
    primaryEntityId: str
    assignedAnalystIds: List[str] = Field(default_factory=list)
    artifacts: List[CaseArtifactModel] = Field(default_factory=list)
    entities: List[CaseEntityModel] = Field(default_factory=list)
    comments: List[CaseCommentModel] = Field(default_factory=list)
    tasks: List[CaseTaskModel] = Field(default_factory=list)
    linkedCases: List[CaseLinkModel] = Field(default_factory=list)
    closure: Optional[CaseClosureModel] = None

    @field_validator("caseId", "title", "primaryEntityId")
    @classmethod
    def validate_required_case_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Case ID, title, and primary entity ID are required")
        return value

    @model_validator(mode="after")
    def validate_primary_entity(self):
        if not self.entities:
            raise ValueError("At least one case entity is required")
        primary_entity = next((entity for entity in self.entities if entity.entityId == self.primaryEntityId), None)
        if not primary_entity:
            raise ValueError("Primary entity ID must match one of the case entities")
        if primary_entity.role != EntityRole.PRIMARY:
            raise ValueError("Primary entity must have role primary")
        if primary_entity.relationshipToCase != EntityRelationship.SUBJECT_OF_CASE:
            raise ValueError("Primary entity must have subject_of_case relationship")
        return self


class UpdateCaseRequest(CaseRequestModel):
    title: str
    description: str = ""
    caseType: CaseType = Field(default=CaseType.OTHER)
    status: CaseStatus = Field(default=CaseStatus.NEW)
    severity: Severity = Field(default=Severity.LOW)
    priority: Priority = Field(default=Priority.LOW)
    intakeSource: IntakeSource = Field(default=IntakeSource.MANUAL)
    tags: List[CaseTag] = Field(default_factory=list)
    primaryEntityId: str
    assignedAnalystIds: List[str] = Field(default_factory=list)
    artifacts: List[CaseArtifactModel] = Field(default_factory=list)
    entities: List[CaseEntityModel] = Field(default_factory=list)
    tasks: List[CaseTaskModel] = Field(default_factory=list)
    comments: Optional[List[CaseCommentModel]] = None
    linkedCases: List[CaseLinkModel] = Field(default_factory=list)
    closure: Optional[CaseClosureModel] = None

    @field_validator("title", "primaryEntityId")
    @classmethod
    def validate_required_update_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title and primary entity ID are required")
        return value

    @model_validator(mode="after")
    def validate_primary_entity(self):
        if not self.entities:
            raise ValueError("At least one case entity is required")
        primary_entity = next((entity for entity in self.entities if entity.entityId == self.primaryEntityId), None)
        if not primary_entity:
            raise ValueError("Primary entity ID must match one of the case entities")
        if primary_entity.role != EntityRole.PRIMARY:
            raise ValueError("Primary entity must have role primary")
        if primary_entity.relationshipToCase != EntityRelationship.SUBJECT_OF_CASE:
            raise ValueError("Primary entity must have subject_of_case relationship")
        return self


class CaseResponse(BaseModel):
    id: str
    caseId: str
    tenant_uuid: str
    title: str
    description: str = ""
    caseType: CaseType = Field(default=CaseType.OTHER)
    status: CaseStatus = Field(default=CaseStatus.NEW)
    severity: Severity = Field(default=Severity.LOW)
    priority: Priority = Field(default=Priority.LOW)
    intakeSource: IntakeSource = Field(default=IntakeSource.MANUAL)
    tags: List[CaseTag] = Field(default_factory=list)
    createdBy: str = ""
    assignedAnalystIds: List[str] = Field(default_factory=list)
    primaryEntityId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    closedAt: Optional[datetime] = None
    artifacts: List[dict] = Field(default_factory=list)
    entities: List[dict] = Field(default_factory=list)
    comments: List[dict] = Field(default_factory=list)
    tasks: List[dict] = Field(default_factory=list)
    linkedCases: List[dict] = Field(default_factory=list)
    closure: Optional[dict] = None


class CreateCaseShareRequest(CaseRequestModel):
    expiresInHours: int = Field(default=168, ge=1, le=720)


class CaseShareResponse(BaseModel):
    shareId: str
    token: str
    path: str
    expiresAt: datetime
