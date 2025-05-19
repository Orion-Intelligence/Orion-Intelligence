import re
from abc import ABC
from datetime import datetime
from time import sleep
from typing import List, Optional, Callable
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _public_tableau(leak_extractor_interface, ABC):
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

  def __new__(cls, callback: Optional[Callable[[], None]] = None):
    if cls._instance is None:
      cls._instance = super(_public_tableau, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "https://public.tableau.com/views/DataBreachChronologyFeatures/ChronologyofDataBreaches?%3Aembed=y&%3AshowVizHome=no&%3Ahost_url=https%3A%2F%2Fpublic.tableau.com%2F&%3Aembed_code_version=3&%3Atabs=no&%3Atoolbar=yes&%3Aanimate_transition=yes&%3Adisplay_static_image=no&%3Adisplay_spinner=no&%3Adisplay_overlay=yes&%3Adisplay_count=yes&%3Alanguage=en-US&%3AloadOrderID=6"

  @property
  def base_url(self) -> str:
    return "https://public.tableau.com"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(m_resoource_block=False, m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return "https://privacyrights.org/contact"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    is_crawled = self.invoke_db(REDIS_COMMANDS.S_GET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED, False)
    max_pages = 500 if is_crawled else 100000

    page.evaluate("""
            const cursor = document.createElement('div');
            cursor.id = 'fake-cursor';
            cursor.style.position = 'fixed';
            cursor.style.width = '10px';
            cursor.style.height = '10px';
            cursor.style.background = 'red';
            cursor.style.borderRadius = '50%';
            cursor.style.zIndex = '99999';
            cursor.style.pointerEvents = 'none';
            document.body.appendChild(cursor);

            window.moveFakeCursor = (x, y) => {
                const el = document.getElementById('fake-cursor');
                if (el) {
                    el.style.left = x + 'px';
                    el.style.top = y + 'px';
                }
            };
        """)

    page.wait_for_selector("#tabZoneId8", state="visible", timeout=60000)
    sleep(10)

    viewport = page.viewport_size
    x_position = int(viewport["width"] * 0.8)
    default_y_position = 98
    y_position = default_y_position
    hover_count = 0
    self._card_data = []

    retry_count = 0
    max_retries = 10

    for _ in range(max_pages):
      if retry_count >= max_retries:
        break

      try:
        page.mouse.move(x_position, y_position)
        page.evaluate(f'moveFakeCursor({x_position}, {y_position});')
        page.wait_for_selector(".tab-tooltipContainer", timeout=5000)
        tooltip_element = page.query_selector(".tab-tooltipContainer")
        if not tooltip_element:
          continue

        tooltip_content = tooltip_element.inner_html()

        soup = BeautifulSoup(tooltip_content, "html.parser")
        all_spans = soup.select(".tab-selection-relaxation")
        company_name = all_spans[0].text.strip() if all_spans else "Unknown Title"

        tables = soup.select(".tab-ubertipTooltip table")
        data_dict = {}
        for table in tables:
          for row in table.find_all("tr"):
            tds = row.find_all("td")
            if len(tds) >= 3:
              key = tds[0].get_text(strip=True).rstrip(":")
              val = tds[2].get_text(strip=True)
              data_dict[key] = val

        base_url = self.base_url
        for table in tables:
          for tr in table.find_all("tr"):
            tds = tr.find_all("td")
            if len(tds) >= 3 and "Source" in tds[0].text:
              spans = tds[2].find_all("span", class_="tab-selection-relaxation")
              if spans and len(spans) > 1:
                base_url = spans[-1].text.strip()

        weblinks = re.findall(r'https?://[^\s<"]+', tooltip_content)
        m_important = data_dict.get("Incident Details", "")
        content_parts = [
          data_dict.get("Incident Details", ""),
          data_dict.get("Breach Type", ""),
          data_dict.get("Organization Type", ""),
          data_dict.get("Information Impacted", "")
        ]
        m_content = "\n".join(content_parts).strip()

        card_data = leak_model(
          m_title=company_name,
          m_section=content_parts,
          m_url=base_url,
          m_base_url=base_url,
          m_screenshot="",
          m_content=m_content + " " + self.base_url + " " + page.url,
          m_network=helper_method.get_network_type(self.base_url),
          m_important_content=m_important,
          m_weblink=weblinks,
          m_dumplink=[],
          m_content_type=["tracking"],
          m_leak_date=next(
            (
              datetime.strptime(match.group(1), "%Y-%m-%d").strftime("%Y-%m-%d")
              for value in data_dict.values()
              if isinstance(value, str) and (match := re.search(r"Breach date[:：]?\s*(\d{4}-\d{2}-\d{2})", value))
            ),
            None,
          ),
          m_data_size=f"{data_dict['Total Affected']} individuals"
          if "Total Affected" in data_dict and data_dict["Total Affected"] != "UNKN"
          else None,
        )

        entity_data = entity_model(
          m_country_name="United States",
          m_company_name=company_name,
          m_states=[data_dict["Breach Location State"]] if "Breach Location State" in data_dict else [],
          m_location=[data_dict["Breach Location State"]] if "Breach Location State" in data_dict else []
        )

        entity_data = helper_method.extract_entities(m_content, entity_data)
        self.append_leak_data(card_data, entity_data)

        y_position += 20
        hover_count += 1
        retry_count = 0

        if hover_count % 15 == 0:
          page.mouse.wheel(0, 280)
          y_position = default_y_position

      except Exception as ex:
        print(f"Error on hover {hover_count}: {ex}")
        retry_count += 1

        page.mouse.move(10, 10)
        page.mouse.click(10, 10)

        y_position = default_y_position
        page.evaluate(f'moveFakeCursor({x_position}, {y_position});')



    self.invoke_db(REDIS_COMMANDS.S_SET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED, True)
