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


class _nitrogenczslprh3xyw6lh5xyjvmsz7ciljoqxxknd7uymkfetfhgvqd(leak_extractor_interface, ABC):
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
      cls._instance = super(_nitrogenczslprh3xyw6lh5xyjvmsz7ciljoqxxknd7uymkfetfhgvqd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:

    return "http://nitrogenczslprh3xyw6lh5xyjvmsz7ciljoqxxknd7uymkfetfhgvqd.onion"

  @property
  def base_url(self) -> str:

    return "http://nitrogenczslprh3xyw6lh5xyjvmsz7ciljoqxxknd7uymkfetfhgvqd.onion"

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

    return "http://nitrogenczslprh3xyw6lh5xyjvmsz7ciljoqxxknd7uymkfetfhgvqd.onion"

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
      href_elements = page.query_selector_all('a.w3-button.w3-padding-large.w3-white.w3-border')
      href_links = []

      for element in href_elements:
        href = element.get_attribute("href")
        if href:

          if not href.startswith('http'):

            if href.startswith('/'):
              href = href[1:]

            full_href = f"{self.base_url}/{href}"
          else:
            full_href = href

          if full_href not in href_links:
            href_links.append(full_href)

      error_count = 0

      for link in href_links:
        try:
          try:
            page.goto(link, timeout=10)
          except Exception:
            pass

          page.wait_for_selector('.w3-container')

          container_index = page.evaluate('''() => {
                  const containers = document.querySelectorAll('.w3-container');
                  for (let i = 0; i < containers.length; i++) {
                      const h3Element = containers[i].querySelector('h3 b');
                      if (h3Element) return i;
                  }
                  return -1;
              }''')

          if container_index == -1:
            error_count += 1
            if error_count >= 3:
              break
            continue

          containers = page.query_selector_all('.w3-container')
          container = containers[container_index] if container_index < len(containers) else None
          if not container:
            error_count += 1
            if error_count >= 3:
              break
            continue

          title_element = container.query_selector('h3 b')
          title = title_element.inner_text().strip() if title_element else ""

          web_link_element = container.query_selector('p a')
          m_weblinks = web_link_element.get_attribute("href") if web_link_element else ""

          p_elements = container.query_selector_all('p')
          m_description = ""
          for p in p_elements:
            if not p.query_selector('a') or p.query_selector('a').inner_text() != m_weblinks:
              p_text = p.inner_text().strip()
              if p_text:
                m_description += p_text + " "
          m_description = m_description.strip()

          column_element = container.query_selector('.column')
          m_images = []
          if column_element:
            img_elements = column_element.query_selector_all('img')
            for img in img_elements:
              src = img.get_attribute("src")
              if src:
                if src.startswith("../"):
                  src = src.replace("../", f"{self.base_url}/")
                elif not src.startswith("http"):
                  src = f"{self.base_url}/{src.lstrip('/')}"
                m_images.append(src)

          button_container = container.query_selector('.w3-col.m8.s12')
          m_dumplink = []
          if button_container:
            button_elements = button_container.query_selector_all('a.w3-button')
            for button in button_elements:
              button_href = button.get_attribute("href")
              if button_href:
                if button_href.startswith("../"):
                  button_href = button_href.replace("../", f"{self.base_url}/")
                elif not button_href.startswith("http"):
                  button_href = f"{self.base_url}/{button_href.lstrip('/')}"
                m_dumplink.append(button_href)

          listing_div_id = "list"
          has_listing = page.evaluate(f'() => !!document.getElementById("{listing_div_id}")')

          if has_listing:
            listing_links = page.evaluate(f'''() => {{
                      const listDiv = document.getElementById("{listing_div_id}");
                      const links = listDiv.querySelectorAll('a');
                      const result = [];
                      for (const link of links) {{
                          const href = link.getAttribute('href');
                          if (href) result.push(href);
                      }}
                      return result;
                  }}''')

            for href in listing_links:
              if href:
                if href.startswith("../"):
                  href = href.replace("../", f"{self.base_url}/")
                elif not href.startswith("http"):
                  href = f"{self.base_url}/{href.lstrip('/')}"
                m_dumplink.append(href)

          is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + m_weblinks, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
          ref_html = None
          if is_crawled != -1 and is_crawled < 5:
            ref_html = helper_method.extract_refhtml(m_weblinks)
            if ref_html:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + m_weblinks, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
            else:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + m_weblinks, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

          card_data = leak_model(
            m_ref_html=ref_html,
            m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
            m_title=title,
            m_url=page.url,
            m_base_url=self.base_url,
            m_content=m_description,
            m_network=helper_method.get_network_type(self.base_url),
            m_important_content=m_description,
            m_content_type=["leaks"],
            m_weblink=[m_weblinks] if m_weblinks else [],
            m_logo_or_images=m_images,
            m_dumplink=m_dumplink
          )

          entity_data = entity_model(
            m_email=helper_method.extract_emails(m_description),
            m_company_name=title,
            m_ip=[m_weblinks],
            m_team="nitrogen"
          )

          entity_data = helper_method.extract_entities(m_description, entity_data)
          self.append_leak_data(card_data, entity_data)
          error_count = 0

        except Exception:
          error_count += 1
          if error_count >= 3:
            break

    except Exception as e:
      print(f"Error in parse_leak_data: {str(e)}")
