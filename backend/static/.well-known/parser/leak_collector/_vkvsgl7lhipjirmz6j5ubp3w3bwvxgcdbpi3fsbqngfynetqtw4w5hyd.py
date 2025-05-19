from abc import ABC
from typing import List
from playwright.sync_api import Page
from bs4 import BeautifulSoup
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method


class _vkvsgl7lhipjirmz6j5ubp3w3bwvxgcdbpi3fsbqngfynetqtw4w5hyd(leak_extractor_interface, ABC):
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
      cls._instance = super(_vkvsgl7lhipjirmz6j5ubp3w3bwvxgcdbpi3fsbqngfynetqtw4w5hyd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:

    return "http://vkvsgl7lhipjirmz6j5ubp3w3bwvxgcdbpi3fsbqngfynetqtw4w5hyd.onion/"

  @property
  def base_url(self) -> str:

    return "http://vkvsgl7lhipjirmz6j5ubp3w3bwvxgcdbpi3fsbqngfynetqtw4w5hyd.onion/"

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
    return "http://vkvsgl7lhipjirmz6j5ubp3w3bwvxgcdbpi3fsbqngfynetqtw4w5hyd.onion/faq"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    title_elements = page.query_selector_all('div.card-body.p-3.pt-2 a.h5')
    title_urls_list = [element.get_attribute('href') for element in title_elements]

    error_count = 0

    for link_url in title_urls_list:
      try:
        page.goto(link_url)

        m_content = page.inner_text("html")
        if "Bad Request" in m_content:
          raise Exception("Bad content")

        unwanted_terms = ["Brain", "Cipher", "Main", "FAQ", "Rules", "Download"]
        m_content = " ".join(
          word for word in m_content.split() if word not in unwanted_terms
        )

        page_html = page.inner_html("html")
        soup = BeautifulSoup(page_html, 'html.parser')

        title = soup.find('h5', class_='card-header')
        title_text = title.get_text(strip=True) if title else "Untitled"

        descriptions = [p.get_text(strip=True) for p in soup.find_all('p') if p.get_text(strip=True)]
        combined_descriptions = " ".join(descriptions)

        image_sources = [img['src'] for img in soup.find_all('img', src=True)]

        download_button = soup.find(
          'a',
          class_='app-academy-md-50 btn btn-label-primary d-flex align-items-center'
        )
        download_link = download_button['href'] if download_button and 'href' in download_button.attrs else ""

        is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title_text, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
        ref_html = None
        if is_crawled != -1 and is_crawled < 5:
          ref_html = helper_method.extract_refhtml(title_text)
          ref_html = ref_html[:500]
          if ref_html:
            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title_text, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
          else:
            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title_text, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

        card_data = leak_model(
          m_ref_html=ref_html,
          m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
          m_title=title_text,
          m_url=page.url,
          m_base_url=self.base_url,
          m_content=m_content,
          m_important_content=combined_descriptions[:500],
          m_network=helper_method.get_network_type(self.base_url),
          m_dumplink=[download_link],
          m_content_type=["leaks"],
        )

        entity_data = entity_model(
          m_company_name=title_text,
          m_email=helper_method.extract_emails(m_content),
          m_team="brain cipher"
        )

        entity_data = helper_method.extract_entities(m_content, entity_data)
        self.append_leak_data(card_data, entity_data)
        error_count = 0

      except Exception:
        error_count += 1
        if error_count >= 3:
          break
