import re
from abc import ABC
from datetime import datetime
from time import sleep
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


class _incblog6qu4y4mm4zvw5nrmue6qbwtgjsxpw6b7ixzssu36tsajldoad(leak_extractor_interface, ABC):
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
            cls._instance = super(_incblog6qu4y4mm4zvw5nrmue6qbwtgjsxpw6b7ixzssu36tsajldoad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://incblog6qu4y4mm4zvw5nrmue6qbwtgjsxpw6b7ixzssu36tsajldoad.onion/blog/disclosures/6807d3b8fdcf1d7b27a78a07"

    @property
    def base_url(self) -> str:
        return "http://incblog6qu4y4mm4zvw5nrmue6qbwtgjsxpw6b7ixzssu36tsajldoad.onion"

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
        return "https://breachforums.st/User-Anubis-media"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            is_parsed = bool(self.invoke_db(REDIS_COMMANDS.S_GET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + self.__class__.__name__, False,RAW_PATH_CONSTANTS.HREF_TIMEOUT))

            sleep(5)
            page.wait_for_selector("a.announcement__container")

            titles_and_links = []


            while True:
                try:

                    cards = page.query_selector_all("a.announcement__container")
                    for card in cards:
                        title_element = card.query_selector("span.text-xs.text-white")
                        if not title_element:
                            continue

                        title = title_element.inner_text().strip()
                        weblink = card.get_attribute("href")
                        if not weblink:
                            continue


                        if weblink.startswith("/"):
                            weblink = f"{self.base_url.rstrip('/')}{weblink}"

                        titles_and_links.append({"title": title, "weblink": weblink})

                    limit = 4000
                    if is_parsed:
                        limit = 100
                    if len(titles_and_links)>limit:
                        break

                    load_more_button = page.query_selector("div.more__container")
                    if load_more_button:
                        load_more_button.click()
                        sleep(3)
                    else:
                        break
                except Exception as e:
                    print(f"An error occurred while clicking 'Load more': {e}")
                    break


            for index, item in enumerate(titles_and_links, start=1):
                try:
                    title = item["title"]
                    weblink = item["weblink"]


                    page.goto(weblink)
                    page.wait_for_selector("ul.new__el", timeout=15000)
                    sleep(3)


                    try:
                        date_element = page.query_selector("div.text-muted span:nth-child(2)")
                        date_raw = date_element.inner_text().strip() if date_element else None
                        date = datetime.strptime(date_raw.split(" ")[0], "%Y-%m-%d").date() if date_raw else None
                    except Exception:
                        date = None

                    description_elements = page.query_selector_all("span.text-white.text-sm.break-words")
                    description = " ".join(
                        [desc.inner_text().strip() for desc in description_elements if desc.inner_text().strip()])

                    image_elements = page.query_selector_all("div.image__container img")
                    image_links = [img.get_attribute("src") for img in image_elements if img.get_attribute("src")]


                    employees_match = re.search(r"Employees:\s*(\d+)", description, re.IGNORECASE)
                    employees = employees_match.group(1) if employees_match else None

                    industry_match = re.search(r"Industry:\s*([A-Za-z\s]+)", description, re.IGNORECASE)
                    industry = industry_match.group(1).strip() if industry_match else None

                    data_size_match = re.search(r"Data:\s*([0-9.]+\s*[A-Za-z]+)", description, re.IGNORECASE)
                    data_size = data_size_match.group(1).strip() if data_size_match else None


                    revenue = None
                    for element in description_elements:
                        text = element.inner_text().strip()
                        if text.startswith("Revenue:"):
                            revenue = text.split("Revenue: ")[1].strip()
                            break

                    description += f"\n employee no {employees}"

                    is_crawled = int(self.invoke_db(REDIS_COMMANDS.S_GET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, 0, RAW_PATH_CONSTANTS.HREF_TIMEOUT))
                    ref_html = None
                    if is_crawled != -1 and is_crawled < 5 and len(weblink) > 0:
                        ref_html = helper_method.extract_refhtml(weblink[0])
                        if ref_html:
                            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, -1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
                        else:
                            self.invoke_db(REDIS_COMMANDS.S_SET_INT, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + title, is_crawled + 1, RAW_PATH_CONSTANTS.HREF_TIMEOUT)

                    card_data = leak_model(
                        m_title=title,
                        m_ref_html=ref_html,
                        m_url=page.url,
                        m_base_url=self.base_url,
                        m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                        m_content=description,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=description[:500],
                        m_weblink=[weblink] if weblink else [],
                        m_content_type=["leaks"],
                        m_logo_or_images=image_links,
                        m_data_size=data_size,
                        m_leak_date=date,
                        m_revenue=revenue,
                    )
                    entity_data = entity_model(
                        m_attacker=["inc ransome"],
                        m_company_name=title,
                        m_industry=industry,
                    )
                    self.append_leak_data(card_data, entity_data)


                except Exception as e:
                    print(f"An error occurred while processing card {index}: {e}")
            self.invoke_db(REDIS_COMMANDS.S_SET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + self.__class__.__name__, True, RAW_PATH_CONSTANTS.HREF_TIMEOUT)
        except Exception as e:
            print(f"An error occurred while parsing leak data: {e}")