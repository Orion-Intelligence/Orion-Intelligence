from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _dataleakypypu7uwblm5kttv726l3iripago6p336xjnbstkjwrlnlid(leak_extractor_interface, ABC):
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
      cls._instance = super(_dataleakypypu7uwblm5kttv726l3iripago6p336xjnbstkjwrlnlid, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:

    return "http://dataleakypypu7uwblm5kttv726l3iripago6p336xjnbstkjwrlnlid.onion/"

  @property
  def base_url(self) -> str:

    return "http://dataleakypypu7uwblm5kttv726l3iripago6p336xjnbstkjwrlnlid.onion/"

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
    return "https://t.me/BlackLockChanel"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    project_sections = page.query_selector_all(".project")
    error_count = 0

    for project in project_sections:
      icon = project.query_selector(".img")
      if not icon or not icon.is_visible():
        continue

      data_link_element = project.query_selector(".links a")
      full_data_link = f"{self.base_url}{data_link_element.get_attribute('href')}" if data_link_element else ""

      try:
        icon.click()

        content_element = page.query_selector(".box .white")
        if not content_element:
          raise Exception("Content element not found")

        content = content_element.inner_text()

        title_element = content_element.query_selector("h2")
        title = title_element.inner_text() if title_element else "No Title"

        card_data = leak_model(
          m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
          m_title=title,
          m_url=page.url,
          m_base_url=self.base_url,
          m_content=content + " " + self.base_url + " " + page.url,
          m_network=helper_method.get_network_type(self.base_url),
          m_important_content=content,
          m_dumplink=[full_data_link],
          m_content_type=["leaks"],
        )

        entity_data = entity_model(
          m_email=helper_method.extract_emails(content),
        )
        entity_data = helper_method.extract_entities(content, entity_data)

        self.append_leak_data(card_data, entity_data)

        close_button = page.query_selector(".close div")
        if close_button:
          close_button.click()

        error_count = 0

      except Exception:
        error_count += 1
        if error_count >= 3:
          break
