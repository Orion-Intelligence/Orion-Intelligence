from __future__ import annotations

from pathlib import Path
from typing import Any

from orion.services.redis_manager.redis_enums import REDIS_COMMANDS


class FakeConfigEngine:
    def __init__(self, find_one_results=None, find_results=None, tenants=None):
        self.find_one_results = list(find_one_results or [])
        self.find_results = list(find_results or [])
        self.tenants = list(tenants or [])
        self.saved: list[Any] = []
        self.find_one_calls = 0
        self.find_calls = 0

    def _match_tenant(self, query):
        terms = dict(query or {})
        for field, candidates in (("is_default", self.tenants), ("_id", self.tenants)):
            if field not in terms:
                continue
            wanted = terms[field]
            if isinstance(wanted, dict):
                wanted = wanted.get("$eq")
            for tenant in candidates:
                actual = tenant.is_default if field == "is_default" else str(tenant.id)
                if actual == (bool(wanted) if field == "is_default" else str(wanted)):
                    return tenant
        return None

    async def find_one(self, *_args, **_kwargs):
        self.find_one_calls += 1
        if self.tenants and len(_args) > 1 and getattr(_args[0], "__name__", "") == "db_tenant_model":
            matched = self._match_tenant(_args[1])
            if matched is not None:
                return matched
        if self.find_one_results:
            return self.find_one_results.pop(0)
        return None

    async def find(self, *_args, **_kwargs):
        self.find_calls += 1
        if self.find_results:
            return self.find_results.pop(0)
        return []

    async def save(self, model):
        self.saved.append(model)
        return model


class FakeRaisingEngine:
    def __init__(self, tenant):
        self._tenant = tenant
        self._served = False

    async def find_one(self, *_args, **_kwargs):
        if not self._served:
            self._served = True
            return self._tenant
        raise RuntimeError("db down")

    async def find(self, *_args, **_kwargs):
        raise RuntimeError("db down")

    async def save(self, model):
        return model


class FakeConfigRedis:
    def __init__(self, values=None, get_exc=False, set_exc=False):
        self.values = dict(values or {})
        self.get_exc = get_exc
        self.set_exc = set_exc
        self.calls: list[Any] = []

    async def invoke_trigger(self, command, payload):
        self.calls.append((command, payload))
        if command == REDIS_COMMANDS.S_GET_STRING:
            if self.get_exc:
                raise RuntimeError("redis get down")
            return self.values.get(payload[0])
        if command == REDIS_COMMANDS.S_SET_STRING:
            if self.set_exc:
                raise RuntimeError("redis set down")
            self.values[payload[0]] = payload[1]
            return True
        return None


class FakeResourceManager:
    def __init__(self, resource_dir: Path | None = None, tenant_system_dir: Path | None = None):
        self.resource_dir = resource_dir
        self.tenant_system_dir = tenant_system_dir

    def system_resource_path(self, file_name, tenant):
        if self.resource_dir is None:
            return Path("/nonexistent-config-dir") / file_name
        return self.resource_dir / file_name

    def get_tenant_system_dir(self, tenant):
        return self.tenant_system_dir


class FakeAuditLogManager:
    def __init__(self):
        self.calls: list[Any] = []

    async def register(self, tenant_id, user_id, action):
        self.calls.append((tenant_id, user_id, action))


class FakeMailManager:
    def __init__(self, exc=None):
        self.calls: list[Any] = []
        self.exc = exc

    async def send_test_mail(self, tenant_id, config):
        self.calls.append((tenant_id, config))
        if self.exc is not None:
            raise self.exc


class FakeLog:
    def g(self):
        return self

    def w(self, *_args, **_kwargs):
        return None

    def e(self, *_args, **_kwargs):
        return None

    def i(self, *_args, **_kwargs):
        return None


class FakeUploadFile:
    def __init__(self, content=b"image-bytes", content_type="image/png"):
        self._content = content
        self.content_type = content_type

    async def read(self):
        return self._content
