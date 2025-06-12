from abc import ABC
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method
from bs4 import BeautifulSoup


class _mydatae2d63il5oaxxangwnid5loq2qmtsol2ozr6vtb7yfm5ypzo6id(leak_extractor_interface, ABC):
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
      cls._instance = super(_mydatae2d63il5oaxxangwnid5loq2qmtsol2ozr6vtb7yfm5ypzo6id, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://mydatae2d63il5oaxxangwnid5loq2qmtsol2ozr6vtb7yfm5ypzo6id.onion/blog"

  @property
  def base_url(self) -> str:
    return "http://mydatae2d63il5oaxxangwnid5loq2qmtsol2ozr6vtb7yfm5ypzo6id.onion"

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
    return "http://mydatae2d63il5oaxxangwnid5loq2qmtsol2ozr6vtb7yfm5ypzo6id.onion"

  def append_leak_data(self, leak: leak_model, entity: entity_model):

    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    html_content = page.content()
    soup = BeautifulSoup(html_content, "html.parser")

    card_links = []
    for a_tag in soup.find_all("a", class_="a_title", href=True):
      link = self.base_url + "/" + a_tag["href"]
      card_links.append(link)

    error_count = 0

    for link in card_links:
      try:
        page.goto(link)
        inner_html = page.content()
        inner_soup = BeautifulSoup(inner_html, "html.parser")

        desc_div = inner_soup.find("div", style="line-height:20px; padding-top:5px; margin-bottom:30px;")
        description = desc_div.get_text().strip() if desc_div else "No description found."

        title_div = inner_soup.find("div", attrs={"style": "float:left;"})
        title = title_div.text.strip() if title_div else "No title found."
        weblink = title_div.text.strip() if title_div else "No weblink found."

        secret_links = []
        rows = inner_soup.find_all("div", class_="tr")
        for row in rows:
          input_tags = row.find_all("input", class_="inp_text")
          if input_tags and len(input_tags) > 0:
            link_value = input_tags[0].get("value")
            if link_value:
              secret_links.append(link_value)

        image_urls = []
        for img_tag in inner_soup.find_all("img"):
          image_src = img_tag.get("src")
          if image_src:
            full_img_url = self.base_url + "/" + image_src
            image_urls.append(full_img_url)

        card_data = leak_model(
          m_title=title,
          m_url=page.url,
          m_base_url=self.base_url,
          m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
          m_content=description,
          m_weblink=[weblink],
          m_network=helper_method.get_network_type(self.base_url),
          m_important_content=description,
          m_content_type=["leaks"],
          m_logo_or_images=image_urls,
          m_dumplink=secret_links,
        )

        entity_data = entity_model(
          m_email=helper_method.extract_emails(description)
        )

        entity_data = helper_method.extract_entities(description, entity_data)
        self.append_leak_data(card_data, entity_data)
        error_count = 0

      except Exception:
        error_count += 1
        if error_count >= 3:
          break
