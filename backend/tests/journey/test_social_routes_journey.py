from __future__ import annotations

import json
from pathlib import Path

import pytest


INJECTIONS_DIR = Path(__file__).resolve().parent / "injections"


def _load_injection(name: str):
    return json.loads((INJECTIONS_DIR / name).read_text(encoding="utf-8"))


def _assert_response_body(response):
    assert response.content
    assert response.json() is not None


@pytest.mark.parametrize(
    "method,path,payload_file",
    [
        ("POST", "/api/social/recon", "social_recon.json"),
        ("POST", "/api/social/phone/recon", "social_phone_recon.json"),
        ("POST", "/api/social/profile", "social_profile.json"),
        ("POST", "/api/social/online/images", "social_online_images.json"),
        ("POST", "/api/social/recon/image", "social_recon_image.json"),
        ("POST", "/api/social/followers", "social_followers.json"),
        ("POST", "/api/social/following", "social_following.json"),
        ("POST", "/api/social/posts", "social_posts.json"),
        ("POST", "/api/social/entity", "social_entity.json"),
        ("POST", "/api/social/metadata", "social_metadata.json"),
        ("POST", "/api/social/session/upsert?graph_type=social", "social_session_upsert.json"),
        ("GET", "/api/social/session/tabs?graph_type=social", None),
        ("POST", "/api/social/session/tab/add?graph_type=social", "social_session_tab_add.json"),
    ],
)
def test_social_routes_real_smoke(main_app_client, method: str, path: str, payload_file: str | None):
    payload = _load_injection(payload_file) if payload_file else None
    response = main_app_client.request(method, path, json=payload)
    assert response.status_code == 200, response.text
    _assert_response_body(response)
