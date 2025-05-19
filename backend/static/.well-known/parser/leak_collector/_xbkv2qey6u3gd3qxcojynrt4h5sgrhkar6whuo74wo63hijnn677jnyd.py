import datetime
from abc import ABC
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _xbkv2qey6u3gd3qxcojynrt4h5sgrhkar6whuo74wo63hijnn677jnyd(leak_extractor_interface, ABC):
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
      cls._instance = super(_xbkv2qey6u3gd3qxcojynrt4h5sgrhkar6whuo74wo63hijnn677jnyd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://xbkv2qey6u3gd3qxcojynrt4h5sgrhkar6whuo74wo63hijnn677jnyd.onion/posts"

  @property
  def base_url(self) -> str:
    return "http://xbkv2qey6u3gd3qxcojynrt4h5sgrhkar6whuo74wo63hijnn677jnyd.onion"

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
    return "http://xbkv2qey6u3gd3qxcojynrt4h5sgrhkar6whuo74wo63hijnn677jnyd.onion"

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
      processed_posts = set()
      while True:
        links = page.query_selector_all('div.mb-4.basis-1.last\\:mb-0 > a')
        if not links:
          break

        collected_links = []
        for link in links:
          href = link.get_attribute("href")
          if href:
            post_id = href.split('/posts/')[1].rstrip('/')
            if post_id not in processed_posts:
              full_url = f"{self.base_url}/posts/{post_id}/"
              size_element = link.query_selector("p.line-clamp-6.pt-4")
              m_data_size = size_element.inner_text().strip() if size_element else ""
              collected_links.append((full_url, m_data_size))
              processed_posts.add(post_id)

        error_count = 0
        max_errors = 3

        try:
          for link, main_page_data_size in collected_links:
            try:
              page.goto(link)
              page.wait_for_selector('.content')

              m_content = page.text_content('article')

              date_element = page.query_selector("div.text-sm > span")
              m_date = date_element.inner_text().strip() if date_element else ""

              title_element = page.query_selector("p.text-center.text-4xl.font-bold")
              m_title = title_element.inner_text().strip() if title_element else ""

              href_elements = page.query_selector_all('article a[href]')
              m_weblinks = [href.get_attribute('href') for href in href_elements]

              revenue_element = page.query_selector("article > p:nth-child(3)")
              m_revenue = revenue_element.inner_text().replace("Revenue:",
                                                               "").strip() if revenue_element else ""

              size_element = page.query_selector("article > p:nth-child(4)")
              m_data_size = size_element.inner_text().replace("Data:",
                                                              "").strip() if size_element else main_page_data_size

              if not m_revenue or not m_revenue.startswith('$'):
                m_revenue = ""
              if not m_data_size or not any(char.isdigit() for char in m_data_size):
                m_data_size = ""

              card_data = leak_model(
                m_screenshot=helper_method.get_screenshot_base64(page, m_title, self.base_url),
                m_title=m_title,
                m_url=page.url,
                m_base_url=self.base_url,
                m_content=m_content + " " + self.base_url + " " + page.url,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=m_content,
                m_weblink=m_weblinks,
                m_dumplink=[],
                m_content_type=["leaks"],
                m_revenue=m_revenue,
                m_data_size=m_data_size,
                m_leak_date=datetime.datetime.strptime(m_date.split(', ', 1)[1], '%B %d, %Y').date()
              )

              entity_data = entity_model(
                m_email=helper_method.extract_emails(m_content),
              )
              entity_data = helper_method.extract_entities(m_content, entity_data)
              self.append_leak_data(card_data, entity_data)

              error_count = 0  # reset after success

            except Exception as e:
              error_count += 1
              print(f"Error processing {link}: {e}")
              if error_count >= max_errors:
                print("Too many consecutive errors, stopping loop.")
                break

        except Exception as global_err:
          print(f"Fatal error in leak processing loop: {global_err}")

        break

    except Exception as e:
      print(f"Error parsing leak data: {str(e)}")
