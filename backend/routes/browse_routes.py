from fastapi import APIRouter, Query, Request
from fastapi.responses import Response, HTMLResponse
from httpx import AsyncClient, AsyncHTTPTransport
import re

browse_routes = APIRouter(prefix="/api")

PRIVOXY_URL = "http://host.docker.internal:8118"  # Tinyproxy URL
PRIVOXY_TRANSPORT = AsyncHTTPTransport(proxy=PRIVOXY_URL)  # Force all traffic through proxy

async def fetch_and_rewrite(url: str, request: Request):
    async with AsyncClient(timeout=30, follow_redirects=True) as client:
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

        # Leave absolute URLs unchanged (http, https, etc.)
        if old_url.startswith(("http", "https", "data:", "javascript:", "#")):
            return match.group(0)

        # Rewrite only relative URLs
        new_url = f'{base_url.rstrip("/")}/{old_url.lstrip("/")}'
        print(f"🔍 Rewriting relative URL: {old_url} → {new_url}")  # Debugging output
        return match.group(0).replace(old_url, new_url)

    return re.sub(r'href="([^"]+)"|src="([^"]+)"', fix_url, html)

@browse_routes.get("/browse")
async def browse(request: Request, url: str = Query(...)):
    return await fetch_and_rewrite(url, request)
