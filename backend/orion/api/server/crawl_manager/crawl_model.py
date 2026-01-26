import asyncio
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, List
from playwright.sync_api import sync_playwright

from api.social_manager.social_enums import SOCIAL_REQUEST_COMMANDS, SOCIAL_PLATFORMS
from api.social_manager.cross_platform_mapping import cross_platform_mapper
from api.social_manager.login_session.session_manager import SessionManager
from api.social_manager.scrapers.instagram import InstagramScraper
from api.social_manager.scrapers.facebook import FacebookScraper
from api.social_manager.scrapers.behance_scraper import BehanceScraper
from api.social_manager.scrapers.vimeo import VimeoScraper

SESSION_DIR = os.path.dirname(os.path.abspath(__file__))
SESSION_FILE_MAP = {
    "InstagramScraper": "instagram_session.json.gz",
    "FacebookScraper": "FacebookScraper_session.json.gz",
}

BROWSER_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-software-rasterizer'
]

MAX_WORKERS = 4
BLOCKED_RESOURCES = ['image', 'media', 'font', 'stylesheet']


class social_controller:

    def __init__(self):
        self._browser = None
        self._playwright = None

    def _get_scraper(self, platform: str, username: str, max_followers: int, max_following: int):
        if platform == SOCIAL_PLATFORMS.INSTAGRAM:
            return InstagramScraper(username, max_followers, max_following)
        elif platform == SOCIAL_PLATFORMS.FACEBOOK:
            return FacebookScraper(username, max_following)
        elif platform == SOCIAL_PLATFORMS.BEHANCE:
            return BehanceScraper(username, max_followers, max_following)
        elif platform == SOCIAL_PLATFORMS.VIMEO:
            return VimeoScraper(username, max_followers, max_following)
        return None

    def _block_media(self, route):
        """Block images, media, fonts to speed up page loading."""
        if route.request.resource_type in BLOCKED_RESOURCES:
            route.abort()
        else:
            route.continue_()

    def _run_scraper(self, scraper, page) -> Dict[str, Any]:
        if getattr(scraper, "requires_login", False):
            session_filename = SESSION_FILE_MAP.get(
                scraper.__class__.__name__,
                f"{scraper.__class__.__name__}_session.json.gz"
            )
            session_file = os.path.join(SESSION_DIR, session_filename)

            session = SessionManager(session_file)
            loaded = session.load(page)

            if not loaded:
                return {
                    "status": "login_required",
                    "platform": scraper.name,
                    "message": "Manual login required. Please authenticate and retry."
                }

            page.goto(scraper.seed_url, wait_until="domcontentloaded")
            session.apply_storage(page)
            page.reload(wait_until="domcontentloaded")
            page.wait_for_timeout(2000)
        else:
            page.goto(scraper.seed_url, wait_until="domcontentloaded")

        result = scraper.parse_page(page)
        return {
            "status": "success",
            "platform": scraper.name,
            "data": result
        }

    def _scrape_single(self, platform: str, username: str, max_followers: int, max_following: int,
                       block_media: bool = True) -> Dict[str, Any]:
        """Scrape a single profile with optional media blocking."""
        cross_platform_mapper.clear_cards()

        scraper = self._get_scraper(platform, username, max_followers, max_following)
        if not scraper:
            return {
                "status": "error",
                "message": f"Unsupported platform: {platform}"
            }

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=BROWSER_ARGS)
            page = browser.new_page()

            if block_media:
                page.route("**/*", self._block_media)

            try:
                result = self._run_scraper(scraper, page)
            finally:
                browser.close()

        return result

    def _scrape_single_task(self, task: Dict) -> Dict[str, Any]:
        """Worker function for parallel scraping."""
        platform = task["platform"]
        username = task["username"]
        max_followers = task.get("max_followers", 50)
        max_following = task.get("max_following", 50)

        scraper = self._get_scraper(platform, username, max_followers, max_following)
        if not scraper:
            return {
                "status": "error",
                "message": f"Unsupported platform: {platform}"
            }

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=BROWSER_ARGS)
            page = browser.new_page()
            page.route("**/*", self._block_media)

            try:
                result = self._run_scraper(scraper, page)
            finally:
                browser.close()

        return result

    def _scrape_multiple(self, targets: List[Dict], compare_results: bool, threshold: int, max_followers: int = 50,
                         max_following: int = 50) -> Dict[str, Any]:
        """Scrape multiple profiles concurrently."""
        cross_platform_mapper.clear_cards()

        tasks = []
        for target in targets:
            platform = target.get("platform", "")
            usernames = target.get("usernames", [])
            # Use the root-level max_followers/max_following passed to this method

            for username in usernames:
                tasks.append({
                    "platform": platform,
                    "username": username,
                    "max_followers": max_followers,
                    "max_following": max_following
                })

        results = []

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_task = {
                executor.submit(self._scrape_single_task, task): task
                for task in tasks
            }

            for future in as_completed(future_to_task):
                task = future_to_task[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    results.append({
                        "status": "error",
                        "platform": task["platform"],
                        "username": task["username"],
                        "message": str(e)
                    })

        response = {
            "status": "success",
            "scrape_results": results,
            "total_scraped": len(results)
        }

        if compare_results:
            response["analysis"] = cross_platform_mapper.get_full_analysis(threshold)

        return response

    def _get_mapping_data(self, include_analysis: bool, threshold: int) -> Dict[str, Any]:
        if include_analysis:
            return cross_platform_mapper.get_full_analysis(threshold)
        return cross_platform_mapper.get_summary()

    def _compare_following(self, threshold: int) -> Dict[str, Any]:
        return cross_platform_mapper.compare_following_across_platforms(threshold)

    def _analyze_influence(self, threshold: int) -> Dict[str, Any]:
        return cross_platform_mapper.analyze_cross_platform_influence(threshold)

    def _clear_data(self) -> Dict[str, Any]:
        cross_platform_mapper.clear_cards()
        return {"status": "success", "message": "All social data cleared"}

    async def invoke_trigger(self, command: int, data: Any = None) -> Any:
        if command == SOCIAL_REQUEST_COMMANDS.S_INIT:
            return {"status": "initialized"}

        if command == SOCIAL_REQUEST_COMMANDS.S_SCRAPE_INSTAGRAM:
            return await asyncio.to_thread(
                self._scrape_single,
                SOCIAL_PLATFORMS.INSTAGRAM,
                data.get("username"),
                data.get("max_followers", 50),
                data.get("max_following", 50),
                True
            )

        if command == SOCIAL_REQUEST_COMMANDS.S_SCRAPE_FACEBOOK:
            return await asyncio.to_thread(
                self._scrape_single,
                SOCIAL_PLATFORMS.FACEBOOK,
                data.get("username"),
                data.get("max_followers", 50),
                data.get("max_following", 50),
                True
            )

        if command == SOCIAL_REQUEST_COMMANDS.S_SCRAPE_BEHANCE:
            return await asyncio.to_thread(
                self._scrape_single,
                SOCIAL_PLATFORMS.BEHANCE,
                data.get("username"),
                data.get("max_followers", 50),
                data.get("max_following", 50),
                True
            )

        if command == SOCIAL_REQUEST_COMMANDS.S_SCRAPE_VIMEO:
            return await asyncio.to_thread(
                self._scrape_single,
                SOCIAL_PLATFORMS.VIMEO,
                data.get("username"),
                data.get("max_followers", 50),
                data.get("max_following", 50),
                True
            )

        if command == SOCIAL_REQUEST_COMMANDS.S_SCRAPE_MULTIPLE:
            return await asyncio.to_thread(
                self._scrape_multiple,
                data.get("targets", []),
                data.get("compare_results", False),
                data.get("similarity_threshold", 70),
                data.get("max_followers", 50),
                data.get("max_following", 50)
            )

        if command == SOCIAL_REQUEST_COMMANDS.S_GET_MAPPING_DATA:
            return self._get_mapping_data(
                data.get("include_analysis", True),
                data.get("similarity_threshold", 70)
            )

        if command == SOCIAL_REQUEST_COMMANDS.S_COMPARE_FOLLOWING:
            return self._compare_following(data.get("similarity_threshold", 70))

        if command == SOCIAL_REQUEST_COMMANDS.S_ANALYZE_INFLUENCE:
            return self._analyze_influence(data.get("similarity_threshold", 70))

        if command == SOCIAL_REQUEST_COMMANDS.S_CLEAR_DATA:
            return self._clear_data()

        return None