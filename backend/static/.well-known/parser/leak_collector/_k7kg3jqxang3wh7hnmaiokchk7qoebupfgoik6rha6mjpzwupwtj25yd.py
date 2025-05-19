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
from bs4 import BeautifulSoup


class _k7kg3jqxang3wh7hnmaiokchk7qoebupfgoik6rha6mjpzwupwtj25yd(leak_extractor_interface, ABC):
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
      cls._instance = super(_k7kg3jqxang3wh7hnmaiokchk7qoebupfgoik6rha6mjpzwupwtj25yd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://k7kg3jqxang3wh7hnmaiokchk7qoebupfgoik6rha6mjpzwupwtj25yd.onion"

  @property
  def base_url(self) -> str:
    return "http://k7kg3jqxang3wh7hnmaiokchk7qoebupfgoik6rha6mjpzwupwtj25yd.onion"

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
    return "http://k7kg3jqxang3wh7hnmaiokchk7qoebupfgoik6rha6mjpzwupwtj25yd.onion/contact.php"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    page_number = 1

    while True:
      page.goto(f"{self.seed_url}/index.php?page={page_number}", timeout=60000)

      links = page.eval_on_selector_all(
        "th.News[onclick^='viewtopic']",
        "elements => elements.map(el => el.getAttribute('onclick').match(/'([^']+)'/)[1])"
      )

      if not links:
        break

      full_links = [f"{self.base_url.rstrip('/')}/topic.php?id={link_id}" for link_id in links]

      error_count = 0

      for card_url in full_links:
        new_page = page.context.new_page()
        try:
          new_page.goto(card_url)

          html = new_page.content()
          soup = BeautifulSoup(html, 'html.parser')

          news_element = soup.find('th', class_='News')
          if not news_element:
            error_count += 1
            if error_count >= 3:
              break
            continue

          m_title = new_page.title()
          m_content = news_element.get_text(strip=True)

          country_name = (
            news_element.find('i', class_='location').next_sibling.strip()
            if news_element.find('i', class_='location') else "Unknown"
          )
          weblink = (
            news_element.find('i', class_='link').next_sibling.strip()
            if news_element.find('i', class_='link') else "Unknown"
          )

          data_size = None
          if "amount of data:" in m_content:
            data_size = m_content.split("amount of data:")[1].split("added:")[0].strip()

          publication_date = None
          if "publication date:" in m_content:
            publication_date_section = m_content.split("publication date:")[1].strip()
            if len(publication_date_section) >= 10 and publication_date_section[:10].count("-") == 2:
              publication_date = publication_date_section[:10]

          information = None
          if "information:" in m_content:
            information = m_content.split("information:")[1].split("comment:")[0].strip()

          comment = None
          if "comment:" in m_content:
            comment = m_content.split("comment:")[1].strip()

          description = f"{information}. {comment}" if information and comment else (information or comment or "")

          dump_links = []
          rar_passwords = []

          download_section_start = m_content.find("DOWNLOAD LINKS:")
          if download_section_start != -1:
            download_section = m_content[download_section_start:]

            links_start = download_section.find("DOWNLOAD LINKS:") + len("DOWNLOAD LINKS:")
            links_end = download_section.find("Rar password:")
            if links_end != -1:
              links_text = download_section[links_start:links_end].strip()
              for link in links_text.split("<br>"):
                formatted_link = link.strip()
                if formatted_link.startswith("http"):
                  dump_links.append(formatted_link + " ")

            password_start = download_section.find("Rar password:")
            if password_start != -1:
              rar_password = download_section[password_start:].split("Rar password:")[1].split("<")[0].strip()
              rar_passwords.append(rar_password)

          is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
          ref_html = None
          if is_crawled != -1 and is_crawled < 5:
            ref_html = helper_method.extract_refhtml(weblink)
            if ref_html:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
            else:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

          rar_passwords = f"{rar_passwords}"

          card_data = leak_model(
            m_ref_html=ref_html,
            m_title=m_title,
            m_url=new_page.url,
            m_base_url=self.base_url,
            m_content=m_content,
            m_important_content=description,
            m_network=helper_method.get_network_type(self.base_url),
            m_content_type=["leaks"],
            m_screenshot=helper_method.get_screenshot_base64(new_page, None, self.base_url),
            m_weblink=[weblink],
            m_dumplink=dump_links,
            m_data_size=data_size,
            m_leak_date=publication_date,
          )

          entity_data = entity_model(
            m_email=helper_method.extract_emails(description),
            m_country_name=country_name,
            m_ip=[weblink],
            m_location=[country_name],
            m_password=rar_passwords,
            m_team="play news"
          )

          entity_data = helper_method.extract_entities(description, entity_data)
          self.append_leak_data(card_data, entity_data)
          error_count = 0

        except Exception:
          error_count += 1
          if error_count >= 3:
            break

        finally:
          new_page.close()

      page_number += 1
