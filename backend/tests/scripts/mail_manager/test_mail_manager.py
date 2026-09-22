from __future__ import annotations

import asyncio
import json
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from orion.services.mail_manager.mail_manager import mail_manager
import orion.services.mail_manager.mail_manager as mm_module
from tests.scripts.mail_manager.fakes import (
    FailingSMTP,
    FakeConfigController,
    FakeSMTP,
    FakeUrlResponse,
    config_without_get,
)
from tests.scripts.mail_manager.helpers import (
    VALID_CONFIG,
    _run,
    get_manager,
    patch_config,
    patch_env,
    patch_inline_to_thread,
)


import base64

_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgAB4iG8MwAAAABJRU5ErkJggg=="
)
_PNG_BYTES = base64.b64decode(_PNG_B64)


def test_process_app_variables_replaces_token(monkeypatch):
    manager = get_manager()
    patch_config(monkeypatch, FakeConfigController(app_name="Acme"))
    subject, body = _run(manager.process_app_variables("Welcome to appname", "Hello from appname"))
    assert subject == "Welcome to Acme"
    assert body == "Hello from Acme"


def test_global_mail_config_with_get_method(monkeypatch):
    patch_config(monkeypatch, FakeConfigController(meta_info=json.dumps(VALID_CONFIG)))
    assert mail_manager._global_mail_config()["ACCOUNTS_MAIL"] == "accounts@example.com"


def test_global_mail_config_without_get_uses_config(monkeypatch):
    patch_config(monkeypatch, config_without_get(json.dumps(VALID_CONFIG)))
    assert mail_manager._global_mail_config()["ACCOUNTS_SMTP_PORT"] == "1025"


def test_global_mail_config_invalid_json_returns_empty(monkeypatch):
    patch_config(monkeypatch, FakeConfigController(meta_info="not-json{"))
    assert mail_manager._global_mail_config() == {}


def test_normalize_mail_config_success():
    result = mail_manager._normalize_mail_config(dict(VALID_CONFIG))
    assert result == ("accounts@example.com", "secret", "mailpit", 1025)


def test_normalize_mail_config_missing_field_raises():
    with pytest.raises(HTTPException) as exc:
        mail_manager._normalize_mail_config({"ACCOUNTS_MAIL": "a@b.com"})
    assert exc.value.status_code == 400


def test_normalize_mail_config_bad_port_raises():
    bad = dict(VALID_CONFIG)
    bad["ACCOUNTS_SMTP_PORT"] = "abc"
    with pytest.raises(HTTPException):
        mail_manager._normalize_mail_config(bad)


def test_tenant_system_mail_config_no_tenant():
    assert _run(get_manager()._tenant_system_mail_config(None)) is None


def test_tenant_system_mail_config_success(monkeypatch):
    patch_config(monkeypatch, FakeConfigController(meta_info=json.dumps(VALID_CONFIG)))
    result = _run(get_manager()._tenant_system_mail_config("tenant-1"))
    assert result["ACCOUNTS_MAIL"] == "accounts@example.com"


def test_tenant_system_mail_config_exception(monkeypatch):
    patch_config(monkeypatch, FakeConfigController(raise_load=True))
    assert _run(get_manager()._tenant_system_mail_config("tenant-1")) is None


def test_selected_mail_config_prefers_tenant(monkeypatch):
    manager = get_manager()

    async def tenant_config(tenant_id):
        return {"source": "tenant"}

    monkeypatch.setattr(manager, "_tenant_system_mail_config", tenant_config)
    assert _run(manager._selected_mail_config("tenant-1")) == {"source": "tenant"}


def test_selected_mail_config_falls_back_to_global(monkeypatch):
    manager = get_manager()

    async def tenant_config(tenant_id):
        return None

    monkeypatch.setattr(manager, "_tenant_system_mail_config", tenant_config)
    monkeypatch.setattr(mail_manager, "_global_mail_config", staticmethod(lambda: {"source": "global"}))
    assert _run(manager._selected_mail_config("tenant-1")) == {"source": "global"}


def test_prepare_verification_message_builds_msg(monkeypatch):
    manager = get_manager()
    patch_config(monkeypatch, FakeConfigController(app_name="Acme"))
    sender, password, server, port, msg = _run(
        manager._prepare_verification_message("to@example.com", "Subject", "<p>Body</p>", config=dict(VALID_CONFIG))
    )
    assert sender == "accounts@example.com"
    assert msg["To"] == "to@example.com"
    assert msg["Subject"] == "Subject"


def test_send_takedown_mail_inline_attachments(monkeypatch):
    manager = get_manager()
    patch_config(monkeypatch, FakeConfigController(app_name="Acme"))
    patch_env(monkeypatch, {"PRODUCTION": "0"})
    patch_inline_to_thread(monkeypatch)
    sent = {}

    def send_sync_email(sender_email, password, to, msg, smtp_server, smtp_port):
        sent["msg"] = msg

    monkeypatch.setattr(mail_manager, "_send_sync_email", staticmethod(send_sync_email))
    _run(
        manager.send_takedown_mail(
            to_email="victim@example.com",
            target_domain="evil.com",
            screenshot_filename="shot.png",
            html_filename="page.html",
            config=dict(VALID_CONFIG),
            screenshot_base64="data:image/png;base64," + _PNG_B64,
            html_content="<html>x</html>",
            custom_message="Please act",
        )
    )
    payload = sent["msg"].as_string()
    assert payload.count("evil.com") >= 1


def test_send_takedown_mail_fetches_via_urllib(monkeypatch):
    manager = get_manager()
    patch_config(monkeypatch, FakeConfigController(app_name="Acme"))
    patch_env(monkeypatch, {"PRODUCTION": "0", "TRUSTED_MICROS_API_BASE": "http://micros:8010"})
    patch_inline_to_thread(monkeypatch)
    monkeypatch.setattr(
        mm_module.urllib.request,
        "urlopen",
        lambda req, timeout=None: FakeUrlResponse(_PNG_BYTES),
    )
    sent = {}
    monkeypatch.setattr(mail_manager, "_send_sync_email", staticmethod(lambda *a: sent.setdefault("done", True)))
    _run(
        manager.send_takedown_mail(
            to_email="victim@example.com",
            target_domain="evil.com",
            screenshot_filename="shot.png",
            html_filename="page.html",
            config=dict(VALID_CONFIG),
        )
    )
    assert sent["done"] is True


def test_send_verification_mail_list(monkeypatch):
    manager = get_manager()
    patch_config(monkeypatch, FakeConfigController(meta_info=json.dumps(VALID_CONFIG)))
    patch_inline_to_thread(monkeypatch)
    captured = {}

    def send_list(sender_email, password, to_list, msg, smtp_server, smtp_port):
        captured["to_list"] = to_list

    monkeypatch.setattr(mail_manager, "_send_sync_email_list", staticmethod(send_list))
    _run(manager.send_verification_mail_list(["a@x.com", "b@x.com"], "Subj", "<p>Body</p>"))
    assert captured["to_list"] == ["a@x.com", "b@x.com"]


def test_send_test_mail_missing_recipient_raises(monkeypatch):
    manager = get_manager()
    with pytest.raises(HTTPException) as exc:
        _run(manager.send_test_mail(config={"ACCOUNTS_MAIL": ""}))
    assert exc.value.status_code == 400


def test_send_test_mail_wraps_smtp_error(monkeypatch):
    manager = get_manager()

    async def failing_send(*args, **kwargs):
        error = RuntimeError("boom")
        error.smtp_code = 535
        error.smtp_error = b"auth denied"
        raise error

    monkeypatch.setattr(manager, "send_verification_mail", failing_send)
    with pytest.raises(HTTPException) as exc:
        _run(manager.send_test_mail(config=dict(VALID_CONFIG)))
    assert exc.value.status_code == 424
    assert "535" in exc.value.detail


def test_send_sync_email_production(monkeypatch):
    FakeSMTP.instances.clear()
    patch_env(monkeypatch, {"PRODUCTION": "1"})
    monkeypatch.setattr(mm_module.smtplib, "SMTP_SSL", FakeSMTP)
    msg = mm_module.MIMEText("body")
    mail_manager._send_sync_email("s@x.com", "pass", "to@x.com", msg, "mailpit", 1025)
    server = FakeSMTP.instances[-1]
    assert server.logins == [("s@x.com", "pass")]
    assert server.sent


def test_send_sync_email_list_non_production(monkeypatch):
    FakeSMTP.instances.clear()
    patch_env(monkeypatch, {"PRODUCTION": "0"})
    monkeypatch.setattr(mm_module.smtplib, "SMTP", FakeSMTP)
    msg = mm_module.MIMEText("body")
    mail_manager._send_sync_email_list("s@x.com", "pass", ["a@x.com"], msg, "mailpit", 1025)
    server = FakeSMTP.instances[-1]
    assert server.sent[0][1] == ["a@x.com", "s@x.com"]


def test_validate_mail_configuration_tenant(monkeypatch):
    manager = get_manager()

    async def tenant_config(tenant_id):
        return dict(VALID_CONFIG)

    monkeypatch.setattr(manager, "_tenant_system_mail_config", tenant_config)
    patch_inline_to_thread(monkeypatch)
    patch_env(monkeypatch, {"PRODUCTION": "0"})
    monkeypatch.setattr(mm_module.smtplib, "SMTP", FakeSMTP)
    _run(manager.validate_mail_configuration("tenant-1"))


def test_validate_mail_configuration_global_fallback(monkeypatch):
    manager = get_manager()

    async def tenant_config(tenant_id):
        return None

    monkeypatch.setattr(manager, "_tenant_system_mail_config", tenant_config)
    patch_inline_to_thread(monkeypatch)
    patch_env(monkeypatch, {"PRODUCTION": "0"})
    monkeypatch.setattr(mail_manager, "_global_mail_config", staticmethod(lambda: dict(VALID_CONFIG)))
    monkeypatch.setattr(mm_module.smtplib, "SMTP", FakeSMTP)
    _run(manager.validate_mail_configuration())


def test_validate_connection_sync_production_login(monkeypatch):
    FakeSMTP.instances.clear()
    patch_env(monkeypatch, {"PRODUCTION": "1"})
    monkeypatch.setattr(mm_module.smtplib, "SMTP_SSL", FakeSMTP)
    assert mail_manager._validate_connection_sync("s@x.com", "pass", "mailpit", 465) is True
    assert FakeSMTP.instances[-1].logins


def test_validate_connection_sync_non_production_noop(monkeypatch):
    FakeSMTP.instances.clear()
    patch_env(monkeypatch, {"PRODUCTION": "0"})
    monkeypatch.setattr(mm_module.smtplib, "SMTP", FakeSMTP)
    assert mail_manager._validate_connection_sync("s@x.com", "pass", "mailpit", 1025) is True
    assert FakeSMTP.instances[-1].noops == 1


def test_validate_connection_sync_failure_raises(monkeypatch):
    patch_env(monkeypatch, {"PRODUCTION": "0"})
    monkeypatch.setattr(mm_module.smtplib, "SMTP", FailingSMTP)
    with pytest.raises(HTTPException) as exc:
        mail_manager._validate_connection_sync("s@x.com", "pass", "mailpit", 1025)
    assert exc.value.status_code == 400


def test_validate_mail_configuration_rejects_invalid_smtp_settings(monkeypatch):
    monkeypatch.setattr(
        "orion.api.server.config_manager.config_controller.config_controller.getInstance",
        staticmethod(
            lambda: SimpleNamespace(
                _config={
                    "meta_info": json.dumps(
                        {
                            "ACCOUNTS_MAIL": "accounts@example.com",
                            "ACCOUNTS_MAIL_PASSWORD": "1#VSC&cuad)d",
                            "ACCOUNTS_SMTP_SERVER": "mailpit",
                            "ACCOUNTS_SMTP_PORT": "bad-port",
                        }
                    )
                }
            )
        ),
    )

    with pytest.raises(HTTPException) as exc:
        mail_manager._validate_mail_configuration_sync()

    assert exc.value.status_code == 400
    assert exc.value.detail == "SMTP configuration is incomplete"


@pytest.mark.anyio
async def test_send_verification_mail_uses_saved_smtp_settings(monkeypatch):
    manager: mail_manager = mail_manager.get_instance()
    sent = {}

    monkeypatch.setattr(
        "orion.api.server.config_manager.config_controller.config_controller.getInstance",
        staticmethod(
            lambda: SimpleNamespace(
                _config={
                    "meta_info": json.dumps(
                        {
                            "ACCOUNTS_MAIL": "accounts@example.com",
                            "ACCOUNTS_MAIL_PASSWORD": "1#VSC&cuad)d",
                            "ACCOUNTS_SMTP_SERVER": "mailpit",
                            "ACCOUNTS_SMTP_PORT": "1025",
                        }
                    )
                }
            )
        ),
    )

    async def process_app_variables(subject: str, body: str):
        return subject, body

    async def to_thread(func, *args, **kwargs):
        return func(*args, **kwargs)

    def send_sync_email(sender_email, password, to, msg, smtp_server, smtp_port):
        sent.update(
            {
                "sender_email": sender_email,
                "password": password,
                "to": to,
                "subject": msg["Subject"],
                "smtp_server": smtp_server,
                "smtp_port": smtp_port,
            }
        )

    monkeypatch.setattr(manager, "process_app_variables", process_app_variables)
    monkeypatch.setattr(asyncio, "to_thread", to_thread)
    monkeypatch.setattr(mail_manager, "_send_sync_email", staticmethod(send_sync_email))

    await manager.send_verification_mail("user@example.com", "Subject", "<p>Hello</p>")

    assert sent == {
        "sender_email": "accounts@example.com",
        "password": "1#VSC&cuad)d",
        "to": "user@example.com",
        "subject": "Subject",
        "smtp_server": "mailpit",
        "smtp_port": 1025,
    }


@pytest.mark.anyio
async def test_send_test_mail_verifies_configuration(monkeypatch):
    manager: mail_manager = mail_manager.get_instance()
    sent = {}

    async def process_app_variables(subject: str, body: str):
        return subject, body

    async def to_thread(func, *args, **kwargs):
        return func(*args, **kwargs)

    def send_sync_email(sender_email, password, to, msg, smtp_server, smtp_port):
        sent.update(
            {
                "sender_email": sender_email,
                "password": password,
                "to": to,
                "subject": msg["Subject"],
                "smtp_server": smtp_server,
                "smtp_port": smtp_port,
            }
        )

    monkeypatch.setattr(manager, "process_app_variables", process_app_variables)
    monkeypatch.setattr(asyncio, "to_thread", to_thread)
    monkeypatch.setattr(mail_manager, "_send_sync_email", staticmethod(send_sync_email))

    await manager.send_test_mail(
        config={
            "ACCOUNTS_MAIL": "accounts@example.com",
            "ACCOUNTS_MAIL_PASSWORD": "1#VSC&cuad)d",
            "ACCOUNTS_SMTP_SERVER": "mailpit",
            "ACCOUNTS_SMTP_PORT": "1025",
        }
    )

    assert sent == {
        "sender_email": "accounts@example.com",
        "password": "1#VSC&cuad)d",
        "to": "accounts@example.com",
        "subject": "SMTP configuration test",
        "smtp_server": "mailpit",
        "smtp_port": 1025,
    }


@pytest.mark.anyio
async def test_send_test_mail_falls_back_to_global_smtp_when_tenant_smtp_missing(monkeypatch):
    manager: mail_manager = mail_manager.get_instance()
    sent = {}

    async def tenant_system_mail_config(tenant_id: str | None):
        assert tenant_id == "tenant-without-smtp"
        return None

    async def process_app_variables(subject: str, body: str):
        return subject, body

    async def to_thread(func, *args, **kwargs):
        return func(*args, **kwargs)

    def send_sync_email(sender_email, password, to, msg, smtp_server, smtp_port):
        sent.update(
            {
                "sender_email": sender_email,
                "password": password,
                "to": to,
                "subject": msg["Subject"],
                "smtp_server": smtp_server,
                "smtp_port": smtp_port,
            }
        )

    monkeypatch.setattr(manager, "_tenant_system_mail_config", tenant_system_mail_config)
    monkeypatch.setattr(
        mail_manager,
        "_global_mail_config",
        staticmethod(
            lambda: {
                "ACCOUNTS_MAIL": "global@example.com",
                "ACCOUNTS_MAIL_PASSWORD": "global-pass",
                "ACCOUNTS_SMTP_SERVER": "mailpit",
                "ACCOUNTS_SMTP_PORT": "1025",
            }
        ),
    )
    monkeypatch.setattr(manager, "process_app_variables", process_app_variables)
    monkeypatch.setattr(asyncio, "to_thread", to_thread)
    monkeypatch.setattr(mail_manager, "_send_sync_email", staticmethod(send_sync_email))

    await manager.send_test_mail(tenant_id="tenant-without-smtp")

    assert sent == {
        "sender_email": "global@example.com",
        "password": "global-pass",
        "to": "global@example.com",
        "subject": "SMTP configuration test",
        "smtp_server": "mailpit",
        "smtp_port": 1025,
    }
