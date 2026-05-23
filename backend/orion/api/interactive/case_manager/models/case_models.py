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
from orion.services.mongo_manager.shared_model.db_case_model import EntityRole
from orion.services.mongo_manager.shared_model.db_case_model import EntityType
from orion.services.mongo_manager.shared_model.db_case_model import IdentifierType
from orion.services.mongo_manager.shared_model.db_case_model import IntakeSource
from orion.services.mongo_manager.shared_model.db_case_model import Priority
from orion.services.mongo_manager.shared_model.db_case_model import Severity
from orion.services.mongo_manager.shared_model.db_case_model import SocialPlatform
from orion.services.mongo_manager.shared_model.db_case_model import SourceType
from orion.services.mongo_manager.shared_model.db_case_model import TaskStatus


def validate_other_value(selected_value, other_value: str, field_name: str) -> None:
    if (
        getattr(selected_value, "value", selected_value) == "other"
        and not other_value.strip()
    ):
        raise ValueError(f"{field_name} other value is required")


class CaseRequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SocialMediaProfileModel(CaseRequestModel):
    platform: SocialPlatform
    platformOtherValue: str = ""
    username: str
    profileUrl: str = ""
    displayName: str = ""

    @model_validator(mode="after")
    def validate_other_fields(self):
        validate_other_value(self.platform, self.platformOtherValue, "Social platform")
        return self


class AdditionalIdentifierModel(CaseRequestModel):
    type: IdentifierType
    identifierTypeOtherValue: str = ""
    value: str
    issuer: str = ""
    verified: bool = False

    @model_validator(mode="after")
    def validate_other_fields(self):
        validate_other_value(
            self.type, self.identifierTypeOtherValue, "Identifier type"
        )
        return self


class CaseEntityModel(CaseRequestModel):
    entityId: str
    type: EntityType
    entityTypeOtherValue: str = ""
    value: str
    entityDescription: str = ""
    role: EntityRole = Field(default=EntityRole.RELATED)
    linkedEntityId: str = ""
    confidence: float = 1.0
    source: SourceType = Field(default=SourceType.MANUAL)
    entitySourceOtherValue: str = ""
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

    @model_validator(mode="after")
    def validate_other_fields(self):
        validate_other_value(self.type, self.entityTypeOtherValue, "Entity type")
        validate_other_value(self.source, self.entitySourceOtherValue, "Entity source")
        return self


class CaseArtifactModel(CaseRequestModel):
    artifactId: str = ""
    type: ArtifactType = Field(default=ArtifactType.EVIDENCE)
    artifactTypeOtherValue: str = ""
    title: str = ""
    description: str = ""
    source: SourceType = Field(default=SourceType.MANUAL)
    artifactSourceOtherValue: str = ""
    url: str = ""
    fileName: str = ""
    fileType: str = ""
    entityIds: List[str] = Field(default_factory=list)
    tags: List[CaseTag] = Field(default_factory=list)
    capturedAt: Optional[datetime] = None

    @model_validator(mode="after")
    def validate_other_fields(self):
        validate_other_value(self.type, self.artifactTypeOtherValue, "Artifact type")
        validate_other_value(
            self.source, self.artifactSourceOtherValue, "Artifact source"
        )
        return self


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
    closureReasonOtherValue: str = ""
    summary: str = ""
    resolution: str = ""

    @model_validator(mode="after")
    def validate_other_fields(self):
        validate_other_value(
            self.reason, self.closureReasonOtherValue, "Closure reason"
        )
        return self


class CreateCaseRequest(CaseRequestModel):
    caseId: str
    title: str
    description: str = ""
    caseType: CaseType = Field(default=CaseType.OTHER)
    caseTypeOtherValue: str = ""
    status: CaseStatus = Field(default=CaseStatus.NEW)
    severity: Severity = Field(default=Severity.LOW)
    priority: Priority = Field(default=Priority.LOW)
    intakeSource: IntakeSource = Field(default=IntakeSource.MANUAL)
    intakeSourceOtherValue: str = ""
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
        validate_other_value(self.caseType, self.caseTypeOtherValue, "Case type")
        validate_other_value(
            self.intakeSource, self.intakeSourceOtherValue, "Intake source"
        )

        if not self.entities:
            raise ValueError("At least one case entity is required")

        primary_entity = next(
            (
                entity
                for entity in self.entities
                if entity.entityId == self.primaryEntityId
            ),
            None,
        )
        if not primary_entity:
            raise ValueError("Primary entity ID must match one of the case entities")
        if primary_entity.role != EntityRole.PRIMARY:
            raise ValueError("Primary entity must have role primary")

        return self


class UpdateCaseRequest(CaseRequestModel):
    title: str
    description: str = ""
    caseType: CaseType = Field(default=CaseType.OTHER)
    caseTypeOtherValue: str = ""
    status: CaseStatus = Field(default=CaseStatus.NEW)
    severity: Severity = Field(default=Severity.LOW)
    priority: Priority = Field(default=Priority.LOW)
    intakeSource: IntakeSource = Field(default=IntakeSource.MANUAL)
    intakeSourceOtherValue: str = ""
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
        validate_other_value(self.caseType, self.caseTypeOtherValue, "Case type")
        validate_other_value(
            self.intakeSource, self.intakeSourceOtherValue, "Intake source"
        )

        if not self.entities:
            raise ValueError("At least one case entity is required")

        primary_entity = next(
            (
                entity
                for entity in self.entities
                if entity.entityId == self.primaryEntityId
            ),
            None,
        )
        if not primary_entity:
            raise ValueError("Primary entity ID must match one of the case entities")
        if primary_entity.role != EntityRole.PRIMARY:
            raise ValueError("Primary entity must have role primary")

        return self


class CaseResponse(BaseModel):
    id: str
    caseId: str
    tenant_uuid: str
    title: str
    description: str = ""
    caseType: CaseType = Field(default=CaseType.OTHER)
    caseTypeOtherValue: str = ""
    status: CaseStatus = Field(default=CaseStatus.NEW)
    severity: Severity = Field(default=Severity.LOW)
    priority: Priority = Field(default=Priority.LOW)
    intakeSource: IntakeSource = Field(default=IntakeSource.MANUAL)
    intakeSourceOtherValue: str = ""
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
