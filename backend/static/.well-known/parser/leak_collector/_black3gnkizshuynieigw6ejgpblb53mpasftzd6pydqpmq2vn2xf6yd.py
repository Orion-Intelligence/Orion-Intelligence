from abc import ABC
from typing import List
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _black3gnkizshuynieigw6ejgpblb53mpasftzd6pydqpmq2vn2xf6yd(leak_extractor_interface, ABC):
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
            cls._instance = super(_black3gnkizshuynieigw6ejgpblb53mpasftzd6pydqpmq2vn2xf6yd, cls).__new__(cls)
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "http://black3gnkizshuynieigw6ejgpblb53mpasftzd6pydqpmq2vn2xf6yd.onion"

    @property
    def base_url(self) -> str:
        return "http://black3gnkizshuynieigw6ejgpblb53mpasftzd6pydqpmq2vn2xf6yd.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value):
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "http://black3gnkizshuynieigw6ejgpblb53mpasftzd6pydqpmq2vn2xf6yd.onion/contacts"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            self.callback()

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
            dump_links = []


            page.goto(self.seed_url)
            page.wait_for_load_state('domcontentloaded')


            page_html = page.content()
            soup = BeautifulSoup(page_html, 'html.parser')


            card_headers = soup.select("div.card-header")

            for header in card_headers:
                link_element = header.select_one("a.link-offset-2.link-underline.link-underline-opacity-0.text-white")
                if link_element and link_element.get('href'):
                    item_url = link_element.get('href')
                    if not item_url.startswith(('http://', 'https://')):
                        item_url = urljoin(self.base_url, item_url)
                    all_leak_urls.append(item_url)

            print(f"Found {len(all_leak_urls)} leak URLs to process")

            
            for leak_url in all_leak_urls:
                try:
                    print(f"Processing: {leak_url}")
                    page.goto(leak_url)
                    page.wait_for_load_state('domcontentloaded')

                    leak_html = page.content()
                    leak_soup = BeautifulSoup(leak_html, 'html.parser')


                    content_container = leak_soup.select_one("div.d-flex.flex-row")
                    if not content_container:
                        print(f"No content container found for {leak_url}")
                        continue


                    detail_container = content_container.select_one("div.d-flex.flex-column.justify-content-between")
                    if not detail_container:
                        print(f"No detail container found for {leak_url}")
                        continue


                    title_element = detail_container.select_one("h2")
                    title = title_element.get_text(strip=True) if title_element else "No title"


                    desc_elements = detail_container.find_all(["p", "pre"])
                    description = " ".join(p.get_text(strip=True) for p in desc_elements)


                    size_element = detail_container.select_one("p.text-danger")
                    data_size = size_element.get_text(strip=True) if size_element else None


                    date_element = detail_container.select_one("span.px-1")
                    leak_date = date_element.get_text(strip=True) if date_element else None


                    paper_container = leak_soup.select_one("div.papper-contaner")
                    dump_link = None
                    if paper_container:
                        dump_link_element = paper_container.select_one(
                            "a.list-group-item.list-group-item-action.text-center.text-uppercase")
                        if dump_link_element and dump_link_element.get('href'):
                            dump_link = dump_link_element.get('href')
                            if not dump_link.startswith(('http://', 'https://')):
                                dump_link = urljoin(self.base_url, dump_link)
                            dump_links.append(dump_link)

                    card_data = leak_model(
                        m_screenshot=helper_method.get_screenshot_base64(page, title),
                        m_title=title,
                        m_url=leak_url,
                        m_dumplink=[dump_link],
                        m_network=helper_method.get_network_type(self.base_url),
                        m_base_url=self.base_url,
                        m_content=description + " " + self.base_url + " " + leak_url,
                        m_important_content=description,
                        m_content_type=["leaks"],
                        m_data_size=data_size,
                        m_leak_date=helper_method.extract_and_convert_date(leak_date)
                    )

                    entity_data = entity_model(
                        m_email_addresses=helper_method.extract_emails(description) if description else [],
                        m_phone_numbers=helper_method.extract_phone_numbers(description) if description else [],
                        m_company_name=title,
                    )

                    self.append_leak_data(card_data, entity_data)

                    print(f"Successfully processed: {title}")

                except Exception as item_ex:
                    print(f"Error processing item {leak_url}: {str(item_ex)}")
                    continue

            print(f"Total cards created: {len(self._card_data)}")
            print(f"Total dump links found: {len(dump_links)}")
            return self._card_data

        except Exception as ex:
            print(f"An error occurred in parse_leak_data: {ex}")
            import traceback
            traceback.print_exc()
            return []
