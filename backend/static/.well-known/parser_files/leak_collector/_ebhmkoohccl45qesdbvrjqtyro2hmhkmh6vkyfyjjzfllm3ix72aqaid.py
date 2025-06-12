import re
from abc import ABC
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from urllib.parse import urljoin

from crawler.crawler_services.shared.helper_method import helper_method


class _ebhmkoohccl45qesdbvrjqtyro2hmhkmh6vkyfyjjzfllm3ix72aqaid(leak_extractor_interface, ABC):
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
      cls._instance = super(_ebhmkoohccl45qesdbvrjqtyro2hmhkmh6vkyfyjjzfllm3ix72aqaid, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://ebhmkoohccl45qesdbvrjqtyro2hmhkmh6vkyfyjjzfllm3ix72aqaid.onion/leaks.php"

  @property
  def base_url(self) -> str:
    return "http://ebhmkoohccl45qesdbvrjqtyro2hmhkmh6vkyfyjjzfllm3ix72aqaid.onion"

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
    return "http://ebhmkoohccl45qesdbvrjqtyro2hmhkmh6vkyfyjjzfllm3ix72aqaid.onion"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  @staticmethod
  def safe_find(page, selector, attr=None):
    try:
      element = page.query_selector(selector)
      if element:
        return element.get_attribute(attr) if attr else element.inner_text().strip()
    except Exception:
      return None

  def parse_leak_data(self, page: Page):
    try:
      full_url = self.seed_url
      page.goto(full_url, timeout=30000)
      page.wait_for_load_state('load')
      page.wait_for_selector("div.advert_col", timeout=30000)

      advert_blocks = page.query_selector_all("div.advert_col")
      error_count = 0

      for block in advert_blocks:
        try:
          soup = BeautifulSoup(block.inner_html(), 'html.parser')

          title = soup.select_one('div.advert_info_title').text.strip()

          content = soup.select_one('div.advert_info_p').get_text(separator="\n", strip=True)

          web_url_element = soup.select_one('div.advert_info_p a')
          web_url = web_url_element['href'] if web_url_element else None

          image_urls = []
          for img in soup.select('div.advert_imgs_block img'):
            img_src = img.get('src')
            full_img_url = urljoin(self.base_url, img_src)
            image_urls.append(full_img_url)

          size = None
          info_code_div = soup.select_one('div.advert_info_code')
          if info_code_div:
            size_match = re.search(r'Size:\s*([\d.,]+\s*[A-Z]+)', info_code_div.text)
            size = size_match.group(1) if size_match else None

          is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + web_url, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
          ref_html = None
          if is_crawled != -1 and is_crawled < 5:
            ref_html = helper_method.extract_refhtml(web_url)
            if ref_html:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + web_url, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
            else:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + web_url, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

          card_data = leak_model(
            m_ref_html=ref_html,
            m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
            m_title=title,
            m_weblink=[web_url] if web_url else [],
            m_url=full_url,
            m_base_url=self.base_url,
            m_content=content + " " + self.base_url + " " + full_url,
            m_websites=[],
            m_important_content=content,
            m_network=helper_method.get_network_type(self.base_url),
            m_content_type=["leaks"],
            m_data_size=size,
          )

          entity_data = entity_model(
            m_email=helper_method.extract_emails(content),
            m_ip=[web_url],
            m_company_name=title,
            m_team="interlock"
          )
          entity_data = helper_method.extract_entities(content, entity_data)

          self.append_leak_data(card_data, entity_data)
          error_count = 0

        except Exception:
          error_count += 1
          if error_count >= 3:
            break


    except Exception as ex:
      print(f"An error occurred: {ex}")
