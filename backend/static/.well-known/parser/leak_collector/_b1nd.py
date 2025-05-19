import re
from abc import ABC
from datetime import datetime

from typing import List

from playwright.sync_api import Page
from urllib.parse import urljoin
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _b1nd(leak_extractor_interface, ABC):
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
      cls._instance = super(_b1nd, cls).__new__(cls)
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://b1nd.net"

  @property
  def base_url(self) -> str:
    return "http://b1nd.net"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

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
      thread_links = []

      page.goto(self.seed_url)
      page.wait_for_load_state("load")

      db_link_element = page.query_selector('h3.node-title a[href*="/forums/databases"]')
      if not db_link_element:
        db_link_element = page.query_selector('a[href="/forums/databases.5/"]')

      if not db_link_element:
        raise Exception("Could not find databases category link")

      db_link = db_link_element.get_attribute("href")
      full_db_link = urljoin(self.base_url, db_link)

      page.goto(full_db_link)
      page.wait_for_load_state("load")

      current_page = 1
      max_pages = 13

      while current_page <= max_pages:
        page.wait_for_selector('div.structItem-title a')

        thread_elements = page.query_selector_all('div.structItem-title a')

        for element in thread_elements:
          href = element.get_attribute("href")
          if href:
            full_url = urljoin(self.base_url, href)
            if full_url not in thread_links:
              thread_links.append(full_url)

        current_page += 1
        if current_page <= max_pages:
          next_page_url = f"{full_db_link}page-{current_page}"
          page.goto(next_page_url)
          page.wait_for_load_state("load")

      error_count = 0
      for idx, thread_url in enumerate(thread_links):
        try:
          page.goto(thread_url)
          page.wait_for_load_state("load")

          date_element = page.query_selector('time.u-dt')
          date_text = date_element.get_attribute("data-date-string") if date_element else ""

          title_element = page.query_selector('h1.p-title-value')
          title = title_element.inner_text().strip() if title_element else ""

          content_element = page.query_selector('article.message-body div.bbWrapper')
          content = ""
          if content_element:
            content = content_element.inner_text().strip().replace('\n', ' ')

          image_logos = []
          img_elements = page.query_selector_all('article.message-body div.bbWrapper img')
          for img in img_elements:
            src = img.get_attribute("src")
            if src:
              full_img_url = urljoin(self.base_url, src)
              image_logos.append(full_img_url)

          websites = []
          domain_pattern = r'https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/\S*)?|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/\S*)?|[a-zA-Z0-9.-]+\.onion(?:/\S*)?'

          if content:
            matches = re.findall(domain_pattern, content)
            for match in matches:
              if match not in websites:
                websites.append(match)

          link_elements = page.query_selector_all('article.message-body div.bbWrapper a')
          for link in link_elements:
            href = link.get_attribute("href")
            if href and (href.startswith("http") or ".com" in href or ".net" in href or ".onion" in href):
              if href not in websites:
                websites.append(href)

          password = ""
          password_js = """
                  () => {
                      const spans = Array.from(document.querySelectorAll('span'));
                      const passwordSpan = spans.find(span => span.textContent.includes('Passwords:'));

                      if (passwordSpan) {
                          const text = passwordSpan.textContent;
                          const parts = text.split('Passwords:');
                          if (parts.length > 1) {
                              return parts[1].trim();
                          }
                      }

                      const signature = document.querySelector('aside.message-signature div.bbWrapper');
                      if (signature && signature.textContent.includes('Passwords:')) {
                          const text = signature.textContent;
                          const parts = text.split('Passwords:');
                          if (parts.length > 1) {
                              return parts[1].trim();
                          }
                      }

                      const allElements = document.querySelectorAll('*');
                      for (const el of allElements) {
                          if (el.textContent && el.textContent.includes('Passwords:') && el.children.length === 0) {
                              const text = el.textContent;
                              const parts = text.split('Passwords:');
                              if (parts.length > 1) {
                                  return parts[1].trim();
                              }
                          }
                      }

                      return '';
                  }
              """
          try:
            password = page.evaluate(password_js)
          except Exception:
            pass

          m_leak_date = None
          if date_text:
            try:
              m_leak_date = datetime.strptime(date_text, '%b %d, %Y').date()
            except Exception:
              pass

          important_content = ""
          if content:
            words = content.split()
            if len(words) > 500:
              important_content = " ".join(words[:500])
            else:
              important_content = content

          card_data = leak_model(
            m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
            m_title=title,
            m_weblink=websites,
            m_url=thread_url,
            m_base_url=self.base_url,
            m_content=content + " " + self.base_url + " " + thread_url if content else self.base_url + " " + thread_url,
            m_network=helper_method.get_network_type(self.base_url),
            m_important_content=important_content,
            m_content_type=["leaks"],
            m_leak_date=m_leak_date,
            m_logo_or_images=image_logos,
          )

          entity_data = entity_model(
            m_email=helper_method.extract_emails(content) if content else [],
            m_phone_numbers=helper_method.extract_phone_numbers(content) if content else [],
            m_company_name=title,
            m_password=password,
            m_team="b1nd"
          )
          entity_data = helper_method.extract_entities(content, entity_data)

          self.append_leak_data(card_data, entity_data)
          error_count = 0

        except Exception:
          error_count += 1
          if error_count >= 3:
            break


    except Exception as e:
      print(f"An error occurred: {e}")
    finally:
      pass