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


VERIFICATION_CODE_LENGTH = 6
VERIFICATION_CODE_TTL_MINUTES = 15
VERIFICATION_MAX_ATTEMPTS = 5
VERIFICATION_RESEND_COOLDOWN_SECONDS = 60
MAX_CREDENTIAL_DOCUMENTS = 10


class ApplicantVerificationStatus(str, Enum):
    UNVERIFIED = "unverified"
    VERIFIED = "verified"


class CredentialDocumentType(str, Enum):
    CERTIFICATION = "certification"
    DEGREE = "degree"
    TRANSCRIPT = "transcript"
    LICENSE = "license"
    TRAINING = "training"
    EMPLOYMENT_LETTER = "employment_letter"
    REFERENCE = "reference"
    OTHER = "other"


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


class db_public_profile_model(Model):
    user_id: str = Field(unique=True)

    verificationStatus: ApplicantVerificationStatus = Field(default=ApplicantVerificationStatus.UNVERIFIED, index=True)
    verifiedAt: Optional[datetime] = None
    verifiedEmail: str = ""

    verificationCodeHash: Optional[str] = None
    verificationCodeExpiry: Optional[datetime] = None
    verificationAttempts: int = 0
    verificationLastSentAt: Optional[datetime] = None

    fullName: str = ""
    headline: str = ""
    phone: str = ""
    location: str = ""
    linkedinUrl: str = ""
    githubUrl: str = ""

    credentialDocuments: List[CredentialDocument] = Field(default_factory=list)

    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)

    model_config = {"collection": "public_profiles"}
