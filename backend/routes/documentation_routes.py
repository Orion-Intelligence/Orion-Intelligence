import re

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import Response

from orion.api.server.config_manager.config_controller import config_controller
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys

documentation_routes = APIRouter()

_DOCS_UPSTREAM = "http://documentation"
_CANONICAL_BRANDS = {"", "Orion", "Orion Intelligence"}
_FORWARD_HEADERS = {"cache-control", "etag", "last-modified", "expires", "location", "content-disposition"}
_ORION_WORD = re.compile(r"\bOrion\b")


def _rebrand(html: str, brand: str) -> str:
    return _ORION_WORD.sub(brand, html.replace("Orion Intelligence", brand))


async def _resolve_brand(request: Request):
    tenant = getattr(request.state, "tenant", None)
    if tenant is None or getattr(tenant, "is_default", False):
        return None
    brand = (await config_controller.getInstance().get_cached(AllowedKeys.APP_NAME.value, "", tenant_id=str(tenant.id)) or "").strip()
    return None if brand in _CANONICAL_BRANDS else brand


def _asset_headers(upstream: httpx.Response):
    return {key: value for key, value in upstream.headers.items() if key.lower() in _FORWARD_HEADERS}


@documentation_routes.get("/documentation/{doc_path:path}", include_in_schema=False)
async def documentation_proxy(doc_path: str, request: Request):
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            upstream = await client.get(f"{_DOCS_UPSTREAM}/{doc_path}", params=request.query_params)
    except httpx.RequestError:
        return Response(status_code=502)

    content_type = upstream.headers.get("content-type", "application/octet-stream")

    if upstream.status_code == 200 and content_type.startswith("text/html"):
        brand = await _resolve_brand(request)
        body = _rebrand(upstream.text, brand) if brand else upstream.text
        return Response(content=body, media_type=content_type)

    return Response(content=upstream.content, status_code=upstream.status_code, media_type=content_type, headers=_asset_headers(upstream))
