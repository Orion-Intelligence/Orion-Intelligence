from fastapi import APIRouter, Query, Request
from fastapi.responses import Response, HTMLResponse
from httpx import AsyncClient, AsyncHTTPTransport, HTTPStatusError, RequestError, Limits
import re
from urllib.parse import urljoin, quote
import logging
import asyncio

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

browse_routes = APIRouter(prefix="/api")

# Proxy configuration with throttled concurrency
PRIVOXY_URL = "http://host.docker.internal:8118"
PRIVOXY_TRANSPORT = AsyncHTTPTransport(
    proxy=PRIVOXY_URL,
    retries=5,  # Retry with backoff
    limits=Limits(max_connections=20, max_keepalive_connections=10)  # Lowered to throttle
)

# Semaphore to limit concurrent requests
CONCURRENCY_LIMIT = 10
semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)

async def fetch_and_rewrite(url: str, request: Request):
    """Fetch and rewrite content with concurrency control."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": url,
    }

    async with semaphore:  # Limit concurrent requests
        try:
            async with AsyncClient(
                headers=headers,
                timeout=60,
                follow_redirects=True,
                transport=PRIVOXY_TRANSPORT,
                max_redirects=10
            ) as client:
                response = await client.get(url)
                response.raise_for_status()
                logger.info(f"✅ Status: {response.status_code}, URL: {url}, Content-Type: {response.headers.get('content-type')}")

                content_type = response.headers.get("content-type", "").lower()
                if "text/html" in content_type:
                    rewritten_content = rewrite_html_urls(response.text, url)
                    return HTMLResponse(content=rewritten_content, status_code=response.status_code)
                elif "css" in content_type:
                    rewritten_content = rewrite_css_urls(response.text, url)
                    return Response(content=rewritten_content, media_type=content_type, status_code=response.status_code)
                elif content_type:
                    return Response(content=response.content, media_type=content_type, status_code=response.status_code)
                else:
                    logger.warning(f"Unknown content-type for URL: {url}")
                    return Response(content=response.content, status_code=response.status_code)

        except HTTPStatusError as e:
            logger.error(f"❌ HTTP error: {e.response.status_code} for URL: {url} - {e}")
            return Response(content=f"Error fetching URL: {e}", status_code=e.response.status_code)
        except RequestError as e:
            logger.error(f"❌ Network error fetching URL {url}: {str(e)}")
            # Fallback for failed assets
            if "image" in url:
                return Response(content=b"", media_type="image/png", status_code=200)  # Empty image
            elif "css" in url:
                return Response(content="/* Failed to load CSS */", media_type="text/css", status_code=200)
            elif "js" in url:
                return Response(content="console.log('Failed to load JS');", media_type="application/javascript", status_code=200)
            return Response(content=f"Network error: {str(e)}", status_code=502)
        except Exception as e:
            logger.error(f"❌ Unexpected error fetching URL {url}: {str(e)}", exc_info=True)
            return Response(content=f"Internal server error: {str(e)}", status_code=500)

def rewrite_html_urls(html: str, base_url: str) -> str:
    """Rewrite all URLs in HTML to route through the proxy."""
    def fix_url(match):
        old_url = match.group(1) or match.group(2)
        if old_url.startswith(("http://", "https://")):
            new_url = f'/api/browse?url={quote(old_url)}'
            logger.debug(f"🔍 Rewriting absolute: {old_url} → {new_url}")
            return match.group(0).replace(old_url, new_url)
        absolute_url = urljoin(base_url, old_url)
        new_url = f'/api/browse?url={quote(absolute_url)}'
        logger.debug(f"🔍 Rewriting relative: {old_url} → {new_url}")
        return match.group(0).replace(old_url, new_url)

    return re.sub(r'href="([^"]+)"|src="([^"]+)"', fix_url, html)

def rewrite_css_urls(css: str, base_url: str) -> str:
    """Rewrite URLs in CSS files."""
    def fix_css_url(match):
        old_url = match.group(1).strip("'\"")
        if old_url.startswith(("http://", "https://")):
            new_url = f'/api/browse?url={quote(old_url)}'
            logger.debug(f"🔍 Rewriting CSS absolute: {old_url} → {new_url}")
            return f'url("{new_url}")'
        absolute_url = urljoin(base_url, old_url)
        new_url = f'/api/browse?url={quote(absolute_url)}'
        logger.debug(f"🔍 Rewriting CSS relative: {old_url} → {new_url}")
        return f'url("{new_url}")'

    return re.sub(r'url\(([^)]+)\)', fix_css_url, css)

@browse_routes.get("/browse")
async def browse(request: Request, url: str = Query(...)):
    logger.info(f"📡 Browsing URL: {url}")
    return await fetch_and_rewrite(url, request)