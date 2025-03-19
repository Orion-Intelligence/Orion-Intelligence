from fastapi import APIRouter, Query, Request
from fastapi.responses import Response, HTMLResponse
from httpx import AsyncClient, AsyncHTTPTransport, HTTPStatusError
import re
from urllib.parse import urljoin, quote
import logging

# Set up basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

browse_routes = APIRouter(prefix="/api")

# Proxy configuration
PRIVOXY_URL = "http://host.docker.internal:8118"  # Privoxy or Tinyproxy URL
PRIVOXY_TRANSPORT = AsyncHTTPTransport(proxy=PRIVOXY_URL)  # Force traffic through proxy

async def fetch_and_rewrite(url: str, request: Request):
    """
    Fetch content from a URL and rewrite it if necessary.
    Handles HTML, CSS, JS, images, and other content types.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": url,
    }

    try:
        async with AsyncClient(
            headers=headers,
            timeout=30,
            follow_redirects=True,
            transport=PRIVOXY_TRANSPORT  # Ensure proxy is used for all requests
        ) as client:
            response = await client.get(url)
            response.raise_for_status()  # Raise exception for bad status codes
            logger.info(f"✅ Status: {response.status_code}, URL: {url}")

            content_type = response.headers.get("content-type", "").lower()
            if "text/html" in content_type:
                # Rewrite HTML content
                rewritten_content = rewrite_html_urls(response.text, url)
                return HTMLResponse(content=rewritten_content, status_code=response.status_code)
            elif "css" in content_type:
                # Rewrite URLs in CSS content
                rewritten_content = rewrite_css_urls(response.text, url)
                return Response(
                    content=rewritten_content,
                    media_type=content_type,
                    status_code=response.status_code
                )
            else:
                # Return non-HTML/CSS assets (e.g., images, JS) as-is
                return Response(
                    content=response.content,
                    media_type=content_type,
                    status_code=response.status_code
                )

    except HTTPStatusError as e:
        logger.error(f"❌ HTTP error: {e.response.status_code} for URL: {url}")
        return Response(content=f"Error fetching URL: {e}", status_code=e.response.status_code)
    except Exception as e:
        logger.error(f"❌ General error fetching URL {url}: {str(e)}")
        return Response(content=f"Internal server error: {str(e)}", status_code=500)

def rewrite_html_urls(html: str, base_url: str) -> str:
    """
    Rewrite all URLs (relative and absolute) in HTML to route through the proxy.
    """
    def fix_url(match):
        old_url = match.group(1) or match.group(2)

        # Handle absolute URLs
        if old_url.startswith(("http://", "https://")):
            new_url = f'/api/browse?url={quote(old_url)}'
            logger.debug(f"🔍 Rewriting absolute: {old_url} → {new_url}")
            return match.group(0).replace(old_url, new_url)

        # Handle relative URLs
        absolute_url = urljoin(base_url, old_url)
        new_url = f'/api/browse?url={quote(absolute_url)}'
        logger.debug(f"🔍 Rewriting relative: {old_url} → {new_url}")
        return match.group(0).replace(old_url, new_url)

    # Match href and src attributes
    return re.sub(r'href="([^"]+)"|src="([^"]+)"', fix_url, html)

def rewrite_css_urls(css: str, base_url: str) -> str:
    """
    Rewrite URLs in CSS files (e.g., url() references) to route through the proxy.
    """
    def fix_css_url(match):
        old_url = match.group(1).strip("'\"")  # Remove quotes if present

        # Handle absolute URLs
        if old_url.startswith(("http://", "https://")):
            new_url = f'/api/browse?url={quote(old_url)}'
            logger.debug(f"🔍 Rewriting CSS absolute: {old_url} → {new_url}")
            return f'url("{new_url}")'

        # Handle relative URLs
        absolute_url = urljoin(base_url, old_url)
        new_url = f'/api/browse?url={quote(absolute_url)}'
        logger.debug(f"🔍 Rewriting CSS relative: {old_url} → {new_url}")
        return f'url("{new_url}")'

    # Match url() patterns in CSS
    return re.sub(r'url\(([^)]+)\)', fix_css_url, css)

@browse_routes.get("/browse")
async def browse(request: Request, url: str = Query(...)):
    """
    Endpoint to browse and proxy a given URL.
    """
    logger.info(f"📡 Browsing URL: {url}")
    return await fetch_and_rewrite(url, request)