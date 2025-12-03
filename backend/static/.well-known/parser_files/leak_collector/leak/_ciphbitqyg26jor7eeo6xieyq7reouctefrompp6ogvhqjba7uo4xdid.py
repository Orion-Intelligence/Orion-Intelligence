from abc import ABC
from typing import List
from datetime import datetime

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method
from crawler.crawler_services.log_manager.log_controller import log


class _ciphbitqyg26jor7eeo6xieyq7reouctefrompp6ogvhqjba7uo4xdid(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()
        self._is_crawled = False

    def init_callback(self, callback=None):
        self.callback = callback

    def __new__(cls, callback=None):
        if cls._instance is None:
            cls._instance = super(_ciphbitqyg26jor7eeo6xieyq7reouctefrompp6ogvhqjba7uo4xdid, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://ciphbitqyg26jor7eeo6xieyq7reouctefrompp6ogvhqjba7uo4xdid.onion"

    @property
    def developer_signature(self) -> str:
        return "open:open"

    @property
    def base_url(self) -> str:
        return "http://ciphbitqyg26jor7eeo6xieyq7reouctefrompp6ogvhqjba7uo4xdid.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://ciphbitqyg26jor7eeo6xieyq7reouctefrompp6ogvhqjba7uo4xdid.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_load_state("networkidle")

            page.evaluate(
                """() => {
                    if (!window.__captured_open_urls) {
                        window.__captured_open_urls = [];
                        const _open = window.open;
                        window.open = function(url, target, features) {
                            try { window.__captured_open_urls.push(url); } catch(e) {}
                            return _open.apply(this, arguments);
                        };
                    }
                }"""
            )

            card_handles = page.query_selector_all("div.card")

            for card in card_handles:
                title = ""
                weblink = ""
                date_text = ""
                content = ""
                dumplink = ""

                title_handle = card.query_selector("h2.post-title a.title")
                if title_handle:
                    title = (title_handle.inner_text() or "").strip()
                    weblink_attr = title_handle.get_attribute("href")
                    if weblink_attr:
                        weblink = weblink_attr.strip()

                date_handle = card.query_selector(".post-header .post-meta span")
                if date_handle:
                    date_text = (date_handle.inner_text() or "").strip()

                content_handle = card.query_selector("span[data-details]")
                if content_handle:
                    content_attr = content_handle.get_attribute("data-details")
                    if content_attr:
                        content = content_attr.strip()

                published_handle = card.query_selector("div.post-footer a.mouse")
                if published_handle:
                    href_attr = published_handle.get_attribute("href")
                    onclick_attr = published_handle.get_attribute("onclick")

                    if href_attr and href_attr.strip().lower().startswith("http"):
                        dumplink = href_attr.strip()
                    elif onclick_attr:
                        import re
                        m = re.search(r"window\\.open\\(['\\\"]([^'\\\"]+)['\\\"])", onclick_attr)
                        if m:
                            dumplink = m.group(1).strip()
                    else:
                        current_url = page.url
                        published_handle.click()
                        page.wait_for_timeout(400)

                        captured = page.evaluate(
                            """() => {
                                try {
                                    if (!window.__captured_open_urls) return null;
                                    return window.__captured_open_urls.length ? window.__captured_open_urls.pop() : null;
                                } catch (e) { return null; }
                            }"""
                        )
                        if captured:
                            dumplink = captured
                        else:
                            new_url = page.url
                            if new_url and new_url != current_url:
                                dumplink = new_url
                                try:
                                    page.go_back(wait_until="domcontentloaded", timeout=30000)
                                    page.wait_for_load_state("networkidle", timeout=30000)
                                except:
                                    pass

                leak_date = None
                if date_text:
                    for fmt in ("%b %d, %Y", "%B %d, %Y", "%d %b %Y", "%d %B %Y"):
                        try:
                            leak_date = datetime.strptime(date_text, fmt).date()
                            break
                        except Exception:
                            continue

                if dumplink and not dumplink.startswith("http"):
                    dumplink = f"{self.base_url.rstrip('/')}/{dumplink.lstrip('/')}"
                    if not dumplink.endswith('/'):
                        dumplink += '/'

                card_data = leak_model(
                    m_title=title if title else "",
                    m_url=page.url,
                    m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                    m_base_url=self.base_url,
                    m_content=content if content else "",
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=(content[:500] if content else ""),
                    m_weblink=[weblink] if weblink else [],
                    m_dumplink=[dumplink] if dumplink else [],
                    m_content_type=["leaks"],
                    m_leak_date=leak_date,
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_team="Ciphbit",
                )

                self.append_leak_data(card_data, entity_data)

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))