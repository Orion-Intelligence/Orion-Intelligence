from abc import ABC
from typing import List
from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _bianlianlbc5an4kgnay3opdemgcryg2kpfcbgczopmm3dnbz3uaunad(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def init_callback(self, callback=None):
        self.callback = callback

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://bianlianlbc5an4kgnay3opdemgcryg2kpfcbgczopmm3dnbz3uaunad.onion"

    @property
    def base_url(self) -> str:
        return self.seed_url

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "swikipedia@onionmail.org"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            while True:
                page.wait_for_load_state("networkidle")

                read_more_count = page.locator('a.readmore').count()
                if read_more_count == 0:
                    return

                for i in range(read_more_count):
                    try:
                        read_more_link = page.locator('a.readmore').nth(i)
                        read_more_link.click()
                        page.wait_for_load_state("networkidle")

                        title_elem = page.locator('article div.title h1.title')
                        title = title_elem.text_content().strip() if title_elem.count() > 0 else "No title found"

                        description_elem = page.locator('section.body p').first
                        description = description_elem.text_content().strip() if description_elem.count() > 0 else ""

                        weblink_elem = page.locator('section.body a[href^="https://"]').first
                        weblink = [weblink_elem.get_attribute('href')] if weblink_elem.count() > 0 else []

                        revenue_elem = page.locator('section.body p:has-text("Revenue")').first
                        revenue = revenue_elem.text_content().split(':')[
                            -1].strip() if revenue_elem.count() > 0 else None

                        data_size_elem = page.locator('section.body p:has-text("Data Volume")').first
                        data_size = data_size_elem.text_content().split(':')[
                            -1].strip() if data_size_elem.count() > 0 else None

                        dump_links = [f"{self.base_url}{link.get_attribute('href')}" for link in
                                      page.locator('section.body a[href^="/dl/"]').all()]

                        images = [
                            f"{self.base_url}{img.get_attribute('src')}" if not img.get_attribute('src').startswith(
                                'http')
                            else img.get_attribute('src')
                            for img in page.locator('section.body img').all()
                        ]

                        card_data = leak_model(
                            m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                            m_title=title,
                            m_url=page.url,
                            m_base_url=self.base_url,
                            m_content=description + " " + self.base_url + " " + page.url,
                            m_network=helper_method.get_network_type(page.url),
                            m_important_content=description,
                            m_weblink=weblink,
                            m_logo_or_images=images,
                            m_dumplink=dump_links,
                            m_content_type=["leaks"],
                            m_revenue=revenue,
                            m_data_size=data_size
                        )

                        entity_data = entity_model(
                            m_email=helper_method.extract_emails(description),
                        )
                        entity_data = helper_method.extract_entities(description, entity_data)

                        self.append_leak_data(card_data, entity_data)

                        page.go_back()
                        page.wait_for_load_state("networkidle")

                    except Exception as link_ex:
                        print(f"Error processing entry {i}: {str(link_ex)}")
                        page.go_back()
                        page.wait_for_load_state("networkidle")
                        continue

                next_button = page.locator('a:has-text("Next")').first
                if next_button.count() > 0:
                    next_button.click()
                    page.wait_for_load_state("networkidle")
                else:
                    break

        except Exception as e:
            print(f"Error parsing leak data: {str(e)}")

