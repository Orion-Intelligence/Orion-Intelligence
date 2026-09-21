import pytest

from orion.constants.constant import CONSTANTS


@pytest.fixture(autouse=True)
def _no_quiesce_delay(monkeypatch):
    monkeypatch.setattr(CONSTANTS, "RESTORE_QUIESCE_DRAIN_SECONDS", 0)
