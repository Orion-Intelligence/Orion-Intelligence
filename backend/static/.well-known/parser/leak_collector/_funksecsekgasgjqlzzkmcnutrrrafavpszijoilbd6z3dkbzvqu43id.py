from abc import ABC
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from urllib.parse import urljoin
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _funksecsekgasgjqlzzkmcnutrrrafavpszijoilbd6z3dkbzvqu43id(leak_extractor_interface, ABC):
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
            cls._instance = super(_funksecsekgasgjqlzzkmcnutrrrafavpszijoilbd6z3dkbzvqu43id, cls).__new__(cls)
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://funksecsekgasgjqlzzkmcnutrrrafavpszijoilbd6z3dkbzvqu43id.onion"

    @property
    def base_url(self) -> str:
        return "http://funksecsekgasgjqlzzkmcnutrrrafavpszijoilbd6z3dkbzvqu43id.onion"

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
        return self.seed_url

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
            page.goto(self.seed_url)
            page.wait_for_load_state('load')

            page_html = page.content()
            self.soup = BeautifulSoup(page_html, 'html.parser')


            product_links = []
            product_cards = self.soup.select("a.product-card")

            for card in product_cards:
                item_url = card.get('href')
                if item_url and not item_url.startswith(('http://', 'https://')):
                    item_url = urljoin(self.base_url, item_url)
                product_links.append(item_url)


            for product_url in product_links:
                if product_url is not None:
                    page.goto(product_url)
                else:
                    continue
                page.wait_for_load_state('load')

                product_html = page.content()
                product_soup = BeautifulSoup(product_html, 'html.parser')


                title_element = product_soup.find("h2")
                title = title_element.get_text(strip=True) if title_element else "not found"


                if title.lower().startswith("about "):
                    title = title[6:]


                content_elements = product_soup.find_all(["h2", "p"])
                content = "\n".join(elem.get_text(strip=True) for elem in content_elements if elem)


                important_content = content[:500] if content else ""


                image_elements = product_soup.find_all("img")
                logos = [img.get("src") for img in image_elements if img.get("src")]


                dump_link_element = product_soup.find("a", class_="download-button")
                dumplink = dump_link_element["href"] if dump_link_element else "not found"

                card_data = leak_model(
                    m_screenshot=helper_method.get_screenshot_base64(page, title),
                    m_title=title,
                    m_url=product_url,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_base_url=self.base_url,
                    m_content=content + " " + self.base_url + " " + product_url,
                    m_important_content=important_content,
                    m_content_type=["leaks"],
                    m_logo_or_images=logos,
                    m_dumplink=[dumplink]
                )

                entity_data = entity_model(
                    m_email=helper_method.extract_emails(content),
                    m_company_name=title,
                    m_ip=product_url
                )
                entity_data = helper_method.extract_entities(content, entity_data)

                self.append_leak_data(card_data, entity_data)

        except Exception as ex:
            print(f"An error occurred: {ex}")
