from __future__ import annotations

import time

from orion.constants.constant import CONSTANTS


class maintenance_state:
    __instance = None

    @staticmethod
    def get_instance():
        if maintenance_state.__instance is None:
            maintenance_state()
        return maintenance_state.__instance

    def __init__(self):
        if maintenance_state.__instance is not None:
            return
        maintenance_state.__instance = self
        self._checked_at = -CONSTANTS.MAINTENANCE_CACHE_TTL_SECONDS
        self._active = False
        self._restoring_tenants: set[str] = set()

    def fence_tenants(self, tenant_ids) -> None:
        self._restoring_tenants.update(str(tenant_id) for tenant_id in tenant_ids)

    def release_tenants(self, tenant_ids) -> None:
        self._restoring_tenants.difference_update(str(tenant_id) for tenant_id in tenant_ids)

    def is_tenant_fenced(self, tenant_id, parent_tenant_id=None) -> bool:
        if not self._restoring_tenants:
            return False
        if str(tenant_id) in self._restoring_tenants:
            return True
        return bool(parent_tenant_id) and str(parent_tenant_id) in self._restoring_tenants

    def is_active(self) -> bool:
        now = time.monotonic()
        if now - self._checked_at >= CONSTANTS.MAINTENANCE_CACHE_TTL_SECONDS:
            try:
                self._active = CONSTANTS.MAINTENANCE_FLAG.exists()
            except OSError:
                self._active = False
            self._checked_at = now
        return self._active

    def invalidate(self) -> None:
        self._checked_at = -CONSTANTS.MAINTENANCE_CACHE_TTL_SECONDS

    def enable(self) -> None:
        CONSTANTS.MAINTENANCE_FLAG.parent.mkdir(parents=True, exist_ok=True)
        CONSTANTS.MAINTENANCE_FLAG.touch()
        self.invalidate()

    def disable(self) -> None:
        CONSTANTS.MAINTENANCE_FLAG.unlink(missing_ok=True)
        self.invalidate()
