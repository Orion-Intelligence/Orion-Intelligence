import datetime
from abc import ABC
from typing import List
from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page


class _nerqnacjmdy3obvevyol7qhazkwkv57dwqvye5v46k5bcujtfa6sduad(leak_extractor_interface, ABC):
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
            cls._instance = super(_nerqnacjmdy3obvevyol7qhazkwkv57dwqvye5v46k5bcujtfa6sduad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "http://nerqnacjmdy3obvevyol7qhazkwkv57dwqvye5v46k5bcujtfa6sduad.onion/"

    @property
    def base_url(self) -> str:
        return "http://nerqnacjmdy3obvevyol7qhazkwkv57dwqvye5v46k5bcujtfa6sduad.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=True, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "kairossup@onionmail.com"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        visited_cards = set()
        self._is_crawled = False

        while not self.is_crawled:
            page.wait_for_load_state("domcontentloaded")

            cards = page.locator("main .grid [data-slot='card']")
            page.wait_for_selector("main .grid [data-slot='card']", timeout=10000)

            if cards.count() == 0:
                self._is_crawled = True
                break

            for i in range(cards.count()):
                card = cards.nth(i)
                card_text = card.inner_text()

                if card_text in visited_cards:
                    continue
                visited_cards.add(card_text)

                card.scroll_into_view_if_needed()

                card.locator("div[data-slot='card-header']").click(force=True, no_wait_after=True)

                page.wait_for_url("**/service?serviceId=**", wait_until="domcontentloaded", timeout=10000)

                title = page.locator("h1.text-xl").text_content().strip()

                content_el = page.locator("p.text-muted-foreground").first
                content = content_el.text_content().strip() if content_el.count() else "N/A"

                website_el = page.locator("label:has-text('Website') + a")
                website = website_el.get_attribute("href") if website_el.count() else "N/A"

                data_info_el = page.locator("label:has-text('Data Size & Created') + p")
                data_info = data_info_el.text_content().strip() if data_info_el.count() else "N/A"
                date_time = "N/A"
                if "•" in data_info:
                    date_time = data_info.split("•")[-1].strip()

                contact_lines = page.locator("label:has-text('Contact') ~ div p").all_text_contents()
                address = contact_lines[0].strip() if contact_lines else "N/A"

                image_elements = page.locator("main img")
                image_urls = []
                for j in range(image_elements.count()):
                    src = image_elements.nth(j).get_attribute("src")
                    if src:
                        image_urls.append(src)

                all_links = page.locator("a[href]")
                dumplinks = []
                for j in range(all_links.count()):
                    href = all_links.nth(j).get_attribute("href")
                    if href and ".onion" in href:
                        dumplinks.append(href.strip())

                title = title.split("\\")[0]
                ref_html = helper_method.extract_refhtml(
                    website, self.invoke_db, REDIS_COMMANDS,
                    CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page
                )

                card_data = leak_model(
                    m_ref_html=ref_html,
                    m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                    m_title=title,
                    m_content=content + " " + self.base_url + " " + page.url,
                    m_weblink=[website],
                    m_logo_or_images=image_urls,
                    m_revenue="N/A",
                    m_leak_date=datetime.datetime.strptime(date_time,"%m/%d/%Y").date() if date_time != "N/A" else None,
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=content,
                    m_dumplink=dumplinks,
                    m_content_type=["leaks"],
                )

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_location=[address] if address != "N/A" else [],
                    m_company_name=title,
                    m_industry="N/A",
                    m_team="kairos"
                )

                self.append_leak_data(card_data, entity_data)

                page.go_back()
                page.wait_for_selector("main .grid [data-slot='card']", timeout=10000)

            next_button = page.locator('button:has-text("Next")')
            if next_button.count() > 0 and next_button.is_enabled():
                next_button.click(no_wait_after=True)
                page.wait_for_selector("main .grid [data-slot='card']", timeout=10000)
            else:
                self._is_crawled = True