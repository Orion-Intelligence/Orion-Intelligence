"""Coverage map: checklist items 126-150 + admin route guards."""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from configs import app_dependency
from orion.constants import constant
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role
from routes.admin_routes import admin_routes
from routes.social_routes import social_routes
from routes.tenant_routes import tenant_routes


async def _status_ok():
    return UserStatus.ACTIVE


class _FakeTenantManager:
    async def get_tenant(self, *_):
        return {"id": "t1", "name": "Tenant"}

    async def update_tenant(self, *_):
        return {"message": "Tenant updated"}

    async def get_all_tenant(self):
        return []

    async def create_tenant_user(self, *_):
        return {"message": "User created successfully"}


class _FakeAccountManager:
    async def get_all_users(self, *_):
        return []

    async def update_user(self, *_):
        return {"message": "User updated"}

    async def update_current_user(self, *_):
        return {"message": "User updated successfully"}

    async def delete_user(self, *_):
        return {"message": "User deleted successfully"}

    async def get_node(self, *_):
        return {"user": {}, "tenant": {}, "alerts": []}


class _FakeAlertManager:
    def __init__(self, running=False):
        self.running = running

    async def add_custom_alert(self, *_):
        return {"message": "Created"}

    async def set_alert_seen(self, *_):
        return {"message": "Alerts updated successfully", "updated": 1}

    async def delete_alert(self, *_):
        return {"message": "Alert deleted successfully"}

    async def update_alert(self, *_):
        return {"message": "Alert updated successfully"}

    async def getAllAlerts(self, *_):
        return []

    async def get_scan_status(self, *_):
        return {"scan_running": self.running}

    async def set_scan_running(self, *_):
        return {"scan_running": False}

    async def delete_all_alerts(self, *_):
        return {"message": "All alerts deleted successfully"}

    async def delete_alerts_by_type(self, *_):
        return {"message": "Deleted 1 alerts of type 'x'"}


class _FakeResourceManager:
    async def deleteTenantImage(self, *_):
        return {"tenant_image": "deleted"}

    async def uploadTenantImage(self, *_):
        return {"image": "t1"}

    async def update_system_image(self, *_):
        return {"image": "logo.png"}

    async def delete_user_image(self, *_):
        return {"user_image": "deleted"}

    async def update_user_image(self, *_):
        return {"image": "u1"}

    async def delete_system_image(self, *_):
        return {"system_image": "deleted"}


class _FakeAuditManager:
    async def get(self, *_):
        return {"items": [], "page": 1}


class _FakeGraphsModel:
    async def social_search(self, *_):
        return {"ok": True, "social": True}

    async def upsert_data(self, *_):
        return {"ok": True, "upsert": True}

    async def get_tabs_summary(self, *_):
        return {"tabs": [], "total_tabs": 0, "max_tabs_allowed": 5}

    async def add_tab(self, *_):
        return {"tabs": [], "total_tabs": 1, "max_tabs_allowed": 5}


class _FakeSearchModel:
    async def social_search(self, *_):
        return {"ok": True}


class _FakeConfigController:
    async def update_public_config(self, *_):
        return {"settings": {"language": "en"}}

    async def uploadSystemResource(self, *_):
        return {"logo_url": "/api/s/static/system/logo_url_custom.png"}


def _build_client(monkeypatch, role: user_role, alert_running: bool = False):
    from orion.api.interactive.account_manager.account_manager import AccountManager
    from orion.api.interactive.alert_manager.alert_manager import AlertManager
    from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
    from orion.api.interactive.auth_manager.auth_manager import auth_manager
    from orion.api.interactive.graph_manager.graphs_model import graphs_model
    from orion.api.interactive.resource_manager.resource_manager import ResourceManager
    from orion.api.interactive.search_manager.search_model import search_model
    from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
    from orion.api.server.config_manager.config_controller import config_controller

    monkeypatch.setattr(TenantManager, "get_instance", staticmethod(lambda: _FakeTenantManager()))
    monkeypatch.setattr(AccountManager, "get_instance", staticmethod(lambda: _FakeAccountManager()))
    monkeypatch.setattr(AlertManager, "getInstance", staticmethod(lambda: _FakeAlertManager(running=alert_running)))
    monkeypatch.setattr(ResourceManager, "get_instance", staticmethod(lambda: _FakeResourceManager()))
    monkeypatch.setattr(AuditLogManager, "get_instance", staticmethod(lambda: _FakeAuditManager()))
    monkeypatch.setattr(graphs_model, "getInstance", staticmethod(lambda: _FakeGraphsModel()))
    monkeypatch.setattr(search_model, "getInstance", staticmethod(lambda: _FakeSearchModel()))
    monkeypatch.setattr(config_controller, "getInstance", staticmethod(lambda: _FakeConfigController()))
    monkeypatch.setattr(auth_manager, "edit_userStatus_and_sendMail_from_admin", staticmethod(lambda *_: None))

    constant.license_rules = {
        "maintainer": {
            "modules": "all",
            "cti_graph": True,
            "mapping": True,
            "scanning": True,
            "maintainer": True,
        }
    }

    async def _role_ok():
        return role

    async def _user_ok():
        return SimpleNamespace(
            id="u1",
            tenant_uuid="t1",
            role=role,
            licenses=["maintainer"],
            status=UserStatus.ACTIVE,
        )

    app = FastAPI()
    app.include_router(tenant_routes)
    app.include_router(social_routes)
    app.include_router(admin_routes)

    app.dependency_overrides[app_dependency.get_current_role] = _role_ok
    app.dependency_overrides[app_dependency.get_current_status] = _status_ok
    app.dependency_overrides[app_dependency.get_current_user] = _user_ok

    return TestClient(app)


@pytest.mark.parametrize(
    "method,path,body",
    [
        ("post", "/api/get/tenant", None),
        ("post", "/api/update/tenants", {"id": "t1", "name": "Tenant"}),
        ("post", "/api/users", None),
        ("post", "/api/update/user", {"username": "user1", "status": "active", "licenses": ["free"]}),
        ("post", "/api/update/current/user", {"username": "user1"}),
        ("delete", "/api/tenant/image", None),
        ("post", "/api/delete/user", {"username": "user1", "status": "active", "licenses": ["free"]}),
        (
            "post",
            "/api/tenant/create/user",
            {
                "username": "user00001",
                "email": "u2@example.com",
                "password": "Aa!123456",
                "role": "member",
                "status": "active",
                "licenses": ["free"],
                "subscription": False,
            },
        ),
        ("post", "/api/audit/logs", {"page": 1}),
        ("post", "/api/get/tenant/node", None),
        ("post", "/api/tenants/get", None),
        ("post", "/api/public/update", {"settings": {"language": "en"}}),
    ],
)
def test_admin_and_member_tenant_contracts(monkeypatch, method, path, body):
    role = user_role.ADMIN if path in {"/api/tenants/get", "/api/public/update"} else user_role.MEMBER
    client = _build_client(monkeypatch, role=role)

    if method == "get":
        resp = client.get(path, json=body)
    elif method == "delete":
        resp = client.delete(path, json=body)
    else:
        resp = client.post(path, json=body)

    assert resp.status_code == 200


def test_alert_and_scan_member_flows(monkeypatch):
    client = _build_client(monkeypatch, role=user_role.MEMBER)

    assert client.post("/api/alert/add", json={"type": "breach", "ioc_type": "email", "ioc_value": "a@b.com"}).status_code == 200
    assert client.post("/api/alert/seen", json=[{"data_hash": "x", "report_seen": True}]).status_code == 200
    assert client.post("/api/alert/delete", json="x").status_code == 200
    assert client.post("/api/alert/update", json={"data_hash": "x", "type": "breach", "ioc_type": "email", "ioc_value": "a@b.com"}).status_code == 200
    assert client.get("/api/profile/alerts").status_code == 200
    assert client.post("/api/profile/alert/scan").status_code == 202
    assert client.post("/api/profile/alert/scan/cancel").status_code == 200
    assert client.post("/api/profile/alerts/delete/all").status_code == 200
    assert client.post("/api/profile/alerts/delete/breach").status_code == 200
    assert client.post("/api/profile/alert/scan/status").status_code == 200


def test_alert_scan_prevents_duplicate_run(monkeypatch):
    client = _build_client(monkeypatch, role=user_role.MEMBER, alert_running=True)
    resp = client.post("/api/profile/alert/scan")
    assert resp.status_code == 202


def test_tenant_and_user_and_system_image_upload_delete_routes(monkeypatch):
    client = _build_client(monkeypatch, role=user_role.ADMIN)

    tenant_upload = client.put("/api/tenant/image", files={"file": ("tenant.png", b"img", "image/png")})
    assert tenant_upload.status_code == 200

    user_upload = client.put("/api/user/image", files={"file": ("user.png", b"img", "image/png")})
    assert user_upload.status_code == 200

    system_upload = client.put("/api/system/image", files={"file": ("logo.png", b"img", "image/png")})
    assert system_upload.status_code == 200

    user_delete = client.delete("/api/user/image")
    assert user_delete.status_code == 200


def test_member_cannot_access_admin_only_tenant_list(monkeypatch):
    client = _build_client(monkeypatch, role=user_role.MEMBER)
    resp = client.post("/api/tenants/get")
    assert resp.status_code == 403


@pytest.mark.parametrize(
    "path,body",
    [
        ("/api/social/recon", {"query": "alice"}),
        ("/api/social/phone/recon", {"query": "123"}),
        ("/api/social/profile", {"platform": "x", "username": "alice"}),
        ("/api/social/online/images", {"platform": "x", "username": "alice"}),
        ("/api/social/followers", {"platform": "x", "username": "alice", "max_followers": 10}),
        ("/api/social/following", {"platform": "x", "username": "alice", "max_following": 10}),
        ("/api/social/posts", {"platform": "x", "username": "alice"}),
        ("/api/social/entity", {"platform": "x", "username": "alice"}),
        ("/api/social/metadata", {"tokens": ["breach", "leak"], "username": "alice", "platform": "x"}),
        ("/api/social/session/upsert", {"tabs": []}),
        ("/api/social/session/tab/add", {"label": "tab-1"}),
    ],
)
def test_social_contracts(monkeypatch, path, body):
    client = _build_client(monkeypatch, role=user_role.ADMIN)
    resp = client.post(path, json=body)
    assert resp.status_code == 200


def test_social_session_tabs_summary(monkeypatch):
    client = _build_client(monkeypatch, role=user_role.ADMIN)
    resp = client.get("/api/social/session/tabs")
    assert resp.status_code == 200
    assert "tabs" in resp.json()


def test_social_endpoints_explicit_coverage(monkeypatch):
    client = _build_client(monkeypatch, role=user_role.ADMIN)
    assert client.post("/api/social/phone/recon", json={"query": "123"}).status_code == 200
    assert client.post("/api/social/profile", json={"platform": "x", "username": "alice"}).status_code == 200
    assert client.post("/api/social/online/images", json={"platform": "x", "username": "alice"}).status_code == 200
    assert client.post("/api/social/followers", json={"platform": "x", "username": "alice", "max_followers": 10}).status_code == 200
    assert client.post("/api/social/following", json={"platform": "x", "username": "alice", "max_following": 10}).status_code == 200
    assert client.post("/api/social/posts", json={"platform": "x", "username": "alice"}).status_code == 200
    assert client.post("/api/social/entity", json={"platform": "x", "username": "alice"}).status_code == 200
    assert client.post("/api/social/metadata", json={"tokens": ["breach"], "username": "alice", "platform": "x"}).status_code == 200


def test_social_recon_image_rejects_missing_image_base64(monkeypatch):
    client = _build_client(monkeypatch, role=user_role.ADMIN)
    resp = client.post("/api/social/recon/image", json={})
    assert resp.status_code == 200
    assert resp.json().get("message") == "image_base64_required"


def test_social_recon_image_accepts_valid_base64(monkeypatch):
    client = _build_client(monkeypatch, role=user_role.ADMIN)
    resp = client.post("/api/social/recon/image", json={"image_base64": "aGVsbG8="})
    assert resp.status_code == 200


def test_admin_row_action_delete_blocked(monkeypatch):
    client = _build_client(monkeypatch, role=user_role.ADMIN)
    resp = client.get("/admin/api/db_system_model/row-action", params={"name": "delete"})
    assert resp.status_code == 403
