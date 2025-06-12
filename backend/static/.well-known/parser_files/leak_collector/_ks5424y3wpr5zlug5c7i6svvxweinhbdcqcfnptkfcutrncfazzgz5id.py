from abc import ABC
from typing import List
from urllib.parse import urlparse

from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method


class _ks5424y3wpr5zlug5c7i6svvxweinhbdcqcfnptkfcutrncfazzgz5id(leak_extractor_interface, ABC):
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
      cls._instance = super(_ks5424y3wpr5zlug5c7i6svvxweinhbdcqcfnptkfcutrncfazzgz5id, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:

    return "http://ks5424y3wpr5zlug5c7i6svvxweinhbdcqcfnptkfcutrncfazzgz5id.onion/posts.php?pid=kjR1jYcN0m8P5Il0SbJ6hvDm"

  @property
  def base_url(self) -> str:

    return "http://ks5424y3wpr5zlug5c7i6svvxweinhbdcqcfnptkfcutrncfazzgz5id.onion"

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
    return "http://ks5424y3wpr5zlug5c7i6svvxweinhbdcqcfnptkfcutrncfazzgz5id.onion/index.php#contact"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    links = page.query_selector_all('a[post]')
    link_urls = []
    for link in links:
      href = link.get_attribute('href')
      if href:
        full_url = f"{self.base_url}/posts.php{href}"
        link_urls.append(full_url)

    error_count = 0
    for url in link_urls:
      try:
        page.goto(url)

        title_el = page.query_selector('st')
        title = title_el.inner_text() if title_el else ""

        weblink_el = page.query_selector('card in h h1')
        weblink = weblink_el.inner_text() if weblink_el else ""

        description_el = page.query_selector('card in p')
        description = description_el.inner_text() if description_el else ""

        payment_el = page.query_selector('card.rs in cont p')
        payment_info = payment_el.inner_text() if payment_el else ""

        content = f"{title}: {description} {payment_info}"
        important_content = description

        gallery_images = page.query_selector_all('gallery img')
        images = []
        for img in gallery_images:
          img_src = img.get_attribute('src')
          if img_src:
            parsed_url = urlparse(img_src)
            images.append(parsed_url.path.strip())

        download_url = ""
        download_btn = page.query_selector('a.btn[onclick*="showdir"]')
        if download_btn:
          onclick = download_btn.get_attribute('onclick')
          if onclick:
            start = onclick.find("'") + 1
            end = onclick.rfind("'")
            if start != -1 and end != -1:
              download_url = onclick[start:end].strip()

        is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
        ref_html = None
        if is_crawled != -1 and is_crawled < 5:
          ref_html = helper_method.extract_refhtml(weblink)
          if ref_html:
            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
          else:
            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

        card_data = leak_model(
          m_ref_html=ref_html,
          m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
          m_title=title,
          m_url=url,
          m_base_url=self.base_url,
          m_content=content,
          m_network=helper_method.get_network_type(self.base_url),
          m_important_content=important_content,
          m_dumplink=[download_url],
          m_content_type=["leaks"],
          m_logo_or_images=images,
          m_weblink=[weblink],
        )

        entity_data = entity_model(
          m_email=helper_method.extract_emails(important_content),
          m_company_name=title,
          m_ip=[weblink],
          m_team="ks"
        )

        entity_data = helper_method.extract_entities(content, entity_data)
        self.append_leak_data(card_data, entity_data)
        error_count = 0

      except Exception:
        error_count += 1
        if error_count >= 3:
          break
