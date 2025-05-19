from abc import ABC
from datetime import datetime
from typing import List
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd(leak_extractor_interface, ABC):
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
      cls._instance = super(_omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd.onion/"

  @property
  def base_url(self) -> str:
    return "http://omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd.onion/"

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
    return "http://omegalock5zxwbhswbisc42o2q2i54vdulyvtqqbudqousisjgc7j7yd.onion"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    datatable = self.soup.find("table", class_="datatable")
    if not datatable:
      print("No datatable found.")
      return

    rows = datatable.find_all("tr")
    page_urls = [
      urljoin(self.seed_url, link["href"])
      for row in rows
      for link in row.find_all("a", href=True)
    ]

    error_count = 0

    for page_url in page_urls:
      try:
        page.goto(page_url, wait_until="networkidle")
        self.soup = BeautifulSoup(page.content(), "html.parser")

        title_element = self.soup.find(class_="theading")
        title_text = helper_method.clean_text(title_element.get_text(strip=True)) if title_element else ""

        tstat_element = self.soup.find(class_="tstat")
        content = helper_method.clean_text(tstat_element.get_text(strip=True)) if tstat_element else ""
        important_content = content

        matching_row = next(
          (
            row for row in rows
            if (a := row.find("a", href=True)) and page_url.endswith(a["href"])
          ),
          None
        )
        total_size = last_updated = ""
        if matching_row:
          cells = matching_row.find_all("td")
          total_size = cells[3].get_text(strip=True) if len(cells) > 3 else ""
          last_updated = cells[4].get_text(strip=True) if len(cells) > 4 else ""
        last_updated_date = datetime.strptime(last_updated, "%Y-%m-%d").date()

        tdownload_table = self.soup.find("table", class_="tdownload")
        dump_links = []
        if tdownload_table:
          dump_links = [
            urljoin(self.base_url, link["href"])
            for link in tdownload_table.find_all("a", href=True)
          ]

        card_data = leak_model(
          m_screenshot=helper_method.get_screenshot_base64(page, title_text, self.base_url),
          m_title=title_text,
          m_url=page_url,
          m_base_url=self.base_url,
          m_content=content + " " + self.base_url + " " + page_url,
          m_network=helper_method.get_network_type(self.base_url),
          m_important_content=important_content,
          m_weblink=[page_url],
          m_dumplink=dump_links,
          m_content_type=["leaks"],
          m_leak_date=last_updated_date,
          m_data_size=total_size
        )

        entity_data = entity_model(
          m_email=helper_method.extract_emails(content),
          m_company_name=title_text,
          m_team="omega"
        )

        entity_data = helper_method.extract_entities(content, entity_data)
        self.append_leak_data(card_data, entity_data)
        error_count = 0

      except Exception:
        error_count += 1
        if error_count >= 3:
          break
