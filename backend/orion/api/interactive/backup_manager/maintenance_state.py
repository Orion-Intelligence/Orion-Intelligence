from __future__ import annotations

import json
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
        self._fence_checked_at = -CONSTANTS.MAINTENANCE_CACHE_TTL_SECONDS
        self._restoring_tenants: set[str] = set()

    def _read_fenced(self) -> set[str]:
        try:
            return {str(item) for item in json.loads(CONSTANTS.TENANT_FENCE_FILE.read_text(encoding="utf-8"))}
        except (OSError, ValueError):
            return set()

    def _write_fenced(self, tenant_ids: set[str]) -> None:
        CONSTANTS.TENANT_FENCE_FILE.parent.mkdir(parents=True, exist_ok=True)
        if tenant_ids:
            CONSTANTS.TENANT_FENCE_FILE.write_text(json.dumps(sorted(tenant_ids)), encoding="utf-8")
        else:
            CONSTANTS.TENANT_FENCE_FILE.unlink(missing_ok=True)
        self._restoring_tenants = set(tenant_ids)
        self._fence_checked_at = time.monotonic()

    def _fenced(self) -> set[str]:
        now = time.monotonic()
        if now - self._fence_checked_at >= CONSTANTS.MAINTENANCE_CACHE_TTL_SECONDS:
            self._restoring_tenants = self._read_fenced()
            self._fence_checked_at = now
        return self._restoring_tenants

    def fence_tenants(self, tenant_ids) -> None:
        self._write_fenced(self._read_fenced() | {str(tenant_id) for tenant_id in tenant_ids})

    def release_tenants(self, tenant_ids) -> None:
        self._write_fenced(self._read_fenced() - {str(tenant_id) for tenant_id in tenant_ids})

    def release_all_tenants(self) -> None:
        self._write_fenced(set())

    def is_tenant_fenced(self, tenant_id, parent_tenant_id=None) -> bool:
        fenced = self._fenced()
        if not fenced:
            return False
        if str(tenant_id) in fenced:
            return True
        return bool(parent_tenant_id) and str(parent_tenant_id) in fenced

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
