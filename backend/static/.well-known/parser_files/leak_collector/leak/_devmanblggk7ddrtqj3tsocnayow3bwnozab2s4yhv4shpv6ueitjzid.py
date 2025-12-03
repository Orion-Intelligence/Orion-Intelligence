from abc import ABC
from typing import List
from datetime import datetime
import re

from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _devmanblggk7ddrtqj3tsocnayow3bwnozab2s4yhv4shpv6ueitjzid(leak_extractor_interface, ABC):
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
            cls._instance = super(_devmanblggk7ddrtqj3tsocnayow3bwnozab2s4yhv4shpv6ueitjzid, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://devmanblggk7ddrtqj3tsocnayow3bwnozab2s4yhv4shpv6ueitjzid.onion"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://devmanblggk7ddrtqj3tsocnayow3bwnozab2s4yhv4shpv6ueitjzid.onion"

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
        return "http://devmanblggk7ddrtqj3tsocnayow3bwnozab2s4yhv4shpv6ueitjzid.onion"

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

            card_handles = page.query_selector_all("div.article")
            for card in card_handles:
                title = ""
                weblink = ""
                data_size = ""
                revenue = ""

                h2 = card.query_selector("div.article-head h2") or card.query_selector("h2")
                if h2:
                    title = (h2.inner_text() or "").strip()
                    a = h2.query_selector("a")
                    if a:
                        href = a.get_attribute("href")
                        if href:
                            weblink = href.strip()
                    else:
                        if title and "." in title:
                            weblink = title

                p_elems = card.query_selector_all("p")
                for p in p_elems:
                    cls = (p.get_attribute("class") or "").strip()
                    if "countdown" in cls:
                        continue
                    in_hidden = p.evaluate("el => !!el.closest('.hidden-text')")
                    if in_hidden:
                        continue

                    text = (p.inner_text() or "").strip()
                    if not text:
                        continue

                    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
                    for ln in lines:
                        low = ln.lower()

                        ds_match = re.search(r'(\d[\d\.,]*\s*(?:kb|mb|gb|tb|kib|mib|gib))', low)
                        if ds_match and not data_size:
                            data_size = ds_match.group(1).replace(" ", "")
                            continue

                        rev_match = re.search(r'(\$\s*[\d\.,]+|[\d\.,]+\s*(?:k|m|b)\b)', low)
                        if rev_match and not revenue:
                            revenue = rev_match.group(1).replace(" ", "")
                            continue

                    if not data_size or not revenue:
                        if len(lines) >= 2:
                            first, second = lines[0], lines[1]
                            low_first, low_second = first.lower(), second.lower()
                            if (not data_size) and any(u in low_first for u in ("gb", "mb", "tb", "kb")):
                                data_size = first.replace(" ", "")
                            if (not revenue) and ("$" in low_second or re.search(r'[\d\.,]+(?:k|m|b)\b', low_second)):
                                revenue = second.replace(" ", "")

                    break

                parts = []
                if title:
                    parts.append(title)
                if data_size:
                    parts.append(data_size)
                if revenue:
                    parts.append(revenue)
                content = " | ".join(parts)
                important_content = content[:500] if content else ""

                ref_html = helper_method.extract_refhtml(weblink, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)
                card_data = leak_model(
                    m_ref_html=ref_html,
                    m_title=title if title else "",
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_content=content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                    m_important_content=important_content,
                    m_weblink=[weblink] if weblink else [],
                    m_content_type=["leaks"],
                    m_data_size=data_size if data_size else "",
                    m_revenue=revenue if revenue else "",
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_team="DevMan",
                )

                self.append_leak_data(card_data, entity_data)

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))