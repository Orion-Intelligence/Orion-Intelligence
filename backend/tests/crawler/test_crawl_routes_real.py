from __future__ import annotations

import base64
from pathlib import Path

import pytest


BACKEND_ROOT = Path(__file__).resolve().parents[2]


def _normalize_embeddings(payload):
    if not isinstance(payload, dict):
        return payload

    embedding = payload.get("m_embedding")
    if isinstance(embedding, list) and embedding:
        normalized = embedding[:384]
        if len(normalized) < 384:
            filler = normalized[-1]
            normalized.extend([filler] * (384 - len(normalized)))
        payload["m_embedding"] = normalized

    for card in payload.get("cards_data", []):
        embedding = card.get("m_embedding")
        if isinstance(embedding, list) and embedding:
            normalized = embedding[:384]
            if len(normalized) < 384:
                filler = normalized[-1]
                normalized.extend([filler] * (384 - len(normalized)))
            card["m_embedding"] = normalized

    return payload


def _assert_response_body(path: str, response):
    if path.startswith("/api/feeder/"):
        feeder_file = BACKEND_ROOT / "static" / ".well-known" / "feeder" / f"crawl_data_{path.rsplit('/', 1)[-1]}.txt"
        assert "text/plain" in response.headers.get("content-type", "")
        return

    assert response.content

    if path == "/api/parser":
        parser_file = BACKEND_ROOT / "static" / ".well-known" / "parser_files.zip"
        assert parser_file.exists()
        assert "application/zip" in response.headers.get("content-type", "")
        return

    assert response.json() is not None


def _assert_file_side_effect(path: str, payload: dict | None, response):
    if path != "/api/screenshot" or not payload:
        return

    screenshot_file = BACKEND_ROOT / "static" / "resource" / "screenshot" / "breach" / payload["filename"]
    assert response.json()["filename"] == payload["filename"]
    assert screenshot_file.exists()
    assert screenshot_file.read_bytes() == base64.b64decode(payload["data"])


@pytest.mark.parametrize(
    "method,path,payload_file",
    [
        ("GET", "/api/feeder/leak", None),
        ("GET", "/api/parser", None),
        ("POST", "/api/index/leak", "index_leak.json"),
        ("POST", "/api/index/news", "index_news.json"),
        ("POST", "/api/index/tracking", "index_tracking.json"),
        ("POST", "/api/index/exploit", "index_exploit.json"),
        ("POST", "/api/index/defacement", "index_defacement.json"),
        ("POST", "/api/screenshot", "screenshot_upload.json"),
        ("POST", "/api/index/generic", "index_generic.json"),
        ("POST", "/api/nlp/parse", "nlp_parse.json"),
        ("POST", "/api/nlp/parse/ai", "nlp_parse_ai.json"),
        ("POST", "/api/nlp/summarize/ai", "nlp_summarize_ai.json"),
        ("POST", "/api/index/chat", "index_chat.json"),
        ("POST", "/api/index/social", "index_social.json"),
        ("POST", "/api/index/sanctions", "index_sanctions.json"),
        ("POST", "/api/index/entity", "index_entity.json"),
        ("POST", "/api/index/dump", "index_dump.json"),
        ("POST", "/api/index/stealerlog", "index_stealerlog.json"),
    ],
)
def test_crawl_routes_real_smoke(main_app_client, load_injection, method: str, path: str, payload_file: str | None):
    payload = _normalize_embeddings(load_injection(payload_file)) if payload_file else None
    response = main_app_client.request(method, path, json=payload)
    assert response.status_code == 200, response.text
    _assert_response_body(path, response)
    _assert_file_side_effect(path, payload, response)
