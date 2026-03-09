from __future__ import annotations

import asyncio
import json
from typing import Any

import pytest
from fastapi import Request

import routes.crawl_routes as cr


def _json_request(payload: Any) -> Request:
    body = json.dumps(payload).encode("utf-8")

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(
        {"type": "http", "method": "POST", "path": "/", "headers": [(b"content-type", b"application/json")]},
        receive=receive,
    )


@pytest.mark.parametrize(
    "method,path,payload_file",
    [
        # ("GET", "/api/feeder/leak", None),
        # ("GET", "/api/parser", None),
        ("POST", "/api/index/leak", "index_leak.json"),
        # ("POST", "/api/index/news", "index_news.json"),
        # ("POST", "/api/index/tracking", "index_tracking.json"),
        # ("POST", "/api/index/exploit", "index_exploit.json"),
        # ("POST", "/api/index/defacement", "index_defacement.json"),
        # ("POST", "/api/screenshot", "screenshot_upload.json"),
        # ("POST", "/api/index/generic", "index_generic.json"),
        # ("POST", "/api/nlp/parse", "nlp_parse.json"),
        # ("POST", "/api/nlp/parse/ai", "nlp_parse_ai.json"),
        # ("POST", "/api/nlp/summarize/ai", "nlp_summarize_ai.json"),
        # ("POST", "/api/index/chat", "index_chat.json"),
        # ("POST", "/api/index/social", "index_social.json"),
        # ("POST", "/api/index/sanctions", "index_sanctions.json"),
        # ("POST", "/api/index/entity", "index_entity.json"),
        # ("POST", "/api/index/dump", "index_dump.json"),
        # ("POST", "/api/index/stealerlog", "index_stealerlog.json"),
    ],
)
def test_crawl_routes_real_smoke(load_injection, method: str, path: str, payload_file: str | None):
    payload = load_injection(payload_file) if payload_file else None
    routes = {
        # ("GET", "/api/feeder/leak"): lambda _p: cr.feeder("leak"),
        # ("GET", "/api/parser"): lambda _p: cr.parser(),
        ("POST", "/api/index/leak"): lambda p: cr.index_leak_data(_json_request(p)),
        # ("POST", "/api/index/news"): lambda p: cr.index_news_data(_json_request(p)),
        # ("POST", "/api/index/tracking"): lambda p: cr.index_tracking_data(_json_request(p)),
        # ("POST", "/api/index/exploit"): lambda p: cr.index_exploit_data(_json_request(p)),
        # ("POST", "/api/index/defacement"): lambda p: cr.index_defacement_data(_json_request(p)),
        # ("POST", "/api/screenshot"): lambda p: cr.screenshot(cr.ScreenshotPayload(**p)),
        # ("POST", "/api/index/generic"): lambda p: cr.index_generic(_json_request(p)),
        # ("POST", "/api/nlp/parse"): lambda p: cr.parse_text(cr.nlp_data_model(**p)),
        # ("POST", "/api/nlp/parse/ai"): lambda p: cr.parse_ai(cr.nlp_data_model(**p)),
        # ("POST", "/api/nlp/summarize/ai"): lambda p: cr.summarize_ai(cr.nlp_data_model(**p)),
        # ("POST", "/api/index/chat"): lambda p: cr.index_chat_data(_json_request(p)),
        # ("POST", "/api/index/social"): lambda p: cr.index_social_data(_json_request(p)),
        # ("POST", "/api/index/sanctions"): lambda p: cr.index_sanctions_data(_json_request(p)),
        # ("POST", "/api/index/entity"): lambda p: cr.index_entities(_json_request(p), [cr.entity_model(**item) for item in p]),
        # ("POST", "/api/index/dump"): lambda p: cr.index_dump(_json_request(p)),
        # ("POST", "/api/index/stealerlog"): lambda p: cr.index_stealerlog(cr.LogBatchModel(**p)),
    }

    body = asyncio.run(routes[(method, path)](payload))
    assert body is not None
