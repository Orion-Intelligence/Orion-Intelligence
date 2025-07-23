from abc import ABC
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _gunrabxbig445sjqa535uaymzerj6fp4nwc6ngc2xughf2pedjdhk4ad(leak_extractor_interface, ABC):
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
            cls._instance = super(_gunrabxbig445sjqa535uaymzerj6fp4nwc6ngc2xughf2pedjdhk4ad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://gunrabxbig445sjqa535uaymzerj6fp4nwc6ngc2xughf2pedjdhk4ad.onion"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://gunrabxbig445sjqa535uaymzerj6fp4nwc6ngc2xughf2pedjdhk4ad.onion"

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
        return "http://jzbhtsuwysslrzi2n5is3gmzsyh6ayhm7jt3xowldhk7rej4dqqubxqd.onion/login"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_selector(".tile", timeout=30000)
            html = page.content()
            soup = BeautifulSoup(html, "html.parser")

            company_blocks = soup.select("div.tile")
            title_links = []

            for block_index, block in enumerate(company_blocks, start=1):
                title_el = block.select_one("strong > a")
                title = title_el.text.strip() if title_el else None
                dumplink = title_el["href"] if title_el and title_el.has_attr("href") else None

                # Initialize fields
                industry = location = weblink = None

                info_divs = block.select("div")
                for div in info_divs:
                    text = div.get_text(separator="|", strip=True)
                    parts = [part.strip() for part in text.split("|") if part.strip()]
                    for part in parts:
                        if part.lower().startswith("industry:"):
                            industry = part.split(":", 1)[-1].strip()
                        elif part.lower().startswith("location:"):
                            location = part.split(":", 1)[-1].strip()
                        elif part.startswith("http"):
                            weblink = part

                description = f"Title: {title}\nIndustry: {industry}\nLocation: {location}"

                title_links.append({
                    "block_index": block_index,
                    "title": title,
                    "industry": industry,
                    "location": location,
                    "publish_date": None,
                    "weblink": weblink,
                    "dumplink": dumplink,
                    "description": description
                })

            for title_data in title_links:

                ref_html = helper_method.extract_refhtml(title_data["weblink"], self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS)

                card_data = leak_model(
                    m_ref_html=ref_html,
                    m_title=title_data["title"],
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_screenshot=helper_method.get_screenshot_base64(page, title_data["title"], self.base_url),
                    m_content=title_data["description"],
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=title_data["description"],
                    m_weblink=[title_data["weblink"]] if title_data["weblink"] else [],
                    m_dumplink=[title_data["dumplink"]] if title_data["dumplink"] else [],
                    m_content_type=["leaks"],
                    m_leak_date=title_data["publish_date"]
                )

                entity_data = entity_model(
                    m_location=[title_data["location"]] if title_data["location"] else [],
                    m_country_name=title_data["location"],
                    m_company_name=title_data["title"],
                    m_industry=title_data["industry"],
                    m_team = "qtox"
                )

                self.append_leak_data(card_data, entity_data)

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))
            raise
