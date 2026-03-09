from __future__ import annotations

from pathlib import Path

import pytest


BACKEND_ROOT = Path(__file__).resolve().parents[2]
AUTH_COOKIE = {"access_token": "journey-test-cookie"}


def _assert_response_body(path: str, response):
    assert response.content

    if path == "/robots.txt":
        assert (BACKEND_ROOT / "static" / "robots.txt").exists()
        assert "text/plain" in response.headers.get("content-type", "")
        return

    if path == "/api/s/static/favicon":
        assert (BACKEND_ROOT / "static" / "resource" / "system" / "logo_url_default.png").exists()
        assert response.headers.get("content-type", "").startswith("image/")
        return

    if path == "/api/s/static/tenant/default":
        assert (BACKEND_ROOT / "static" / "resource" / "tenant" / "default.png").exists()
        assert response.headers.get("content-type", "").startswith("image/")
        return

    if path == "/api/s/static/user/default":
        assert (BACKEND_ROOT / "static" / "resource" / "profile" / "default.png").exists()
        assert response.headers.get("content-type", "").startswith("image/")
        return

    if path == "/api/s/static/system/logo_url_default.png":
        assert (BACKEND_ROOT / "static" / "resource" / "system" / "logo_url_default.png").exists()
        assert response.headers.get("content-type", "").startswith("image/")
        return

    assert response.json() is not None


@pytest.mark.parametrize(
    "method,path,with_cookie",
    [
        ("GET", "/api/public", False),
        ("GET", "/api/s/static/tenant/default", True),
        ("GET", "/api/s/static/user/default", True),
        ("GET", "/api/s/static/favicon", False),
        ("GET", "/api/s/static/system/logo_url_default.png", False),
        ("GET", "/robots.txt", False),
        ("GET", "/api/search/stealerlogs?q=test@example.com", False),
    ],
)
def test_public_api_routes_real_smoke(main_app_client, method: str, path: str, with_cookie: bool):
    if with_cookie:
        main_app_client.cookies.update(AUTH_COOKIE)
    try:
        response = main_app_client.request(method, path)
    finally:
        if with_cookie:
            main_app_client.cookies.clear()
    assert response.status_code == 200, response.text
    _assert_response_body(path, response)
