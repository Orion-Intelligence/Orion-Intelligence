from __future__ import annotations

import asyncio

import orion.services.mail_manager.mail_manager as mm_module
from orion.services.mail_manager.mail_manager import mail_manager
from tests.scripts.mail_manager.fakes import make_env


def _run(coro):
    return asyncio.run(coro)


def get_manager() -> mail_manager:
    return mail_manager.get_instance()


def patch_config(monkeypatch, controller):
    monkeypatch.setattr(
        "orion.api.server.config_manager.config_controller.config_controller.getInstance",
        staticmethod(lambda: controller),
    )


def patch_env(monkeypatch, values):
    monkeypatch.setattr(mm_module.env_handler, "get_instance", staticmethod(lambda: make_env(values)))


def patch_inline_to_thread(monkeypatch):
    async def to_thread(func, *args, **kwargs):
        return func(*args, **kwargs)

    monkeypatch.setattr(mm_module.asyncio, "to_thread", to_thread)


VALID_CONFIG = {
    "ACCOUNTS_MAIL": "accounts@example.com",
    "ACCOUNTS_MAIL_PASSWORD": "secret",
    "ACCOUNTS_SMTP_SERVER": "mailpit",
    "ACCOUNTS_SMTP_PORT": "1025",
}
