from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

from pymongo import MongoClient


BACKEND_ROOT = Path(__file__).resolve().parents[2]
INJECTIONS_DIR = Path(__file__).resolve().parent / "tenant_injections"


def _load_injection(name: str):
    return json.loads((INJECTIONS_DIR / name).read_text(encoding="utf-8"))


def _assert_response_body(response):
    assert response.content
    assert response.json() is not None


def _resolve_signup_user(email: str) -> dict:
    from orion.services.mongo_manager.mongo_enums import MONGO_CONNECTIONS

    with MongoClient(
        host=MONGO_CONNECTIONS.S_MONGO_DATABASE_IP,
        port=MONGO_CONNECTIONS.S_MONGO_DATABASE_PORT,
        username=MONGO_CONNECTIONS.S_MONGO_USERNAME,
        password=MONGO_CONNECTIONS.S_MONGO_PASSWORD,
    ) as client:
        user = client[MONGO_CONNECTIONS.S_MONGO_DATABASE_NAME]["db_user_account"].find_one({"email": email})
    assert user is not None, f"user not found for email {email}"
    return dict(user)

def _set_current_user(main_app_client, user: dict):
    from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, UserStatus

    licenses = []
    for license_name in user.get("licenses", []):
        try:
            licenses.append(LicenseName(license_name))
        except ValueError:
            licenses.append(license_name)

    status = user.get("status") or UserStatus.ACTIVE.value
    try:
        status = UserStatus(status)
    except ValueError:
        pass

    main_app_client.app.state.test_current_user = SimpleNamespace(
        id=str(user["_id"]),
        username=user["username"],
        email=user.get("email", ""),
        role=user.get("role", "member"),
        status=status,
        tenant_uuid=user["tenant_uuid"],
        licenses=licenses,
        subscription=user.get("subscription", False),
        preferences=user.get("preferences") or {},
        account_verify_at=user.get("account_verify_at"),
        twofa_enabled=user.get("twofa_enabled", False),
    )


def test_tenant_routes_real_journey(main_app_client):
    signup_payload = _load_injection("signup.json")
    resend_payload = _load_injection("signup.json")
    update_tenant_payload = _load_injection("update_tenant.json")
    create_user_payload = _load_injection("create_tenant_user.json")
    update_user_payload = _load_injection("update_user.json")
    update_current_user_payload = _load_injection("update_current_user.json")
    delete_user_payload = _load_injection("delete_user.json")
    audit_log_payload = _load_injection("audit_logs.json")

    signup_response = main_app_client.post("/api/signup", json=signup_payload)
    assert signup_response.status_code == 200, signup_response.text
    _assert_response_body(signup_response)

    resend_response = main_app_client.post("/api/signup/verificaion", json=resend_payload)
    assert resend_response.status_code == 200, resend_response.text
    _assert_response_body(resend_response)

    signup_user = _resolve_signup_user(signup_payload["email"])
    verification_token = signup_user["verification_token"]
    verify_response = main_app_client.post(f"/api/verify/{verification_token}")
    assert verify_response.status_code == 200, verify_response.text
    _assert_response_body(verify_response)

    signup_user = _resolve_signup_user(signup_payload["email"])
    _set_current_user(main_app_client, signup_user)

    tenant_response = main_app_client.post("/api/get/tenant")
    assert tenant_response.status_code == 200, tenant_response.text
    _assert_response_body(tenant_response)

    tenant_node_response = main_app_client.post("/api/get/tenant/node")
    assert tenant_node_response.status_code == 200, tenant_node_response.text
    _assert_response_body(tenant_node_response)

    update_tenant_payload["id"] = signup_user["tenant_uuid"]
    update_tenant_response = main_app_client.post("/api/update/tenants", json=update_tenant_payload)
    assert update_tenant_response.status_code == 200, update_tenant_response.text
    _assert_response_body(update_tenant_response)

    users_response = main_app_client.post("/api/users")
    assert users_response.status_code == 200, users_response.text
    _assert_response_body(users_response)

    create_user_response = main_app_client.post("/api/tenant/create/user", json=create_user_payload)
    assert create_user_response.status_code == 200, create_user_response.text
    _assert_response_body(create_user_response)

    update_user_response = main_app_client.post("/api/update/user", json=update_user_payload)
    assert update_user_response.status_code == 200, update_user_response.text
    _assert_response_body(update_user_response)

    update_current_user_response = main_app_client.post("/api/update/current/user", json=update_current_user_payload)
    assert update_current_user_response.status_code == 200, update_current_user_response.text
    _assert_response_body(update_current_user_response)

    delete_user_response = main_app_client.post("/api/delete/user", json=delete_user_payload)
    assert delete_user_response.status_code == 200, delete_user_response.text
    _assert_response_body(delete_user_response)

    main_app_client.app.state.test_current_user = None

    all_tenants_response = main_app_client.post("/api/tenants/get")
    assert all_tenants_response.status_code == 200, all_tenants_response.text
    _assert_response_body(all_tenants_response)

    audit_logs_response = main_app_client.post("/api/audit/logs", json=audit_log_payload)
    assert audit_logs_response.status_code == 200, audit_logs_response.text
    _assert_response_body(audit_logs_response)
