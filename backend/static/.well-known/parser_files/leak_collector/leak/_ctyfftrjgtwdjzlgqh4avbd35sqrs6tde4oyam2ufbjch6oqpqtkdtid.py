from abc import ABC
from typing import List
import re

from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _ctyfftrjgtwdjzlgqh4avbd35sqrs6tde4oyam2ufbjch6oqpqtkdtid(leak_extractor_interface, ABC):
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
            cls._instance = super(_ctyfftrjgtwdjzlgqh4avbd35sqrs6tde4oyam2ufbjch6oqpqtkdtid, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://ctyfftrjgtwdjzlgqh4avbd35sqrs6tde4oyam2ufbjch6oqpqtkdtid.onion/publications"

    @property
    def developer_signature(self) -> str:

        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://ctyfftrjgtwdjzlgqh4avbd35sqrs6tde4oyam2ufbjch6oqpqtkdtid.onion"

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
        return "http://ctyfftrjgtwdjzlgqh4avbd35sqrs6tde4oyam2ufbjch6oqpqtkdtid.onion/contacts"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        page.wait_for_load_state("networkidle",timeout=60000)
        page.wait_for_selector('div.relative.bg-white.cursor-pointer.rounded-lg', timeout=30000)

        card_locators = page.locator('div.relative.bg-white.cursor-pointer.rounded-lg')

        for card_index in range(card_locators.count()):
            card = card_locators.nth(card_index)

            title_locator = card.locator('h2.text-xl.font-semibold.text-gray-800')
            title = title_locator.text_content().strip() if title_locator.count() > 0 else ''

            desc_locator = card.locator('p.text-gray-600.mb-3.line-clamp-2')
            description = desc_locator.inner_text().strip() if desc_locator.count() > 0 else ''

            dump_links = re.findall(r'https?://[^\s#]+(?:#[^\s]*)?', description)

            data_size_match = re.search(r'\d+ files, [\d.]+ tb size', description)
            data_size = data_size_match.group(0) if data_size_match else ''

            fields = {}
            grid_items = card.locator('div.text-sm.text-gray-500 > div')
            for item in grid_items.all():
                text = item.inner_text().strip()
                if ':' in text:
                    key, value = text.split(':', 1)
                    fields[key.strip()] = value.strip()

            revenue = fields.get('Revenue', '')
            category = fields.get('Category', '')
            in_stock = fields.get('In Stock', '')

            image_srcs = []
            logo_locator = card.locator('img.h-8.w-8.object-contain')
            logo_src = logo_locator.get_attribute('src') if logo_locator.count() > 0 else None
            if logo_src:
                image_srcs.append(self.base_url + logo_src if logo_src.startswith('/') else logo_src)

            preview_locator = card.locator('img.h-48.w-full.object-cover')
            preview_src = preview_locator.get_attribute('src') if preview_locator.count() > 0 else None
            if preview_src:
                image_srcs.append(self.base_url + preview_src if preview_src.startswith('/') else preview_src)

            m_content = (
                f"Title: {title}\n"
                f"Description: {description}\n"
                f"Data Size: {data_size}\n"
                f"Dump Links: {', '.join(dump_links)}\n"
                f"Revenue: {revenue}\n"
                f"Category: {category}\n"
                f"In Stock: {in_stock}\n"
                f"Image SRCs: {', '.join(image_srcs)}"
            )
            domain = re.search(r'\b(?:https?://)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b', title)
            ref_html = None
            if domain:
                domain = domain.group(1)
                ref_html = helper_method.extract_refhtml(domain, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

            card_data = leak_model(
                m_title=title,
                m_ref_html=ref_html,
                m_url=self.seed_url,
                m_base_url=self.base_url,
                m_content=m_content,
                m_network=helper_method.get_network_type(self.base_url),
                m_screenshot=helper_method.get_screenshot_base64(page, title,self.base_url),
                m_important_content=description,
                m_dumplink=dump_links,
                m_content_type=["leaks"],
                m_data_size=data_size,
                m_revenue=revenue,
                m_logo_or_images=image_srcs,

            )

            entity_data = entity_model(
                m_team="Clist",
                m_industry=category,
                m_scrap_file = self.__class__.__name__,
            )

            self.append_leak_data(card_data, entity_data)



