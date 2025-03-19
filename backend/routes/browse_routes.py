from fastapi import APIRouter, Query, Request
from fastapi.responses import Response, HTMLResponse
from httpx import AsyncClient, AsyncHTTPTransport
import re

browse_routes = APIRouter(prefix="/api")

PRIVOXY_URL = "http://host.docker.internal:8118"  # Tinyproxy URL
PRIVOXY_TRANSPORT = AsyncHTTPTransport(proxy=PRIVOXY_URL)  # Force all traffic through proxy

async def fetch_and_rewrite(url: str, request: Request):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": url,
    }

    async with AsyncClient(headers=headers, timeout=30, follow_redirects=True) as client:
        response = await client.get(url)
        print(f"✅ Status: {response.status_code}, URL: {url}")  # Debugging output
        return HTMLResponse(content=response.text) if "text/html" in response.headers.get("content-type", "") else Response(response.content)

def rewrite_html_urls(html: str, base_url: str) -> str:
    def fix_url(match):
        old_url = match.group(1) or match.group(2)

        # If the URL is absolute (starts with http/https), don't rewrite it
        if old_url.startswith(("http://", "https://")):
            return match.group(0)

        # Rewrite only relative URLs
        new_url = f'/api/browse?url={base_url.rstrip("/")}/{old_url.lstrip("/")}'
        print(f"🔍 Rewriting: {old_url} → {new_url}")  # Debugging output
        return match.group(0).replace(old_url, new_url)

    return re.sub(r'href="([^"]+)"|src="([^"]+)"', fix_url, html)


@browse_routes.get("/browse")
async def browse(request: Request, url: str = Query(...)):
    return await fetch_and_rewrite(url, request)
