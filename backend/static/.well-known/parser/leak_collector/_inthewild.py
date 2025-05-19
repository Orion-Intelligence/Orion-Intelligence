from abc import ABC
from datetime import datetime
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _inthewild(leak_extractor_interface, ABC):
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
      cls._instance = super(_inthewild, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "https://inthewild.io/feed"

  @property
  def base_url(self) -> str:
    return "https://inthewild.io/feed"

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
    return "https://www.linkedin.com/company/in-the-wild-io"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      if self.callback():
        self._card_data.clear()
        self._entity_data.clear()

  def parse_leak_data(self, page: Page):
    self._card_data = []
    processed_urls = set()
    error_count = 0
    no_new_card_attempts = 0
    last_row_count = 0

    while True:
      try:
        page.wait_for_selector("table tbody tr", timeout=10000)

        while True:
          rows = page.query_selector_all("table tbody tr")

          if not rows or len(rows) == last_row_count:
            no_new_card_attempts += 1
            if no_new_card_attempts >= 3:
              return
          else:
            no_new_card_attempts = 0

          last_row_count = len(rows)

          for index, row in enumerate(rows):
            try:
              rows = page.query_selector_all("table tbody tr")
              row = rows[index]

              vuln_link = row.query_selector("td:nth-child(1) a")
              if not vuln_link:
                continue

              vuln_id = vuln_link.inner_text().strip()
              vuln_url = vuln_link.get_attribute("href")

              if vuln_url in processed_urls:
                continue
              processed_urls.add(vuln_url)

              page.wait_for_timeout(200)
              with page.expect_navigation(wait_until="domcontentloaded"):
                vuln_link.click()
              page.wait_for_timeout(200)

              reference_element = page.query_selector(
                "dt:has-text('Reference to the description:') + dd a")
              reference_url = reference_element.get_attribute("href") if reference_element else ""

              description_text = page.evaluate("""
                                () => {
                                    let dtElements = document.querySelectorAll('dt.css-yv1hg8');
                                    for (let dt of dtElements) {
                                        if (dt.innerText.trim() === 'Description:') {
                                            let dd = dt.nextElementSibling;
                                            return dd ? dd.innerText.trim() : 'No description available';
                                        }
                                    }
                                    return 'No description available';
                                }
                            """)

              last_update_element = page.query_selector("dt:has-text('Last updated date:') + dd")
              last_update_date = last_update_element.inner_text().strip() if last_update_element else "Unknown"

              report_cards = page.query_selector_all(".css-tbubqa")
              website = report_cards[0].query_selector(".chakra-link").get_attribute(
                "href") if report_cards else None
              social_media_profile = None

              if len(report_cards) > 1:
                second_card_link = report_cards[1].query_selector(".chakra-link")
                second_card_url = second_card_link.get_attribute("href") if second_card_link else None
                if second_card_url and "github.com" in second_card_url:
                  social_media_profile = second_card_url

              page.wait_for_timeout(200)

              card_data = leak_model(
                m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
                m_title=vuln_id,
                m_url=page.url,
                m_base_url=self.base_url,
                m_weblink=[reference_url],
                m_content=description_text + " " + self.base_url + " " + page.url,
                m_important_content=description_text,
                m_network=helper_method.get_network_type(self.base_url),
                m_leak_date=datetime.strptime(last_update_date, '%m/%d/%Y').date(),
                m_websites=[website] if website else [],
                m_content_type=["leaks"],
              )

              entity_data = entity_model(
                m_email=helper_method.extract_emails(description_text),
                m_social_media_profiles=[social_media_profile] if social_media_profile else [],
                m_team="in the wild"
              )
              error_count = 0
              entity_data = helper_method.extract_entities(description_text, entity_data)

              self.append_leak_data(card_data, entity_data)

              page.wait_for_timeout(500)
              page.go_back()
              page.wait_for_load_state("domcontentloaded")
              page.wait_for_selector("table tbody tr", timeout=10000)

            except Exception:
              pass

          page.evaluate("window.scrollBy(0, document.body.scrollHeight)")
          page.wait_for_timeout(1000)


      except Exception:
        error_count += 1
        if error_count >= 3:
          break
