from __future__ import annotations

from routes.admin_routes import admin_routes
from routes.api_routes import api_routes
from routes.auth_routes import auth_router
from routes.public_api_routes import public_routes
from routes.social_routes import social_routes
from routes.tenant_routes import tenant_routes


def _collect_route_signatures() -> set[tuple[str, str]]:
    routers = [auth_router, public_routes, admin_routes, tenant_routes, social_routes, api_routes]
    signatures: set[tuple[str, str]] = set()
    for router in routers:
        for route in router.routes:
            methods = route.methods or set()
            for method in methods:
                if method in {"GET", "POST", "PUT", "DELETE"}:
                    signatures.add((method, route.path))
    return signatures


def test_client_e2e_api_catalog_is_present_in_backend():
    """
    Keep backend route surface aligned with client E2E API usage.
    This is a route parity guard, not a behavior test.
    """
    expected = {
        ("POST", "/api/token"),
        ("POST", "/api/token/demo"),
        ("POST", "/api/token/2fa/verify"),
        ("POST", "/api/token/refresh"),
        ("POST", "/api/logout"),
        ("POST", "/api/signup"),
        ("POST", "/api/signup/verificaion"),
        ("POST", "/api/verify/{token}"),
        ("POST", "/api/forgot"),
        ("POST", "/api/updatePassword"),
        ("POST", "/api/subscription/request"),
        ("POST", "/api/support"),
        ("GET", "/api/public"),
        ("POST", "/api/public/update"),
        ("POST", "/api/get/tenant"),
        ("POST", "/api/get/tenant/node"),
        ("POST", "/api/update/tenants"),
        ("POST", "/api/users"),
        ("POST", "/api/tenants/get"),
        ("POST", "/api/update/user"),
        ("POST", "/api/update/current/user"),
        ("POST", "/api/delete/user"),
        ("POST", "/api/tenant/create/user"),
        ("POST", "/api/audit/logs"),
        ("PUT", "/api/user/image"),
        ("DELETE", "/api/user/image"),
        ("PUT", "/api/tenant/image"),
        ("DELETE", "/api/tenant/image"),
        ("PUT", "/api/system/image"),
        ("DELETE", "/api/system/image"),
        ("POST", "/api/alert/add"),
        ("POST", "/api/alert/seen"),
        ("POST", "/api/alert/delete"),
        ("POST", "/api/alert/update"),
        ("GET", "/api/profile/alerts"),
        ("POST", "/api/profile/alert/scan"),
        ("POST", "/api/profile/alert/scan/cancel"),
        ("POST", "/api/profile/alert/scan/status"),
        ("POST", "/api/profile/alerts/delete/all"),
        ("POST", "/api/profile/alerts/delete/{_type}"),
        ("POST", "/api/search/strategic"),
        ("POST", "/api/search/breach"),
        ("POST", "/api/search/social"),
        ("POST", "/api/search/exploit"),
        ("POST", "/api/search/defacement"),
        ("POST", "/api/search/stealerlogs"),
        ("POST", "/api/search/stealer/ioc"),
        ("POST", "/api/search/consolidated"),
        ("POST", "/api/search/consolidated/ioc"),
        ("GET", "/api/directory"),
        ("GET", "/api/dumps"),
        ("GET", "/api/insight"),
        ("GET", "/api/insight/country"),
        ("GET", "/api/search/breach/{doc_id}"),
        ("GET", "/api/search/strategic/{doc_id}"),
        ("GET", "/api/search/defacement/{doc_id}"),
        ("GET", "/api/search/exploit/{doc_id}"),
        ("GET", "/api/search/social/{doc_id}"),
        ("GET", "/api/search/chat/{doc_id}"),
        ("GET", "/api/search/news/{doc_id}"),
        ("GET", "/api/search/breach/screenshot/{filename}"),
        ("POST", "/api/dynamic/user"),
        ("POST", "/api/dynamic/social"),
        ("POST", "/api/dynamic/wanted"),
        ("POST", "/api/dynamic/national-identity"),
        ("POST", "/api/dynamic/cracked"),
        ("POST", "/api/dynamic/software"),
        ("POST", "/api/urlscan/domain"),
        ("POST", "/api/urlscan/subdomains"),
        ("POST", "/api/urlscan/dns"),
        ("POST", "/api/urlscan/wayback"),
        ("POST", "/api/urlscan/ip"),
        ("POST", "/api/social/recon"),
        ("POST", "/api/social/recon/image"),
        ("POST", "/api/social/profile"),
        ("POST", "/api/social/online/images"),
        ("POST", "/api/social/posts"),
        ("POST", "/api/social/followers"),
        ("POST", "/api/social/following"),
        ("POST", "/api/social/entity"),
        ("POST", "/api/social/metadata"),
        ("POST", "/api/social/phone/recon"),
        ("POST", "/api/social/session/upsert"),
        ("GET", "/api/social/session/tabs"),
        ("POST", "/api/social/session/tab/add"),
        ("POST", "/api/crypto/scan"),
    }

    actual = _collect_route_signatures()
    missing = expected - actual
    assert not missing, f"Client E2E API parity gap: {sorted(missing)}"
