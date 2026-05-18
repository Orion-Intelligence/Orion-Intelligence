from datetime import datetime
from datetime import timezone
from enum import Enum
from typing import List
from typing import Optional

from odmantic import EmbeddedModel
from odmantic import Field
from odmantic import Model
from pydantic import BaseModel
from pydantic import Field as PydanticField


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CaseType(str, Enum):
    DATA_LEAK = "data_leak"
    ACCOUNT_TAKEOVER = "account_takeover"
    PHISHING = "phishing"
    MALWARE = "malware"

    FRAUD = "fraud"
    DEFACEMENT = "defacement"
    SUSPICIOUS_INFRASTRUCTURE = "suspicious_infrastructure"
    VULNERABILITY_EXPOSURE = "vulnerability_exposure"
    INSIDER_THREAT = "insider_threat"
    SOCIAL_IMPERSONATION = "social_impersonation"
    DARK_WEB_MENTION = "dark_web_mention"
    OTHER = "other"


class CaseStatus(str, Enum):
    NEW = "new"
    TRIAGED = "triaged"
    ASSIGNED = "assigned"
    INVESTIGATING = "investigating"
    WAITING_ON_RESPONSE = "waiting_on_response"
    REMEDIATING = "remediating"
    REVIEW = "review"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Severity(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IntakeSource(str, Enum):
    MANUAL = "manual"
    SOC_ALERT = "soc_alert"
    TENANT_ALERT = "tenant_alert"
    SIEM = "siem"
    EMAIL_REPORT = "email_report"
    EMPLOYEE_REPORT = "employee_report"
    CUSTOMER_REPORT = "customer_report"
    BREACH_SEARCH = "breach_search"
    STEALER_LOGS = "stealer_logs"
    ENTITY_API = "entity_api"
    NETWORK_INTEL = "network_intel"
    SOCIAL_INTEL = "social_intel"
    CTI_GRAPH = "cti_graph"
    EXTERNAL_INTEL = "external_intel"
    OTHER = "other"


class EntityType(str, Enum):
    PERSON = "person"
    ORGANIZATION = "organization"
    EMAIL = "email"
    DOMAIN = "domain"
    IP = "ip"
    URL = "url"
    USERNAME = "username"
    PHONE = "phone"
    WALLET = "wallet"
    DEVICE = "device"
    CLOUD_ASSET = "cloud_asset"
    CREDENTIAL = "credential"
    SOCIAL_PROFILE = "social_profile"
    MALWARE = "malware"
    VULNERABILITY = "vulnerability"
    THREAT_ACTOR = "threat_actor"
    CAMPAIGN = "campaign"
    INCIDENT = "incident"
    OTHER = "other"


class EntityRole(str, Enum):
    PRIMARY = "primary"
    RELATED = "related"
    VICTIM = "victim"
    ATTACKER = "attacker"
    ASSET = "asset"
    INDICATOR = "indicator"
    SOURCE = "source"
    RECIPIENT = "recipient"
    OBSERVED_ON = "observed_on"
    OWNER = "owner"


class EntityRelationship(str, Enum):
    SUBJECT_OF_CASE = "subject_of_case"
    AFFECTED_ACCOUNT = "affected_account"
    AFFECTED_ASSET = "affected_asset"
    CONTACT_POINT = "contact_point"
    OWNS = "owns"
    USES = "uses"
    HOSTS = "hosts"
    RESOLVES_TO = "resolves_to"
    CONNECTED_TO = "connected_to"
    CREATED_BY = "created_by"
    TARGETED_BY = "targeted_by"
    OBSERVED_WITH = "observed_with"
    SAME_AS = "same_as"
    RELATED_TO = "related_to"


class SocialPlatform(str, Enum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    X = "x"
    LINKEDIN = "linkedin"
    TELEGRAM = "telegram"
    WHATSAPP = "whatsapp"
    DISCORD = "discord"
    REDDIT = "reddit"
    GITHUB = "github"
    GITLAB = "gitlab"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    MASTODON = "mastodon"
    PASTEBIN = "pastebin"
    DARK_WEB_FORUM = "dark_web_forum"
    OTHER = "other"


class IdentifierType(str, Enum):
    EMAIL = "email"
    PHONE = "phone"
    USERNAME = "username"
    DOMAIN = "domain"
    IP = "ip"
    URL = "url"
    NATIONAL_ID = "national_id"
    PASSPORT = "passport"
    EMPLOYEE_ID = "employee_id"
    CUSTOMER_ID = "customer_id"
    DEVICE_ID = "device_id"
    HOSTNAME = "hostname"
    MAC_ADDRESS = "mac_address"
    WALLET_ADDRESS = "wallet_address"
    CVE = "cve"
    OTHER = "other"


class EntityAttributeType(str, Enum):
    OS = "os"
    HOSTNAME = "hostname"
    EDR_STATUS = "edr_status"
    ASSET_CRITICALITY = "asset_criticality"
    LAST_SEEN_IP = "last_seen_ip"
    CLOUD_PROVIDER = "cloud_provider"
    CLOUD_ACCOUNT_ID = "cloud_account_id"
    CLOUD_RESOURCE_ID = "cloud_resource_id"
    REGION = "region"
    EXPOSURE = "exposure"
    DEPARTMENT = "department"
    COUNTRY = "country"
    BUSINESS_UNIT = "business_unit"
    OWNER = "owner"
    SOURCE_SYSTEM = "source_system"
    RISK_SCORE = "risk_score"


class ArtifactType(str, Enum):
    EVIDENCE = "evidence"
    SCREENSHOT = "screenshot"
    FILE = "file"
    URL_CAPTURE = "url_capture"
    RAW_ALERT = "raw_alert"
    CHAT_TRANSCRIPT = "chat_transcript"
    EMAIL_HEADER = "email_header"
    LOG_EXCERPT = "log_excerpt"
    REPORT = "report"
    OTHER = "other"


class SourceType(str, Enum):
    MANUAL = "manual"
    ORION_ALERT = "orion_alert"
    ORION_SEARCH = "orion_search"
    ORION_SCAN = "orion_scan"
    IMPORT = "import"
    API = "api"
    EXTERNAL = "external"
    OTHER = "other"


class TaskStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    DONE = "done"
    CANCELLED = "cancelled"


class CaseLinkRelationship(str, Enum):
    DUPLICATE = "duplicate"
    RELATED = "related"
    PARENT = "parent"
    CHILD = "child"
    FOLLOW_UP = "follow_up"
    ESCALATION = "escalation"
    SAME_ACTOR = "same_actor"
    SAME_VICTIM = "same_victim"
    SAME_INFRASTRUCTURE = "same_infrastructure"


class ClosureReason(str, Enum):
    TRUE_POSITIVE = "true_positive"
    FALSE_POSITIVE = "false_positive"
    DUPLICATE = "duplicate"
    RISK_ACCEPTED = "risk_accepted"
    REMEDIATED = "remediated"
    NO_ACTION_REQUIRED = "no_action_required"
    INCONCLUSIVE = "inconclusive"
    OTHER = "other"


class CaseTag(str, Enum):
    VIP = "vip"
    EXECUTIVE = "executive"
    WATCHLIST = "watchlist"
    HIGH_VALUE_ASSET = "high_value_asset"
    CUSTOMER_IMPACT = "customer_impact"
    REGULATORY = "regulatory"
    PUBLIC_EXPOSURE = "public_exposure"
    CREDENTIAL_EXPOSURE = "credential_exposure"
    REQUIRES_REVIEW = "requires_review"
    ESCALATED = "escalated"
    FALSE_POSITIVE = "false_positive"
    DUPLICATE = "duplicate"


class SocialMediaProfile(EmbeddedModel):
    platform: SocialPlatform
    username: str
    profileUrl: str = ""
    displayName: str = ""


class AdditionalIdentifier(EmbeddedModel):
    type: IdentifierType
    value: str
    issuer: str = ""
    verified: bool = False


class CaseEntityAttribute(EmbeddedModel):
    type: EntityAttributeType
    value: str


class CaseEntity(EmbeddedModel):
    entityId: str
    type: EntityType
    value: str
    displayName: str = ""
    role: EntityRole = Field(default=EntityRole.RELATED)
    relationshipToCase: EntityRelationship = Field(default=EntityRelationship.RELATED_TO)
    confidence: float = 1.0
    source: SourceType = Field(default=SourceType.MANUAL)
    identifiers: List[AdditionalIdentifier] = Field(default_factory=list)
    socialProfiles: List[SocialMediaProfile] = Field(default_factory=list)
    tags: List[CaseTag] = Field(default_factory=list)
    attributes: List[CaseEntityAttribute] = Field(default_factory=list)
    createdBy: str = ""
    updatedBy: str = ""
    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)


class CaseArtifact(EmbeddedModel):
    artifactId: str
    type: ArtifactType = Field(default=ArtifactType.EVIDENCE)
    title: str
    description: str = ""
    source: SourceType = Field(default=SourceType.MANUAL)
    url: str = ""
    fileName: str = ""
    fileType: str = ""
    entityIds: List[str] = Field(default_factory=list)
    tags: List[CaseTag] = Field(default_factory=list)
    capturedAt: Optional[datetime] = None
    createdBy: str = ""
    createdAt: datetime = Field(default_factory=utc_now)


class CaseComment(EmbeddedModel):
    commentId: str
    body: str
    entityIds: List[str] = Field(default_factory=list)
    artifactIds: List[str] = Field(default_factory=list)
    createdBy: str = ""
    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)


class CaseTask(EmbeddedModel):
    taskId: str
    title: str
    description: str = ""
    status: TaskStatus = Field(default=TaskStatus.OPEN)
    priority: Priority = Field(default=Priority.MEDIUM)
    assignedTo: str = ""
    dueAt: Optional[datetime] = None
    entityIds: List[str] = Field(default_factory=list)
    artifactIds: List[str] = Field(default_factory=list)
    createdBy: str = ""
    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)
    completedAt: Optional[datetime] = None


class CaseLink(EmbeddedModel):
    targetCaseId: str
    relationship: CaseLinkRelationship = Field(default=CaseLinkRelationship.RELATED)
    reason: str
    createdBy: str = ""
    createdAt: datetime = Field(default_factory=utc_now)


class CaseClosure(BaseModel):
    reason: ClosureReason
    summary: str = ""
    resolution: str = ""
    closedBy: str = ""
    closedAt: datetime = PydanticField(default_factory=utc_now)


class db_case_model(Model):
    caseId: str = Field(index=True)
    tenant_uuid: str = Field(index=True)

    title: str
    description: str = ""
    caseType: CaseType = Field(default=CaseType.OTHER)
    status: CaseStatus = Field(default=CaseStatus.NEW)
    severity: Severity = Field(default=Severity.LOW)
    priority: Priority = Field(default=Priority.LOW)
    tags: List[CaseTag] = Field(default_factory=list)
    intakeSource: IntakeSource = Field(default=IntakeSource.MANUAL)

    createdBy: str = ""
    assignedAnalystIds: List[str] = Field(default_factory=list)
    primaryEntityId: Optional[str] = None

    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)
    closedAt: Optional[datetime] = None

    entities: List[CaseEntity] = Field(default_factory=list)

    artifacts: List[CaseArtifact] = Field(default_factory=list)
    tasks: List[CaseTask] = Field(default_factory=list)

    comments: List[CaseComment] = Field(default_factory=list)
    linkedCases: List[CaseLink] = Field(default_factory=list)

    closure: Optional[CaseClosure] = None

    model_config = {"collection": "cases"}
