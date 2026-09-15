import pytest

from orion.api.interactive.backup_manager.maintenance_state import maintenance_state
from orion.constants.constant import CONSTANTS


@pytest.fixture
def flag(tmp_path, monkeypatch):
    path = tmp_path / ".maintenance"
    monkeypatch.setattr(CONSTANTS, "MAINTENANCE_FLAG", path)
    maintenance_state.get_instance().invalidate()
    yield path
    maintenance_state.get_instance().invalidate()
