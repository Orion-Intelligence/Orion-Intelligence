from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

from bson import ObjectId
from bson.errors import InvalidId


class Ownership(str, Enum):
    DIRECT = "direct"
    TRANSITIVE = "transitive"
    GLOBAL = "global"
    PRESERVED = "preserved"


@dataclass(frozen=True)
class PartitionRule:
    ownership: Ownership
    tenant_field: str = ""
    user_field: str = ""
    as_object_id: bool = False
    source: str = "inferred"
    reason: str = ""

    @property
    def is_tenant_owned(self) -> bool:
        return self.ownership in (Ownership.DIRECT, Ownership.TRANSITIVE)


@dataclass
class TenantScope:
    tenant_id: str
    user_ids: list[str] = field(default_factory=list)

    @property
    def object_id(self) -> ObjectId | None:
        try:
            return ObjectId(self.tenant_id)
        except (InvalidId, TypeError):
            return None
