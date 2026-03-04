from abc import ABC
from typing import List
import re
from playwright.sync_api import Page
from datetime import datetime

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _bravoxxtrmqeeevhl7gdh2yzvlrjxajr66d33c7ozosrccx4cz7cepad(leak_extractor_interface, ABC):
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
            cls._instance = super(_bravoxxtrmqeeevhl7gdh2yzvlrjxajr66d33c7ozosrccx4cz7cepad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://bravoxxtrmqeeevhl7gdh2yzvlrjxajr66d33c7ozosrccx4cz7cepad.onion"

    @property
    def developer_signature(self) -> str:
        return "Muhammad Hannan Zahid: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hOii"

    @property
    def base_url(self) -> str:
        return "http://bravoxxtrmqeeevhl7gdh2yzvlrjxajr66d33c7ozosrccx4cz7cepad.onion"

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
        return "http://bravoxxtrmqeeevhl7gdh2yzvlrjxajr66d33c7ozosrccx4cz7cepad.onion/contact"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        all_urls = []
        while True:
            page.wait_for_selector('div.bg-card.relative.flex.h-full.flex-col.overflow-hidden.rounded-lg.border.shadow-md')

            cards = page.locator('div.mb-6.grid.grid-cols-1.gap-6.md\\:grid-cols-2.lg\\:grid-cols-3 > div.bg-card.relative.flex.h-full.flex-col.overflow-hidden.rounded-lg.border.shadow-md').all()

            for card in cards:
                if card.locator('div.flex.flex-1.flex-col.space-y-4.p-6 > p.absolute.inset-0.top-1\\/2.px-10.font-semibold').count() > 0:
                    continue

                url1 = card.locator('div.flex.flex-1.flex-col.space-y-4.p-6 > div.flex.flex-col.items-center > a[href]').first.get_attribute('href')
                complete_url = self.seed_url + url1
                all_urls.append(complete_url)

            if self.is_crawled:
                break

            next_btn = page.locator('button[aria-label="Next Page"]')
            if next_btn.count() > 0 and not next_btn.is_disabled():
                next_btn.click()
                page.wait_for_timeout(3000)
            else:
                break

        for url in all_urls:
            page.goto(url, wait_until='domcontentloaded')
            page.wait_for_selector('div.container div.bg-card')

            address = page.locator('div.container.mx-auto > div.bg-card.border.shadow-md').first

            title_date_comlink_rev = address.locator('div.grid.grid-cols-3.items-center').first
            date_span_loc = title_date_comlink_rev.locator('div.flex.items-center > span.text-muted-foreground.font-mono.text-sm')
            date_span = date_span_loc.first.inner_text().strip() if date_span_loc.count() > 0 else None

            date = None
            if date_span:
                date_text = date_span
                if date_text and "until release" not in date_text:
                    date_obj = datetime.strptime(date_span, '%d/%m/%Y %H:%M')
                    date = date_obj.date()

            title_el_loc = title_date_comlink_rev.locator('h3.text-xl.font-semibold')
            title_el = title_el_loc.first.inner_text().strip() if title_el_loc.count() > 0 else None

            if title_el:
                title = re.sub(r'[^a-zA-Z0-9 ]', '', title_el).strip()
            else:
                title = None

            company_link = []
            company_link_button = title_date_comlink_rev.locator('div.flex.flex-col.items-center > div.flex.gap-2').first

            company_link_a = company_link_button.locator('a[href]')
            if company_link_a.count() > 0:
                company_link.append(company_link_a.first.get_attribute('href'))

            revenue = None
            for btn in company_link_button.locator('button').all():
                if btn.locator('a[href]').count() == 0:
                    text_val = btn.inner_text().strip()
                    if "$" in text_val:
                        revenue = text_val

            data_size_dump_link = address.locator('div.flex.items-center.justify-between').first

            data_size = None

            data_size_button = data_size_dump_link.locator('div.grid.grid-cols-4.items-center.gap-2.space-x-4 > button').all()
            if len(data_size_button) >= 4:
                fourth_button = data_size_button[3]
                size_span = fourth_button.locator('div.flex.items-center.text-sm > span')
                if size_span.count() > 0:
                    data_size = size_span.first.inner_text().strip()

            dump_link = data_size_dump_link.locator('button > a.cursor-pointer[href]')
            if dump_link.count() > 0:
                completed_dump_link = [self.seed_url + dump_link.first.get_attribute('href')]
            else:
                completed_dump_link = []
            imp_desc = address.locator('p.text-muted-foreground.flex-1')
            important_description = imp_desc.inner_text().strip() if imp_desc.count() > 0 else ""

            paragraphs = address.locator('div.markdown-content > p').all()
            description_parts = []
            image_links = []
            for p in paragraphs:
                img = p.locator('img')
                if img.count() > 0:
                    src = img.first.get_attribute('src')
                    if not src.startswith('http'):
                        complete_src = self.seed_url + src
                    else:
                        complete_src = src
                    image_links.append(complete_src)
                else:
                    text = p.inner_text().strip()
                    if text:
                        description_parts.append(text)
            full_description = "\n".join(description_parts)

            tags = address.locator('div.flex.flex-wrap.gap-2 > span').all()
            tags_collected = []
            for tag in tags:
                t_text = tag.inner_text().strip()
                tags_collected.append(t_text)

            ref_html = helper_method.extract_refhtml(title, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

            card_data = leak_model(
                m_ref_html=ref_html,
                m_title=title,
                m_url=url,
                m_base_url=self.base_url,
                m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                m_content=full_description,
                m_important_content=important_description,
                m_network=helper_method.get_network_type(self.base_url),
                m_content_type=["leaks"],
                m_leak_date=date,
                m_dumplink=completed_dump_link,
                m_websites=company_link,
                m_logo_or_images=image_links,
                m_data_size=data_size,
                m_revenue=revenue
            )

            entity_data = entity_model(
                m_tags=tags_collected,
                m_company_name=title
            )

            self.append_leak_data(card_data, entity_data)