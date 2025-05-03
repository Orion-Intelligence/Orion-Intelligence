from abc import ABC
from datetime import datetime
from time import sleep

from typing import List

from playwright.sync_api import Page
from urllib.parse import urljoin
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method


class _cicadabv7vicyvgz5khl7v2x5yygcgow7ryy6yppwmxii4eoobdaztqd(leak_extractor_interface, ABC):
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
      cls._instance = super(_cicadabv7vicyvgz5khl7v2x5yygcgow7ryy6yppwmxii4eoobdaztqd, cls).__new__(cls)
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://cicadabv7vicyvgz5khl7v2x5yygcgow7ryy6yppwmxii4eoobdaztqd.onion/?page=1"

  @property
  def base_url(self) -> str:
    return "http://cicadabv7vicyvgz5khl7v2x5yygcgow7ryy6yppwmxii4eoobdaztqd.onion/"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=False)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value])

  def contact_page(self) -> str:
    return self.seed_url

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
      element = page.locator(selector).first
      if element.count() > 0:
        return element.get_attribute(attr) if attr else element.inner_text().strip()
    except Exception:
      return None

  def parse_leak_data(self, page: Page):
    try:
      sleep(50)
      all_hrefs = []

      for page_num in range(0, 3):

        page_url = f"{self.base_url}?page={page_num}"

        sleep(5)
        page.goto(page_url)
        page.wait_for_load_state('load')

        link_divs = page.query_selector_all("div.block.relative.p-8.bg-gray-800.rounded-lg")

        if len(link_divs) == 0:
          sleep(5)
        for div in link_divs:

          link_tag = div.query_selector("a.inline-flex.items-center.justify-center.bg-gray-800.text-white")

          if link_tag:
            href = link_tag.get_attribute("href")
            if href:

              full_url = urljoin(self.base_url, href)

              if full_url not in all_hrefs:
                all_hrefs.append(full_url)

      for index, url in enumerate(all_hrefs):
        try:

          page.goto(url)
          page.wait_for_load_state('load')

          company_name_element = page.query_selector(
            "h2.font-bold.text-yellow-500.mb-4.break-words.uppercase")
          company_name = company_name_element.inner_text().strip() if company_name_element else "No company name found"

          website_element = page.query_selector("div.mt-2.mb-1 a.text-blue-400")
          website = website_element.get_attribute("href") if website_element else "No website found"

          elements = page.query_selector_all("div.rounded-md.inline-block.mb-1 span.text-white.text-sm")

          data_size = elements[0].inner_text().strip() if len(elements) > 0 else None
          created_date = elements[2].inner_text().strip() if len(elements) > 1 else "No date found"

          description_element = page.query_selector(
            "p.mt-1.text-gray-400.text-mg.mb-6.overflow-y-auto.whitespace-pre-wrap.rounded-lg")
          description = description_element.inner_text().strip() if description_element else "No description found"

          m_leak_date = datetime.strptime(created_date, '%B %d, %Y').date()

          is_crawled = self.invoke_db(REDIS_COMMANDS.S_GET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + website, False)
          ref_html = None
          if not is_crawled:
            ref_html = helper_method.extract_refhtml(website)
            if ref_html:
              self.invoke_db(REDIS_COMMANDS.S_SET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + website, True)

          card_data = leak_model(
            m_ref_html=ref_html,
            m_screenshot=helper_method.get_screenshot_base64(page, company_name),
            m_title=company_name,
            m_url=url,
            m_weblink=[url, website],
            m_network=helper_method.get_network_type(url),
            m_base_url=self.base_url,
            m_content=description + " " + self.base_url + " " + url,
            m_important_content=description,
            m_content_type=["leaks"],
            m_data_size=data_size,
            m_leak_date=m_leak_date
          )

          entity_data = entity_model(
            m_email_addresses=helper_method.extract_emails(description),
            m_company_name=company_name,
            m_ip=[website]
          )

          self.append_leak_data(card_data, entity_data)

        except Exception as _:
          continue

    except Exception as ex:
      print(f"An error occurred in parse_leak_data: {ex}")
