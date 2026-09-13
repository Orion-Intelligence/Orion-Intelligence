from __future__ import annotations


class _FakeAuditManager:
    def __init__(self):
        self.calls = []

    async def search_audit(self, current_user, action: str, target: str):
        self.calls.append((current_user.id, action, target))
