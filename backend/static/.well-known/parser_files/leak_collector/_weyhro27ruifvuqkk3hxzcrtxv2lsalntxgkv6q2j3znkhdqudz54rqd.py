from abc import ABC
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method
from datetime import datetime

class _weyhro27ruifvuqkk3hxzcrtxv2lsalntxgkv6q2j3znkhdqudz54rqd(leak_extractor_interface, ABC):
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
            cls._instance = super(_weyhro27ruifvuqkk3hxzcrtxv2lsalntxgkv6q2j3znkhdqudz54rqd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://weyhro27ruifvuqkk3hxzcrtxv2lsalntxgkv6q2j3znkhdqudz54rqd.onion/leaks"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://weyhro27ruifvuqkk3hxzcrtxv2lsalntxgkv6q2j3znkhdqudz54rqd.onion"

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
        return "http://weyhro27ruifvuqkk3hxzcrtxv2lsalntxgkv6q2j3znkhdqudz54rqd.onion/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):

        article_links = page.query_selector_all('div.border.rounded-xl a[href*="/leaks/"]')
        articles = []
        for link in article_links:
            href = link.get_attribute('href')
            time_element = link.query_selector('time')
            raw_date = time_element.get_attribute('datetime') if time_element else ""
            parsed_date = None
            if raw_date:
                try:
                    parsed_date = datetime.fromisoformat(raw_date.replace("Z", "+00:00")).date()
                except ValueError:
                    parsed_date = None

            info_element = link.query_selector('p.z-20.mt-4.text-sm')
            revenue, location = "", ""
            if info_element:
                info_text = info_element.inner_text()
                parts = info_text.split(',')
                revenue = parts[0].strip() if parts else ""
                location = parts[1].strip() if len(parts) > 1 else ""



            articles.append({"href": href, "date": parsed_date, "revenue": revenue, "location": location})

        for article in articles:
            article_url = article["href"]
            full_url = article_url if article_url.startswith('http') else self.base_url + article_url
            page.goto(full_url)


            title_element = page.query_selector('h1.text-4xl.font-bold')
            title = title_element.inner_text() if title_element else ""

            description_element = page.query_selector('p.mt-6.text-lg')
            description = description_element.inner_text() if description_element else ""

            article_element = page.query_selector('article.prose.prose-zinc.prose-quoteless')
            article_content = article_element.inner_text() if article_element else ""

            full_content = f"{description}\n{article_content}" if description and article_content else description or article_content

            files_link_element = page.query_selector('a[href*="p7teg7yh2dwxg2tsbgnki3zrt5p7wgaegtfh4cobeqbhcq55nwt2m6yd.onion/s/"]')
            files_url = files_link_element.get_attribute('href') if files_link_element else ""

            website_link_element = page.query_selector('a[href*="adriaticglass.com"]')
            website_url = website_link_element.get_attribute('href') if website_link_element else ""



            card_data = leak_model(
                m_title=title,
                m_url=full_url,
                m_base_url=self.base_url,
                m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                m_content=full_content,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=description[:500],
                m_weblink=[website_url] if website_url else [],
                m_dumplink=[files_url] if files_url else [],
                m_content_type=["leaks"],
                m_leak_date=article['date'],
                m_revenue=article['revenue']
            )
            entity_data = entity_model(
                m_team="Weyhro",
                m_location=[article['location']]
            )

            self.append_leak_data(card_data, entity_data)

