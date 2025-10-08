import re

import pyotp

from datetime import datetime, UTC
from enum import Enum
from typing import Optional, Dict, Any
from odmantic import Model, Field
from passlib.context import CryptContext
from pydantic import field_validator, model_validator
from starlette_admin.exceptions import FormValidationError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class user_role(str, Enum):
    ADMIN = "admin"
    CRAWLER = "crawler"
    DEMO = "demo"
    PROFILE = "profile"


class UserStatus(str, Enum):
    PENDING = "verification_pending"
    ONBOARDING = "onboarding"
    ACTIVE = "active"
    DISABLE = "disable"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


class db_user_account(Model):
    username: str = Field(unique=True)
    password: str
    email: str = Field(default="")
    role: user_role = Field(default=user_role.DEMO)
    status: Optional[UserStatus] = Field(default=None)

    verification_token: Optional[str] = Field(default=None)
    verification_expiry: Optional[datetime] = Field(default=None)

    twofa_enabled: bool = Field(default=False)
    twofa_secret: Optional[str] = Field(default=None)

    account_verify_at: Optional[datetime] = Field(default=None)
    subscription: bool = Field(default=False)
    preferences: Optional[Dict[str, Any]] = {}

    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(str(password))

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        value = value.strip()
        if not value.isalnum():
            raise ValueError("Username must be alphanumeric and cannot contain spaces or special characters")
        if any(op in value for op in ["$", "{", "}"]):
            raise ValueError("Invalid characters in username")
        return value

    @field_validator("password", mode="before")
    @classmethod
    def validate_and_hash_password(cls, value: str) -> str:
        if value is None or not str(value).strip():
            raise ValueError("Password is required")

        password = str(value)

        # Combined regex check for all 5 conditions
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[a-z]", password):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", password):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            raise ValueError("Password must contain at least one special character")

        if password.startswith("$2b$"):
            return password

        return pwd_context.hash(password)

    @model_validator(mode="before")
    def validate_email(cls, values):
        role = values.get("role")
        email = values.get("email", "")
        if role == user_role.PROFILE:
            if not email or "@" not in email or "." not in email.split("@")[-1]:
                raise FormValidationError({"email": "Invalid or missing email address for profile users"})
        elif email:
            if "@" not in email or "." not in email.split("@")[-1]:
                raise FormValidationError({"email": "Invalid email format"})
        return values

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def is_admin(self) -> bool:
        return self.role == user_role.ADMIN

    def is_crawler(self) -> bool:
        return self.role == user_role.CRAWLER

    def is_demo(self) -> bool:
        return self.role == user_role.DEMO

    def verify_2fa(self, code: str) -> bool:
        if not self.twofa_enabled or not self.twofa_secret:
            return False
        return pyotp.TOTP(self.twofa_secret).verify(code, valid_window=1)

    def provisioning_uri(self, issuer: str = "MyApp") -> Optional[str]:
        if not self.twofa_secret:
            return None
        return pyotp.totp.TOTP(self.twofa_secret).provisioning_uri(
            name=self.username,
            issuer_name=issuer,
        )

    @model_validator(mode="after")
    def finalize(self):
        if self.role != user_role.PROFILE:
            object.__setattr__(self, "status", UserStatus.ACTIVE)
            if self.account_verify_at is None:
                object.__setattr__(self, "account_verify_at", datetime.now(UTC))
        else:
            if self.status is None:
                raise FormValidationError({"status": "Status is required for profile users"})
        return self