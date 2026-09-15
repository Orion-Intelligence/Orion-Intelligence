import pytest

from tests.model.fakes import FakeAuditManager


@pytest.fixture(autouse=True)
def _patch_audit(monkeypatch):
    audit = FakeAuditManager()
    monkeypatch.setattr(
        "orion.api.interactive.feeder_manager.feeder_manager.AuditLogManager.get_instance",
        staticmethod(lambda: audit),
    )
    monkeypatch.setattr(
        "orion.api.interactive.feeder_manager.feeder_helper.AuditLogManager.get_instance",
        staticmethod(lambda: audit),
    )
    return audit
