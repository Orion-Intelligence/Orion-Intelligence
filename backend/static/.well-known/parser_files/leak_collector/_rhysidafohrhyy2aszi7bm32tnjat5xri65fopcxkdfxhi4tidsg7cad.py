import re
from abc import ABC
from typing import List
from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method


class _rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad(leak_extractor_interface, ABC):
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
      cls._instance = super(_rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad.onion/"

  @property
  def base_url(self) -> str:
    return "http://rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad.onion/"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=False)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return "http://rhysidafohrhyy2aszi7bm32tnjat5xri65fopcxkdfxhi4tidsg7cad.onion/"

  def append_leak_data(self, leak: leak_model, entity: entity_model):

    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    try:
      page.wait_for_selector("#companies_online", timeout=5000)
      company_text = page.locator("#companies_online").text_content()
      company_count = int(re.search(r'\d+', company_text).group()) if company_text else 0

      error_count = 0

      for company_id in range(company_count, 0, -1):
        try:
          url = f"{self.base_url}/archive.php?company={company_id}"
          page.goto(url, wait_until="domcontentloaded")

          title_el = page.query_selector(f"#company_modal_label_{company_id}")
          title = title_el.text_content().strip() if title_el else f"Company {company_id}"

          description_els = page.query_selector_all(f"#company_modal_{company_id} p")
          description = "\n".join(p.text_content().strip() for p in description_els if p.text_content())

          href_el = page.query_selector(f"#company_modal_{company_id} a[href^='http']")
          external_link = href_el.get_attribute("href") if href_el else ""

          image_els = page.query_selector_all(f"#company_modal_{company_id} img")
          images = [img.get_attribute("src") for img in image_els if img.get_attribute("src")]

          content = f"{title}\n{description}\n{external_link}"

          is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + external_link, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
          ref_html = None
          if is_crawled != -1 and is_crawled < 5:
            ref_html = helper_method.extract_refhtml(external_link)
            if ref_html:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + external_link, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
            else:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + external_link, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

          card_data = leak_model(
            m_ref_html=ref_html,
            m_title=title,
            m_url=url,
            m_base_url=self.base_url,
            m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
            m_content=content,
            m_network=helper_method.get_network_type(self.base_url),
            m_important_content=content[:500],
            m_weblink=[external_link] if external_link else [],
            m_dumplink=[],
            m_content_type=["leaks"],
            m_logo_or_images=images,
          )

          entity_data = entity_model(
            m_company_name=title,
            m_ip=[external_link],
            m_email=helper_method.extract_emails(content),
            m_phone_numbers=helper_method.extract_phone_numbers(content),
            m_team="rhysida"
          )

          entity_data = helper_method.extract_entities(content, entity_data)
          self.append_leak_data(card_data, entity_data)

          error_count = 0

        except Exception:
          error_count += 1
          if error_count >= 3:
            break

    except Exception as e:
      print(f"Failed to parse company list: {e}")
