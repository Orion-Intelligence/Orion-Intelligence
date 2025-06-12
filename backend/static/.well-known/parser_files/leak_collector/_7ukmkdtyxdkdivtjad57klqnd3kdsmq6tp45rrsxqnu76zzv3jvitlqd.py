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


class _7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd(leak_extractor_interface, ABC):
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
      cls._instance = super(_7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion"

  @property
  def base_url(self) -> str:
    return "http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion"

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
    return "http://7ukmkdtyxdkdivtjad57klqnd3kdsmq6tp45rrsxqnu76zzv3jvitlqd.onion"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    self._card_data = []

    try:
      page.wait_for_selector("div.border.border-warning.card-body.shadow-lg", timeout=30000)
      cards = page.query_selector_all("div.border.border-warning.card-body.shadow-lg")
      if not cards:
        return

      error_count = 0
      for card in cards:
        try:
          description_el = card.query_selector("p.card-text")
          description = description_el.inner_text().strip() if description_el else "No content available"
          imp_content = description[:500]

          website = ""
          subtitle_blocks = card.query_selector_all("h6.card-subtitle")
          for h6 in subtitle_blocks:
            if "Web Site:" in h6.inner_text():
              a_tag = h6.query_selector("a[href]")
              if a_tag:
                website = a_tag.get_attribute("href").strip()
              break

          dumplinks = []
          for h6 in subtitle_blocks:
            a_tag = h6.query_selector("a[href]")
            if a_tag:
              href = a_tag.get_attribute("href")
              if href:
                dumplinks.append(href.strip())

          if not dumplinks or not website:
            continue

          title_el = card.query_selector("h4.card-title")
          raw_title = title_el.inner_text().strip() if title_el else "Unknown"
          match = re.search(r"(.*?)\s*\(([^)]+)\)", raw_title)
          if match:
            company_name = match.group(1).strip()
            location = match.group(2).strip()
          else:
            company_name = raw_title
            location = None

          is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + website, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
          ref_html = None
          if is_crawled != -1 and is_crawled < 5:
            ref_html = helper_method.extract_refhtml(website)
            if ref_html:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + website, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
            else:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + website, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

          card_data = leak_model(
            m_ref_html=ref_html,
            m_screenshot=helper_method.get_screenshot_base64(page, company_name, self.base_url),
            m_title=company_name,
            m_url=page.url,
            m_websites=[website] if website else [],
            m_base_url=self.base_url,
            m_content=f"{description} {self.base_url} {page.url}",
            m_network=helper_method.get_network_type(self.base_url),
            m_important_content=imp_content,
            m_content_type=["leaks"],
            m_dumplink=dumplinks,
          )

          entity_data = entity_model(
            m_email=helper_method.extract_emails(description),
            m_company_name=company_name,
            m_ip=[website],
            m_location=location.split(",") if location else None,
            m_team="diaxin"
          )
          entity_data = helper_method.extract_entities(description, entity_data)

          self.append_leak_data(card_data, entity_data)
          error_count = 0

        except Exception:
          error_count += 1
          if error_count >= 3:
            break


    except Exception as e:
      print(f"Error in parsing: {e}")
