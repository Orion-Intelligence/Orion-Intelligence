from abc import ABC
from typing import List
from datetime import datetime
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
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _lunalockcccxzkpfovwzifwxcytqkiuak6wzybnniqwxcmpsetpbetid(leak_extractor_interface, ABC):
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
            cls._instance = super(_lunalockcccxzkpfovwzifwxcytqkiuak6wzybnniqwxcmpsetpbetid, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://lunalockcccxzkpfovwzifwxcytqkiuak6wzybnniqwxcmpsetpbetid.onion/victim"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://lunalockcccxzkpfovwzifwxcytqkiuak6wzybnniqwxcmpsetpbetid.onion/victim"

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
        return "http://lunalockcccxzkpfovwzifwxcytqkiuak6wzybnniqwxcmpsetpbetid.onion/contact"

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
            processed_urls = set()

            links = []
            anchors = page.query_selector_all("section.grid a[href], article.group a[href], article a[href]")
            for a in anchors:
                href = a.get_attribute("href")
                if href:
                    links.append(href)

            for link in links:
                detail_url = urljoin(self.base_url, link)

                if detail_url in processed_urls:
                    continue
                processed_urls.add(detail_url)

                try:
                    with page.expect_navigation(wait_until="domcontentloaded"):
                        page.goto(detail_url)
                except Exception:
                    page.goto(detail_url, wait_until="domcontentloaded", timeout=30000)

                try:
                    page.wait_for_load_state("networkidle", timeout=15000)
                except Exception:
                    pass

                title = ""
                h1 = page.query_selector("h1")
                if h1:
                    title = (h1.inner_text() or "").strip()

                leak_date = None
                date_str = ""
                time_el = page.query_selector("header time, .mx-auto time, time")
                if time_el:
                    dt_attr = time_el.get_attribute("datetime")
                    if dt_attr:
                        date_str = dt_attr.strip()
                        try:
                            if date_str.endswith("Z"):
                                dt_clean = date_str.replace("Z", "+00:00")
                                parsed = datetime.fromisoformat(dt_clean)
                            else:
                                parsed = datetime.fromisoformat(date_str)
                            leak_date = parsed.date()
                        except Exception:
                            leak_date = None
                    else:
                        date_text = (time_el.inner_text() or "").strip()
                        date_str = date_text
                        try:
                            parsed = datetime.strptime(date_text, "%B %d, %Y")
                            leak_date = parsed.date()
                        except Exception:
                            leak_date = None

                industry = ""
                country = ""
                try:
                    chip_container = page.query_selector("header .mt-3, header .mt-3.flex, header .flex.mt-3, .mt-3.flex, .mt-3")
                    chips = []
                    if chip_container:
                        chip_elements = chip_container.query_selector_all("span.chip, span.inline.chip, .chip")
                        for ch in chip_elements:
                            txt = (ch.inner_text() or "").strip()
                            if not txt or txt == "•" or txt.lower().startswith("added"):
                                continue
                            chips.append(txt)
                    if not chips:
                        all_spans = page.query_selector_all("header span, header .chip, .chip")
                        for sp in all_spans:
                            txt = (sp.inner_text() or "").strip()
                            if not txt or txt == "•" or txt.lower().startswith("added"):
                                continue
                            chips.append(txt)
                    country_candidates = [c for c in chips if re.fullmatch(r'[A-Z]{2,3}', c)]
                    if country_candidates:
                        country = country_candidates[0]
                    industry_candidates = [c for c in chips if not re.fullmatch(r'[A-Z]{2,3}', c) and len(c) > 2]
                    if industry_candidates:
                        industry = industry_candidates[0]
                    elif chips:
                        industry = chips[-1]
                except Exception:
                    industry = ""
                    country = ""

                revenue = ""
                h3s = page.query_selector_all("h3")
                fee_text = ""
                for h in h3s:
                    txt = (h.inner_text() or "").strip().lower()
                    if "fee" in txt or "demand" in txt:
                        fee_text = h.evaluate("el => (el.nextElementSibling ? el.nextElementSibling.textContent : '')").strip()
                        if fee_text:
                            break
                if not fee_text:
                    candidate = page.query_selector("div:has-text('Demand'), div:has-text('Fee'), span:has-text('Demand'), span:has-text('Fee')")
                    if candidate:
                        fee_text = (candidate.inner_text() or "").strip()
                if fee_text:
                    fee_text = " ".join(fee_text.split())
                    revenue = fee_text

                weblinks = []
                anchors_ext = page.query_selector_all(".prose.content a, .content a, article a, header a")
                for a in anchors_ext:
                    href2 = a.get_attribute("href") or ""
                    if not href2:
                        continue
                    abs_href = urljoin(detail_url, href2)
                    if abs_href.startswith("http://") or abs_href.startswith("https://"):
                        if abs_href not in weblinks:
                            weblinks.append(abs_href)

                dumplinks = []
                try:
                    h3_leaked = page.query_selector("h3:has-text('Leaked Files')")
                    if h3_leaked:
                        section_handle = h3_leaked.evaluate_handle("el => el.closest('section')")
                        if section_handle:
                            sec_elem = section_handle.as_element()
                            if sec_elem:
                                anchors_section = sec_elem.query_selector_all("a[href]")
                                for a in anchors_section:
                                    href2 = a.get_attribute("href") or ""
                                    if not href2:
                                        continue
                                    abs_href = urljoin(detail_url, href2)
                                    if abs_href not in dumplinks:
                                        dumplinks.append(abs_href)
                except Exception:
                    dumplinks = []

                parts = []
                if title:
                    parts.append(title)
                if date_str:
                    parts.append(date_str)
                elif leak_date:
                    parts.append(str(leak_date))
                if industry:
                    parts.append(industry)
                if revenue:
                    parts.append(revenue)
                content = " | ".join(parts) if parts else ""
                important_content = content[:500] if content else ""

                ref_html = helper_method.extract_refhtml(title, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

                card_data = leak_model(
                    m_ref_html=ref_html,
                    m_title=title if title else "",
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_content=content,
                    m_screenshot=helper_method.get_screenshot_base64(page, "", self.base_url),
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=important_content,
                    m_weblink=weblinks if weblinks else [],
                    m_dumplink=dumplinks if dumplinks else [],
                    m_content_type=["leaks"],
                )

                if hasattr(card_data, "m_leak_date"):
                    card_data.m_leak_date = leak_date if leak_date else None
                if hasattr(card_data, "m_industry"):
                    card_data.m_industry = industry if industry else ""
                if hasattr(card_data, "m_revenue"):
                    card_data.m_revenue = revenue if revenue else ""
                if hasattr(card_data, "m_country"):
                    card_data.m_country = country if country else ""

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_team="lunalock",
                    m_industry=industry,
                    m_country=[country],
                    m_location=[country],
                )

                self.append_leak_data(card_data, entity_data)

                page.go_back(wait_until="domcontentloaded", timeout=30000)
                try:
                    page.wait_for_load_state("networkidle", timeout=30000)
                except Exception:
                    pass

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
