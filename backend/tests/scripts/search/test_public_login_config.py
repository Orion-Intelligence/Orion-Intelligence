from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from starlette.requests import Request

from routes import public_api_routes
from tests.scripts.search.helpers import _run


@pytest.mark.parametrize("is_default,is_primary,parent_id,expected", [
    (True, False, None, "0"),
    (False, True, None, "1"),
    (False, False, "primary-tenant", "1"),
    (False, False, None, "1"),
])
def test_public_login_content_follows_resolved_tenant(monkeypatch, is_default, is_primary, parent_id, expected):
    tenant = SimpleNamespace(id="tenant-id", is_default=is_default, is_primary=is_primary, parent_tenant_id=parent_id)
    request = Request({"type": "http", "headers": [], "state": {"tenant": tenant}})
    config = SimpleNamespace(settings={"app_name": "Custom branding", "language_allowed": "ar"})
    get_system_info = AsyncMock(return_value=config)
    signup_allowed = AsyncMock(return_value=True)
    monkeypatch.setattr(public_api_routes.config_controller, "getInstance", lambda: SimpleNamespace(get_system_info=get_system_info))
    monkeypatch.setattr(public_api_routes.TenantManager, "get_instance", lambda: SimpleNamespace(is_signup_allowed=signup_allowed))
    monkeypatch.setattr(public_api_routes.env_handler, "get_instance", lambda: SimpleNamespace(env=lambda key, default: default))

    result = _run(public_api_routes.get_public_config(request))

    assert result.settings["tenant_login"] == expected
    assert result.settings["app_name"] == "Custom branding"
    assert result.settings["language_allowed"] == "ar"
    assert result.settings["signup_enabled"] == "1"
    get_system_info.assert_awaited_once_with(include_email_config=False, tenant_id="tenant-id")
    signup_allowed.assert_awaited_once_with(tenant)
