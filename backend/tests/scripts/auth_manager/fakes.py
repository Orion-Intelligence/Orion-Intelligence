from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace

from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, user_role
from orion.services.mongo_manager.shared_model.db_tenant_model import TenantStatus

VALID_OID = "507f1f77bcf86cd799439011"


def make_user(**overrides):
    defaults = dict(
        id=VALID_OID,
        email="user@example.com",
        username="user1",
        password="hashed-password",
        status=UserStatus.ACTIVE,
        twofa_enabled=False,
        twofa_secret=None,
        tenant_uuid=VALID_OID,
        role=user_role.MEMBER,
        subscription=True,
        account_verify_at=datetime.now(timezone.utc),
        licenses=[LicenseName.MAINTAINER],
        password_reset_required=False,
        reset_twofa_on_password_reset=False,
        verification_token="verify-token",
        verification_expiry=datetime(2999, 1, 1),
        password_reset_token="reset-hash",
        password_reset_expiry=datetime(2999, 1, 1),
        recovery_key_hash="recovery-hash",
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def make_tenant(**overrides):
    defaults = dict(id=VALID_OID, verified=True, status=TenantStatus.ACTIVE)
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


class FakePwdContext:
    def __init__(self, verify_result=True):
        self.verify_result = verify_result
        self.hashed = []

    def verify(self, password, hashed):
        if callable(self.verify_result):
            return self.verify_result(password, hashed)
        return self.verify_result

    def hash(self, password):
        self.hashed.append(password)
        return f"hashed::{password}"


class FakeSessionInstance:
    def __init__(self):
        self.temp_tokens = []
        self.access_tokens = []
        self.onboarding = True

    async def create_temp_token(self, username, extra=None):
        self.temp_tokens.append((username, extra))
        return "temp-token"

    async def create_access_token(self, data, expires_delta=None, free=False):
        self.access_tokens.append((data, expires_delta, free))
        return "access-token", "member"

    async def has_onboarding(self, tenant_uuid):
        return self.onboarding

    async def get_parent_tenant(self, tenant_uuid):
        return None

    async def ensure_quota_access(self, user):
        return None

    async def parent_has_subscription(self, parent_tenant):
        return False


class FakeSessionManager:
    EXTENSION_SESSION_CLIENT = "extension"
    _instance = None
    ensure_error = None

    @classmethod
    def reset(cls):
        cls._instance = FakeSessionInstance()
        cls.ensure_error = None

    @staticmethod
    def get_instance():
        return FakeSessionManager._instance

    @staticmethod
    def ensure_user_tenant_access(user, tenant_or_id):
        if FakeSessionManager.ensure_error is not None:
            raise FakeSessionManager.ensure_error

    @staticmethod
    def tenant_identifier(tenant_or_id):
        return tenant_or_id

    @staticmethod
    def issue_password_reset_token(user, reset_twofa=False):
        user.password_reset_token = "issued-hash"
        return "reset-token"

    @staticmethod
    def hash_password_reset_token(token):
        return f"hash::{token}"


class FakeAuditManagerInstance:
    def __init__(self):
        self.calls = []

    async def register(self, tenant_id, user_id, action):
        self.calls.append((tenant_id, user_id, action))


class FakeAuditManager:
    _instance = None

    @classmethod
    def reset(cls):
        cls._instance = FakeAuditManagerInstance()

    @staticmethod
    def get_instance():
        return FakeAuditManager._instance


class FakeMailInstance:
    def __init__(self):
        self.sent = []

    async def send_verification_mail(self, to, subject, body, tenant_id=None):
        self.sent.append({"to": to, "subject": subject, "body": body, "tenant_id": tenant_id})


class FakeMailManager:
    _instance = None

    @classmethod
    def reset(cls):
        cls._instance = FakeMailInstance()

    @staticmethod
    def get_instance():
        return FakeMailManager._instance


class FakeConfigInstance:
    async def get_cached(self, key, default, tenant_id=None):
        return default


class FakeConfigController:
    @staticmethod
    def getInstance():
        return FakeConfigInstance()


class FakeAuthInstance:
    def __init__(self, user=None):
        self.user = user
        self.calls = []

    async def authenticate_user(self, mail, password):
        self.calls.append((mail, password))
        return self.user


class FakeLog:
    def __init__(self):
        self.messages = []

    def g(self):
        return self

    def e(self, message):
        self.messages.append(message)


class FakeRequest:
    def __init__(self, form_data):
        self._form = form_data

    async def form(self):
        return self._form


class FakeMailTemplate:
    def __init__(self):
        self.rendered = []

    def render(self, **kwargs):
        self.rendered.append(kwargs)
        return "<html>rendered</html>"
