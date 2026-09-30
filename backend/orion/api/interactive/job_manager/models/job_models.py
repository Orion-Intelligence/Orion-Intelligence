from datetime import datetime
from typing import List
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from orion.services.mongo_manager.shared_model.db_job_model import ApplicationStatus
from orion.services.mongo_manager.shared_model.db_job_model import CredentialDocumentType
from orion.services.mongo_manager.shared_model.db_job_model import CyberSecurityRole
from orion.services.mongo_manager.shared_model.db_job_model import EngagementType
from orion.services.mongo_manager.shared_model.db_job_model import JobAudience
from orion.services.mongo_manager.shared_model.db_job_model import JobPostStatus
from orion.services.mongo_manager.shared_model.db_job_model import MAX_SCREENING_QUESTIONS
from orion.services.mongo_manager.shared_model.db_job_model import SalaryPeriod
from orion.services.mongo_manager.shared_model.db_job_model import ScreeningAnswerType
from orion.services.mongo_manager.shared_model.db_job_model import SecurityCertification
from orion.services.mongo_manager.shared_model.db_job_model import SecurityClearanceLevel
from orion.services.mongo_manager.shared_model.db_job_model import SecurityFramework
from orion.services.mongo_manager.shared_model.db_job_model import WorkMode

CHOICE_ANSWER_TYPES = {ScreeningAnswerType.SINGLE_CHOICE, ScreeningAnswerType.MULTI_CHOICE}


def validate_other_value(selected_value, other_value: str, field_name: str) -> None:
    if getattr(selected_value, "value", selected_value) == "other" and not other_value.strip():
        raise ValueError(f"{field_name} other value is required")


class JobRequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ScreeningQuestionModel(JobRequestModel):
    questionId: str = ""
    prompt: str
    answerType: ScreeningAnswerType = Field(default=ScreeningAnswerType.SHORT_TEXT)
    choices: List[str] = Field(default_factory=list)
    required: bool = False

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Screening question prompt is required")
        return value

    @model_validator(mode="after")
    def validate_choices(self):
        if self.answerType in CHOICE_ANSWER_TYPES and len(self.choices) < 2:
            raise ValueError("Choice questions require at least two choices")
        if self.answerType not in CHOICE_ANSWER_TYPES and self.choices:
            raise ValueError("Choices are only allowed on choice questions")
        return self


class JobPostMutationRequest(JobRequestModel):
    title: str
    shortDescription: str = ""
    description: str = ""
    keyResponsibilities: List[str] = Field(default_factory=list)

    role: CyberSecurityRole
    roleOtherValue: str = ""
    engagementType: EngagementType
    clearanceLevel: SecurityClearanceLevel = Field(default=SecurityClearanceLevel.NONE)
    workMode: WorkMode = Field(default=WorkMode.ONSITE)
    location: str = ""

    requiredCertifications: List[SecurityCertification] = Field(default_factory=list)
    additionalCertifications: List[str] = Field(default_factory=list)
    frameworkExperience: List[SecurityFramework] = Field(default_factory=list)
    additionalFrameworks: List[str] = Field(default_factory=list)
    technicalStack: List[str] = Field(default_factory=list)

    salaryMin: int = 0
    salaryMax: int = 0
    salaryCurrency: str = "USD"
    salaryPeriod: SalaryPeriod = Field(default=SalaryPeriod.YEARLY)
    salaryUndisclosed: bool = False

    screeningQuestions: List[ScreeningQuestionModel] = Field(default_factory=list)

    audience: JobAudience = Field(default=JobAudience.OPEN)
    expiresAt: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Job title is required")
        return value

    @model_validator(mode="after")
    def validate_job_post(self):
        validate_other_value(self.role, self.roleOtherValue, "Job role")

        if self.salaryMin < 0 or self.salaryMax < 0:
            raise ValueError("Salary values cannot be negative")
        if self.salaryMax and self.salaryMin > self.salaryMax:
            raise ValueError("Salary minimum cannot exceed salary maximum")

        if len(self.screeningQuestions) > MAX_SCREENING_QUESTIONS:
            raise ValueError(f"Maximum {MAX_SCREENING_QUESTIONS} screening questions are allowed")

        supplied_ids = [question.questionId for question in self.screeningQuestions if question.questionId]
        if len(supplied_ids) != len(set(supplied_ids)):
            raise ValueError("Screening question identifiers must be unique")

        return self


class CreateJobPostRequest(JobPostMutationRequest):
    pass


class UpdateJobPostRequest(JobPostMutationRequest):
    pass


class ScreeningQuestionResponse(BaseModel):
    questionId: str
    prompt: str
    answerType: ScreeningAnswerType
    choices: List[str] = Field(default_factory=list)
    required: bool = False


class JobPostListItem(BaseModel):
    jobId: str
    title: str
    shortDescription: str = ""
    role: CyberSecurityRole
    roleOtherValue: str = ""
    engagementType: EngagementType
    audience: JobAudience
    status: JobPostStatus
    applicationCount: int = 0
    createdAt: datetime
    publishedAt: Optional[datetime] = None
    expiresAt: Optional[datetime] = None


class JobPostListResponse(BaseModel):
    items: List[JobPostListItem] = Field(default_factory=list)
    totalPosts: int = 0
    activePosts: int = 0


class JobPostResponse(BaseModel):
    jobId: str
    tenant_id: str
    title: str
    shortDescription: str = ""
    description: str = ""
    keyResponsibilities: List[str] = Field(default_factory=list)

    role: CyberSecurityRole
    roleOtherValue: str = ""
    engagementType: EngagementType
    clearanceLevel: SecurityClearanceLevel
    workMode: WorkMode
    location: str = ""

    requiredCertifications: List[SecurityCertification] = Field(default_factory=list)
    additionalCertifications: List[str] = Field(default_factory=list)
    frameworkExperience: List[SecurityFramework] = Field(default_factory=list)
    additionalFrameworks: List[str] = Field(default_factory=list)
    technicalStack: List[str] = Field(default_factory=list)

    salaryMin: int = 0
    salaryMax: int = 0
    salaryCurrency: str = "USD"
    salaryPeriod: SalaryPeriod
    salaryUndisclosed: bool = False

    screeningQuestions: List[ScreeningQuestionResponse] = Field(default_factory=list)

    audience: JobAudience
    status: JobPostStatus
    applicationCount: int = 0

    createdBy: str = ""
    createdAt: datetime
    updatedAt: datetime
    publishedAt: Optional[datetime] = None
    expiresAt: Optional[datetime] = None
    closedAt: Optional[datetime] = None


class CredentialDocumentResponse(BaseModel):
    documentId: str
    documentType: CredentialDocumentType
    documentTypeOtherValue: str = ""
    title: str = ""
    issuer: str = ""
    issuedAt: Optional[datetime] = None
    expiresAt: Optional[datetime] = None
    fileName: str = ""
    fileSize: int = 0


class ScreeningAnswerResponse(BaseModel):
    questionId: str
    prompt: str
    answer: str = ""
    answers: List[str] = Field(default_factory=list)


class ApplicationStatusEventResponse(BaseModel):
    status: ApplicationStatus
    note: str = ""
    changedBy: str = ""
    changedAt: datetime


class ApplicationListItem(BaseModel):
    applicationId: str
    applicantUsername: str = ""
    applicantVerified: bool = False
    status: ApplicationStatus
    submittedAt: datetime
    firstViewedAt: Optional[datetime] = None
    credentialDocumentCount: int = 0


class ApplicationListResponse(BaseModel):
    jobId: str
    jobTitle: str = ""
    items: List[ApplicationListItem] = Field(default_factory=list)
    total: int = 0


class ApplicationDetailResponse(BaseModel):
    applicationId: str
    jobId: str
    jobTitle: str = ""

    applicantUsername: str = ""
    applicantVerified: bool = False
    email: str = ""
    linkedinUrl: str = ""
    githubUrl: str = ""
    coverLetter: str = ""

    screeningAnswers: List[ScreeningAnswerResponse] = Field(default_factory=list)
    resumeFileName: str = ""
    credentialDocuments: List[CredentialDocumentResponse] = Field(default_factory=list)

    status: ApplicationStatus
    timeline: List[ApplicationStatusEventResponse] = Field(default_factory=list)
    submittedAt: datetime
    firstViewedAt: Optional[datetime] = None
    updatedAt: datetime
    decidedAt: Optional[datetime] = None


class UpdateApplicationStatusRequest(JobRequestModel):
    status: ApplicationStatus
    note: str = ""
    visibleToApplicant: bool = True

    @field_validator("note")
    @classmethod
    def validate_note(cls, value: str) -> str:
        return value.strip()


class ContactApplicantRequest(JobRequestModel):
    subject: str
    message: str

    @field_validator("subject", "message")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Subject and message are required")
        return value
