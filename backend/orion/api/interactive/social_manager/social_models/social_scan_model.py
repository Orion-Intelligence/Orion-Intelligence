import asyncio
from dataclasses import dataclass
from typing import Any


@dataclass
class SocialScan:
    user_id: str
    kind: str
    payload: dict[str, Any]
    headers: dict[str, str]
    profile_username: str
    task: asyncio.Task | None = None
