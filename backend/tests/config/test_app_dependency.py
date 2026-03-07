from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from configs.app_dependency import get_user_permissions, role_required, license_required
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.constants import constant


@pytest.fixture(autouse=True)
def fake_license_rules():
    constant.license_rules = {
        "free": {"modules": [], "cti_graph": False, "mapping": False, "scanning": False, "maintainer": False},
        "maintainer": {"modules": ["general", "breach", "social"], "cti_graph": True, "mapping": True, "scanning": True, "maintainer": True},
        "enterprise": {"modules": "all", "cti_graph": True, "mapping": True, "scanning": True, "maintainer": False},
    }


def test_get_user_permissions_aggregates_boolean_and_modules():
    user = SimpleNamespace(licenses=["free", "maintainer"])
    perms = get_user_permissions(user)

    assert perms["scanning"] is True
    assert perms["cti_graph"] is True
    assert perms["maintainer"] is True
    assert "general" in perms["modules"]


def test_get_user_permissions_all_modules():
    user = SimpleNamespace(licenses=["enterprise"])
    perms = get_user_permissions(user)

    assert perms["modules"] == "all"


def test_role_required_allows_matching_role():
    import asyncio
    check = role_required([user_role.ADMIN, user_role.MEMBER])
    role = asyncio.run(check(role=user_role.ADMIN))
    assert role == user_role.ADMIN


def test_role_required_blocks_non_matching_role():
    import asyncio
    check = role_required([user_role.ADMIN])

    with pytest.raises(HTTPException) as ex:
        asyncio.run(check(role=user_role.DEMO))

    assert ex.value.status_code == 403


def test_license_required_allows_module_access():
    import asyncio
    checker = license_required("module:general")
    user = SimpleNamespace(licenses=["maintainer"])

    ok = asyncio.run(checker(user=user, role=user_role.MEMBER))
    assert ok is True


def test_license_required_blocks_missing_module():
    import asyncio
    checker = license_required("module:exploit")
    user = SimpleNamespace(licenses=["free"])

    with pytest.raises(HTTPException) as ex:
        asyncio.run(checker(user=user, role=user_role.MEMBER))

    assert ex.value.status_code == 403


def test_license_required_bypass_licenses():
    import asyncio
    checker = license_required("scanning", bypass_licenses=["maintainer"])
    user = SimpleNamespace(licenses=["maintainer"])

    ok = asyncio.run(checker(user=user, role=user_role.MEMBER))
    assert ok is True
