
from datetime import datetime
from enum import Enum
from typing import Optional
from enum import Enum
from typing import Optional

import pyotp
from odmantic import Model, Field
from passlib.context import CryptContext
from pydantic import field_validator

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class user_role(str, Enum):
    ADMIN = "admin"
    CRAWLER = "crawler"
    DEMO = "demo"
    PROFILE="profile"

class UserStatus(str, Enum):
    PENDING = "verification_pending"
    ONBOARDING="onboarding"
    ACTIVE = "active"
    DISABLE="disable"

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


class db_user_account(Model):
    username: str = Field(unique=True)
    password: str = Field(default="")
    email:str=Field(default="")
    role: user_role = Field(default=user_role.DEMO)
    status:UserStatus=Field(default=UserStatus.PENDING)
    verification_token: Optional[str] = Field(default=None)
    verification_expiry: Optional[datetime] = Field(default=None)
    twofa_enabled: bool = Field(default=False)
    twofa_secret: Optional[str] = Field(default=None)


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
    def hash_password(cls, value: str) -> str:
        if not value.startswith("$2b$"):
            return pwd_context.hash(value)
        return value

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