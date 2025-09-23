from abc import ABC
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method
import re
from datetime import datetime

class _netleaks(leak_extractor_interface, ABC):
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
            cls._instance = super(_netleaks, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "https://netleaks.net/databases"

    @property
    def base_url(self) -> str:
        return "https://netleaks.net"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://netleaks.net/contact/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):

        post_elements = page.locator('li a[href^="/blog/"]').all()
        post_ids = []

        for element in post_elements:
            href = element.get_attribute('href')
            if href and href.startswith('/blog/'):
                post_id = href.split('/')[-1]
                post_ids.append(post_id)

        for post_id in post_ids:
            post_url = f"{self.base_url}/blog/{post_id}"
            try:
                page.goto(post_url)
            except Exception as e:
                print(f"Failed to load {post_url}: {e}")
                continue

            title = page.locator('h1.text-4xl.lg\\:text-5xl.font-bold').inner_text()
            description = page.locator('div.prose.prose-lg p:not([align="center"])').nth(0).inner_text()

            image_elements = page.locator('div.prose.prose-lg img')
            image_urls = []

            for i in range(image_elements.count()):
                src = image_elements.nth(i).get_attribute('src')
                if src:
                    image_urls.append(src)

            file_info_element = page.locator('div.prose.prose-lg pre').nth(0).inner_text()
            file_info = file_info_element.strip()


            compressed_size = ""
            uncompressed_size = ""
            breach_date = None
            location = ""

            compressed_match = re.search(r'Compressed\s*:\s*([\d.]+)\s*(MB|GB)', file_info)
            if compressed_match:
                compressed_size = f"{compressed_match.group(1)} {compressed_match.group(2)}"

            uncompressed_match = re.search(r'Uncompressed\s*:\s*([\d.]+)\s*(MB|GB)', file_info)
            if uncompressed_match:
                uncompressed_size = f"{uncompressed_match.group(1)} {uncompressed_match.group(2)}"

            date_match = re.search(r'Breach Date\s*:\s*([A-Za-z, ]+\d{4})', file_info)
            if date_match:
                try:
                    dt = page.locator("time.text-gray-400").get_attribute("datetime")
                    if dt:
                        breach_date = datetime.strptime(dt[:10], "%Y-%m-%d").strftime("%Y-%m-%d")
                except Exception as ex:
                    pass

            location_match = re.search(r'Country\s*:\s*([A-Za-z ]+)', file_info)
            if location_match:
                location = location_match.group(1).strip()

            m_content_text = page.locator('div.prose.prose-lg').inner_text().strip()

            m_content = (
                f"Full Page Content:\n{m_content_text}"
            )

            download_links = []
            h3_elements = page.locator('div.prose.prose-lg h3')
            h3_count = h3_elements.count()

            for i in range(h3_count):
                heading_text = h3_elements.nth(i).inner_text().lower()
                if "download" in heading_text:
                    pre_locator = page.locator('div.prose.prose-lg pre').nth(i)
                    if pre_locator.count() > 0:
                        link_text = pre_locator.inner_text().strip()
                        if link_text.startswith("http"):
                            download_links.append(link_text)


            data_size = f"Compressed: {compressed_size}, Uncompressed: {uncompressed_size}"


            card_data = leak_model(
                m_title=title,
                m_url=post_url,
                m_base_url=self.base_url,
                m_screenshot=helper_method.get_screenshot_base64(page,title,self.base_url),
                m_content=m_content,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=description,
                m_dumplink=download_links,
                m_content_type=["leaks"],
                m_data_size=data_size,
                m_leak_date=breach_date,
                m_logo_or_images=image_urls
            )

            entity_data = entity_model(
                m_scrap_file=self.__class__.__name__,
                m_team="Bjorka",
                m_location=[location],
                m_country=[location]
            )

            self.append_leak_data(card_data, entity_data)
