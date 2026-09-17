from __future__ import annotations

import io
from types import SimpleNamespace


class FakeSMTP:
    instances: list = []

    def __init__(self, server, port, context=None, timeout=None):
        self.server = server
        self.port = port
        self.context = context
        self.timeout = timeout
        self.logins = []
        self.sent = []
        self.noops = 0
        FakeSMTP.instances.append(self)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def login(self, sender_email, password):
        self.logins.append((sender_email, password))

    def sendmail(self, sender_email, recipients, message):
        self.sent.append((sender_email, recipients, message))

    def noop(self):
        self.noops += 1


class FailingSMTP(FakeSMTP):
    def login(self, sender_email, password):
        raise RuntimeError("auth failed")

    def noop(self):
        raise RuntimeError("connection failed")


class FakeConfigController:
    def __init__(self, meta_info=None, app_name="Orion Intelligence", has_get=True, raise_load=False):
        self._meta_info = meta_info
        self._app_name = app_name
        self._has_get = has_get
        self._raise_load = raise_load
        self._config = {"meta_info": meta_info} if meta_info is not None else {}
        self.loaded = []

    async def get_cached(self, key, default, tenant_id=None):
        return self._app_name

    def get(self, key, default=None, tenant_id=None):
        if not self._has_get:
            raise AttributeError("get")
        if key == "meta_info":
            return self._meta_info if self._meta_info is not None else default
        return default

    async def load_config(self, tenant_id=None):
        self.loaded.append(tenant_id)
        if self._raise_load:
            raise RuntimeError("load failed")


def config_without_get(meta_info):
    return SimpleNamespace(_config={"meta_info": meta_info})


class FakeUrlResponse:
    def __init__(self, data):
        self._data = data

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return self._data


def make_env(values):
    return SimpleNamespace(env=lambda key, default=None: values.get(key, default))
