from abc import ABC
from datetime import datetime
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
import time
import re


class _lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd(leak_extractor_interface, ABC):
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
      cls._instance = super(_lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd, cls).__new__(cls)
      cls._instance._initialized = False
    return cls._instance

  @property
  def seed_url(self) -> str:
    return "http://lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd.onion/leaks"

  @property
  def base_url(self) -> str:
    return "http://lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd.onion"

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
    return "http://lynxblogco7r37jt7p5wrmfxzqze7ghxw6rihzkqc455qluacwotciyd.onion/leaks"

  def append_leak_data(self, leak: leak_model, entity: entity_model):
    self._card_data.append(leak)
    self._entity_data.append(entity)
    if self.callback:
      self.callback()

  def parse_leak_data(self, page: Page):
    try:
      time.sleep(30)

      processed_urls = set()

      error_count = 0

      while True:
        try:
          cards = page.query_selector_all('.news__block.chat__block')
          new_cards_found = False

          for card in cards:
            try:
              title = card.query_selector(
                '.chat__block-title').inner_text().strip() if card.query_selector(
                '.chat__block-title') else "No Title"
              date_text = card.query_selector(
                '.chat__block-date span').inner_text().strip() if card.query_selector(
                '.chat__block-date span') else "No Date"
              relative_url = card.query_selector('a.button-blue').get_attribute(
                'href') if card.query_selector('a.button-blue') else None
              full_url = self.base_url + relative_url if relative_url else None

              if full_url in processed_urls:
                continue

              processed_urls.add(full_url)
              new_cards_found = True

              date = datetime.strptime(date_text, "%d/%m/%Y").date() if date_text != "No Date" else None

              description = revenue = downloaded = industry = categories = publication_category = ""
              images = []
              income = employees = "No data available"

              if full_url:
                detail_page = page.context.new_page()
                detail_page.goto(full_url)

                try:
                  detail_page.wait_for_selector('.detailed p', timeout=10000)
                except:
                  detail_page.close()
                  continue

                description_element = detail_page.query_selector('.detailed p')
                if description_element:
                  description = description_element.inner_text().strip()

                  revenue_match = re.search(r"Revenue:\s*([\d\w\s.$]+)", description)
                  revenue = revenue_match.group(1) if revenue_match else "No revenue info"

                  employees_match = re.search(r"Employees:\s*(\d+)", description)
                  employees = employees_match.group(1) if employees_match else "No employee info"

                  industry_match = re.search(r"Industry:\s*([\w\s]+)", description)
                  industry = industry_match.group(1) if industry_match else "No industry info"

                  downloaded_match = re.search(r"Downloaded:\s*([\w\d.]+)", description)
                  downloaded = downloaded_match.group(1) if downloaded_match else "No downloaded info"

                income_element = detail_page.query_selector('div.col-md-6 span:has-text("Income") + p')
                if income_element:
                  income = income_element.inner_text().strip()

                publication_category_element = detail_page.query_selector(
                  'div.col-md-6 span:has-text("Publication category") + p')
                if publication_category_element:
                  publication_category = publication_category_element.inner_text().strip()

                disclosure_categories_element = detail_page.query_selector(
                  'div.row p span:has-text("Categories") + p')
                if disclosure_categories_element:
                  categories = disclosure_categories_element.inner_text().strip()

                description += f"\nEmployees count: {employees}\nIncome: {income}\nPublication Category: {publication_category}\nDisclosure Categories: {categories}"

                images = [
                  self.base_url + img.get_attribute('src')
                  for img in detail_page.query_selector_all('.disclosured__images img')
                  if img.get_attribute('src')
                ]

                detail_page.close()

              ip = ""
              is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
              m_ref_html = None
              if is_crawled != -1 and is_crawled < 5:
                ref_html = helper_method.extract_refhtml(title)
                if ref_html:
                  self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
                  ip = title
                else:
                  self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

              card_data = leak_model(
                m_ref_html=m_ref_html,
                m_title=title,
                m_url=page.url,
                m_base_url=self.base_url,
                m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                m_content=description,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=description[:500],
                m_content_type=["leaks"],
                m_revenue=revenue,
                m_data_size=downloaded,
                m_leak_date=date,
                m_logo_or_images=images,
              )

              entity_data = entity_model(
                m_email=helper_method.extract_emails(description),
                m_industry=industry,
                m_company_name=title,
                m_ip=[ip],
                m_team="lynx"
              )

              entity_data = helper_method.extract_entities(description, entity_data)
              self.append_leak_data(card_data, entity_data)

            except Exception:
              pass

          if new_cards_found:
            error_count = 0
          else:
            error_count += 1
            if error_count >= 3:
              break

          show_more_button = page.query_selector('button.button-blue:has-text("Show more")')
          if new_cards_found and show_more_button:
            show_more_button.click()
            time.sleep(5)
          else:
            break

        except Exception:
          error_count += 1
          if error_count >= 3:
            break

    except Exception as e:
      print(f"An error occurred while parsing leak data: {e}")
