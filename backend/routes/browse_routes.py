from fastapi import APIRouter, Query, Request
from fastapi.responses import Response, HTMLResponse
from httpx import AsyncClient, AsyncHTTPTransport, HTTPStatusError, RequestError
import re
from urllib.parse import urljoin, quote
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

browse_routes = APIRouter(prefix="/api")

PRIVOXY_URL = "http://host.docker.internal:8118"
PRIVOXY_TRANSPORT = AsyncHTTPTransport(proxy=PRIVOXY_URL, retries=3, http2=True, limits={"max_connections": 100, "max_keepalive_connections": 20})

async def fetch_and_rewrite(url: str, request: Request):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": url,
    }

    try:
        async with AsyncClient(
            headers=headers,
            timeout=120,
            follow_redirects=True,
            transport=PRIVOXY_TRANSPORT
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

            content_type = response.headers.get("content-type", "").lower()
            if "text/html" in content_type:
                rewritten_content = rewrite_html_urls(response.text, url)
                return HTMLResponse(content=rewritten_content, status_code=response.status_code)
            elif "css" in content_type:
                rewritten_content = rewrite_css_urls(response.text, url)
                return Response(
                    content=rewritten_content,
                    media_type=content_type,
                    status_code=response.status_code
                )
            elif content_type:
                return Response(
                    content=response.content,
                    media_type=content_type,
                    status_code=response.status_code
                )
            else:
                return Response(
                    content=response.content,
                    status_code=response.status_code
                )

    except HTTPStatusError as e:
        return Response(content=f"❌Error fetching URL: {e}", status_code=e.response.status_code)
    except RequestError as e:
        return Response(content=f"❌Network error: {str(e)}", status_code=502)
    except Exception as e:
        return Response(content=f"❌Internal server error: {str(e)}", status_code=500)

def rewrite_html_urls(html: str, base_url: str) -> str:
    def fix_url(match):
        old_url = match.group(1) or match.group(2)
        if old_url.startswith(("http://", "https://")):
            new_url = f'/api/browse?url={quote(old_url)}'
            return match.group(0).replace(old_url, new_url)
        absolute_url = urljoin(base_url, old_url)
        new_url = f'/api/browse?url={quote(absolute_url)}'
        return match.group(0).replace(old_url, new_url)

    return re.sub(r'href="([^"]+)"|src="([^"]+)"', fix_url, html)

def rewrite_css_urls(css: str, base_url: str) -> str:
    def fix_css_url(match):
        old_url = match.group(1).strip("'\"")
        if old_url.startswith(("http://", "https://")):
            new_url = f'/api/browse?url={quote(old_url)}'
            return f'url("{new_url}")'
        absolute_url = urljoin(base_url, old_url)
        new_url = f'/api/browse?url={quote(absolute_url)}'
        return f'url("{new_url}")'

    return re.sub(r'url\(([^)]+)\)', fix_css_url, css)

@browse_routes.get("/browse")
async def browse(request: Request, url: str = Query(...)):
    return await fetch_and_rewrite(url, request)