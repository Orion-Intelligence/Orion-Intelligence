import ast
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
from bs4 import BeautifulSoup
from datetime import datetime


class _blogvl7tjyjvsfthobttze52w36wwiz34hrfcmorgvdzb6hikucb7aqd(leak_extractor_interface, ABC):
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
      cls._instance = super(_blogvl7tjyjvsfthobttze52w36wwiz34hrfcmorgvdzb6hikucb7aqd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://blogvl7tjyjvsfthobttze52w36wwiz34hrfcmorgvdzb6hikucb7aqd.onion"

  @property
  def base_url(self) -> str:
    return "http://blogvl7tjyjvsfthobttze52w36wwiz34hrfcmorgvdzb6hikucb7aqd.onion"

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
    return "http://blogvl7tjyjvsfthobttze52w36wwiz34hrfcmorgvdzb6hikucb7aqd.onion"

  def append_leak_data(self, leak: leak_model, entity: entity_model):

    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      self.callback()

  def parse_leak_data(self, page: Page):
    error_count = 0

    for i in range(1, 26):
      try:
        url = f"{self.base_url}/news.php?id={i}"
        page.goto(url)
        page.wait_for_load_state("networkidle")

        soup = BeautifulSoup(page.content(), "html.parser")

        title_tag = soup.find("h5",
                              class_="MuiTypography-root MuiTypography-h5 MuiTypography-alignCenter css-1pakh3q")
        title = title_tag.text.strip() if title_tag else "No Title"

        date_tag = soup.find("p",
                             class_="MuiTypography-root MuiTypography-body1 MuiTypography-alignCenter css-1oy63y8")
        publication_date_raw = date_tag.text.strip() if date_tag else None

        if publication_date_raw:
          cleaned_date = publication_date_raw.split(":")[-1].strip()
          date_formats = ["%d.%m.%Y", "%d-%m-%Y"]
          publication_date = None
          for date_format in date_formats:
            try:
              publication_date = datetime.strptime(cleaned_date, date_format).date()
              break
            except ValueError:
              continue
        else:
          publication_date = None

        image_divs = soup.find_all("div", class_="MuiBox-root css-85t6ji")
        image_urls = []
        for div in image_divs:
          img_tag = div.find("img")
          if img_tag and img_tag.get("src"):
            image_urls.append(img_tag["src"])

        description_divs = soup.find_all("div", class_="css-1j63rwj")
        descriptions = []
        weblinks = []
        revenues = []

        for description_div in description_divs:
          p_tags = description_div.find_all("p")
          desc_text = []
          for p in p_tags:
            text = p.get_text(strip=True)
            lower_text = text.lower()

            if lower_text.startswith("website"):
              link_part = text[len("Website"):].lstrip(" :")
              links = [link.strip() for link in
                       link_part.replace(" / ", ",").replace(" /", ",").split(",") if link]
              weblinks.extend(links)

            elif lower_text.startswith("revenue"):
              revenue_part = text[len("Revenue"):].lstrip(" :")
              revenues.append(revenue_part)

            else:
              desc_text.append(text)
          descriptions.append("\n".join(desc_text))

        dump_links = set()
        dump_divs = soup.find_all("div", class_="MuiBox-root css-0")
        for dump_div in dump_divs:
          link_tag = dump_div.find("a")
          if link_tag and link_tag.get("href"):
            dump_links.add(link_tag.get("href"))
        dump_links = list(dump_links)

        is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblinks[0], 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
        ref_html = None
        if is_crawled != -1 and is_crawled < 5:
          ref_html = helper_method.extract_refhtml(weblinks[0])
          if ref_html:
            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblinks[0], -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
          else:
            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + weblinks[0], is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

        important_content = ast.literal_eval(f"{descriptions}")[0]
        m_content = f"{descriptions} {revenues} {weblinks}"

        card_data = leak_model(
          m_ref_html=ref_html,
          m_title=title,
          m_url=page.url,
          m_base_url=self.base_url,
          m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
          m_content=m_content,
          m_network=helper_method.get_network_type(self.base_url),
          m_important_content=important_content,
          m_dumplink=dump_links,
          m_content_type=["leaks"],
          m_leak_date=publication_date,
          m_weblink=weblinks,
          m_revenue=f"{revenues}",
        )

        entity_data = entity_model(
          m_email=helper_method.extract_emails(m_content),
          m_company_name=title,
          m_ip=weblinks,
          m_team="money message"
        )
        entity_data = helper_method.extract_entities(m_content, entity_data)

        self.append_leak_data(card_data, entity_data)
        error_count = 0

      except Exception:
        error_count += 1
        if error_count >= 3:
          break
