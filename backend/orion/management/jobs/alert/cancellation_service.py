from typing import Any


class CancellationService:
    def __init__(self):
        self._cancel_scan_flags: dict[str, bool] = {}

    @staticmethod
    def tenant_key(tenant_id: Any) -> str:
        return str(tenant_id)

    def ensure_tenant(self, tenant_id: Any) -> str:
        tenant_key = self.tenant_key(tenant_id)
        if tenant_key not in self._cancel_scan_flags:
            self._cancel_scan_flags[tenant_key] = False
        return tenant_key

    def is_cancelled(self, tenant_id: Any) -> bool:
        return bool(self._cancel_scan_flags.get(self.tenant_key(tenant_id)))

    def cancel(self, tenant_id: Any) -> None:
        self._cancel_scan_flags[self.tenant_key(tenant_id)] = True

    def clear(self, tenant_id: Any) -> None:
        self._cancel_scan_flags.pop(self.tenant_key(tenant_id), None)
