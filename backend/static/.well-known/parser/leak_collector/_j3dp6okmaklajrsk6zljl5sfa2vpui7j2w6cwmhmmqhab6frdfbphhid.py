from abc import ABC
from typing import List
from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _j3dp6okmaklajrsk6zljl5sfa2vpui7j2w6cwmhmmqhab6frdfbphhid(leak_extractor_interface, ABC):
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

  def __new__(cls, callback=None):

    if cls._instance is None:
      cls._instance = super(_j3dp6okmaklajrsk6zljl5sfa2vpui7j2w6cwmhmmqhab6frdfbphhid, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:

    return "http://j3dp6okmaklajrsk6zljl5sfa2vpui7j2w6cwmhmmqhab6frdfbphhid.onion"

  @property
  def base_url(self) -> str:

    return "http://j3dp6okmaklajrsk6zljl5sfa2vpui7j2w6cwmhmmqhab6frdfbphhid.onion"

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

    return "http://j3dp6okmaklajrsk6zljl5sfa2vpui7j2w6cwmhmmqhab6frdfbphhid.onion/#contact"

  def append_leak_data(self, leak: leak_model, entity: entity_model):

    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    try:
      page.goto(self.seed_url)

      href_elements = page.query_selector_all('.slider-slides nav ul li a')
      href_links = []

      for element in href_elements:
        href = element.get_attribute("href")
        if href and href.startswith('#'):
          target_id = href[1:]
          if target_id not in href_links:
            href_links.append(target_id)

      error_count = 0

      for target_id in href_links:
        try:
          if page.url != self.seed_url:
            page.goto(self.seed_url)

          article = page.query_selector(f'#{target_id}')
          if not article:
            error_count += 1
            if error_count >= 3:
              break
            continue

          title_element = article.query_selector('h2')
          title = title_element.inner_text().strip() if title_element else ""

          description = ""
          h3_elements = article.query_selector_all('h3')
          revenue = ""
          size = ""

          for h3 in h3_elements:
            h3_text = h3.inner_text().strip()

            if "Revenue" in h3_text:
              revenue = h3_text.split("Revenue", 1)[1].strip()

            if "ZIP - " in h3_text:
              size = h3_text.split("ZIP - ", 1)[1].strip()

            if not h3.query_selector('a') and h3_text:
              description += h3_text + " "

          description = description.strip()

          download_links = []
          link_elements = article.query_selector_all('h3 a')
          for link in link_elements:
            href = link.get_attribute("href")
            if href:
              if href.startswith('download/') or (
                  not href.startswith('http') and not href.startswith('#')):
                if not href.startswith('/'):
                  full_href = f"{self.base_url}/{href}"
                else:
                  full_href = f"{self.base_url}{href}"
              else:
                full_href = href
              download_links.append(full_href)

          is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
          ref_html = None
          if is_crawled != -1 and is_crawled < 5:
            ref_html = helper_method.extract_refhtml(title)
            if ref_html:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
            else:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

          card_data = leak_model(
            m_ref_html=ref_html,
            m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
            m_title=title,
            m_url=f"{self.base_url}/#{target_id}",
            m_base_url=self.base_url,
            m_content=description,
            m_network=helper_method.get_network_type(self.base_url),
            m_important_content=description,
            m_content_type=["leaks"],
            m_dumplink=download_links,
            m_weblink=[title],
            m_revenue=revenue,
            m_data_size=size
          )

          entity_data = entity_model(
            m_email=helper_method.extract_emails(description),
            m_company_name=title,
            m_ip=[title],
            m_team="safepay"
          )

          entity_data = helper_method.extract_entities(description, entity_data)
          self.append_leak_data(card_data, entity_data)
          error_count = 0

        except Exception:
          error_count += 1
          if error_count >= 3:
            break

    except Exception as e:
      print(f"Error in parse_leak_data: {str(e)}")
