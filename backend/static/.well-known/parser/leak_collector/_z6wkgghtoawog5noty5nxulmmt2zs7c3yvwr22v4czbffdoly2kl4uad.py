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
import re


class _z6wkgghtoawog5noty5nxulmmt2zs7c3yvwr22v4czbffdoly2kl4uad(leak_extractor_interface, ABC):
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
      cls._instance = super(_z6wkgghtoawog5noty5nxulmmt2zs7c3yvwr22v4czbffdoly2kl4uad, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://z6wkgghtoawog5noty5nxulmmt2zs7c3yvwr22v4czbffdoly2kl4uad.onion"

  @property
  def base_url(self) -> str:
    return "http://z6wkgghtoawog5noty5nxulmmt2zs7c3yvwr22v4czbffdoly2kl4uad.onion"

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
    return "http://z6wkgghtoawog5noty5nxulmmt2zs7c3yvwr22v4czbffdoly2kl4uad.onion"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    try:
      max_pages = 5
      fetched_links = set()

      for page_num in range(1, max_pages + 1):
        current_url = f"{self.base_url}?paged={page_num}" if page_num > 1 else self.base_url

        page.goto(current_url, timeout=60000)
        page.wait_for_selector('article.post', timeout=30000)

        cards = page.locator('article.post')

        error_count = 0
        max_errors = 3
        fetched_links = set()

        for index in range(cards.count()):
          try:
            link_elements = cards.nth(index).locator('h2.entry-title > a')
            if link_elements.count() > 1:
              continue

            title_locator = cards.nth(index).locator('h2.entry-title > a')
            if not title_locator.is_visible():
              continue

            try:
              title_locator.click()
              page.wait_for_load_state('networkidle')
            except Exception:
              continue

            description = ""
            description_without_links = ""
            image_urls, web_urls, dump_urls = [], [], []
            extracted_data_size = None

            post_title = page.locator('h1.entry-title')
            extracted_title = post_title.inner_text().strip() if post_title else None

            entry_content = page.locator('.entry-content')
            if entry_content:
              paragraphs = entry_content.locator('p')
              for i in range(paragraphs.count()):
                text = paragraphs.nth(i).inner_text().strip()
                if len(text) > 30:
                  description += f"{text}\n"

              link_elements = entry_content.locator('a')
              for i in range(link_elements.count()):
                href = link_elements.nth(i).get_attribute('href')
                if href and href not in fetched_links:
                  fetched_links.add(href)
                  anchor_text = link_elements.nth(i).inner_text().upper()
                  if 'DOWNLOAD' in anchor_text:
                    dump_urls.append(href)
                  elif href.startswith('https'):
                    web_urls.append(href)

              # Inline links from description
              plain_text_urls = re.findall(r'\bhttps://[^\s,]+', description)
              for url in plain_text_urls:
                if url not in fetched_links:
                  fetched_links.add(url)
                  if 'DOWNLOAD' in url.upper():
                    dump_urls.append(url)
                  else:
                    web_urls.append(url)

              description_without_links = re.sub(r'https?://\S+', '', description).strip()

              data_size_match = re.search(r'(\d+\.?\d*)\s?(TB|GB)', description, re.IGNORECASE)
              if data_size_match:
                extracted_data_size = f"{data_size_match.group(1)} {data_size_match.group(2)}"

            if not extracted_title or not description:
              continue

            is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + web_urls[0], 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
            ref_html = None
            if is_crawled != -1 and is_crawled < 5:
              ref_html = helper_method.extract_refhtml(web_urls[0])
              if ref_html:
                self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + web_urls[0], -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
              else:
                self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + web_urls[0], is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

            card_data = leak_model(
              m_ref_html=ref_html,
              m_title=extracted_title,
              m_url=page.url,
              m_base_url=self.base_url,
              m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
              m_content=description,
              m_network=helper_method.get_network_type(self.base_url),
              m_important_content=description_without_links[:500],
              m_weblink=web_urls,
              m_dumplink=dump_urls,
              m_content_type=["leaks"],
              m_data_size=extracted_data_size,
            )

            entity_data = entity_model(
              m_ip=web_urls,
              m_email=helper_method.extract_emails(description),
              m_company_name=extracted_title,
              m_team="ransomeware"
            )

            entity_data = helper_method.extract_entities(description, entity_data)
            self.append_leak_data(card_data, entity_data)
            error_count = 0

            page.goto(current_url, timeout=60000)
            page.wait_for_load_state('networkidle')

          except Exception as e:
            print(f"Error processing card at index {index}: {e}")
            error_count += 1
            if error_count >= max_errors:
              print("Too many consecutive errors, aborting loop.")
              break

    except Exception as e:
      print(f"[ERROR] Skipping card due to: {e}")
