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


class _rnsmwareartse3m4hjsumjf222pnka6gad26cqxqmbjvevhbnym5p6ad(leak_extractor_interface, ABC):
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
      cls._instance = super(_rnsmwareartse3m4hjsumjf222pnka6gad26cqxqmbjvevhbnym5p6ad, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://rnsmwareartse3m4hjsumjf222pnka6gad26cqxqmbjvevhbnym5p6ad.onion"

  @property
  def base_url(self) -> str:
    return "http://rnsmwareartse3m4hjsumjf222pnka6gad26cqxqmbjvevhbnym5p6ad.onion"

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
    return "http://rnsmwareartse3m4hjsumjf222pnka6gad26cqxqmbjvevhbnym5p6ad.onion"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    try:
      cards = page.query_selector_all('.card')

      error_count = 0

      for card in cards:
        try:
          weblink = set()
          dumplink = set()
          description = revenue = ""

          title = card.query_selector('.card-body .card-title').inner_text().strip() if card.query_selector(
            '.card-body .card-title') else "No Title"

          more_info_url = card.query_selector('.card-footer .more-info-link').get_attribute(
            'href') if card.query_selector('.card-footer .more-info-link') else None

          if more_info_url:
            more_info_page = page.context.new_page()
            more_info_page.goto(more_info_url)

            description = more_info_page.query_selector(
              'div.section > p').inner_text() if more_info_page.query_selector(
              'div.section > p') else "No description available"
            revenue = more_info_page.query_selector(
              '#Revenue p').inner_text() if more_info_page.query_selector(
              '#Revenue p') else "No revenue info"
            team_size = more_info_page.query_selector(
              '#Team p').inner_text() if more_info_page.query_selector(
              '#Team p') else "No team size info"

            description = f"{description}\nTeam Size: {team_size}"

            all_links = [link.get_attribute('href') for section_id in
                         ['#Negotiat', '#listing-files', '#files']
                         for link in more_info_page.query_selector_all(f'{section_id} + .section ul a')]

            all_links += [link.get_attribute('href') for link in
                          more_info_page.query_selector_all('a[href]') if
                          link.get_attribute('href')]

            for link in all_links:
              if "www." in link and not ".onion" in link:
                weblink.add(link)
              else:
                dumplink.add(link)

            more_info_page.close()

          if not title:
            continue
          weblink = list(weblink)[0]
          is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
          ref_html = None
          if is_crawled != -1 and is_crawled < 5:
            ref_html = helper_method.extract_refhtml(weblink)
            if ref_html:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
            else:
              self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblink, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

          cleaned_dumplink = [link for link in dumplink if link.startswith("http")]

          card_data = leak_model(
            m_ref_html=ref_html,
            m_title=title,
            m_url=page.url,
            m_base_url=self.base_url,
            m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
            m_content=description,
            m_network=helper_method.get_network_type(self.base_url),
            m_important_content=description[:500],
            m_weblink=list(weblink),
            m_dumplink=cleaned_dumplink,
            m_content_type=["leaks"],
            m_revenue=revenue,
          )

          entity_data = entity_model(
            m_email=helper_method.extract_emails(description),
            m_company_name=title,
            m_ip=list(weblink) if weblink else None,
            m_team="run some wares"
          )

          entity_data = helper_method.extract_entities(description, entity_data)
          self.append_leak_data(card_data, entity_data)

          error_count = 0

        except Exception:
          error_count += 1
          if error_count >= 3:
            break

    except Exception as e:
      print(f"An error occurred while parsing leak data: {e}")
