from abc import ABC
from datetime import datetime
from typing import List

from playwright.sync_api import Page, Error as PlaywrightError

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _pearsmob5sn44ismokiusuld34pnfwi6ctgin3qbvonpoob4lh3rmtqd(leak_extractor_interface, ABC):
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
            cls._instance = super(_pearsmob5sn44ismokiusuld34pnfwi6ctgin3qbvonpoob4lh3rmtqd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://pearsmob5sn44ismokiusuld34pnfwi6ctgin3qbvonpoob4lh3rmtqd.onion/"

    @property
    def developer_signature(self) -> str:
        return "Usman Ali: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qDMP"


    @property
    def base_url(self) -> str:
        return "http://pearsmob5sn44ismokiusuld34pnfwi6ctgin3qbvonpoob4lh3rmtqd.onion/"

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
        return "pear@onionmail.org"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):

        page.wait_for_selector('a.underline-one:has-text("Details")', timeout=30000)

        detail_links = page.locator('a.underline-one:has-text("Details")').all()
        href_date_pairs = []
        for link in detail_links:
            href = link.get_attribute('href')
            if not href:
                continue

            parent_td = link.locator('xpath=ancestor::td[contains(@class, "es-text-7589")]')
            if parent_td.count() == 0:
                continue

            date_elem = parent_td.locator('div.info__body p:has-text("Company Notificated Date:")')
            notification_date = ""
            if date_elem.count() > 0:
                date_text = date_elem.inner_text().strip()
                if date_text.startswith("Company Notificated Date:"):
                    notification_date = date_text.split("Company Notificated Date:", 1)[1].strip().replace(" 🔔", "")

            href_date_pairs.append((href, notification_date))

        for href, notification_date in href_date_pairs:
            detail_url = self.base_url + href if not href.startswith('http') else href
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    page.goto(detail_url, timeout=60000)
                    break
                except PlaywrightError as e:
                    print(f"Attempt {attempt + 1}/{max_retries} failed for URL: {detail_url}. Error: {str(e)}")
                    if attempt + 1 == max_retries:
                        print(f"Max retries reached for URL: {detail_url}. Moving to next URL.")
                        continue
                    continue
            else:
                continue
            title = ""
            title_elem = page.locator('td.es-text-5704 p:first-child strong')
            if title_elem.count() > 0:
                title = title_elem.inner_text().strip()
            status = ""
            status_elem = page.locator('td.es-text-5704 mark strong')
            if status_elem.count() > 0:
                status = status_elem.inner_text().strip()


            website = ""
            website_elem = page.locator('td.es-text-5704 a.underline-one')
            if website_elem.count() > 0:
                website = website_elem.inner_text().strip()

            industry = ""
            location = ""
            revenue = ""
            data_volume = ""
            data_description = ""

            p_elements = page.locator('td.es-text-5704 p').all()
            for p_elem in p_elements:
                text = p_elem.inner_text().strip()
                if text.startswith("Industry:"):
                    industry = text.split("Industry:", 1)[1].strip()
                elif text.startswith("Location:"):
                    location = text.split("Location:", 1)[1].strip().replace(" 📍", "")
                elif text.startswith("Revenue:"):
                    revenue = text.split("Revenue:", 1)[1].strip()
                elif text.startswith("Data Volume:"):
                    data_volume = text.split("Data Volume:", 1)[1].strip()
                elif text.startswith("Data Description:"):
                    data_description = text.split("Data Description:", 1)[1].strip()



            dump_elems = page.locator('span.es-button-border a.es-button').all()
            dump_links = [elem.get_attribute('href') for elem in dump_elems if elem.get_attribute('href')]

            date_obj = None
            date_formats = [
                '%d.%m.%Y', '%Y.%m.%d', '%m.%d.%Y', '%Y.%d.%m',
                '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d'
            ]

            for date_format in date_formats:
                try:
                    date_obj = datetime.strptime(notification_date, date_format).date()
                    break
                except ValueError:
                    continue
            if date_obj is None:
                print(f"Error parsing date '{notification_date}' for {detail_url}: does not match any supported format")
                continue

            ref_html = helper_method.extract_refhtml(website, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

            content = f"Title: {title}\nStatus: {status}\nWebsite: {website}\nIndustry: {industry}\nLocation: {location}\nRevenue: {revenue}\nData Volume: {data_volume}\nDescription: {data_description}\nDump Links: {', '.join(dump_links)}"
            card_data = leak_model(
                m_title=title,
                m_url=detail_url,
                m_ref_html=ref_html,
                m_base_url=self.base_url,
                m_content=content,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=data_description,
                m_dumplink=dump_links,
                m_content_type=["leaks"],
                m_weblink=[website],
                m_revenue=revenue,
                m_data_size=data_volume,
                m_leak_date=date_obj
            )

            entity_data = entity_model(
                m_scrap_file=self.__class__.__name__,
                m_team="PEAR",
                m_industry=industry,
                m_location=[location],
            )

            self.append_leak_data(card_data, entity_data)
