import pytest

from orion.constants.constant import CONSTANTS


@pytest.fixture(autouse=True)
def _isolated_restore_side_effects(monkeypatch, tmp_path):
    monkeypatch.setattr(CONSTANTS, "RESTORE_QUIESCE_DRAIN_SECONDS", 0)
    monkeypatch.setattr(CONSTANTS, "TENANT_FENCE_FILE", tmp_path / ".fenced_tenants")
