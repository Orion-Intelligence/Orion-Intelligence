from __future__ import annotations

from types import SimpleNamespace

import pytest

from orion.helper_manager.env_handler import env_handler
from tests.model.fakes import FakeElastic


@pytest.fixture
def fake_elastic(monkeypatch):
    fake = FakeElastic()
    monkeypatch.setattr(
        "orion.services.elastic_manager.elastic_controller.elastic_controller.get_instance",
        staticmethod(lambda: fake),
    )
    monkeypatch.setattr(
        env_handler,
        "get_instance",
        staticmethod(lambda: SimpleNamespace(env=lambda key, default=None: "0" if key == "SEMANTIC_ENABLED" else default)),
    )
    return fake
