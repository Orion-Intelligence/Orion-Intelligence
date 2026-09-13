from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

from cryptography.fernet import Fernet

DEK = Fernet.generate_key()


class FakeKeyManager:
    async def get_profile_dek(self, tenant_id):
        return DEK

    async def create_dek(self, tenant_id):
        return DEK

    async def get_or_create_dek(self, tenant_id):
        return DEK


class FakeMail:
    def __init__(self):
        self.test_calls = []
        self.validate_calls = []
        self.sent = []

    async def send_test_mail(self, tenant_id=None, config=None):
        self.test_calls.append((tenant_id, config))

    async def validate_mail_configuration(self, tenant_id=None):
        self.validate_calls.append(tenant_id)

    async def send_verification_mail(self, to, subject, body, tenant_id=None, config=None):
        self.sent.append((to, subject, body, tenant_id))


class FakeConfig:
    def __init__(self, cached="1"):
        self.cached = cached
        self.load_calls = []
        self.cached_calls = []

    async def load_config(self, force_db=False, tenant_id=None):
        self.load_calls.append(tenant_id)
        return None

    async def get_cached(self, key, default=None, tenant_id=None):
        self.cached_calls.append(key)
        return self.cached


class FakeAudit:
    def __init__(self):
        self.calls = []

    async def register(self, tenant_id, actor_id, event):
        self.calls.append((tenant_id, actor_id, event))
        return "log-id"


class FakeAlertManager:
    def __init__(self, summary=None, options=None):
        self.summary = summary if summary is not None else {"total": 3}
        self.options = options if options is not None else ["one", "two"]
        self.summary_calls = []

    async def get_alert_summary(self, tenant_id):
        self.summary_calls.append(tenant_id)
        return self.summary


class FakeAccount:
    def __init__(self, hashed="$2b$12$Abcdefg1!hashedpassword"):
        self.hashed = hashed
        self.calls = []

    async def create_tenant_user(self, existing_user, existing_mail, password):
        self.calls.append((existing_user, existing_mail, password))
        return self.hashed


class FakeResource:
    def __init__(self, target_dir=None, source_dir=None, files=None):
        self.target_dir = target_dir
        self.source_dir = source_dir
        self.SYSTEM_RESOURCE_FILES = files if files is not None else {"logo_custom.png", "plain.txt"}

    def get_tenant_system_dir(self, tenant):
        return self.target_dir

    def system_resource_path(self, file_name, tenant=None):
        base = self.source_dir if self.source_dir is not None else Path("/nonexistent-source-dir")
        return base / file_name


class FakeCollection:
    def __init__(self, modified_count=1):
        self.modified_count = modified_count
        self.update_one_calls = []
        self.update_many_calls = []

    async def update_one(self, query, update):
        self.update_one_calls.append((query, update))
        return SimpleNamespace(modified_count=self.modified_count)

    async def update_many(self, query, update):
        self.update_many_calls.append((query, update))
        return SimpleNamespace(modified_count=self.modified_count)


class ModelEngine:
    def __init__(self):
        self.find_one_map = {}
        self.find_map = {}
        self.count_result = 0
        self.count_results = None
        self.saved = []
        self.deleted = []
        self.removed = []
        self.collection = None
        self.save_raises = False

    def set_find_one(self, model, values):
        self.find_one_map[model] = list(values)
        return self

    def set_find(self, model, values):
        self.find_map[model] = list(values)
        return self

    async def find_one(self, model, *args, **kwargs):
        queue = self.find_one_map.get(model)
        if queue:
            return queue.pop(0)
        return None

    async def find(self, model, *args, **kwargs):
        return list(self.find_map.get(model, []))

    async def count(self, *args, **kwargs):
        if self.count_results:
            return self.count_results.pop(0)
        return self.count_result

    async def save(self, model):
        if self.save_raises:
            raise RuntimeError("save failed")
        self.saved.append(model)
        return model

    async def delete(self, model):
        self.deleted.append(model)
        return True

    async def remove(self, *args, **kwargs):
        self.removed.append((args, kwargs))
        return True

    def get_collection(self, model):
        return self.collection
