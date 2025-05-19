import re
from abc import ABC
from time import sleep
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method


class _3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd(leak_extractor_interface, ABC):
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
      cls._instance = super(_3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd, cls).__new__(cls)
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd.onion/"

  @property
  def base_url(self) -> str:
    return "http://3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd.onion/"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block=False)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return "http://3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd.onion"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    page.goto(self.seed_url, wait_until="networkidle")
    self.soup = BeautifulSoup(page.content(), "html.parser")

    cards = self.soup.find_all("div", class_="card")

    for index, card in enumerate(cards, start=1):
      attempt = 0
      try:
        title_element = card.find("h5", class_="card-title")
        card_title_url = helper_method.clean_text(title_element.get_text(strip=True)) if title_element else ""

        text_element = card.find("p", class_="card-text")
        card_text = text_element.get_text(" ", strip=True) if text_element else ""

        size_match = re.search(r"\b(\d+(?:\.\d+)?\s?(?:KB|MB|GB|TB|PB|KiB|MiB|GiB|TiB))\b", card_text, flags=re.IGNORECASE)
        dump_size = size_match.group(1).upper() if size_match else None

        page.locator(f'button:has-text("Show")').nth(index - 1).click()
        page.wait_for_selector(".modal-content", timeout=5000)

        modal_content = BeautifulSoup(page.content(), "html.parser").find("div", class_="modal-content")
        if not modal_content:
          continue

        title_element = modal_content.find("h5", id="full-card-title")
        title_url = helper_method.clean_text(title_element.get_text(strip=True)) if title_element else card_title_url

        raw_body_element = modal_content.find("p", id="full-card-text")
        if not raw_body_element:
          continue

        raw_lines = raw_body_element.decode_contents().split("<br/>")
        raw_lines = [BeautifulSoup(line, "html.parser").get_text(strip=True) for line in raw_lines if line.strip()]

        title_name = helper_method.clean_text(raw_lines[0]) if raw_lines else ""
        description_lines = raw_lines[1:] if len(raw_lines) > 1 else []
        description_text = helper_method.clean_text("\n".join(description_lines))

        if not re.match(r"^(https?:\/\/)?([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}$", title_url.strip()):
          title_name = title_url
          title_url = None

        if not title_url:
          url_match = re.search(r"\b(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9\-]+\.[a-zA-Z]{2,})(\/\S*)?", description_text)
          title_url = url_match.group(1) if url_match else None

        if not title_url:
          title_url = self.base_url

        password_match = re.search(r'password\s*[:\-]?\s*([^\s<>\n]+)', description_text, flags=re.IGNORECASE)
        password = password_match.group(1) if password_match and len(password_match.group(1)) > 10 else None

        links_element = modal_content.find("p", id="full-card-links")
        dump_links = [link["href"] for link in links_element.find_all("a", href=True)] if links_element else []

        full_text = f"{title_url or ''}\n{title_name}\n{description_text}\n{self.seed_url}\n{self.base_url}"
        is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title_url, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
        ref_html = None
        if is_crawled!=-1 and is_crawled<5:
          ref_html = helper_method.extract_refhtml(title_url)
          if ref_html:
            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title_url, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
          else:
            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title_url, is_crawled+1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

        sleep(0.5)
        card_data = leak_model(m_ref_html=ref_html,
                               m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url), m_title=title_name, m_url=page.url, m_base_url=self.base_url, m_content=full_text,
                               m_network=helper_method.get_network_type(self.base_url),
                               m_important_content=description_text,
                               m_dumplink=dump_links,
                               m_content_type=["leaks"],
                               m_data_size=dump_size, )

        entity_data = entity_model(m_email=helper_method.extract_emails(full_text),
                                   m_company_name=title_name if title_name else None,
                                   m_ip=[title_url] if title_url else None,
                                   m_password=password if password else None,
                                   m_team="abyss")

        entity_data = helper_method.extract_entities(full_text, entity_data)
        self.append_leak_data(card_data, entity_data)
        page.locator(".modal .btn-close").click()
        attempt = 0

      except Exception as e:
        attempt += 1
        print(f"Error processing card {index}, attempt {attempt}: {e}")
        if attempt >= 3:
          break
