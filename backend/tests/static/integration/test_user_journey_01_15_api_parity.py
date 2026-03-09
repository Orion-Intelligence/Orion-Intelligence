from __future__ import annotations

from routes.admin_routes import admin_routes
from routes.api_micros import micro_routes
from routes.api_routes import api_routes
from routes.auth_routes import auth_router
from routes.public_api_routes import public_routes
from routes.social_routes import social_routes
from routes.tenant_routes import tenant_routes


def _collect_route_signatures() -> set[tuple[str, str]]:
    routers = [auth_router, public_routes, admin_routes, tenant_routes, social_routes, api_routes, micro_routes]
    signatures: set[tuple[str, str]] = set()
    for router in routers:
        for route in router.routes:
            methods = route.methods or set()
            for method in methods:
                if method in {"GET", "POST", "PUT", "DELETE"}:
                    signatures.add((method, route.path))
    return signatures


USER_JOURNEY_01_15_API_MAP: dict[str, set[tuple[str, str]]] = {
    "01-init": {
        ("GET", "/api/public"),
    },
    "02-login": {
        ("POST", "/api/token"),
        ("POST", "/api/token/refresh"),
        ("POST", "/api/logout"),
        ("POST", "/api/get/tenant/node"),
    },
    "03-flow-navigation": {
        ("POST", "/api/search/strategic"),
        ("POST", "/api/search/breach"),
        ("POST", "/api/search/defacement"),
        ("POST", "/api/search/social"),
        ("POST", "/api/search/exploit"),
        ("POST", "/api/search/stealer/ioc"),
        ("POST", "/api/search/breach"),
        ("GET", "/api/insight/country"),
        ("GET", "/api/directory"),
        ("GET", "/api/dumps"),
        ("POST", "/api/urlscan/domain"),
        ("POST", "/api/dynamic/cracked"),
        ("POST", "/api/dynamic/user"),
        ("POST", "/api/dynamic/social"),
        ("POST", "/api/dynamic/wanted"),
        ("POST", "/api/dynamic/national-identity"),
        ("POST", "/api/dynamic/software"),
    },
    "04-searching": {
        ("POST", "/api/search/strategic"),
        ("POST", "/api/search/defacement"),
        ("POST", "/api/search/social"),
        ("POST", "/api/search/exploit"),
        ("GET", "/api/search/strategic/{doc_id}"),
        ("GET", "/api/search/defacement/{doc_id}"),
        ("GET", "/api/search/social/{doc_id}"),
        ("GET", "/api/search/exploit/{doc_id}"),
        ("GET", "/api/search/news/{doc_id}"),
        ("POST", "/api/search/breach"),
        ("POST", "/api/urlscan/domain"),
        ("POST", "/api/dynamic/cracked"),
    },
    "05-user-management": {
        ("POST", "/api/users"),
        ("POST", "/api/tenant/create/user"),
        ("POST", "/api/update/user"),
        ("POST", "/api/delete/user"),
        ("POST", "/api/token"),
    },
    "06-account-management": {
        ("POST", "/api/token"),
        ("POST", "/api/update/current/user"),
        ("PUT", "/api/user/image"),
        ("DELETE", "/api/user/image"),
        ("POST", "/api/forgot"),
        ("POST", "/api/updatePassword"),
        ("POST", "/api/token/2fa/verify"),
    },
    "07-cti-management": {
        ("GET", "/api/graph"),
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
        ("POST", "/api/crypto/scan"),
    },
    "08-tenant-management": {
        ("POST", "/api/token"),
        ("POST", "/api/signup"),
        ("POST", "/api/verify/{token}"),
        ("POST", "/api/get/tenant"),
        ("POST", "/api/get/tenant/node"),
        ("POST", "/api/tenants/get"),
        ("POST", "/api/update/tenants"),
        ("POST", "/api/tenant/create/user"),
        ("POST", "/api/profile/alert/scan"),
        ("GET", "/api/profile/alerts"),
        ("POST", "/api/profile/alerts/delete/all"),
        ("POST", "/api/alert/add"),
        ("POST", "/api/alert/seen"),
        ("POST", "/api/alert/delete"),
    },
    "09-system-management": {
        ("GET", "/api/public"),
        ("POST", "/api/public/update"),
        ("PUT", "/api/system/image"),
        ("DELETE", "/api/system/image"),
    },
    "10-pagination": {
        ("POST", "/api/search/strategic"),
        ("POST", "/api/search/breach"),
        ("POST", "/api/search/defacement"),
        ("POST", "/api/search/social"),
        ("POST", "/api/search/exploit"),
    },
    "11-chatbot": {
        ("GET", "/api/search/strategic/{doc_id}"),
        ("POST", "/api/nlp/chat/report"),
    },
    "12-filter-management": {
        ("POST", "/api/search/strategic"),
        ("POST", "/api/search/breach"),
        ("POST", "/api/search/defacement"),
        ("POST", "/api/search/social"),
        ("POST", "/api/search/exploit"),
    },
    "13-consolidated": {
        ("POST", "/api/search/consolidated"),
        ("POST", "/api/search/consolidated/ioc"),
        ("POST", "/api/search/stealerlogs"),
        ("POST", "/api/search/stealer/ioc"),
        ("POST", "/api/urlscan/domain"),
        ("GET", "/api/search/social/{doc_id}"),
        ("POST", "/api/search/social"),
    },
    "14-scans-management": {
        ("POST", "/api/urlscan/domain"),
        ("POST", "/api/dynamic/user"),
        ("POST", "/api/dynamic/social"),
        ("POST", "/api/dynamic/wanted"),
        ("POST", "/api/dynamic/national-identity"),
        ("POST", "/api/dynamic/cracked"),
        ("POST", "/api/dynamic/software"),
        ("POST", "/api/ioc/extract"),
        ("POST", "/api/apk/scan"),
        ("POST", "/api/crypto/scan"),
    },
    "15-support": {
        ("POST", "/api/support"),
    },
}


def test_user_journey_has_all_15_steps():
    expected_steps = {
        "01-init",
        "02-login",
        "03-flow-navigation",
        "04-searching",
        "05-user-management",
        "06-account-management",
        "07-cti-management",
        "08-tenant-management",
        "09-system-management",
        "10-pagination",
        "11-chatbot",
        "12-filter-management",
        "13-consolidated",
        "14-scans-management",
        "15-support",
    }
    assert set(USER_JOURNEY_01_15_API_MAP.keys()) == expected_steps


def test_user_journey_every_step_has_endpoints():
    for step, signatures in USER_JOURNEY_01_15_API_MAP.items():
        assert signatures, f"{step} has no mapped API signatures"


def test_user_journey_01_to_15_route_parity():
    actual = _collect_route_signatures()
    for step, expected in USER_JOURNEY_01_15_API_MAP.items():
        missing = expected - actual
        assert not missing, f"{step} missing backend APIs: {sorted(missing)}"
