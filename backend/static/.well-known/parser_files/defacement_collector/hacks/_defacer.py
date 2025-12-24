from abc import ABC
from datetime import datetime
from typing import List
from urllib.parse import urljoin

from playwright.sync_api import Page
from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.defacement_model import defacement_model
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _defacer(leak_extractor_interface, ABC):
  _instance = None

  def __init__(self, callback=None):

    self.callback = callback
    self._card_data = []
    self._entity_data = []
    self.soup = None
    self._initialized = None
    self._redis_instance = redis_controller()
    self._is_crawled = False

  def init_callback(self, callback=None):

    self.callback = callback

  def __new__(cls, callback=None):

    if cls._instance is None:
      cls._instance = super(_defacer, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def is_crawled(self) -> bool:
    return self._is_crawled

  @property
  def seed_url(self) -> str:
    return "https://defacer.net/archive/"

  @property
  def developer_signature(self) -> str:

    return "name:signature"

  @property
  def base_url(self) -> str:
    return "https://defacer.net"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(
      m_fetch_proxy=FetchProxy.NONE,
      m_fetch_config=FetchConfig.PLAYRIGHT,
      m_threat_type=ThreatType.DEFACEMENT)

  @property
  def card_data(self) -> List[leak_model]:
    return self._card_data

  @property
  def entity_data(self) -> List[entity_model]:
    return self._entity_data

  def invoke_db(self, command: int, key: str, default_value, expiry: int = None):

    return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

  def contact_page(self) -> str:
    return "https://defacer.net"

  def append_leak_data(self, leak: defacement_model, entity: entity_model):

    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    max_pages = 2 if self.is_crawled else 100
    current_page = 1
    consecutive_errors = 0
    context = page.context

    while current_page <= max_pages:
      try:
        page_url = self.seed_url if current_page == 1 else f"{self.seed_url}{current_page}"
        page.goto(page_url)
        page.wait_for_load_state("load")
        page.wait_for_selector("table tbody tr", timeout=30000)

        mirror_links = [urljoin(self.base_url, row.query_selector("td.center a").get_attribute("href")) for row in
          page.query_selector_all("table tbody tr") if row.query_selector("td.center a")]

        for mirror_url in mirror_links:
          mirror_page = None
          try:
            mirror_page = context.new_page()
            mirror_page.goto(mirror_url, timeout=30000)
            mirror_page.wait_for_load_state("load")
            mirror_page.wait_for_selector(".card.bg-dark", timeout=20000)

            header_elem = mirror_page.query_selector(".card-header.bg-info")
            header = header_elem.inner_text() if header_elem else ""
            target_url = header.split("Defacement Detail of")[-1].strip() if "Defacement Detail of" in header else ""

            desc_elem = mirror_page.query_selector(".card-body p")
            description = desc_elem.inner_text().strip() if desc_elem else ""
            date_obj = None
            rec_elem = mirror_page.query_selector("p:has(strong:has-text('Recorded On')) strong")
            recorded_on = rec_elem.inner_text().split(":", 1)[-1].strip() if rec_elem else ""
            if recorded_on:
              try:
                dt_obj = datetime.strptime(recorded_on, "%Y-%m-%d %H:%M:%S")
                date_obj = dt_obj.date()
              except Exception as e:
                log.g().w(f"Date parse failed for {recorded_on}: {e}")

            ip_elem = mirror_page.query_selector("strong:has-text('IP') a")
            ip = ip_elem.inner_text().strip() if ip_elem else ""

            att_elem = mirror_page.query_selector("p:has(strong:has-text('Attacker')) a")
            attacker = att_elem.inner_text().strip() if att_elem else ""

            team_elem = mirror_page.query_selector("p:has(strong:has-text('Team')) a")
            team = team_elem.inner_text().strip() if team_elem else ""

            srv_elem = mirror_page.query_selector("p:has(strong:has-text('Server')) strong")
            server = srv_elem.inner_text().split(":", 1)[-1].strip() if srv_elem else ""

            poc_elem = mirror_page.query_selector("p:has(strong:has-text('PoC')) strong")
            poc = poc_elem.inner_text().split(":", 1)[-1].strip() if poc_elem else ""

            isp_elem = mirror_page.query_selector("p:has(strong:has-text('ISP Provider')) strong")
            isp = isp_elem.inner_text().split(":", 1)[-1].strip() if isp_elem else ""

            m_mirror = ""
            iframe = mirror_page.query_selector("iframe")
            if iframe:
              src = iframe.get_attribute("src")
              if src:
                m_mirror = src

            content = helper_method.extract_refhtml(
              ip, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, mirror_page)

            card_data = defacement_model(
              m_web_server=[server] if server else [],
              m_source_url=[mirror_url],
              m_content=content,
              m_base_url=self.base_url,
              m_url=target_url,
              m_ioc_type=["hacked"],
              m_mirror_links=[m_mirror] if m_mirror else [],
              m_network=helper_method.get_network_type(self.base_url),
              m_leak_date=date_obj)

            entity_data = entity_model(
              m_scrap_file=self.__class__.__name__,
              m_ip=[ip] if ip else [],
              m_team=team,
              m_attacker=[attacker] if attacker else [],
              m_weblink=[target_url] if target_url else [],
              m_vulnerability=poc,
              m_isp=[isp] if isp else [],
              m_exploit_year=description if description else "")

            self.append_leak_data(card_data, entity_data)

          except Exception as ex:
            log.g().e(f"Mirror error {mirror_url}: {ex}")
          finally:
            if mirror_page:
              try:
                mirror_page.close()
              except Exception as e:
                print(f"Unexpected error: {e}")
                pass

        current_page += 1
        consecutive_errors = 0

      except Exception as ex:
        log.g().e(f"Archive page error {current_page}: {ex}")
        consecutive_errors += 1
        if consecutive_errors >= 5:
          log.g().e("Too many consecutive archive errors. Stopping.")
          break
        current_page += 1
