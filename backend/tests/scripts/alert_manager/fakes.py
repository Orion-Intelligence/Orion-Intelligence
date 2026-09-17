from __future__ import annotations

from typing import Any


class FakeMailTemplate:
    def __init__(self, raises: bool = False):
        self.raises = raises
        self.render_calls: list[dict[str, Any]] = []

    def render(self, **kwargs):
        self.render_calls.append(kwargs)
        if self.raises:
            raise RuntimeError("render failed")
        return "<html>rendered</html>"


class FakeMailManager:
    def __init__(self, global_config: dict | None = None):
        self.sent: list[dict[str, Any]] = []
        self._global_config = global_config or {}

    def get_instance(self):
        return self

    async def send_verification_mail(self, to, subject, body, **kwargs):
        self.sent.append({"to": to, "subject": subject, "body": body, "kwargs": kwargs})
        return True

    def _global_mail_config(self):
        return self._global_config


class FakeWebhookManager:
    def __init__(self):
        self.sent: list[dict[str, Any]] = []

    def get_instance(self):
        return self

    async def send_alert(self, **kwargs):
        self.sent.append(kwargs)
        return True


class FakeAlertJob:
    def __init__(self):
        self.cancelled: list[str] = []

    def get_instance(self):
        return self

    async def cancel_tenant_scan(self, tenant_id):
        self.cancelled.append(tenant_id)
        return True
