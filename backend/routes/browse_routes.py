from fastapi import APIRouter, Query, Request
from fastapi.responses import Response, HTMLResponse
from httpx import AsyncClient, AsyncHTTPTransport
import re

browse_routes = APIRouter(prefix="/api")

PROXY_URL = "http://host.docker.internal:8118"
PROXY_TRANSPORT = AsyncHTTPTransport(proxy=PROXY_URL)

async def fetch_and_rewrite(url: str, request: Request, use_proxy: bool = False):
    transport = PROXY_TRANSPORT if use_proxy else None
    async with AsyncClient(transport=transport, timeout=30, follow_redirects=True) as client:
        response = await client.request(
            method=request.method,
            url=url,
            headers={k: v for k, v in request.headers.items() if k.lower() != "host"},
            content=await request.body() if request.method != "GET" else None
        )

        content_type = response.headers.get("content-type", "")
        return HTMLResponse(content=rewrite_html_urls(response.text, url)) if "text/html" in content_type else Response(response.content)

def rewrite_html_urls(html: str, base_url: str) -> str:
    def fix_url(match):
        old_url = match.group(1) or match.group(2)
        return match.group(0) if not old_url or old_url.startswith(("http", "data:", "javascript:", "#")) else match.group(0).replace(old_url, f'/api/browse?url={base_url.rstrip("/")}/{old_url.lstrip("/")}')
    return re.sub(r'href="([^"]+)"|src="([^"]+)"', fix_url, html)

@browse_routes.get("/browse")
async def browse(request: Request, url: str = Query(...)):
    return await fetch_and_rewrite(url, request, url.endswith('.onion'))
