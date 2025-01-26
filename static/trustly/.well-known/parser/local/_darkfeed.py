from abc import ABC
from datetime import datetime
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.card_extraction_model import card_extraction_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method

class _darkfeed(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_darkfeed, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "https://darkfeed.io/threat-intelligence/"

    @property
    def base_url(self) -> str:
        return "https://darkfeed.io"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "https://darkfeed.io/aboutus/"

    def parse_leak_data(self, page: Page):
      try:
        self.soup = BeautifulSoup(page.content(), 'html.parser')
        today_date = datetime.today().strftime('%Y-%m-%d')

        for article in self.soup.find_all("article", class_="elementor-post"):
          title_link = article.find("h3", class_="elementor-post__title").find("a")
          url = title_link['href'] if title_link else None
          title = title_link.get_text(strip=True) if title_link else None

          date_element = article.find("span", class_="elementor-post-date")
          posted_date = date_element.get_text(strip=True) if date_element else None

          if url and title and posted_date:
            content_message = f"{title}, To visit or explore more visit the website: {url}"

            card_data = card_extraction_model(
              m_title=title,
              m_url=url,
              m_base_url=self.base_url,
              m_content=content_message,
              m_network=helper_method.get_network_type(self.base_url).value,
              m_important_content=content_message,
              m_email_addresses=helper_method.extract_emails(content_message),
              m_phone_numbers=helper_method.extract_phone_numbers(content_message),
              m_extra_tags=[],
              m_content_type="organization",
              m_last_updated=today_date
            )

            self._card_data.append(card_data)
      except Exception as ex:
        print(ex)