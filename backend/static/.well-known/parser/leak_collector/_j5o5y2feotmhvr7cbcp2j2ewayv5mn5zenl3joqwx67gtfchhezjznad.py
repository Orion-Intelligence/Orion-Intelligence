from abc import ABC
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _j5o5y2feotmhvr7cbcp2j2ewayv5mn5zenl3joqwx67gtfchhezjznad(leak_extractor_interface, ABC):
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
            cls._instance = super(_j5o5y2feotmhvr7cbcp2j2ewayv5mn5zenl3joqwx67gtfchhezjznad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:

        return "http://j5o5y2feotmhvr7cbcp2j2ewayv5mn5zenl3joqwx67gtfchhezjznad.onion"

    @property
    def base_url(self) -> str:

        return "http://j5o5y2feotmhvr7cbcp2j2ewayv5mn5zenl3joqwx67gtfchhezjznad.onion"

    @property
    def rule_config(self) -> RuleModel:

        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_resoource_block = False)

    @property
    def card_data(self) -> List[leak_model]:

        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:

        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value):

        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value])

    def contact_page(self) -> str:

        return "http://j5o5y2feotmhvr7cbcp2j2ewayv5mn5zenl3joqwx67gtfchhezjznad.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.goto(self.seed_url)
            processed_entries = set()

            current_page = 1
            has_more_pages = True

            while has_more_pages:

                page.wait_for_selector('tr.ant-table-row.ant-table-row-level-0')


                rows = page.query_selector_all(
                    'tr.ant-table-row.ant-table-row-level-0.odd-row, tr.ant-table-row.ant-table-row-level-0:not(.odd-row)')

                for row in rows:
                    cells = row.query_selector_all('td.ant-table-cell')

                    if len(cells) < 6:
                        continue

                    country = cells[0].inner_text().strip()
                    company_name = cells[1].inner_text().strip()
                    domain = cells[2].inner_text().strip()
                    data_size = cells[3].inner_text().strip()

                    download_link_element = cells[4].query_selector('a')
                    dump_link = download_link_element.get_attribute('href') if download_link_element else ""

                    comment = cells[5].get_attribute('title') or cells[5].inner_text().strip()

                    entry_id = f"{country}_{company_name}_{domain}"
                    if entry_id in processed_entries:
                        continue

                    is_crawled = self.invoke_db(REDIS_COMMANDS.S_GET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + domain, False)
                    ref_html = None
                    if not is_crawled:
                        ref_html = helper_method.extract_refhtml(domain)
                        if ref_html:
                            self.invoke_db(REDIS_COMMANDS.S_SET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + domain, True)
                    comment = cells[5].get_attribute('title') or cells[5].inner_text().strip()

                    card_data = leak_model(
                        m_ref_html= ref_html,
                        m_screenshot=helper_method.get_screenshot_base64(page, company_name),
                        m_title=company_name,
                        m_url=domain,
                        m_base_url=self.base_url,
                        m_content=comment,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=comment,
                        m_content_type=["leaks"],
                        m_data_size=data_size,
                        m_dumplink=[dump_link] if dump_link else [],
                    )

                    entity_data = entity_model(
                        m_email_addresses=helper_method.extract_emails(comment),
                        m_company_name=company_name,
                        m_ip=[domain],
                        m_location_info=[country],
                        m_country_name=country,
                    )

                    self.append_leak_data(card_data, entity_data)
                    processed_entries.add(entry_id)

                try:
                    current_page += 1
                    next_page_selector = f'.ant-pagination-item.ant-pagination-item-{current_page}'
                    next_page_element = page.query_selector(next_page_selector)

                    if next_page_element:
                        next_page_element.click()
                        page.wait_for_load_state('networkidle')
                    else:
                        has_more_pages = False
                except Exception as e:
                    print(f"Error navigating to next page: {str(e)}")
                    has_more_pages = False

        except Exception as e:
            print(f"Error parsing leak data: {str(e)}")

