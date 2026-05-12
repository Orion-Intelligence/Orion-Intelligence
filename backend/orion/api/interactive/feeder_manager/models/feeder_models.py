from datetime import datetime
from typing import List, TypedDict

from pydantic import BaseModel, Field

from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName

class FeederRuleOption(BaseModel):
    key: str
    rule_type: str
    path: str | None = None
    values: List[str] = Field(default_factory=list)


class FeederCatalogResponse(BaseModel):
    rules: List[FeederRuleOption] = Field(default_factory=list)


class FeederValueItem(BaseModel):
    url: str
    status: str | None = None
    last_checked_at: datetime | None = None
    last_error: str | None = None
    last_success_date: datetime | None = None
    last_success_message: str | None = None
    last_failure_date: datetime | None = None
    last_failure_message: str | None = None


class FeederScriptItem(BaseModel):
    id: str
    rule_key: str | None = None
    entry_kind: str | None = None
    enabled: bool = True
    file_name: str
    category_key: str
    subcategory_key: str
    path: str | None = None
    session_file_name: str | None = None
    content: str | None = None
    url: str | None = None
    values: List[FeederValueItem] = Field(default_factory=list)
    owner_id: str | None = None
    owner_name: str | None = None
    last_failure_date: datetime | None = None
    last_failure_message: str | None = None
    last_success_date: datetime | None = None
    last_success_message: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class FeederScriptListResponse(BaseModel):
    scripts: List[FeederScriptItem] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    limit: int = 1000
    has_more: bool = False


class FeederUploadResponse(BaseModel):
    message: str = ""
    script: FeederScriptItem | None = None


class FeederOwnerTransferRequest(BaseModel):
    user_id: str


class FeederValueDeleteRequest(BaseModel):
    value: str


class FeederScriptStatusUpdateRequest(BaseModel):
    name: str
    url: str
    status: str
    message: str | None = None


class FeederOwnerUser(BaseModel):
    id: str
    username: str | None = None
    email: str | None = None
    role: str | None = None
    status: str | None = None
    licenses: List[LicenseName] = Field(default_factory=list)


class PathMetadata(TypedDict):
    relative_path: str
    category_key: str
    subcategory_key: str
    file_name: str
    created_at: datetime | None
    updated_at: datetime | None
