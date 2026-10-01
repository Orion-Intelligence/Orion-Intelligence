from __future__ import annotations

from datetime import datetime
from datetime import timezone
from enum import Enum
from typing import List
from typing import Optional

from odmantic import EmbeddedModel
from odmantic import Field
from odmantic import Model


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CyberSecurityRole(str, Enum):
    SOC_ANALYST_L1 = "soc_analyst_l1"
    SOC_ANALYST_L2 = "soc_analyst_l2"
    SOC_ANALYST_L3 = "soc_analyst_l3"
    INCIDENT_RESPONDER = "incident_responder"
    THREAT_INTEL_ANALYST = "threat_intel_analyst"
    THREAT_HUNTER = "threat_hunter"
    PENETRATION_TESTER = "penetration_tester"
    RED_TEAM_OPERATOR = "red_team_operator"
    BLUE_TEAM_ENGINEER = "blue_team_engineer"
    PURPLE_TEAM_ENGINEER = "purple_team_engineer"
    MALWARE_ANALYST = "malware_analyst"
    REVERSE_ENGINEER = "reverse_engineer"
    DFIR_SPECIALIST = "dfir_specialist"
    APPSEC_ENGINEER = "appsec_engineer"
    CLOUD_SECURITY_ENGINEER = "cloud_security_engineer"
    NETWORK_SECURITY_ENGINEER = "network_security_engineer"
    SECURITY_ARCHITECT = "security_architect"
    SECURITY_ENGINEER = "security_engineer"
    VULNERABILITY_MANAGEMENT = "vulnerability_management"
    IAM_ENGINEER = "iam_engineer"
    CRYPTOGRAPHY_ENGINEER = "cryptography_engineer"
    GRC_ANALYST = "grc_analyst"
    COMPLIANCE_AUDITOR = "compliance_auditor"
    SECURITY_AWARENESS_TRAINER = "security_awareness_trainer"
    OSINT_ANALYST = "osint_analyst"
    SECURITY_RESEARCHER = "security_researcher"
    CISO = "ciso"
    OTHER = "other"


class EngagementType(str, Enum):
    FULL_TIME = "full_time"
    TASK_SPECIFIC = "task_specific"


class SecurityClearanceLevel(str, Enum):
    NONE = "none"
    BASIC = "basic"
    CONFIDENTIAL = "confidential"
    SECRET = "secret"
    TOP_SECRET = "top_secret"
    TS_SCI = "ts_sci"


class SecurityCertification(str, Enum):
    CISSP = "cissp"
    CISM = "cism"
    CISA = "cisa"
    CRISC = "crisc"
    CEH = "ceh"
    OSCP = "oscp"
    OSCE = "osce"
    OSWE = "oswe"
    GCIH = "gcih"
    GCIA = "gcia"
    GCFA = "gcfa"
    GPEN = "gpen"
    GREM = "grem"
    SECURITY_PLUS = "security_plus"
    NETWORK_PLUS = "network_plus"
    CCSP = "ccsp"
    CCSK = "ccsk"
    AWS_SECURITY_SPECIALTY = "aws_security_specialty"
    AZURE_SECURITY_ENGINEER = "azure_security_engineer"


class SecurityFramework(str, Enum):
    MITRE_ATTACK = "mitre_attack"
    MITRE_DEFEND = "mitre_defend"
    NIST_CSF = "nist_csf"
    NIST_800_53 = "nist_800_53"
    NIST_800_171 = "nist_800_171"
    ISO_27001 = "iso_27001"
    ISO_27701 = "iso_27701"
    SOC2 = "soc2"
    PCI_DSS = "pci_dss"
    HIPAA = "hipaa"
    GDPR = "gdpr"
    CIS_CONTROLS = "cis_controls"
    OWASP_ASVS = "owasp_asvs"
    OWASP_SAMM = "owasp_samm"
    CMMC = "cmmc"
    FEDRAMP = "fedramp"


class SalaryPeriod(str, Enum):
    HOURLY = "hourly"
    DAILY = "daily"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    PROJECT = "project"


class WorkMode(str, Enum):
    ONSITE = "onsite"
    HYBRID = "hybrid"
    REMOTE = "remote"


class JobPostStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    PAUSED = "paused"
    EXPIRED = "expired"
    CLOSED = "closed"


class JobAudience(str, Enum):
    VERIFIED_ONLY = "verified_only"
    OPEN = "open"


class CredentialDocumentType(str, Enum):
    CERTIFICATION = "certification"
    DEGREE = "degree"
    TRANSCRIPT = "transcript"
    LICENSE = "license"
    TRAINING = "training"
    EMPLOYMENT_LETTER = "employment_letter"
    REFERENCE = "reference"
    OTHER = "other"


class ScreeningAnswerType(str, Enum):
    SHORT_TEXT = "short_text"
    LONG_TEXT = "long_text"
    YES_NO = "yes_no"
    SINGLE_CHOICE = "single_choice"
    MULTI_CHOICE = "multi_choice"


class ApplicationStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    SHORTLISTED = "shortlisted"
    INTERVIEW = "interview"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


APPLICATION_TERMINAL_STATUSES = {
    ApplicationStatus.HIRED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
}

MAX_CREDENTIAL_DOCUMENTS = 10
MAX_SCREENING_QUESTIONS = 20

EDITABLE_JOB_POST_STATUSES = {
    JobPostStatus.DRAFT,
    JobPostStatus.PUBLISHED,
    JobPostStatus.PAUSED,
    JobPostStatus.EXPIRED,
}

APPLICATION_STATUS_FLOW = [
    ApplicationStatus.SUBMITTED,
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFER,
    ApplicationStatus.HIRED,
]


class ScreeningQuestion(EmbeddedModel):
    questionId: str
    prompt: str
    answerType: ScreeningAnswerType = Field(default=ScreeningAnswerType.SHORT_TEXT)
    choices: List[str] = Field(default_factory=list)
    required: bool = False


class ScreeningAnswer(EmbeddedModel):
    questionId: str
    prompt: str
    answer: str = ""
    answers: List[str] = Field(default_factory=list)


class JobFile(EmbeddedModel):
    fileId: str
    fileName: str = ""
    fileType: str = ""
    fileSize: int = 0
    fileResourceId: str = ""
    fileHash: str = ""
    uploadedAt: datetime = Field(default_factory=utc_now)


class CredentialDocument(EmbeddedModel):
    documentId: str
    documentType: CredentialDocumentType = Field(default=CredentialDocumentType.OTHER)
    documentTypeOtherValue: str = ""
    title: str = ""
    issuer: str = ""
    issuedAt: Optional[datetime] = None
    expiresAt: Optional[datetime] = None
    fileName: str = ""
    fileType: str = ""
    fileSize: int = 0
    fileResourceId: str = ""
    fileHash: str = ""
    uploadedAt: datetime = Field(default_factory=utc_now)


class ApplicationStatusEvent(EmbeddedModel):
    status: ApplicationStatus
    note: str = ""
    visibleToApplicant: bool = True
    changedBy: str = ""
    changedAt: datetime = Field(default_factory=utc_now)


class db_job_post_model(Model):
    jobId: str = Field(index=True)
    tenant_id: str = Field(index=True)

    title: str
    shortDescription: str = ""
    description: str = ""
    keyResponsibilities: List[str] = Field(default_factory=list)

    role: CyberSecurityRole = Field(default=CyberSecurityRole.OTHER)
    roleOtherValue: str = ""
    engagementType: EngagementType = Field(default=EngagementType.FULL_TIME)
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

    screeningQuestions: List[ScreeningQuestion] = Field(default_factory=list)

    audience: JobAudience = Field(default=JobAudience.OPEN)
    status: JobPostStatus = Field(default=JobPostStatus.DRAFT, index=True)
    applicationCount: int = 0

    isArchived: bool = Field(default=False, index=True)
    archivedAt: Optional[datetime] = None
    archivedBy: str = ""

    createdBy: str = ""
    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)
    publishedAt: Optional[datetime] = None
    expiresAt: Optional[datetime] = None
    closedAt: Optional[datetime] = None

    model_config = {"collection": "job_posts"}


class db_job_application_model(Model):
    applicationId: str = Field(index=True)
    jobId: str = Field(index=True)
    tenant_id: str = Field(index=True)
    applicant_user_id: str = Field(index=True)
    applicantUsername: str = ""
    applicantVerified: bool = False
    email: str = ""
    linkedinUrl: str = ""
    githubUrl: str = ""
    coverLetter: str = ""
    screeningAnswers: List[ScreeningAnswer] = Field(default_factory=list)
    resume: JobFile
    credentialDocuments: List[CredentialDocument] = Field(default_factory=list)
    submittedAt: datetime = Field(default_factory=utc_now)
    status: ApplicationStatus = Field(default=ApplicationStatus.SUBMITTED, index=True)
    timeline: List[ApplicationStatusEvent] = Field(default_factory=list)
    firstViewedAt: Optional[datetime] = None
    updatedAt: datetime = Field(default_factory=utc_now)
    decidedAt: Optional[datetime] = None

    model_config = {"collection": "job_applications"}


class db_job_view_model(Model):
    jobId: str = Field(index=True)
    user_id: str = Field(index=True)
    viewedAt: datetime = Field(default_factory=utc_now)

    model_config = {"collection": "job_views"}
