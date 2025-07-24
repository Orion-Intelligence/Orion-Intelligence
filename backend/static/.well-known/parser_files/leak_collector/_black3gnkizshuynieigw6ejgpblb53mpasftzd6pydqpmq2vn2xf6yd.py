from abc import ABC
from datetime import datetime
from time import sleep
from typing import List
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import CUSTOM_SCRIPT_REDIS_KEYS, REDIS_COMMANDS
from crawler.crawler_services.shared.helper_method import helper_method
from playwright.sync_api import Page

class _black3gnkizshuynieigw6ejgpblb53mpasftzd6pydqpmq2vn2xf6yd(leak_extractor_interface, ABC):
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

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_black3gnkizshuynieigw6ejgpblb53mpasftzd6pydqpmq2vn2xf6yd, cls).__new__(cls)
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://black3gnkizshuynieigw6ejgpblb53mpasftzd6pydqpmq2vn2xf6yd.onion"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://black3gnkizshuynieigw6ejgpblb53mpasftzd6pydqpmq2vn2xf6yd.onion"

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
        return "http://black3gnkizshuynieigw6ejgpblb53mpasftzd6pydqpmq2vn2xf6yd.onion/contacts"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    @staticmethod
    def safe_find(page, selector, attr=None):

        try:
            element = page.locator(selector).first
            if element.count() > 0:
                return element.get_attribute(attr) if attr else element.inner_text().strip()
        except Exception:
            return None

    def parse_leak_data(self, page: Page):
        try:
            all_leak_urls = []
            sleep(50)

            page.goto(self.seed_url)
            page.wait_for_load_state('domcontentloaded')
            soup = BeautifulSoup(page.content(), 'html.parser')

            card_divs = soup.find_all("div", class_="card-success")
            for card in card_divs:
                a_tag = card.select_one("div.card-header a")
                if a_tag and a_tag.get('href'):
                    full_url = urljoin(self.base_url, a_tag['href'])
                    all_leak_urls.append(full_url)

            error_count = 0

            for leak_url in all_leak_urls:
                try:
                    page.goto(leak_url)
                    page.wait_for_load_state('domcontentloaded')
                    leak_soup = BeautifulSoup(page.content(), 'html.parser')

                    header = leak_soup.select_one("div.d-flex.flex-row")
                    detail = leak_soup.select_one("div.d-flex.flex-column.justify-content-between")
                    if not header or not detail:
                        continue

                    title_element = detail.select_one("h2")
                    title = title_element.get_text(strip=True) if title_element else "No title"

                    desc_elements = detail.find_all(["p", "pre"])
                    description = " ".join(p.get_text(strip=True) for p in desc_elements)

                    size_element = detail.select_one("p.text-danger")
                    data_size = size_element.get_text(strip=True) if size_element else None

                    date_element = detail.select_one("span.px-1")
                    leak_date = None
                    if date_element:
                        try:
                            date_text = ' '.join(date_element.text.split(': ', 1)[1].split()[0:3])
                            leak_date = datetime.strptime(date_text, "%d %b, %Y").date()
                        except Exception as ex:
                            log.g().e(ex)

                    paper_container = leak_soup.select_one("div.papper-contaner")
                    dump_link = None
                    if paper_container:
                        link = paper_container.select_one("a.list-group-item")
                        if link and link.get('href'):
                            dump_link = urljoin(self.base_url, link['href'])

                    ref_html = helper_method.extract_refhtml(title, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS)

                    card_data = leak_model(
                        m_ref_html=ref_html,
                        m_screenshot=helper_method.get_screenshot_base64(page, None, self.base_url),
                        m_title=title,
                        m_url=leak_url,
                        m_dumplink=[dump_link] if dump_link else [],
                        m_network=helper_method.get_network_type(self.base_url),
                        m_base_url=self.base_url,
                        m_content=description + " " + self.base_url + " " + leak_url,
                        m_important_content=description,
                        m_content_type=["leaks"],
                        m_data_size=data_size,
                        m_leak_date=leak_date
                    )

                    entity_data = entity_model(
                        m_ip=[title],
                        m_team="blackout"
                    )
                    entity_data = helper_method.extract_entities(description, entity_data)

                    self.append_leak_data(card_data, entity_data)
                    error_count = 0

                except Exception as ex:
                    log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
                    error_count += 1
                    if error_count >= 3:
                        break

            return self._card_data


        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
            raise