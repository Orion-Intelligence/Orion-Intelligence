from abc import ABC
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _bertblogsoqmm4ow7nqyh5ik7etsmefdbf25stauecytvwy7tkgizhad(leak_extractor_interface, ABC):
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
            cls._instance = super(_bertblogsoqmm4ow7nqyh5ik7etsmefdbf25stauecytvwy7tkgizhad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:

        return "http://bertblogsoqmm4ow7nqyh5ik7etsmefdbf25stauecytvwy7tkgizhad.onion"

    @property
    def base_url(self) -> str:

        return "http://bertblogsoqmm4ow7nqyh5ik7etsmefdbf25stauecytvwy7tkgizhad.onion"

    @property
    def rule_config(self) -> RuleModel:

        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT,m_resoource_block=False)

    @property
    def card_data(self) -> List[leak_model]:

        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:

        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):

        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:

        return "http://bertblogsoqmm4ow7nqyh5ik7etsmefdbf25stauecytvwy7tkgizhad.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):

        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            self.callback()

    def parse_leak_data(self, page: Page):
        page.wait_for_load_state("networkidle")
        index = 0
        while True:
            containers = page.query_selector_all("div[class*='h-[142px]'][class*='flex-col']")
            if index >= len(containers):
                break

            try:

                read_more_link = containers[index].query_selector("a[class*='h-[50px]']")
                index += 1

                if not read_more_link:
                    continue

                with page.expect_navigation():
                    read_more_link.click()
                page.wait_for_load_state("networkidle")


                title_element = page.query_selector("div[class*='text-5xl']")
                title = title_element.inner_text().strip() if title_element else ""

                content_element = page.query_selector(
                    "div.self-stretch.text-\\[\\#97979a\\].text-lg.font-normal.leading-\\[27px\\]")

                m_content = content_element.inner_text().strip() if content_element else ""


                revenue_element = page.query_selector("div[class*='leading-[27px]'][class*='font-medium']")
                m_revenue = revenue_element.inner_text().strip() if revenue_element else ""


                dumplinks = [
                    link.get_attribute("href")
                    for link in page.query_selector_all("a[class*='text-[#3EA5EE]']")
                    if link.get_attribute("href")
                ]


                image_links = [
                    img.get_attribute("src")
                    for img in page.query_selector_all("div.gallery-inner img")
                    if img.get_attribute("src")
                ]

                weblinks = [
                    link.get_attribute("href")
                    for link in page.query_selector_all("a.text-\\[\\#3ea4ee\\].text-lg.font-medium.leading-\\[27px\\]")
                    if link.get_attribute("href")
                ]

                leak_date_element = page.query_selector(
                    "div.self-stretch.text-white.text-base.font-medium.leading-normal"
                )
                raw_date = leak_date_element.inner_text().strip() if leak_date_element else ""



                parts = raw_date.split('/')
                if len(parts) == 3 and all(parts):
                    month = parts[0].zfill(2)
                    day = parts[1].zfill(2)
                    year = parts[2]
                    formatted_date = f"{month}/{day}/{year}"
                    leak_date = helper_method.extract_and_convert_date(formatted_date)
                else:
                    leak_date = None


                card_data = leak_model(
                    m_title=title,
                    m_url=page.url,
                    m_base_url=self.base_url,
                    m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                    m_content=m_content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=m_content,
                    m_weblink=weblinks,
                    m_dumplink=dumplinks,
                    m_logo_or_images=image_links,
                    m_revenue=m_revenue,
                    m_leak_date=leak_date,
                    m_content_type=["leaks"],

                )

                entity_data = entity_model(
                    m_attacker=["bert"],
                    m_company_name=title,
                    m_confidence=["high"],
                )

                self.append_leak_data(card_data, entity_data)

            except Exception as e:
                print(f"Error parsing container: {e}")

            page.go_back()
            page.wait_for_load_state("networkidle")