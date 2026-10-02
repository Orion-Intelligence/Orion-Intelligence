import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from orion.api.server.sso_manager.constants.sso_constants import SSO_CONSTANTS
from orion.api.server.sso_manager.model.sso_model import SSOMailPassphraseRequest
from orion.api.server.sso_manager.sso_manager import sso_manager
from orion.constants.constant import CONSTANTS

CLIENT_SECRET = "s" * 40
SESSION_TOKEN = "t" * 40
VERIFIER = "A" * 43 + "="


def make_manager(monkeypatch, user):
    monkeypatch.setattr(SSO_CONSTANTS, "S_CLIENT_CREDENTIAL", CLIENT_SECRET)
    manager = object.__new__(sso_manager)
    manager._engine = SimpleNamespace(save=AsyncMock())
    manager._session_record = AsyncMock(return_value={"user_id": "1", "session_id": "1"})
    manager._active_user = AsyncMock(return_value=user)
    return manager


def make_request(secret=CLIENT_SECRET):
    return SimpleNamespace(headers={SSO_CONSTANTS.S_CLIENT_AUTH_HEADER: secret})


def test_set_mail_passphrase_stores_only_a_hash(monkeypatch):
    user = SimpleNamespace(mail_passphrase=None)
    manager = make_manager(monkeypatch, user)

    result = asyncio.run(manager.set_mail_passphrase(make_request(), SSOMailPassphraseRequest(session_token=SESSION_TOKEN, verifier=VERIFIER)))

    assert result == {"mail_passphrase_set": True}
    assert user.mail_passphrase != VERIFIER
    assert CONSTANTS.S_AUTH_PWD_CONTEXT.verify(VERIFIER, user.mail_passphrase)
    manager._engine.save.assert_awaited_once_with(user)


def test_set_mail_passphrase_clears_the_value(monkeypatch):
    user = SimpleNamespace(mail_passphrase="$2b$old")
    manager = make_manager(monkeypatch, user)

    result = asyncio.run(manager.set_mail_passphrase(make_request(), SSOMailPassphraseRequest(session_token=SESSION_TOKEN)))

    assert result == {"mail_passphrase_set": False}
    assert user.mail_passphrase is None


def test_set_mail_passphrase_requires_the_mail_client_secret(monkeypatch):
    user = SimpleNamespace(mail_passphrase=None)
    manager = make_manager(monkeypatch, user)

    with pytest.raises(HTTPException) as error:
        asyncio.run(manager.set_mail_passphrase(make_request("wrong"), SSOMailPassphraseRequest(session_token=SESSION_TOKEN, verifier=VERIFIER)))

    assert error.value.status_code == 401
    manager._engine.save.assert_not_awaited()


def test_set_mail_passphrase_requires_an_active_session(monkeypatch):
    manager = make_manager(monkeypatch, None)

    with pytest.raises(HTTPException) as error:
        asyncio.run(manager.set_mail_passphrase(make_request(), SSOMailPassphraseRequest(session_token=SESSION_TOKEN, verifier=VERIFIER)))

    assert error.value.status_code == 401
    manager._engine.save.assert_not_awaited()


def test_request_rejects_a_raw_passphrase():
    with pytest.raises(ValueError):
        SSOMailPassphraseRequest(session_token=SESSION_TOKEN, verifier="my plain passphrase")


def test_authorize_tenant_report_allows_admin(monkeypatch):
    from bson import ObjectId
    from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, db_user_account, user_role
    from orion.services.session_manager.session_manager import session_manager

    target_tenant_id = str(ObjectId())
    admin_user = db_user_account(
        username="adminuser1",
        password="Password123!",
        role=user_role.ADMIN,
        email="admin@orion.com",
        tenant_id=target_tenant_id,
        current_session_id="s123",
        licenses=[LicenseName.FREE],
    )

    fake_tenant = SimpleNamespace(
        id=ObjectId(target_tenant_id),
        slug="target-corp",
        report_mailbox_address="target-corp_report@mail.orionintelligence.org",
    )

    manager = object.__new__(sso_manager)
    manager._engine = SimpleNamespace(find_one=AsyncMock(return_value=fake_tenant))
    manager._redis = SimpleNamespace(invoke_trigger=AsyncMock())
    manager._trusted_redirect_uri = AsyncMock(return_value="http://localhost:4300/api/auth/callback")

    monkeypatch.setattr(session_manager.get_instance(), "get_current_user", AsyncMock(return_value=admin_user))

    fake_request = SimpleNamespace(
        state=SimpleNamespace(tenant=None),
        url=SimpleNamespace(path="/api/sso/mail/authorize"),
        cookies={"access_token": "token123"},
        headers={},
    )

    res = asyncio.run(manager.authorize(
        fake_request,
        redirect_uri="http://localhost:4300/api/auth/callback",
        state="a" * 32,
        tenant_id=target_tenant_id,
    ))
    assert res.status_code == 302
    assert "code=" in res.headers["location"]


def test_authorize_tenant_report_rejects_admin_of_other_tenant(monkeypatch):
    from bson import ObjectId
    from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, db_user_account, user_role
    from orion.services.session_manager.session_manager import session_manager

    target_tenant_id = str(ObjectId())
    other_tenant_id = str(ObjectId())
    admin_user = db_user_account(
        username="adminuser1",
        password="Password123!",
        role=user_role.ADMIN,
        email="admin@orion.com",
        tenant_id=other_tenant_id,
        current_session_id="s123",
        licenses=[LicenseName.FREE],
    )

    fake_tenant = SimpleNamespace(
        id=ObjectId(target_tenant_id),
        slug="target-corp",
        report_mailbox_address="target-corp_report@mail.orionintelligence.org",
    )

    manager = object.__new__(sso_manager)
    manager._engine = SimpleNamespace(find_one=AsyncMock(return_value=fake_tenant))
    manager._redis = SimpleNamespace(invoke_trigger=AsyncMock())

    monkeypatch.setattr(session_manager.get_instance(), "get_current_user", AsyncMock(return_value=admin_user))

    fake_request = SimpleNamespace(
        state=SimpleNamespace(tenant=None),
        url=SimpleNamespace(path="/api/sso/mail/authorize"),
        cookies={"access_token": "token123"},
        headers={},
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(manager.authorize(
            fake_request,
            redirect_uri="http://localhost:4300/api/auth/callback",
            state="a" * 32,
            tenant_id=target_tenant_id,
        ))
    assert exc.value.status_code == 403


def test_authorize_tenant_report_allows_maintainer_of_same_tenant(monkeypatch):
    from bson import ObjectId
    from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, LicenseName, user_role
    from orion.services.session_manager.session_manager import session_manager

    target_tenant_id = str(ObjectId())
    maintainer_user = db_user_account(
        username="maintainer1",
        password="Password123!",
        role=user_role.MEMBER,
        licenses=[LicenseName.MAINTAINER],
        tenant_id=target_tenant_id,
        current_session_id="s123",
        email="m@target.com",
    )

    fake_tenant = SimpleNamespace(
        id=ObjectId(target_tenant_id),
        slug="target-corp",
        report_mailbox_address="target-corp_report@mail.orionintelligence.org",
    )

    manager = object.__new__(sso_manager)
    manager._engine = SimpleNamespace(find_one=AsyncMock(return_value=fake_tenant))
    manager._redis = SimpleNamespace(invoke_trigger=AsyncMock())
    manager._trusted_redirect_uri = AsyncMock(return_value="http://localhost:4300/api/auth/callback")

    monkeypatch.setattr(session_manager.get_instance(), "get_current_user", AsyncMock(return_value=maintainer_user))

    fake_request = SimpleNamespace(
        state=SimpleNamespace(tenant=None),
        url=SimpleNamespace(path="/api/sso/mail/authorize"),
        cookies={"access_token": "token123"},
        headers={},
    )

    res = asyncio.run(manager.authorize(
        fake_request,
        redirect_uri="http://localhost:4300/api/auth/callback",
        state="a" * 32,
        tenant_id=target_tenant_id,
    ))
    assert res.status_code == 302
    assert "code=" in res.headers["location"]


def test_authorize_tenant_report_rejects_maintainer_of_other_tenant(monkeypatch):
    from bson import ObjectId
    from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, LicenseName, user_role
    from orion.services.session_manager.session_manager import session_manager

    target_tenant_id = str(ObjectId())
    other_tenant_id = str(ObjectId())
    maintainer_user = db_user_account(
        username="maintainer1",
        password="Password123!",
        role=user_role.MEMBER,
        licenses=[LicenseName.MAINTAINER],
        tenant_id=other_tenant_id,
        current_session_id="s123",
        email="m@other.com",
    )

    fake_tenant = SimpleNamespace(
        id=ObjectId(target_tenant_id),
        slug="target-corp",
        report_mailbox_address="target-corp_report@mail.orionintelligence.org",
    )

    manager = object.__new__(sso_manager)
    manager._engine = SimpleNamespace(find_one=AsyncMock(return_value=fake_tenant))
    manager._redis = SimpleNamespace(invoke_trigger=AsyncMock())

    monkeypatch.setattr(session_manager.get_instance(), "get_current_user", AsyncMock(return_value=maintainer_user))

    fake_request = SimpleNamespace(
        state=SimpleNamespace(tenant=None),
        url=SimpleNamespace(path="/api/sso/mail/authorize"),
        cookies={"access_token": "token123"},
        headers={},
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(manager.authorize(
            fake_request,
            redirect_uri="http://localhost:4300/api/auth/callback",
            state="a" * 32,
            tenant_id=target_tenant_id,
        ))
    assert exc.value.status_code == 403


def test_authorize_tenant_report_rejects_normal_user(monkeypatch):
    from bson import ObjectId
    from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, db_user_account, user_role
    from orion.services.session_manager.session_manager import session_manager

    target_tenant_id = str(ObjectId())
    normal_user = db_user_account(
        username="memberuser1",
        password="Password123!",
        role=user_role.MEMBER,
        licenses=[LicenseName.FREE],
        tenant_id=target_tenant_id,
        current_session_id="s123",
        email="member@target.com",
    )

    fake_tenant = SimpleNamespace(
        id=ObjectId(target_tenant_id),
        slug="target-corp",
        report_mailbox_address="target-corp_report@mail.orionintelligence.org",
    )

    manager = object.__new__(sso_manager)
    manager._engine = SimpleNamespace(find_one=AsyncMock(return_value=fake_tenant))
    manager._redis = SimpleNamespace(invoke_trigger=AsyncMock())

    monkeypatch.setattr(session_manager.get_instance(), "get_current_user", AsyncMock(return_value=normal_user))

    fake_request = SimpleNamespace(
        state=SimpleNamespace(tenant=None),
        url=SimpleNamespace(path="/api/sso/mail/authorize"),
        cookies={"access_token": "token123"},
        headers={},
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(manager.authorize(
            fake_request,
            redirect_uri="http://localhost:4300/api/auth/callback",
            state="a" * 32,
            tenant_id=target_tenant_id,
        ))
    assert exc.value.status_code == 403
