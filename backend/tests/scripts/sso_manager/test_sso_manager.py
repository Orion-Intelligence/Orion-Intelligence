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
