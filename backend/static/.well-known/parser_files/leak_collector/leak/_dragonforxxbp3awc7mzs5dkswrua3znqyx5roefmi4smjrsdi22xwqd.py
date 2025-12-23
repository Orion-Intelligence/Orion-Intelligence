from abc import ABC
from typing import List
from urllib.parse import urljoin
import re

from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method


class _dragonforxxbp3awc7mzs5dkswrua3znqyx5roefmi4smjrsdi22xwqd(leak_extractor_interface, ABC):
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
            cls._instance = super(_dragonforxxbp3awc7mzs5dkswrua3znqyx5roefmi4smjrsdi22xwqd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://dragonforxxbp3awc7mzs5dkswrua3znqyx5roefmi4smjrsdi22xwqd.onion"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://dragonforxxbp3awc7mzs5dkswrua3znqyx5roefmi4smjrsdi22xwqd.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return self.base_url

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def _normalize_weblink(self, href: str, base: str) -> str:
        if not href:
            return ""
        href = href.strip()
        if href.startswith("http://") or href.startswith("https://"):
            return href
        if href.startswith("//"):
            return "http:" + href
        if re.match(r'^[\w\.-]+\.[a-z]{2,}$', href, re.IGNORECASE):
            return "http://" + href.lstrip("./")
        return urljoin(base, href)

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_load_state("networkidle", timeout=60000)
            listing_base = page.url or self.base_url

            items = page.evaluate(
                """() => {
                    const res = [];
                    const container = document.querySelector('.companies-list');
                    if (!container) return res;
                    const children = Array.from(container.children);
                    for (let i = 0; i < children.length; i++) {
                        const el = children[i];
                        if (!el || !el.classList) continue;
                        if (el.classList.contains('text')) {
                            const a = el.querySelector('a');
                            const href = a ? (a.getAttribute('href') || '') : '';
                            const title = a ? (a.innerText || '').trim() : (el.innerText || '').trim();
                            // find following .timer and .number siblings (nearest)
                            let timer = '';
                            let data = '';
                            for (let j = i+1; j < children.length; j++) {
                                const s = children[j];
                                if (!s || !s.classList) continue;
                                if (s.classList.contains('timer')) {
                                    timer = s.innerText.trim();
                                }
                                if (s.classList.contains('number')) {
                                    const b = s.querySelector('b');
                                    if (b && b.textContent) data = b.textContent.trim();
                                    break;
                                }
                                // stop if next text encountered (prevent crossing groups)
                                if (s.classList.contains('text')) break;
                            }
                            res.push({ href, title, timer, data });
                        }
                    }
                    return res;
                }"""
            )

            for it in items:
                href = (it.get("href") or "").strip()
                title_text = (it.get("title") or "").strip()
                timer_text = (it.get("timer") or "").strip()
                data_size = (it.get("data") or "").strip()

                if not title_text and not href:
                    continue

                weblink = ""
                m = re.search(r'\(([^)]+)\)', title_text)
                if m:
                    weblink = self._normalize_weblink(m.group(1).strip(), listing_base)
                elif href:
                    weblink = self._normalize_weblink(href, listing_base)

                parts = []
                if title_text:
                    parts.append(title_text)
                if timer_text:
                    parts.append(timer_text)
                if data_size:
                    parts.append(data_size)
                if weblink:
                    parts.append(weblink)
                content = " | ".join(parts)
                important_content = content[:500] if content else ""

                weblinks_for_item = [weblink] if weblink else []
                dumplinks_for_item: List[str] = []

                detail_url = urljoin(listing_base, href) if href else None
                if detail_url:
                    page.goto(detail_url, wait_until="domcontentloaded", timeout=60000)
                    page.wait_for_load_state("networkidle", timeout=60000)

                    cur = page.url or detail_url or ""
                    if cur:
                        dumplinks_for_item.append(cur)

                    items_links = page.query_selector_all(".items-list a[href], .items-list .item a[href]")
                    for a in items_links:
                        h2 = (a.get_attribute("href") or "").strip()
                        if not h2:
                            continue
                        abs_href = urljoin(page.url or detail_url, h2)
                        if abs_href not in dumplinks_for_item:
                            dumplinks_for_item.append(abs_href)

                    page.go_back(wait_until="domcontentloaded", timeout=60000)
                    page.wait_for_load_state("networkidle", timeout=60000)

                if len(weblinks_for_item)>0:
                    ref_html = helper_method.extract_refhtml(weblinks_for_item[0], self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)
                else:
                    ref_html = ""

                card_data = leak_model(
                    m_ref_html = ref_html,
                    m_title=title_text if title_text else "",
                    m_screenshot=helper_method.get_screenshot_base64(page, title_text, self.base_url),
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_content=content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=important_content,
                    m_weblink=weblinks_for_item,
                    m_dumplink=dumplinks_for_item,
                    m_content_type=["leaks"],
                    m_data_size=data_size if data_size else ""
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_team="DragonForce",
                )

                self.append_leak_data(card_data, entity_data)

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))