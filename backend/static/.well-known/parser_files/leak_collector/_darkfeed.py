from abc import ABC
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method

class _darkfeed(leak_extractor_interface, ABC):
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
        return "https://darkfeed.io/aboutus/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
      try:
        self.soup = BeautifulSoup(page.content(), 'html.parser')

        error_count = 0

        for article in self.soup.find_all("article", class_="elementor-post"):
          try:
            title_link = article.find("h3", class_="elementor-post__title").find("a")
            url = title_link['href'] if title_link else None
            title = title_link.get_text(strip=True) if title_link else None

            date_element = article.find("span", class_="elementor-post-date")
            posted_date = date_element.get_text(strip=True) if date_element else None

            if url and title and posted_date:
              content_message = f"{title}, To visit or explore more visit the website: {url}"

              card_data = leak_model(
                m_screenshot="",
                m_title=title,
                m_url=url,
                m_base_url=self.base_url,
                m_content=content_message + " " + self.base_url + " " + url,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=content_message,
                m_content_type=["leaks"],
              )

              entity_data = entity_model(
                m_email=helper_method.extract_emails(content_message),
                m_team="dark feed"
              )
              entity_data = helper_method.extract_entities(content_message, entity_data)

              self.append_leak_data(card_data, entity_data)
              error_count = 0

          except Exception:
            error_count += 1
            if error_count >= 3:
              break

      except Exception as ex:
        print(ex)