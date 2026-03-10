from __future__ import annotations

import asyncio
from contextlib import contextmanager
from types import SimpleNamespace

import orion.api.interactive.tenant_manager.tenant_bootstrap as tenant_bootstrap_module
from bson import ObjectId
from odmantic.exceptions import DuplicateKeyError

from orion.api.interactive.tenant_manager.tenant_bootstrap import (
    create_default_tenant,
    create_default_users,
    tenant_boostrap,
)
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, user_role
from orion.services.mongo_manager.shared_model.db_tenant_model import TenantStatus, db_tenant_model


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


class _FakeEncryptor:
    def encrypt(self, data: bytes) -> bytes:
        return b"enc:" + data


class _BootstrapEngine:
    def __init__(self, existing_admin=None, duplicate_on_save_at: int | None = None):
        self.existing_admin = existing_admin
        self.duplicate_on_save_at = duplicate_on_save_at
        self.saved = []
        self.removed = []
        self.deleted = []

    async def find_one(self, model, *_args, **_kwargs):
        if model is db_user_account:
            return self.existing_admin
        return None

    async def save(self, doc):
        self.saved.append(doc)
        if self.duplicate_on_save_at is not None and len(self.saved) == self.duplicate_on_save_at:
            raise DuplicateKeyError("duplicate", Exception("duplicate"))
        return doc

    async def remove(self, model, query):
        self.removed.append((model, query))
        return 1

    async def delete(self, doc):
        self.deleted.append(doc)
        return 1


def test_tenant_bootstrap_creates_default_tenant_and_default_users():
    engine = _BootstrapEngine()

    async def _encrypt_tenant(data):
        return _FakeEncryptor()

    with _swap_attrs((tenant_bootstrap_module.TenantManager, "encrypt_tenant", staticmethod(_encrypt_tenant))):
        tenant = asyncio.run(create_default_tenant(engine))
        asyncio.run(create_default_users(engine, tenant.id))

    assert tenant.is_default is True
    assert tenant.status == TenantStatus.ACTIVE
    assert all(value.startswith("enc:") for value in tenant.licenses)
    assert len(engine.saved) == 3
    assert engine.saved[1].role == user_role.ADMIN
    assert engine.saved[2].role == user_role.CRAWLER


def test_tenant_bootstrap_skips_existing_admin_and_handles_duplicate_user_insert():
    existing_admin = SimpleNamespace(role=user_role.ADMIN)
    skip_engine = _BootstrapEngine(existing_admin=existing_admin)
    asyncio.run(create_default_users(skip_engine, ObjectId()))
    assert skip_engine.saved == []

    duplicate_engine = _BootstrapEngine(duplicate_on_save_at=2)
    fake_log = SimpleNamespace(g=lambda: SimpleNamespace(ex=lambda *_args, **_kwargs: None))
    with _swap_attrs((tenant_bootstrap_module, "log", fake_log)):
        asyncio.run(create_default_users(duplicate_engine, ObjectId()))
    assert len(duplicate_engine.saved) == 2


def test_tenant_bootstrap_rolls_back_when_user_creation_fails():
    created_tenant = db_tenant_model(
        id=ObjectId(),
        name="enc-default",
        is_default=True,
        status=TenantStatus.ACTIVE,
        licenses=["enc:maintainer", "enc:enterprise"],
        verified=True,
        subscription=True,
        user_quota=-1,
        iocs=[],
    )
    engine = _BootstrapEngine()

    async def _create_default_tenant(_engine):
        return created_tenant

    async def _create_default_users(_engine, _tenant_id):
        raise RuntimeError("user insert failed")

    with _swap_attrs(
        (tenant_bootstrap_module, "create_default_tenant", _create_default_tenant),
        (tenant_bootstrap_module, "create_default_users", _create_default_users),
    ):
        try:
            asyncio.run(tenant_boostrap(engine))
            assert False, "tenant_boostrap should raise"
        except RuntimeError:
            pass

    assert engine.removed
    assert engine.deleted == [created_tenant]
