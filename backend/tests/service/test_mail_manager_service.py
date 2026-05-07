from __future__ import annotations

import json
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from orion.services.mail_manager import mail_manager as mail_module
from orion.services.mail_manager.mail_manager import mail_manager


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
    manager = mail_manager.get_instance()
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
    monkeypatch.setattr(mail_module.asyncio, "to_thread", to_thread)
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
