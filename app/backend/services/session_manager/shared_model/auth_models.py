from odmantic import Model, Field
from passlib.context import CryptContext
from enum import Enum
from pydantic import field_validator

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class user_role(str, Enum):
    ADMIN = "admin"
    CRAWLER = "crawler"
    DEMO = "demo"

class user_account(Model):
    username: str = Field(unique=True)
    password: str
    role: user_role = Field(default=user_role.DEMO)

    @field_validator("password", mode="before")
    @classmethod
    def auto_hash_password(cls, value: str) -> str:
        if not value.startswith("$2b$"):
            return pwd_context.hash(value)
        return value

    @staticmethod
    def verify_password(plain_password: str, password: str) -> bool:
        return pwd_context.verify(plain_password, password)

    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    def is_admin(self) -> bool:
        return self.role == user_role.ADMIN

    def is_crawler(self) -> bool:
        return self.role == user_role.CRAWLER

    def is_demo(self) -> bool:
        return self.role == user_role.DEMO
