import re
from abc import ABC
from time import sleep
from typing import List
from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page


class _3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd(leak_extractor_interface, ABC):
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

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd, cls).__new__(cls)
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd.onion/"

    @property
    def base_url(self) -> str:
        return "http://3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=False, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_load_state("networkidle")

        cards = page.locator("div.card")
        count = cards.count()

        for index in range(count):
            attempt = 0
            try:
                card = cards.nth(index)
                title_element = card.locator("h5.card-title")
                card_title_text = title_element.text_content().strip() if title_element.count() else ""
                card_title_url = helper_method.clean_text(card_title_text)

                text_element = card.locator("p.card-text")
                card_text = text_element.text_content().strip() if text_element.count() else ""

                size_match = re.search(r"\b(\d+(?:\.\d+)?\s?(?:KB|MB|GB|TB|PB|KiB|MiB|GiB|TiB))\b", card_text,
                                       flags=re.IGNORECASE)
                dump_size = size_match.group(1).upper() if size_match else None

                page.locator('button:has-text("Show")').nth(index).click()
                page.wait_for_selector(".modal-content", timeout=5000)

                modal = page.locator("div.modal-content")
                if not modal.count():
                    continue

                title_element = modal.locator("h5#full-card-title")
                title_url = helper_method.clean_text(title_element.text_content().strip()) if title_element.count() else card_title_url

                raw_body_element = modal.locator("p#full-card-text")
                if not raw_body_element.count():
                    continue

                raw_html = raw_body_element.inner_html()
                raw_lines = [line.strip() for line in raw_html.split("<br>") if line.strip()]
                raw_lines = [page.evaluate("(html) => { const div = document.createElement('div'); div.innerHTML = html; return div.textContent; }", line) for line in raw_lines]

                title_name = helper_method.clean_text(raw_lines[0]) if raw_lines else ""
                description_lines = raw_lines[1:] if len(raw_lines) > 1 else []
                description_text = helper_method.clean_text("\n".join(description_lines))

                if not re.match(r"^(https?:\/\/)?([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}$", title_url.strip()):
                    title_name = title_url
                    title_url = None

                if not title_url:
                    url_match = re.search(r"\b(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9\-]+\.[a-zA-Z]{2,})(\/\S*)?",
                                          description_text)
                    title_url = url_match.group(1) if url_match else None

                if not title_url:
                    title_url = self.base_url

                password_match = re.search(r'password\s*[:\-]?\s*([^\s<>\n]+)', description_text, flags=re.IGNORECASE)

                links_element = modal.locator("p#full-card-links")
                dump_links = links_element.locator("a[href]").evaluate_all("els => els.map(el => el.href)") if links_element.count() else []

                full_text = f"{title_url or ''}\n{title_name}\n{description_text}\n{self.seed_url}\n{self.base_url}"

                ref_html = helper_method.extract_refhtml(title_url, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)
                sleep(0.5)

                card_data = leak_model(
                    m_ref_html=ref_html,
                    m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
                    m_title=title_name,
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_content=full_text,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=description_text,
                    m_dumplink=dump_links,
                    m_content_type=["leaks"],
                    m_data_size=dump_size,
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_company_name=title_name if title_name else None,
                    m_team="abyss"
                )

                self.append_leak_data(card_data, entity_data)

                page.locator(".modal .btn-close").click()
                attempt = 0

            except Exception as ex:
                log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                attempt += 1
                if attempt >= 3:
                    break
