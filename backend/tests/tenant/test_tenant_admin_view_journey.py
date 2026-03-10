from __future__ import annotations

import asyncio
from contextlib import contextmanager
from datetime import datetime, timezone
from bson import ObjectId
from cryptography.fernet import Fernet
from starlette.requests import Request
from starlette_admin.exceptions import ActionFailed, FormValidationError
from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.shared_model.db_alert_model import db_alert_model
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus, db_user_account, user_role
from orion.services.mongo_manager.shared_model.db_keys import db_keys
from orion.services.mongo_manager.shared_model.db_tenant_model import TenantStatus, db_tenant_model
from orion.services.mongo_manager.shared_views.tenant_admin_view import TenantAdminView


@contextmanager
def _swap_attrs(*items):
    originals = []
    try:
        for owner, attr, value in items:
            originals.append((owner, attr, getattr(owner, attr)))
            setattr(owner, attr, value)
        yield
    finally:
        for owner, attr, value in reversed(originals):
            setattr(owner, attr, value)


class _AdminEngine:
    def __init__(self, default_tenant=None, current_tenant=None, users=None, keys=None, alerts=None):
        self.default_tenant = default_tenant
        self.current_tenant = current_tenant
        self.users = users or []
        self.keys = keys or []
        self.alerts = alerts or []
        self.deleted = []

    async def find_one(self, model, *_args, **_kwargs):
        if model is db_tenant_model:
            if self.current_tenant is not None:
                return self.current_tenant
            return self.default_tenant
        return None

    async def find(self, model, *_args, **_kwargs):
        if model is db_user_account:
            return list(self.users)
        if model is db_keys:
            return list(self.keys)
        if model is db_alert_model:
            return list(self.alerts)
        return []

    async def delete(self, doc):
        self.deleted.append(doc)
        return 1


class _FakeSession:
    def remove(self, *_args, **_kwargs):
        return 1


def _request_with_session() -> Request:
    request = Request(
        {
            "type": "http",
            "http_version": "1.1",
            "method": "GET",
            "scheme": "http",
            "path": "/admin",
            "raw_path": b"/admin",
            "query_string": b"",
            "headers": [],
            "client": ("127.0.0.1", 1234),
            "server": ("testserver", 80),
        }
    )
    request.state.session = _FakeSession()
    return request


def test_tenant_admin_view_guards_default_tenant_changes():
    default_tenant = db_tenant_model(
        id=ObjectId(),
        name="default",
        is_default=True,
        status=TenantStatus.ACTIVE,
        licenses=["free"],
    )
    engine = _AdminEngine(default_tenant=default_tenant, current_tenant=default_tenant)
    view = TenantAdminView(db_tenant_model, engine=engine)
    request = _request_with_session()

    try:
        asyncio.run(view.before_create(request, {"is_default": True}, None))
        assert False, "before_create should reject a second default tenant"
    except FormValidationError:
        pass

    try:
        asyncio.run(view.before_edit(request, {"is_default": False}, default_tenant))
        assert False, "before_edit should reject changing the default tenant flag"
    except FormValidationError:
        pass


def test_tenant_admin_view_delete_cleans_related_records_and_blocks_default(tmp_path):
    tenant = db_tenant_model(
        id=ObjectId(),
        name="tenant",
        is_default=False,
        status=TenantStatus.ACTIVE,
        licenses=["free"],
    )
    default_tenant = db_tenant_model(
        id=ObjectId(),
        name="default",
        is_default=True,
        status=TenantStatus.ACTIVE,
        licenses=["free"],
    )
    user = db_user_account(
        username="TenantUser1",
        password="1qaz!QAZ",
        email="tenant1@gmail.com",
        role=user_role.MEMBER,
        status=UserStatus.ACTIVE,
        tenant_uuid=str(tenant.id),
        licenses=[LicenseName.FREE],
    )
    now = datetime.now(timezone.utc)
    key = db_keys(
        auth_id=str(tenant.id),
        wrapped_key=Fernet.generate_key().decode(),
        created_at=now,
        updated_at=now,
    )
    alert = db_alert_model(tenant_id=str(tenant.id))
    image_dir = tmp_path / "tenant-images"
    image_dir.mkdir(parents=True, exist_ok=True)
    image_path = image_dir / f"{user.id}.enc"
    image_path.write_text("encrypted", encoding="utf-8")

    engine = _AdminEngine(users=[user], keys=[key], alerts=[alert])
    view = TenantAdminView(db_tenant_model, engine=engine)
    request = _request_with_session()
    view.find_by_pks = lambda _request, _pks: asyncio.sleep(0, result=[tenant])

    with _swap_attrs((CONSTANTS, "IMAGE_DIR", image_dir)):
        deleted_count = asyncio.run(view.delete(request, [str(tenant.id)]))

    assert deleted_count == 1
    assert image_path.exists() is False
    assert user in engine.deleted
    assert key in engine.deleted
    assert alert in engine.deleted

    default_engine = _AdminEngine()
    default_view = TenantAdminView(db_tenant_model, engine=default_engine)
    default_view.find_by_pks = lambda _request, _pks: asyncio.sleep(0, result=[default_tenant])
    try:
        asyncio.run(default_view.delete(request, [str(default_tenant.id)]))
        assert False, "delete should block default tenant removal"
    except ActionFailed:
        pass
