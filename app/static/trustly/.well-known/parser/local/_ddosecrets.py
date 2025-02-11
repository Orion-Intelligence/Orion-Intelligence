from abc import ABC
from typing import List
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.card_extraction_model import card_extraction_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method


class _ddosecrets(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self._card_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_ddosecrets, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "https://ddosecrets.com/all_articles/a-z"

    @property
    def base_url(self) -> str:
        return "https://ddosecrets.com"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.SELENIUM)

    @property
    def card_data(self) -> List[card_extraction_model]:
        return self._card_data

    def invoke_db(self, command: REDIS_COMMANDS, key: CUSTOM_SCRIPT_REDIS_KEYS, default_value) -> None:
        return self._redis_instance.invoke_trigger(command, [key.value + self.__class__.__name__, default_value])

    def contact_page(self) -> str:
        return "https://ddosecrets.com/about"

    def parse_leak_data(self, page: Page):
        page.goto(self.seed_url, wait_until="networkidle")
        self.soup = BeautifulSoup(page.content(), 'html.parser')

        article_divs = self.soup.find_all("div", class_="article")
        article_links = [
            urljoin(self.base_url, div.find("h2").find("a")["href"])
            for div in article_divs
            if div.find("h2") and div.find("h2").find("a")
        ]

        for article_url in article_links:
            try:
                page.goto(article_url, wait_until="networkidle")
                self.soup = BeautifulSoup(page.content(), 'html.parser')

                content_div = self.soup.find(
                    "div",
                    class_=lambda c: c == "content",
                    attrs={"id": lambda i: i is None or i != "promo"}
                )
                if not content_div:
                    print(f"No content div found for {article_url}")
                    continue

                title_element = content_div.find("h1")
                title = title_element.get_text(strip=True) if title_element else ""

                meta_element = content_div.find("p", class_="meta")
                published_date = meta_element.get_text(strip=True) if meta_element else ""

                metadata_div = content_div.find("div", class_="metadata")
                source = ""
                countries = []
                types = []
                download_size = ""
                dumplinks = []

                if metadata_div:
                    source_element = metadata_div.find("p", string=lambda t: t and "Source:" in t)
                    if source_element and source_element.find("a"):
                        source = source_element.find("a").get_text(strip=True)

                    country_elements = metadata_div.find_all("a", href=lambda h: h and "/country/" in h)
                    countries = [country.get_text(strip=True) for country in country_elements]

                    type_elements = metadata_div.find_all("a", href=lambda h: h and "/type/" in h)
                    types = [leak_type.get_text(strip=True) for leak_type in type_elements]

                    size_element = metadata_div.find("p", string=lambda t: t and "Download Size:" in t)
                    if size_element:
                        download_size = size_element.get_text(strip=True).replace("Download Size:", "").strip()

                    dumplinks.extend(
                        urljoin(self.base_url, a["href"]) for a in metadata_div.find_all("a", href=True)
                    )

                article_content = content_div.find("div", class_="article-content")
                content_text = ""
                weblinks = []
                if article_content:
                    content_text = " ".join(
                        p.get_text(strip=True) for p in article_content.find_all("p")
                    )
                    weblinks.extend(
                        urljoin(self.base_url, a["href"]) for a in article_content.find_all("a", href=True)
                    )

                card = card_extraction_model(
                    m_title=title,
                    m_url=article_url,
                    m_base_url=self.base_url,
                    m_content=content_text,
                    m_content_type=["leaks"],
                    m_important_content=content_text,
                    m_weblink=weblinks,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_dumplink=dumplinks,
                    m_leak_date=published_date,
                    m_company_name=source,
                    m_addresses=countries,
                    m_data_size=download_size,
                )

                self._card_data.append(card)

            except Exception as e:
                print(f"Error processing {article_url}: {e}")