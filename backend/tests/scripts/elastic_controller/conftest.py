from types import SimpleNamespace

import pytest


@pytest.fixture(autouse=True)
def _patch_env(monkeypatch):
    env_map = {"PRODUCTION": "0", "TESTING_ENABLED": "1"}

    def _env(key, default=None):
        return env_map.get(key, default)

    monkeypatch.setattr(
        "orion.services.elastic_manager.elastic_controller.env_handler.get_instance",
        staticmethod(lambda: SimpleNamespace(env=_env)),
    )
    return env_map
